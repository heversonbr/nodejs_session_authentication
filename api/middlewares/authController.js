const User = require('../models/User');

// this is a middleware use to facilitate the authentication process.
// here we will have 2 middleware functions. 
// the first will create a user object from a request if the session information is provided.
// the second  check if there is a user object at each request (this user object will exist 
//             only if the previous middleware has validate the session existence)

// The following middleware creates a user object, if session data is provided by the request 
module.exports.loadUserFromSession = function getUserFromSession(req, res, next) {

    console.log('---------------------------------------------------------');
    console.log('runnning loadUserFromSession');
    console.log('checking if session.id is associated to a user');
    console.log('---------------------------------------------------------');

    console.log('req.session.id: ' + req.session.id);
    console.log('req.session: ' + req.session);
    console.log('req.session.userId: ' + req.session.userId);
    // Check if 'session information' was received in the request
    if(!(req.session && req.session.userId)){
        console.log('missing session/user information');
        return next();
    }

    // Check if session-id exists in the database
    console.log('finding user session: ' + req.session.userId);
    User.findById(req.session.userId, (err, user) => {
        // looks for a session 
        if (err) {
            console.log('error finding user session');
            return next(err);
        }
  
        if (!user) {
            console.log('no user session found');
            return next();
        }
        // If there is a session id for this user: 
        console.log('user session FOUND in DB for req.session.userId: ' + req.session.userId);
        // Remove the password hash from the User object. 
        // The password is brought by the query in the database. In this way we don't accidentally leak it.
        user.password = undefined;
        // console.log('user password set to null: ' + user.password);

        // Here is where we store the user object in the current request for developer usage. 
        // If the user wasn't found, these values will be set to a non-truthy value, so it won't affect anything.
        req.user = user;   // this variable is set and can used to validate the session. 
        console.log('req.user: ' + req.user);
        res.locals.user = user;     
        // The res.locals property is an object that contains response local variables scoped to the request and because of this,
        // it is only available to the view(s) rendered during that request/response cycle (if any). 
        // This allow us to use our user variable in all the html templates.
        console.log('end loadUserFromSession');
        next();
    });
    
}

// This middleware checks if the user object exists (req.user), 
// if so the sessions was already validated. 
module.exports.loginRequired = function loginRequired (req, res, next){
    console.log('---------------------------------------------------------');
    console.log("running loginRequired");
    console.log('---------------------------------------------------------');
    console.log('req.user: ' + req.user)

    if (req.user) {
        console.log('user object exists: you are logged in')
        return next();
    }

    console.log('user object does not exist! you are not logged in')
    console.log("redirecting to login page");
    return res.redirect("/api/login");
}

