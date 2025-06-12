const express = require("express");
const { submitContactForm } = require("../controllers/contactController"); // Check this path and export!
const { contactFormValidationRules } = require("../middlewares/validators/contactValidation");

console.log('Type of contactFormValidationRules:', typeof contactFormValidationRules, Array.isArray(contactFormValidationRules));
console.log('Type of submitContactForm:', typeof submitContactForm); // This should say 'function'

const router = express.Router();

// Route for submitting a contact form message
router.route("/").post(
  contactFormValidationRules,
  submitContactForm
);

module.exports = router;
