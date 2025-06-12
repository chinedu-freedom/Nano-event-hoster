const { body } = require('express-validator');

const signupValidator = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters long')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain alphanumeric characters, underscores, and hyphens'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(), 
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).withMessage('Password must include uppercase, lowercase, number, and a special character'),
];
const loginValidator = [
    body('email')
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Please enter a valid email address.')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required.'),
];

module.exports = {
    signupValidator,
    loginValidator
};
