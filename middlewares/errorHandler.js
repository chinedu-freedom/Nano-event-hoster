const { CustomAPIError } = require("../utils/customErrors");

const errorHandlerMiddleware = (err, req, res, next) => {
  console.error("--- Global Error Handler ---");
  console.error("Error Name:", err.name);
  console.error("Error Message:", err.message);
  console.error("Error Stack:", err.stack);

  let customError = {
    statusCode: err.statusCode || 500,
    message:
      err.message ||
      "Something went wrong on our side. Please try again later.",
  };

  if (err.code && err.code === 11000) {
    customError.statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    customError.message = `Duplicate value entered for ${field} field. Please choose another value.`;
  }

  if (err.name === "CastError") {
    customError.statusCode = 400;
    customError.message = `No item found with id : ${err.value}`;
  }

  if (err instanceof CustomAPIError) {
    customError.statusCode = err.statusCode;
    customError.message = err.message;
  }

  return res
    .status(customError.statusCode)
    .json({ message: customError.message });
};

module.exports = errorHandlerMiddleware;
