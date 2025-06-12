const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    eventDate: {
      type: Date,
      required: [true, "Event date is required"],
    },
    time: { // New field
        type: String,
        required: [true, "Time is required"]
    },
    startTime: {
      type: String, // e.g., "10:00 AM", "14:30"
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String, // e.g., "12:00 PM", "16:00"
      required: [true, "End time is required"],
    },
    location: {
      type: String,
      required: [true, "Event location is required"],
      trim: true,
      maxlength: 200,
    },
    eventPicture: {
      type: String, // URL of the uploaded image on Cloudinary
      default: "https://placehold.co/600x400/FFF000/000.png?text=Event+Image", // Placeholder if no image
    },
    // If you need to delete the image from Cloudinary later, store its public_id
    eventPicturePublicId: {
      type: String,
    },
    // Reference to the user who created the event (assuming you have a User model)
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: "User", // Assumes your User model is named 'User'
      required: true,
    },
    // You might want to add other fields like description, category, attendees, etc.
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Optional: Add a pre-save hook to validate that end time is after start time
EventSchema.pre('save', function (next) {
    // Basic string comparison might work for 'HH:MM' but is not robust for 'HH:MM AM/PM'
    // For robust time comparison, consider parsing to Date objects or using a library like moment.js
    // Let's keep it simple here, complex date/time validation is better in express-validator or controller.
    next();
});

module.exports = mongoose.model("Event", EventSchema);
