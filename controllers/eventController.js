const Event = require("../models/eventModel");
const { uploadToCloudinary } = require("../utils/cloudinary");
const { // Ensure all custom errors are correctly imported from utils/customErrors
  BadRequestError,
  InternalServerError,
} = require("../utils/customErrors");
const { validationResult } = require("express-validator");


/**
 * @desc    Create a new event
 * @route   POST /api/events
 * @access  Private (requires authentication)
 */
const createEvent = async (req, res, next) => {
  // Validate incoming request body using express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, eventDate, time, startTime, endTime, location } = req.body;
  const creator = req.user._id; // Assuming `req.user` is set by your authentication middleware

  // Basic date/time validation for the 'eventDate' (more robust handled by express-validator)
  const eventDateTime = new Date(eventDate);
  if (isNaN(eventDateTime.getTime())) {
    return next(new BadRequestError("Invalid event date format."));
  }

  // Time comparison: Ensure end time is after start time (assuming HH:MM 24-hour format)
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
      return next(new BadRequestError("End time must be after start time."));
  }

  let eventPicture = "https://placehold.co/600x400/FFF000/000.png?text=Event+Image"; // Default placeholder
  let eventPicturePublicId = null;

  try {
    // Handle image upload if a file is provided
    if (req.file) {
      console.log('File received for upload:', req.file.originalname); // Debugging
      // Pass both the buffer and its MIME type to cloudinary utility
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      console.log('Cloudinary upload successful:', result.secure_url); // Debugging

      eventPicture = result.secure_url;
      eventPicturePublicId = result.public_id;
    }

    const event = await Event.create({
      name,
      eventDate: eventDateTime,
      time,
      startTime,
      endTime,
      location,
      eventPicture,
      eventPicturePublicId,
      creator,
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully!",
      event,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    // Ensure you use 'new' for custom errors
    if (error.message === 'Failed to upload image to Cloudinary.') {
      return next(new InternalServerError(error.message)); // Corrected instantiation
    }
    next(new InternalServerError("Failed to create event. Please try again.")); // Corrected instantiation
  }
};


module.exports = {
  createEvent,
};
