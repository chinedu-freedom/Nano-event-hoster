const express = require("express");
const { createEvent } = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require("multer");
const { eventValidationRules } = require("../middlewares/validators/eventValidation");

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management operations
 */

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - eventDate
 *               - time
 *               - startTime
 *               - endTime
 *               - location
 *               - eventPicture
 *             properties:
 *               name:
 *                 type: string
 *                 example: Community Sports Day
 *               eventDate:
 *                 type: string
 *                 format: date
 *                 example: 2025-09-15
 *               time:
 *                 type: string
 *                 example: 10:00
 *               startTime:
 *                 type: string
 *                 example: 09:30
 *               endTime:
 *                 type: string
 *                 example: 17:00
 *               location:
 *                 type: string
 *                 example: City Park Athletics Track
 *               eventPicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Event created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Event created successfully!
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad Request (validation errors)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/").post(
  authMiddleware,
  upload.single("eventPicture"),
  eventValidationRules,
  createEvent
);

module.exports = router;
