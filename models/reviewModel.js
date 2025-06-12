const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    review: { // Renamed from 'comment' to 'message' for clarity
      type: String,
      required: [true, "Review is required"],
      trim: true,
      minlength: [5, "Review must be at least 5 characters long"],
      maxlength: [500, "Review cannot exceed 500 characters"],
    },
    // Removed: rating, user, product, userName
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Removed: unique index as there's no user/product to ensure uniqueness against

module.exports = mongoose.model("Review", ReviewSchema);
