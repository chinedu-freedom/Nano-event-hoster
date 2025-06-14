const express = require("express");
const router = express.Router();
const {
  signupValidator,
  loginValidator,
} = require("../middlewares/validators/authValidator");

const {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  requestPasswordOtp,
  confirmOtp,
   googleSignIn,
} = require("../controllers/authController");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and authorization APIs
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: newuser123
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecureP@ss123
 *     responses:
 *       201:
 *         description: User registered successfully. Email verification sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sign up successful! Please check your email for verification.
 *                 newUser:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/signup", signupValidator, signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: MyStrongP@ssw0rd
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful!
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/login", loginValidator, login);


/**
 * @swagger
 * /auth/google-login:
 *   post:
 *     summary: Sign in or sign up with Google
 *     tags: [Auth]
 *     description: Authenticates a user using a Google ID token from the frontend. Creates a new user if one doesn't exist.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: The Google ID token received from the frontend after user signs in with Google.
 *                 example: eyJhbGciOiJSUzI1NiIsImtpZCI6IjZmOGQ1OGIwMjE0NzU3NmE2YTUyZDM2YzU1ZjU2MzFhYmE0ZDc0MmQiLCJ0eXAiOiJKV1QifQ...
 *     responses:
 *       200:
 *         description: Google sign-in successful. Returns app JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Google sign-in successful!
 *                 token:
 *                   type: string
 *                   example: your_app_jwt_token_here
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 60d0fe4f5311361c40212f00
 *                     username:
 *                       type: string
 *                       example: GoogleUser
 *                     email:
 *                       type: string
 *                       example: google.user@example.com
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: true
 *                     provider:
 *                       type: string
 *                       example: google
 *                     profilePicture:
 *                       type: string
 *                       example: https://lh3.googleusercontent.com/a/ABCDEFGHIJKLMNO=s96-c
 *       201:
 *         description: Google sign-up successful. Returns app JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Google sign-up successful!
 *                 token:
 *                   type: string
 *                   example: your_app_jwt_token_here
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 60d0fe4f5311361c40212f00
 *                     username:
 *                       type: string
 *                       example: NewGoogleUser
 *                     email:
 *                       type: string
 *                       example: new.google.user@example.com
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: true
 *                     provider:
 *                       type: string
 *                       example: google
 *                     profilePicture:
 *                       type: string
 *                       example: https://lh3.googleusercontent.com/a/ABCDEFGHIJKLMNO=s96-c
 *       400:
 *         description: Bad Request (missing ID token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized (invalid or expired Google ID token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict (email already registered with a different social provider)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/google-login', googleSignIn);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: If user exists, a reset link was sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: If a user with that email exists, a password reset email has been sent.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword, confirmNewPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewerStrongP@ssw0rd
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *                 example: NewerStrongP@ssw0rd
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password has been reset successfully.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/reset-password/:token", resetPassword);

/**
 * @swagger
 * /auth/request-password-otp:
 *   post:
 *     summary: Request OTP for password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent if account exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: If an account with that email exists, a password reset code has been sent.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/request-password-otp", requestPasswordOtp);

/**
 * @swagger
 * /auth/confirm-otp:
 *   post:
 *     summary: Confirm OTP and get password change token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP confirmed successfully. You can now reset your password.
 *                 passwordChangeToken:
 *                   type: string
 *                   example: some_new_reset_token_hex_string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/confirm-otp", confirmOtp);

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   get:
 *     summary: Verify user email
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification token
 *     responses:
 *       200:
 *         description: Email verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified successfully! You can now log in.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/verify-email/:token", verifyEmail);

module.exports = router;
