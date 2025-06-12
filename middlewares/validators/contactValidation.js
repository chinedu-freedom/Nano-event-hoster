const { body } = require("express-validator");

// Regular expression for HH:MM (24-hour format)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Validation rules for the contact form.
 * This array can be directly used as Express middleware.
 */
const contactFormValidationRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address"),
  body("message")
    .trim()
    .notEmpty().withMessage("Message is required")
    .isLength({ min: 10, max: 1000 }).withMessage("Message must be between 10 and 1000 characters"),
];

module.exports = {
  contactFormValidationRules, // This line is crucial for named export
};
