const { validationResult } = require("express-validator");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require('google-auth-library'); // NEW: Import Google Auth Library
const sendEmail = require("../utils/emailSender");
const {
  ConflictError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  InternalServerError,
} = require("../utils/customErrors");

// You need to create an OAuth 2.0 Client ID in Google Cloud Console

// APIs & Services -> Credentials -> Create Credentials -> OAuth client ID

// Select 'Web application' or 'iOS'/'Android' depending on your frontend.

// The CLIENT_ID will be something like: YOUR_CLIENT_ID.apps.googleusercontent.com

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // NEW
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
  process.exit(1);
}


const signup = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { username, email, password } = req.body;
  const normalizedEmail = email.toLowerCase();
  const normalizedUsername = username.trim();

  try {
    const existingUser = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });
    if (existingUser) {
      throw new ConflictError(
        "User with this username or email already exists."
      );
    }
    const newUser = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password: password,
    });
    await newUser.save();

    const verificationToken = crypto.randomBytes(20).toString("hex");
    newUser.emailVerificationToken = verificationToken;
    newUser.emailVerificationExpires = Date.now() + 3600000;
    await newUser.save();

const verificationLinkHtml = `
  <p>Please click the link to verify your email address:</p>
  <a href="${process.env.APP_URL}/verificationPage/index.html?token=${verificationToken}">
    Verify Email
  </a>
  <p>This token expires in 1 hr</p>
`;
    try {
      await sendEmail({
        to: newUser.email,
        subject: "Verify Your Email Address",
        html: verificationLinkHtml,
      });

      res.status(201).json({
        message:
          "Sign up successful! Please check your email for verification.",
        newUser: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
      });
    } catch (mailError) {
      console.error(
        "Error sending verification email (via service):",
        mailError
      );
      throw new InternalServerError("User created but failed to send verification email.");
    }
  } catch (err) {
    console.error("Error during signup:", err);
    if (err instanceof ConflictError || err instanceof BadRequestError || err instanceof InternalServerError) {
      throw err;
    }
    throw new InternalServerError("An unexpected error occurred during signup.");
  }
};


const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      throw new UnauthorizedError("Invalid credentials.");
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenError(
        "Please verify your email address before logging in."
      );
    }
    // console.log("Login attempt for email:", email);
    // console.log("Plaintext password received:", password);
    // console.log("Hashed password from DB (user.password):", user.password);

    const isMatch = await user.comparePassword(password);
    // console.log("Password comparison (isMatch):", isMatch);

    if (!isMatch) {
      throw new UnauthorizedError("Invalid credentials.");
    }

    const payload = {
      userId: user._id,
      username: user.username,
      email: user.email,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "1h",
    });
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.refreshToken = hashedRefreshToken;
    user.refreshTokenExpires = refreshTokenExpiry;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      expires: refreshTokenExpiry,
      path: "/api/auth/refresh-token",
    });

    res.status(200).json({
      message: "Login successful!",
      token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("An unexpected error occurred during login.");
  }
};


