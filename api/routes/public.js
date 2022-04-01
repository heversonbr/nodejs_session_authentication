const express = require('express');
const router = express.Router();

// const User = require('../models/User');
const path = require('path');


// GET root "/" :
// Return: an index.html which is the main entry to the app web-site.
router.get( '/' , (req, res, next) => {
    console.log('Loads index page');

    //return res.status(200).sendFile(path.join(__dirname, '../../public/index.html'));
    return res.status(200).send({status: 'SUCCESS' , message: 'Load INDEX page'}); 
});


module.exports = router;