require('dotenv').config();
const express = require('express');
const morgan = require('morgan'); 
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const publicRouter = require('./api/routes/public');
const authRouter = require('./api/routes/authentication');
const csurf = require('csurf');

const {loadUserFromSession} = require('./api/middlewares/authController');

const app = express();

// Connect to DB using mongoose
const dbOptions = {
        useNewUrlParser : true,
        useUnifiedTopology : true
}

console.log('Trying to connect to ' + process.env.DB_URL + '/' + process.env.DB_NAME)
const connectionPromise = mongoose.connect(process.env.DB_URL + '/' + process.env.DB_NAME, dbOptions)
.then(mongoose =>{ 
        mongoose.connection.getClient();
        console.log("Connected to the database! Enjoy!")
    })
    .catch(err => {
        console.log("Cannot connect to the database!", err);
        process.exit();
});

// session Store
const sessionStore =  MongoStore.create({
    //clientPromise: connectionPromise,     // Use either 'clientPromise and dbName' or 'mongoUrl and dbName'  
    mongoUrl: process.env.DB_URL,
    dbName: process.env.DB_NAME,
    collection: process.env.SESSION_DB_COLLECTION,     // DB collection (table) 

    //autoRemove: 'interval',               
    //autoRemoveInterval: 1 // In minutes. Default
    autoRemove: 'native' // Default
})

// Configure our session
  app.use(session({
        secret: process.env.SESSION_SECRET,      // should be a large unguessable string
        //key: 'session',                    
        saveUninitialized: false,               // don't create session until something stored
        resave: false,                      // don't save session if unmodified
        //key: 'session',             // cookie name dictates the key name added to the request object
        cookie: { 
            maxAge: 1 * 60 * 1000,
            //expires: 60 * 1000,           // in miliseconds, Note If both expires and maxAge are set in the options, then the last one defined in the object is what is used.  The expires option should not be set directly; instead only use the maxAge option.
            //secure: true,                 // setting this to true, as compliant clients will not send the cookie back to the server in the future if the browser does not have an HTTPS connection.
         },
        store: sessionStore,

        
    })
  );

// logging package
app.use(morgan('dev'));
// body-parser : parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS: enable CORS using npm package
var cors = require('cors');
app.use(cors());

// CSRF (cross-site resource forgery) Protection
// app.use('csurf');
// NOTE THAT: in this example we are not handling CSRF tokens to avoid potential CSRF attacks. Must do it in production environments.
// ref: https://youtu.be/j8Yxff6L_po?t=1470


// debug middleware: used only to print request information
app.use( (req, res, next) => {
    console.log('------------------------------------------------------------');
    console.log('---------- MIDDLEWARE Printing info on Request--------------')
    console.log('------------------------------------------------------------');
    console.log('---------------------- url ---------------------------------');
    console.log(req.url);
    console.log('------------------------------------------------------------');
    console.log('--------------------- headers ------------------------------');
    console.log(req.headers);
    console.log('------------------------------------------------------------');
    console.log('--------------------- session ------------------------------');
    console.log('id: ' + req.session.id);
    console.log(req.session);
    console.log('------------------------------------------------------------');
    console.log('---------------------- END ---------------------------------');
    next();
});

// for each request, it verifies the session-data is in the request, if so it loads 
// the user obecjt related to the session
app.use(loadUserFromSession);  

// Routers that should handle requests
app.use('/', publicRouter);
app.use('/api/', authRouter);


// Handling errors: error handling (must be at the bottom)
app.use( (req, res, next) => { 
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

app.use( (error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error:{
            message: error.message
        }
    });
});

module.exports = app;