const googleSignIn = async (req, res, next) => {

  const { idToken } = req.body; // The ID Token received from Google on the frontend



  if (!idToken) {

    return next(new BadRequestError("Google ID token is required."));

  }



  try {

    const ticket = await googleClient.verifyIdToken({

      idToken: idToken,

      audience: process.env.GOOGLE_CLIENT_ID, // Verify that the token is for your app

    });



    const payload = ticket.getPayload();

    // Payload contains verified user information from Google

    const { sub: googleId, email, name, picture } = payload;



    // Check if user already exists in your database

    let user = await User.findOne({ email });



    if (user) {

      // User exists, check if it's a traditional user or social user from a different provider

      if (user.provider === 'email/password' && !user.providerId) {

        // Existing email/password user, but now trying to link Google

        // You might prompt them to link accounts, or just log them in

        // For simplicity, we'll log them in, assuming they now prefer Google sign-in

        user.provider = 'google';

        user.providerId = googleId;

        user.isEmailVerified = true; // Google verifies email automatically

        if (name && !user.username) user.username = name.split(' ')[0]; // Use first name as username if not set

        if (picture && !user.profilePicture) user.profilePicture = picture;

        await user.save({ validateBeforeSave: false }); // Save updates

      } else if (user.provider !== 'google' && user.providerId) {

        // User exists with same email but from a *different* social provider (e.g., Facebook)

        return next(new ConflictError(`This email is already registered via ${user.provider}. Please use that method to sign in.`));

      } else if (user.provider === 'google' && user.providerId !== googleId) {

        // Edge case: Same email, but different Google ID (highly unlikely but possible if Google changes sub or old data is bad)

        console.warn('Google sign-in: Email exists but providerId mismatch. Updating providerId.');

        user.providerId = googleId;

        await user.save({ validateBeforeSave: false });

      }



      // If user exists and is consistent, log them in

      const token = user.getSignedJwtToken();

      return res.status(200).json({

        success: true,

        message: "Google sign-in successful!",

        token,

        user: {

          id: user._id,

          username: user.username,

          email: user.email,

          isEmailVerified: user.isEmailVerified,

          provider: user.provider,

          profilePicture: user.profilePicture,

        },

      });



    } else {

      // User does NOT exist, create a new user account

      const newUser = await User.create({

        username: name || email.split('@')[0], // Use full name or part of email as username

        email: email,

        isEmailVerified: true, // Google verifies emails

        provider: 'google',

        providerId: googleId,

        profilePicture: picture,

        // No password needed for social login user as per model update

      });



      const token = newUser.getSignedJwtToken();

      res.status(201).json({

        success: true,

        message: "Google sign-up successful!",

        token,

        user: {

          id: newUser._id,

          username: newUser.username,

          email: newUser.email,

          isEmailVerified: newUser.isEmailVerified,

          provider: newUser.provider,

          profilePicture: newUser.profilePicture,

        },

      });

    }



  } catch (error) {

    console.error("Error during Google sign-in:", error);

    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError' || error.message.includes('No matching audience') || error.message.includes('Wrong issuer')) {

      return next(new UnauthorizedError("Invalid or expired Google ID token. Please try signing in again."));

    }

    next(new InternalServerError("Google sign-in failed. Please try again."));

  }

};
const verifyEmail = async (req, res) => {
  // console.log("Verification route hit!");
  const { token } = req.params;
  // console.log("Received token:", token);

  try {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token." });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res
      .status(200)
      .json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    console.error("Error verifying email:", error);
    return res
      .status(500)
      .json({ message: "Email verification failed. Please try again later." });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError("Please provide an email address.");
  }

  let user;

  try {
    user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res
        .status(200)
        .json({
          message:
            "If a user with that email exists, a password reset email has been sent.",
        });
    }

    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.FRONTEND_URL}?token=${resetToken}`;

    const messageHtml = `
            <h1>Password Reset Request</h1>
            <p>You are receiving this because you (or someone else) has requested the reset of the password for your account.</p>
            <p>Please click on the following link, or paste this into your browser to complete the process:</p>
            <a href="${resetURL}" style="color: #007bff; text-decoration: none;">Reset password</a>
            <p>This link will expire in 10 minutes.</p>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            <p>Thanks,<br>Your App Team</p>
        `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request for Your App",
        html: messageHtml,
      });

      res.status(200).json({
        message:
          "If a user with that email exists, a password reset email has been sent.",
      });
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error("Error sending password reset email:", emailError);
      throw new InternalServerError(
        "There was an issue sending the password reset email. Please try again later."
      );
    }
  } catch (error) {
    if (user && user.passwordResetToken) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }
    console.error("Error during forgot password process:", error);
    if (error instanceof BadRequestError || error instanceof InternalServerError) {
      throw error;
    }
    throw new InternalServerError("An unexpected error occurred during forgot password request.");
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword, confirmNewPassword } = req.body;

  if (!newPassword || !confirmNewPassword) {
    throw new BadRequestError("Please provide a new password and confirm it.");
  }
  if (newPassword !== confirmNewPassword) {
    throw new BadRequestError(
      "New password and confirm password do not match."
    );
  }
  if (newPassword.length < 6) {
    throw new BadRequestError("Password must be at least 6 characters long.");
  }

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new BadRequestError(
        "Password reset token is invalid or has expired."
      );
    }
    user.password = newPassword;

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;
    user.passwordResetAttemptCount = 0;
    user.passwordResetLockUntil = undefined;


    await user.save();

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Error during password reset (token):", error);
    if (error.name === "ValidationError" && user) {
      throw new BadRequestError(error.message, error.errors);
    }
    if (error instanceof BadRequestError || error instanceof InternalServerError) {
      throw error;
    }
    throw new InternalServerError("An unexpected error occurred during password reset.");
  }
};

// --- NEW ENDPOINT: Request OTP for Password Reset ---
const requestPasswordOtp = async (req, res) => {
  const { email } = req.body;
  console.log("--- Requesting OTP for:", email, "---"); // DEBUG

  if (!email) {
    throw new BadRequestError("Please provide an email address.");
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log("Found user for OTP request:", !!user); // DEBUG

    if (!user) {
      return res.status(200).json({
        message: "If an account with that email exists, a password reset code has been sent.",
      });
    }

    if (user.passwordResetLockUntil && user.passwordResetLockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.passwordResetLockUntil - Date.now()) / (1000 * 60));
      console.log("User locked out from OTP request:", remainingTime, "minutes remaining"); // DEBUG
      return res.status(429).json({
        message: `Too many OTP requests. Please try again in ${remainingTime} minutes.`,
      });
    }

    const otp = await user.generatePasswordResetOtp(); // Generates and updates OTP fields on the user object
    // --- IMPORTANT: ADD THIS LINE TO SAVE THE OTP TO THE DATABASE ---
    await user.save({ validateBeforeSave: false }); // Persist the OTP and its expiry
    // --- END IMPORTANT ADDITION ---

    console.log("Generated OTP (plain):", otp); // DEBUG: ONLY FOR DEV! REMOVE IN PROD!
    console.log("OTP HASHED and stored in DB:", user.passwordResetOtp); // DEBUG
    console.log("OTP Expires (Date obj):", user.passwordResetOtpExpires); // DEBUG
    console.log("OTP Expires (MS):", user.passwordResetOtpExpires.getTime()); // DEBUG
    console.log("Current Time (MS):", Date.now()); // DEBUG


    const messageHtml = `
      <h1>Password Reset Request</h1>
      <p>You have requested a password reset for your account. Please use the following code:</p>
      <h2 style="color: #007bff; font-size: 24px; text-align: center;">${otp}</h2>
      <p>This code is valid for 10 minutes.</p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <p>Thanks,<br>Your App Team</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Your Password Reset Code",
        html: messageHtml,
      });
      console.log("OTP email sent successfully."); // DEBUG

      res.status(200).json({
        message: "If an account with that email exists, a password reset code has been sent.",
      });
    } catch (emailError) {
      console.error("Error sending password reset OTP email (via service):", emailError); // DEBUG
      // Clear OTP fields if email sending fails, to prevent user from retrying with unsent OTP
      user.passwordResetOtp = undefined;
      user.passwordResetOtpExpires = undefined;
      user.passwordResetAttemptCount = 0;
      user.passwordResetLockUntil = undefined;
      await user.save({ validateBeforeSave: false }); // Ensure cleared state is saved

      throw new InternalServerError(
        "There was an issue sending the password reset code. Please try again later."
      );
    }
    // Log the user object AFTER the successful save
    console.log("User object state after OTP request and save:", user); // DEBUG
  } catch (error) {
    console.error("Error during request password reset code process:", error); // DEBUG
    if (error instanceof BadRequestError || error.statusCode === 429) {
      throw error;
    }
    throw new InternalServerError("An unexpected error occurred during password reset code request.");
  }
};

