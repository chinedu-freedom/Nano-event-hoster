const Contact = require("../models/contactModel");
const sendEmail = require("../utils/emailSender"); // Re-using your email sender utility
const { validationResult } = require("express-validator");
const {
  BadRequestError,
  InternalServerError,
} = require("../utils/customErrors"); // Ensure custom errors are imported


/**
 * @desc    Submit a contact form message
 * @route   POST /api/contact
 * @access  Public
 */
const submitContactForm = async (req, res, next) => {
  // Validate incoming request body using express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, message } = req.body;

  try {
    // 1. Save the message to the database
    const contactMessage = await Contact.create({
      name,
      email,
      message,
      // You can add more meta-data like IP address if needed (req.ip, req.headers['user-agent'])
      // ipAddress: req.ip,
      // userAgent: req.headers['user-agent'],
    });

    // 2. Send an email notification (optional, but highly recommended)
    const adminEmail = process.env.ADMIN_CONTACT_EMAIL || 'admin@example.com'; // Define this in your .env
    const emailSubject = `New Contact Form Submission from ${name}`;
    const emailHtml = `
      <h1>New Contact Message Received</h1>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
      <hr>
      <p>This message has also been saved in your database.</p>
    `;

    try {
      await sendEmail({
        to: adminEmail, // Email address to notify (e.g., your admin email)
        from: `"${name}" <${email}>`, // Set sender name and email from the form
        subject: emailSubject,
        html: emailHtml,
      });
      console.log('Contact form notification email sent successfully.');
    } catch (emailError) {
      console.error('Error sending contact form notification email:', emailError);
      // Log the error but don't prevent a successful response to the user,
      // as the message was already saved to the database.
    }

    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully. We will get back to you soon!",
      data: {
        id: contactMessage._id,
        name: contactMessage.name,
        email: contactMessage.email,
      }
    });

  } catch (error) {
    console.error("Error submitting contact form:", error);
    next(new InternalServerError("Failed to send your message. Please try again later."));
  }
};

// You can add other functions here if you need to manage contact messages (e.g., get all messages, mark as read)
// const getContactMessages = async (req, res, next) => { ... }

module.exports = {
  submitContactForm,
  // getContactMessages,
};
