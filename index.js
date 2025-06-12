require("dotenv").config();
const express = require("express");
const app = express();
const connectDB = require("./Db/db");
const errorHandlerMiddleware = require('./middlewares/errorHandler');
const authRoutes = require("./routes/authRoutes");
const userRouter = require('./routes/userRoutes');
const eventRoute = require('./routes/eventRoute'); // NEW: Import event routes
const contactRoute = require('./routes/contactRoute'); // NEW: Import contact routes
const reviewRoute = require('./routes/reviewRoute'); // NEW: Import review routes

const cookieParser = require('cookie-parser'); // NEW: Import cookie-parser

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS (first 5 chars):', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.substring(0, 5) + '...' : 'Not loaded');
console.log('APP_URL:', process.env.APP_URL);


app.use(express.json());
// NEW: Add middleware for parsing URL-encoded data
// This is good practice for handling various form submissions, even if Multer handles multipart.
app.use(express.urlencoded({ extended: true }));
// NEW: Add cookie-parser middleware for handling cookies (e.g., refresh tokens)
app.use(cookieParser());


app.get("/", (req, res) => {
  console.log("Hit root route")
  res.send("API is running");
});

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use('/api/user', userRouter);
app.use('/api/events', eventRoute); // NEW: Mount your event routes
app.use('/api/contact', contactRoute); // NEW: Mount your contact routes
app.use('/api/reviews', reviewRoute); // NEW: Mount your review routes




app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    console.log("Connected to the database");
    app.listen(process.env.PORT, () => {
      console.log("Server is running on port 7000");
    });
  } catch (err) {
    console.log("Error while connecting to the database");
  }
};

start();
