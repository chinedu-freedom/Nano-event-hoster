const Review = require("../models/reviewModel");
const { validationResult } = require("express-validator");
const {
  BadRequestError,
  InternalServerError,
} = require("../utils/customErrors"); // Ensure custom errors are imported


/**
 * @desc    Submit a new review message
 * @route   POST /api/reviews
 * @access  Public
 */
const submitReviewMessage = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { review } = req.body; // This extracts the 'review' string from the request body

  try {
    // Renamed the variable to 'newReview' to avoid conflict with 'review' from req.body
    const newReview = await Review.create({
      review, // Use the 'review' string extracted from req.body
    });

    res.status(201).json({
      success: true,
      message: "Review message submitted successfully!",
      review: newReview, // Return the newly created review object
    });
  } catch (error) {
    console.error("Error submitting review message:", error);
    next(new InternalServerError("Failed to submit review message. Please try again later."));
  }
};


module.exports = {
  submitReviewMessage,
};
