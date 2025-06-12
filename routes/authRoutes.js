const express = require("express");
const router = express.Router();
const {
  signupValidator,
  loginValidator,
} = require("../middlewares/validators/authValidator");
const {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  // --- NEW IMPORTS FOR SPLIT OTP FLOW ---
  requestPasswordOtp,
  confirmOtp,
  // --- END NEW IMPORTS ---
} = require("../controllers/authController");

router.post("/signup", signupValidator, signup);
router.post("/login", loginValidator, login);

// --- Original Token-Based Password Reset Flow ---
// Step 1: User requests a password reset link (containing a token) via email
router.post("/forgot-password", forgotPassword);
// Step 2: User clicks the link, then sends new password with the token from the URL
router.post("/reset-password/:token", resetPassword);

// --- New OTP-Based Password Reset Flow (Split into 2 steps) ---
// Step 1: User requests an OTP code via email
router.post("/request-password-otp", requestPasswordOtp);
// Step 2: User confirms the OTP, and receives a new password change token
router.post("/confirm-otp", confirmOtp);
// Step 3: User uses the password change token (from confirm-otp) to reset their password
// This re-uses the existing reset-password/:token endpoint
// router.post("/reset-password/:token", resetPassword); // This route is already defined above

// --- Email Verification Route ---
router.get("/verify-email/:token", verifyEmail);

module.exports = router;
