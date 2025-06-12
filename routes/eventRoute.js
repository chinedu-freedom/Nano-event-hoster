const express = require("express");
const { createEvent } = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware"); // UPDATED: Import authMiddleware directly
const multer = require("multer"); // Import multer
const { eventValidationRules } = require("../middlewares/validators/eventValidation"); // NEW: Import validation rules

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit (adjust as needed)
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});


// Route for creating an event
// The `authMiddleware` ensures only authenticated users can create events.
// `upload.single('eventPicture')` middleware handles the single file upload.
// `eventValidationRules` are now imported from a separate file.
router.route("/").post(
  authMiddleware, // UPDATED: Use your authMiddleware here
  upload.single('eventPicture'), // Multer middleware for file upload
  eventValidationRules, // Validation rules (imported)
  createEvent // Controller function
);

module.exports = router;
