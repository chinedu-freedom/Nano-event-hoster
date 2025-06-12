const { body } = require("express-validator");

/**
 * Validation rules for submitting a simple review message.
 */
const reviewMessageValidationRules = [
  body("review") // UPDATED: Changed from 'message' to 'review'
    .trim()
    .notEmpty().withMessage("Review is required") // UPDATED: Message refers to 'Review'
    .isLength({ min: 5, max: 500 }).withMessage("Review must be between 5 and 500 characters"), // UPDATED: Message refers to 'Review'
];

module.exports = {
  reviewMessageValidationRules,
};
