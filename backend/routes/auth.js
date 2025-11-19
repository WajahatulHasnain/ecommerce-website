const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getMe
} = require("../controllers/authController");
const { auth } = require("../middleware/auth");

// @route   POST /api/auth/signup
// @desc    Register new user (admin or customer)
// @access  Public
router.post("/signup", signup);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", login);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset code
// @access  Public
router.post("/forgot-password", forgotPassword);

// @route   POST /api/auth/verify-code
// @desc    Verify reset code
// @access  Public
router.post("/verify-code", verifyResetCode);

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post("/reset-password", resetPassword);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, getMe);

module.exports = router;
