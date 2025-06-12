const express = require("express");
const { submitReviewMessage } = require("../controllers/reviewController");
// CORRECTED PATH: Use the path that matches your actual file structure
const { reviewMessageValidationRules } = require("../middlewares/reviewsValidator"); // Assuming middleware/validation/reviewValidation.js

const router = express.Router();

// Route for submitting a review message (Public access)
router.route("/").post(
  reviewMessageValidationRules, // Apply validation for the message
  submitReviewMessage
);

module.exports = router;
