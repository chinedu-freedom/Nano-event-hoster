const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // For hashing passwords (if still used)
const jwt = require("jsonwebtoken"); // For generating JWTs (if still used)
const crypto = require("crypto"); // For generating tokens

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide a username"],
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      // Make password required ONLY if provider is 'email/password'
      // This will be handled in the controller logic if needed,
      // or set this to 'false' if social login users don't need a password.
      required: function() {
        return this.provider === 'email/password'; // Only required for traditional signups
      },
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't return password by default in queries
    },
    isEmailVerified: {
      type: Boolean,
      default: false, // Keep default false for traditional signup verification
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    otp: String,
    otpExpires: Date,
    otpAttempts: { type: Number, default: 0 },
    otpLockUntil: Date,
    // --- NEW FIELDS FOR SOCIAL LOGIN ---
    provider: { // e.g., 'email/password', 'google', 'facebook'
      type: String,
      default: 'email/password',
      enum: ['email/password', 'google', 'facebook', 'apple'] // Add more providers as needed
    },
    providerId: { // Unique ID from the social provider (e.g., Google's 'sub' field)
      type: String,
      unique: true,
      sparse: true, // Allows null values, so it's not unique for email/password users
    },
    profilePicture: String, // Optional: for storing social profile pictures
    // --- END NEW FIELDS ---
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Hash password before saving (only if it's an email/password signup and password is modified)
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.provider !== 'email/password') {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method (for login)
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRES_IN,
  });
};

// Generate email verification token (for traditional email verification)
UserSchema.methods.getEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  this.emailVerificationExpires = Date.now() + 3600000; // 1 hour
  return verificationToken;
};

// Generate password reset token
UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
