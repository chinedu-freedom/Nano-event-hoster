const express = require("express");
const { submitContactForm } = require("../controllers/contactController");
const { contactFormValidationRules } = require("../middlewares/validators/contactValidation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact form submission
 */

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Submit a new contact message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.doe@example.com
 *               message:
 *                 type: string
 *                 example: I have a question about your services.
 *     responses:
 *       201:
 *         description: Message sent successfully.
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
 *                   example: Your message has been sent successfully. We will get back to you soon!
 *                 data:
 *                   $ref: '#/components/schemas/ContactMessage'
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
router.route("/").post(contactFormValidationRules, submitContactForm);

module.exports = router;
