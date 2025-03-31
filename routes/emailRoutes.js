const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/authMiddleware");
const { validateEmail } = require("../middlewares/validateUser");
const {
  sendVerification,
  verifyEmail,
  sendPasswordReset,
  sendNotification,
} = require("../controllers/emailController");

/**
 * @route   POST /api/email/verify
 * @desc    Send or resend email verification
 * @access  Private (requires auth)
 */
router.post("/verify", requireAuth, sendVerification);

/**
 * @route   POST /api/email/verify/:token
 * @desc    Verify email with token
 * @access  Public
 */
router.post("/verify/:token", verifyEmail);

/**
 * @route   POST /api/email/password-reset
 * @desc    Send password reset email
 * @access  Public
 */
router.post("/password-reset", validateEmail, sendPasswordReset);

/**
 * @route   POST /api/email/notification
 * @desc    Send custom notification email
 * @access  Private (requires auth)
 */
router.post("/notification", requireAuth, sendNotification);

module.exports = router;
