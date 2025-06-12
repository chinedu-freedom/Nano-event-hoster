const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // Existing fields for the original token-based reset
    passwordResetToken: String,
    passwordResetExpires: Date,

    // --- NEW FIELDS FOR OTP-BASED PASSWORD RESET ---
    passwordResetOtp: String,             // To store the hashed OTP
    passwordResetOtpExpires: Date,        // To store the OTP's expiration time
    passwordResetAttemptCount: {          // To track failed OTP attempts
      type: Number,
      default: 0
    },
    passwordResetLockUntil: Date,         // To lock out user after too many failed attempts
    // Note: The passwordChangeToken concept is now integrated into passwordResetToken
    // after OTP confirmation to reuse the existing resetPassword endpoint.
    // --- END NEW FIELDS ---

    refreshToken: {
      type: String,
      default: null,
    },
    refreshTokenExpires: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  // console.log("Pre-save hook triggered for user:", this.username, "Password modified:", this.isModified("password"));

  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (canditatePassword) {
  // console.log("comparePassword method called. Candidate:", canditatePassword, "Stored hash:", this.password);
  return await bcrypt.compare(canditatePassword, this.password);
};

// Method for the original token-based password reset AND for generating
// the post-OTP token to be used by the generic resetPassword endpoint.
UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex"); // Generate random 32 bytes
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Token valid for 10 minutes

  return resetToken; // Return the unhashed token to be sent to the user
};

UserSchema.methods.getVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString("hex");
  this.emailVerificationToken = verificationToken;
  this.emailVerificationExpires = Date.now() + 3600000; // 1 hour
  return verificationToken;
};

// --- NEW METHOD FOR OTP-BASED PASSWORD RESET (GENERATION) ---
UserSchema.methods.generatePasswordResetOtp = async function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generates 100000-999999

  this.passwordResetOtp = await bcrypt.hash(otp, 10);
  this.passwordResetOtpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

  this.passwordResetAttemptCount = 0;
  this.passwordResetLockUntil = undefined;

  // No this.save() here; controller will call it.
  return otp; // Return the plain OTP to be sent via email
};

// --- NEW METHOD FOR OTP-BASED PASSWORD RESET (COMPARISON) ---
UserSchema.methods.comparePasswordResetOtp = async function(candidateOtp) {
  return await bcrypt.compare(candidateOtp, this.passwordResetOtp);
};

module.exports = mongoose.model("User", UserSchema);
