const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const {loginValidation} = require('../validation/validation');
const {registerValidation} = require('../validation/validation');
const {loginRequired}  = require('../middlewares/authController');
const path = require('path');


// GET login "/api/login" :
// Parameters: None
// Returns: {status: 'SUCCESS' , message: 'Loads LOGIN page'} if not logged in.  
//          redirects to ("/api/dashboard") if already logged in
router.get( '/login' , (req, res, next) => {

    if (req.user) {
        console.log('user object exists: you are logged in, redirect to dashboard.')
        return res.redirect("/api/dashboard");
    }

    console.log('Loads login page');
    //return res.status(200).sendFile(path.join(__dirname, '../../public/login.html'));
    return res.status(200).send({status: 'SUCCESS' , message: 'Loads LOGIN page'});
});

// GET login "/api/register" :
// Parameters: None
// Returns: {status: 'SUCCESS' , message: 'Loads REGISTER page'} 
router.get( '/register' , (req, res, next) => {
    console.log('Loads register page');
    //return res.status(200).sendFile(path.join(__dirname, '../../public/register.html'));
    return res.status(200).send({status: 'SUCCESS' , message: 'Loads REGISTER page'}); 

});

// POST login "/api/login" :
// Parameters:  receive a json object that contains (email, password)
// Returns:     redirects to ("/api/dashboard") if login is successful,  
//              a json object {status: 'FAIL' , message: 'error message'}, if it fails.
router.post( '/login' , async (req, res, next) => {
    console.log('---------------------------------------------------------');
    console.log('running POST /login');
    console.log('---------------------------------------------------------');
    console.log('email: ' + req.body.email);
    console.log('password: ' + req.body.password);
    console.log('---------------------------------------------------------');

    // Validate the data (req.body) according to the validation schema. 
    const { error } = loginValidation(req.body);
    if(error) return res.status(400).send({status: 'FAIL' , message: error.details[0].message});
    
    // Check if user exists.
    const user = await User.findOne({ email: req.body.email });
    if(!user) return res.status(400).send({status: 'FAIL' , message: 'Email or password is wrong'}); 
    // the 'Email or password is wrong' is kind of vague MESSAGE, but it is better 
    // not revealing to much information to avoid attacks. 

    // Check if password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if(!validPass) return res.status(400).send({status: 'FAIL' , message: 'Invalid password'});
    
    console.log('user._id: ' + user._id);
    // console.log('req: ');
    // console.log(req);
    // setting a property will automatically cause a Set-Cookie response to be sent
    req.session.userId = user._id;
    
    return res.redirect("/api/dashboard");
    //return res.status(200).sendFile(path.join(__dirname, '../../public/dashboard.html'));
});

// GET dashboardh "/api/dashboard" :
// Parameters: None
// Returns: a json object { status: 'SUCCESS' , message : 'Dashboard: ' + user.firstName + ' you are logged in'},  if it is logged in
//           a json object { status: 'FAIL' , message : err} if it is not logged in
router.get( '/dashboard' , loginRequired, (req, res, next) => {

    console.log('---------------------------------------------------------');
    console.log('running GET /dashboard');
    console.log('---------------------------------------------------------');
    console.log('req.session.userId: ' + req.session.userId);
    console.log('---------------------------------------------------------');

     // Check if user exists.
    User.findById(req.session.userId, (err, user) => {
        if(err){
            console.log("error finding user")
            //return next(err);
            return res.status(200).send({ status: 'FAIL' , message : err});
        }

        if(!user){
            console.log("user does not exist. redirecting to /login")
            //return res.status(200).send({ status: 'FAIL' , message : 'User does not exist. redirect to /login'});
            return res.redirect("/api/login");
        }
        // user found/
        console.log("user found, rendering dashboard");
        console.log(user);
        //res.render("dashboard");  // use this when using a template render module. e,g,. pug
        return res.status(200).send({ status: 'SUCCESS' , message : 'Dashboard: ' + user.firstName + ' you are logged in'});
        //return res.status(200).sendFile(path.join(__dirname, '../../public/dashboard.html'));
    });
});

// POST register "/api/register" :
// Parameters: receive a json object that contains (firstname, lastname, email, password)
// Returns: a json objet { status: 'SUCCESS' , message: 'created user: ' + savedUser._id + ', redirect to /'}, if register is successful,  
//          a json object { status: 'FAIL' , message : err}, if it fails.
router.post( '/register' , async (req, res, next) => {
    console.log(req.body);
    // debug only
    console.log('---------------------------------------------------------');
    console.log('running POST /register');
    console.log('---------------------------------------------------------');
    console.log('firstname: ' + req.body.firstname );
    console.log('lastname: ' + req.body.lastname);
    console.log('email: ' + req.body.email);
    console.log('password: ' +  req.body.password);
    console.log('---------------------------------------------------------');

    // Validate the data (req.body) according to the validation schema. 
    const { error } = registerValidation(req.body);
    if(error) return res.status(400).send({status: 'FAIL' , message: error.details[0].message });

    // Check if user already exists.
    const mailExist = await User.findOne({ email: req.body.email });
    console.log('mailExist: ' +  mailExist);
    if(mailExist) return res.status(400).send({ status: 'FAIL' , message: 'Email already exists!'});
    

    // If user does not exist => Hash password before storing it
    // 14: Salt value => hash difficulty
    const hashedPassword = await bcrypt.hash(req.body.password, 14); 
    console.log('hashedPassword: ' +  hashedPassword);

    // Create new User object 
    const user = new User({ 
        _id: new mongoose.Types.ObjectId(),
        firstName : req.body.firstname ,
        lastName : req.body.lastname , 
        email : req.body.email , 
        password : hashedPassword
    }); 
    console.log('creating user: ' +  user);
    
    // Save into the database.
    try{
        const savedUser = await user.save();
        return res.send({ status: 'SUCCESS' , message: 'created user: redirect to /' , user: savedUser._id});
        //return res.redirect("/");

    }
    catch(err){
        res.status(400).send({ status: 'FAIL' , message: err.message});
    }  
});

// GET logout "/api/logout" : 
// Parameters: None
// Returns: a json object { status: 'SUCCESS' , message: 'Logged out! Redirect to /'}, if session destroy goes well. 
//          a json object { status: 'FAIL' , message: { 'Error login out. No-session found: ' : req.session } } , if it fails to find a session and delete it
router.get( '/logout' , (req, res, next) => {

    console.log('---------------------------------------------------------');
    console.log('running POST /logout');
    console.log('---------------------------------------------------------');

    if(req.session) {
        req.session.destroy( (err) => {
            if(err){
                return res.status(200).send({ status: 'FAIL' , message: err })
            }
            return res.status(200).send({ status: 'SUCCESS' , message: 'Logged out! Redirect to /'})
            //return res.redirect("/");
        });       
    }else{
        return res.status(200).send({ status: 'FAIL' , message: { 'Error login out. No-session found: ' : req.session } })
    }
});

// debug only:
router.post('/session', (req, res) => {
    // Return the session id
    return res.status(200).send({ status: 'SUCCESS' , message: 'req.sessionID: ' + req.sessionID});
})

module.exports = router;