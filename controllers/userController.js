const { BadRequestError } = require("../utils/customErrors");
const sendEmail = require("../utils/emailSender");
const User = require("../models/userModel");

const getMe = async (req, res) => {
  res.status(200).json({ user: req.user });
};
const updateMe = async (req, res) => {
  const { username, email } = req.body;

  if (!username && !email) {
    throw new BadRequestError("Please provide username or email to update.");
  }

  if (username && username !== req.user.username) {
    req.user.username = username;
  }

  if (email && email !== req.user.email) {
    req.user.email = email;
    req.user.isEmailVerified = false;

    const verificationToken = req.user.getVerificationToken();

    const verificationURL = `${process.env.APP_URL}/verify-email/${verificationToken}`;

    try {
      await sendEmail({
        to: req.user.email,
        subject: "Please Verify Your New Email Address",
        html: `<p>Please click the link to verify your new email address:</p><a href="${verificationURL}">Verify Email</a><p>This token expires in 1 hr</p>`,
      });
    } catch (mailError) {
      console.error("Error sending new verification email:", mailError);
      req.user.emailVerificationToken = undefined;
      req.user.emailVerificationExpires = undefined;
      throw new InternalServerError(
        "Failed to send verification email to the new address."
      );
    }
  }

  try {
    await req.user.save();
    res
      .status(200)
      .json({ user: req.user, message: "Profile updated successfully." });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern.email) {
        throw new BadRequestError("Email address is already in use.");
      }
      if (error.keyPattern.username) {
        throw new BadRequestError("Username is already taken.");
      }
    }
    console.error("Error updating user profile:", error);
    throw error;
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    throw new BadRequestError(
      "Please provide current password, new password, and confirm new password."
    );
  }

  if (newPassword !== confirmNewPassword) {
    throw new BadRequestError("New password and confirmation do not match.");
  }

  if (newPassword.length < 6) {
    throw new BadRequestError(
      "New password must be at least 6 characters long."
    );
  }

  const user = await User.findById(req.user.id).select("+password");

  try {
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw new UnauthorizedError("Current password is incorrect.");
    }

    user.password = newPassword;

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    user.refreshToken = undefined;
    user.refreshTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
};

module.exports = {
  getMe,
  updateMe,
  changePassword,
};
