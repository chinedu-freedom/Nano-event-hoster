const express = require("express");
const { submitReviewMessage } = require("../controllers/reviewController");
const { reviewMessageValidationRules } = require("../middlewares/reviewsValidator");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: User review/feedback submissions
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Submit a general review message
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - review
 *             properties:
 *               review:
 *                 type: string
 *                 example: This platform is excellent! Very easy to use.
 *                 description: The user's feedback or review message.
 *     responses:
 *       201:
 *         description: Review message submitted successfully.
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
 *                   example: Review message submitted successfully!
 *                 review:
 *                   $ref: '#/components/schemas/ReviewMessage'
 *       400:
 *         description: Bad Request (validation errors)
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
  reviewMessageValidationRules,
  submitReviewMessage
);

module.exports = router;
