// utils/customErrors.js

class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Mark as operational errors (errors expected by the code)
    // Capture stack trace for better debugging, excluding the constructor call itself
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends CustomError {
  constructor(message = 'Bad Request', errors = null) {
    super(message, 400);
    this.errors = errors; // For express-validator errors, if applicable
  }
}

class UnauthorizedError extends CustomError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ForbiddenError extends CustomError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

class ConflictError extends CustomError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

class InternalServerError extends CustomError {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
  }
}

module.exports = {
  CustomError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
};
