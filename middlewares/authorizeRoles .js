const { ForbiddenError } = require("../utils/customErrors");

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw new ForbiddenError("User role not found. Access denied.");
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Role (${req.user.role}) is not authorized to access this resource.`
      );
    }

    next();
  };
};

module.exports = authorizeRoles;
