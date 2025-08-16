const mongoose = require("mongoose");
const connectDB = (URL) => {
  try {
    return mongoose.connect(URL);
    console.log("Connected to the server");
  } catch (err) {
    console.log(err);
  }
};

module.exports = connectDB;
