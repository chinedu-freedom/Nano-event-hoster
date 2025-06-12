const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { UnauthorizedError, ForbiddenError } = require("../utils/customErrors");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authentication invalid: No token provided.");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select(
      "-password -refreshToken -refreshTokenExpires -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires"
    );

    if (!user) {
      throw new UnauthorizedError("Authentication invalid: User not found.");
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenError("Authentication invalid: Email not verified.");
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);

    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError("Authentication invalid: Token expired.");
    }
    if (error.name === "JsonWebTokenError") {
      throw new UnauthorizedError(
        "Authentication invalid: Invalid token signature."
      );
    }

    throw error;
  }
};

module.exports = authMiddleware;
