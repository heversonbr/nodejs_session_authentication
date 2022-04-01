const User = require('../models/User');

// Validation Module (https://joi.dev/api/#introduction)
const Joi = require('joi');

// Register validation
const registerValidation = (data) => {
    // Validation Schema
    const schema = Joi.object({ 
        
        firstname: Joi.string()
            .alphanum()
            .min(3)
            .max(30),
        lastname: Joi.string()
            .alphanum()
            .min(3)
            .max(30),
        email: Joi.string()
            .min(6)
            .email({ minDomainSegments: 2 })
            .required(),
        password: Joi.string()
            .min(8)
            .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
            .required()
    });

    return schema.validate(data);

}

// Login validation
const loginValidation = (data) => {
    // Validation Schema
    const schema = Joi.object({ 
        email: Joi.string()
            .min(6)
            .email({ minDomainSegments: 2 })
            .required(),
        password: Joi.string()
            .min(8)
            .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
            .required()
    });
    return schema.validate(data);
}

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
