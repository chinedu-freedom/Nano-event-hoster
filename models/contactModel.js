const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email address",
      ],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      minlength: [10, "Message must be at least 10 characters long"],
      maxlength: [1000, "Message cannot exceed 1000 characters"],
      trim: true,
    },
    // You might want to add fields like:
    // ipAddress: String, // To track sender's IP for abuse prevention
    // userAgent: String, // To track sender's browser/OS
    // status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' }, // For admin tracking
    // repliedBy: { type: mongoose.Schema.ObjectId, ref: 'User' }, // If an admin replies
    // repliedAt: Date,
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Contact", ContactSchema);
