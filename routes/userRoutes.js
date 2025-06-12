const express = require("express");
const router = express.Router();

const {
  getMe,
  updateMe,
  changePassword,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.get("/me", getMe);
router.patch("/me", updateMe);
router.patch("/me/change-password", authMiddleware, changePassword);
module.exports = router;