// --- NEW ENDPOINT: Confirm OTP and get Password Change Token ---
const confirmOtp = async (req, res) => {
  const { email, otp } = req.body;
  console.log("--- Confirming OTP for:", email, "with code:", otp, "---"); // DEBUG

  if (!email || !otp) {
    throw new BadRequestError("Please provide email and OTP.");
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log("Found user for OTP confirmation:", !!user); // DEBUG

    if (!user) {
      console.log("User not found for OTP confirmation."); // DEBUG
      throw new UnauthorizedError("Invalid email or OTP."); // Generic message
    }

    console.log("User's passwordResetOtp (from DB):", user.passwordResetOtp ? "Present" : "Not Present", user.passwordResetOtp); // DEBUG
    console.log("User's passwordResetOtpExpires (from DB):", user.passwordResetOtpExpires); // DEBUG
    console.log("Current Time (Date obj):", new Date()); // DEBUG

    if (user.passwordResetLockUntil && user.passwordResetLockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.passwordResetLockUntil - Date.now()) / (1000 * 60));
      console.log("User locked out from OTP confirmation:", remainingTime, "minutes remaining"); // DEBUG
      return res.status(429).json({
        message: `Too many incorrect OTP attempts. Please try again in ${remainingTime} minutes.`,
      });
    }

    if (!user.passwordResetOtp || user.passwordResetOtpExpires < Date.now()) {
      console.log("OTP is missing or expired. Clearing OTP fields."); // DEBUG
      // Clear OTP and attempts if expired or missing
      user.passwordResetOtp = undefined;
      user.passwordResetOtpExpires = undefined;
      user.passwordResetAttemptCount = 0;
      user.passwordResetLockUntil = undefined;
      await user.save({ validateBeforeSave: false });
      throw new BadRequestError("Password reset code is invalid or has expired. Please request a new one.");
    }

    // Compare the provided OTP with the stored hashed OTP
    console.log("Attempting to compare OTP. Provided:", otp, "Stored HASH:", user.passwordResetOtp); // DEBUG
    const isOtpMatch = await user.comparePasswordResetOtp(otp);
    console.log("OTP match result:", isOtpMatch); // DEBUG

    if (!isOtpMatch) {
      user.passwordResetAttemptCount = (user.passwordResetAttemptCount || 0) + 1;
      console.log("Incorrect OTP. Attempt count increased to:", user.passwordResetAttemptCount); // DEBUG

      const MAX_OTP_ATTEMPTS = 3;
      const LOCKOUT_DURATION_MINUTES = 5;

      if (user.passwordResetAttemptCount >= MAX_OTP_ATTEMPTS) {
        user.passwordResetLockUntil = Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000;
        user.passwordResetAttemptCount = 0;
        await user.save({ validateBeforeSave: false });
        console.log("User locked out due to too many attempts."); // DEBUG
        return res.status(429).json({
          message: `Too many incorrect OTP attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`,
        });
      }
      await user.save({ validateBeforeSave: false });

      throw new UnauthorizedError("Invalid email or OTP."); // Generic message
    }

    // OTP is valid. Generate a password reset token (reusing getResetPasswordToken method)
    console.log("OTP matched! Generating password change token."); // DEBUG
    const passwordChangeToken = user.getResetPasswordToken(); // This updates passwordResetToken & Expires on user

    // Clear OTP specific fields after successful confirmation
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;
    user.passwordResetAttemptCount = 0;
    user.passwordResetLockUntil = undefined;

    await user.save(); // Save the new passwordResetToken and clear OTP fields
    console.log("Password change token generated and user saved."); // DEBUG

    res.status(200).json({
      message: "OTP confirmed successfully. You can now reset your password.",
      passwordChangeToken: passwordChangeToken
    });

  } catch (error) {
    console.error("Error during OTP confirmation:", error); // DEBUG
    if (error instanceof BadRequestError || error instanceof UnauthorizedError || error.statusCode === 429) {
      throw error;
    }
    throw new InternalServerError("An unexpected error occurred during OTP confirmation.");
  }
};


module.exports = {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  requestPasswordOtp,
  confirmOtp,
  googleSignIn
};
