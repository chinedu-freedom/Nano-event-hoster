const mongoose = require("mongoose");
const connectDB = (URL) => {
  try {
    return mongoose.connect(URL);
    console.log("Connected to the seerver");
  } catch (err) {
    console.log(err);
  }
};

module.exports = connectDB;
