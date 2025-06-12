const { body } = require("express-validator");

// Regular expression for HH:MM (24-hour format)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Validation rules for creating and updating events.
 * This array can be directly used as Express middleware.
 */
const eventValidationRules = [
  body("name")
    .notEmpty().withMessage("Event name is required")
    .isLength({ min: 3, max: 100 }).withMessage("Event name must be between 3 and 100 characters"),
  body("eventDate")
    .notEmpty().withMessage("Event date is required")
    .isISO8601().toDate().withMessage("Event date must be a valid date format (YYYY-MM-DD)"),
  body("time")
    .notEmpty().withMessage("Time is required")
    .matches(timeRegex).withMessage("Time must be in HH:MM format (24-hour)"),
  body("startTime")
    .notEmpty().withMessage("Start time is required")
    .matches(timeRegex).withMessage("Start time must be in HH:MM format (24-hour)"),
  body("endTime")
    .notEmpty().withMessage("End time is required")
    .matches(timeRegex).withMessage("End time must be in HH:MM format (24-hour)"),
  body("location")
    .notEmpty().withMessage("Event location is required")
    .isLength({ min: 3, max: 200 }).withMessage("Location must be between 3 and 200 characters"),
];

module.exports = {
  eventValidationRules,
};
