const User = require("../models/userModels/User");
const {
  generateEmailVerificationToken,
  hashToken,
  getTokenExpiration,
  verifyHashedToken,
  TOKEN_CONFIG,
} = require("../services/authServices");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendEmail,
} = require("../services/emailService");

/**
 * Helper function to handle common error responses
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} message - Custom error message
 * @param {number} statusCode - HTTP status code
 */
const handleError = (res, error, message, statusCode = 500) => {
  console.error(`Email Controller Error: ${message}`, error);
  res.status(statusCode).json({
    success: false,
    message: message || "An error occurred",
    error: error.message,
  });
};

/**
 * Send or resend email verification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendVerification = async (req, res) => {
  try {
    // Check if user exists in request
    if (!req.user || !req.user._id) {
      return handleError(
        res,
        new Error("User not authenticated"),
        "Authentication required",
        401
      );
    }

    // Find the complete user document from database
    const user = await User.findById(req.user._id);
    if (!user) {
      return handleError(
        res,
        new Error("User not found"),
        "User not found in database",
        404
      );
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate a new verification token using auth service
    const verificationToken = generateEmailVerificationToken();
    const hashedToken = hashToken(verificationToken);

    // Set token and expiration on user
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpire = getTokenExpiration("EMAIL_VERIFICATION");
    await user.save();

    // Send the verification email
    await sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    handleError(res, error, "Error sending verification email");
  }
};

/**
 * Verify email with token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return handleError(
        res,
        new Error("Token is required"),
        "Verification token is required",
        400
      );
    }

    // Find user with non-expired token
    const user = await User.findOne({
      emailVerificationToken: hashToken(token),
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return handleError(
        res,
        new Error("Invalid token"),
        "Invalid or expired verification token",
        400
      );
    }

    // Verify the token
    const isValid = verifyHashedToken(
      token,
      user.emailVerificationToken,
      user.emailVerificationExpire
    );

    if (!isValid) {
      return handleError(
        res,
        new Error("Invalid token"),
        "Invalid verification token",
        400
      );
    }

    // Update user verification status process.env
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error("Welcome email failed to send:", emailError);
      // Continue with verification success even if welcome email fails
    }

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    handleError(res, error, "Error verifying email");
  }
};

/**
 * Send password reset email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return handleError(
        res,
        new Error("Email is required"),
        "Email address is required",
        400
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return handleError(
        res,
        new Error("User not found"),
        "No account found with this email",
        404
      );
    }

    // Check for existing reset token and its age
    if (user.resetPasswordExpire && user.resetPasswordExpire > Date.now()) {
      const waitTime = Math.ceil(
        (user.resetPasswordExpire - Date.now()) / 1000 / 60
      );
      return handleError(
        res,
        new Error("Too many requests"),
        `Please wait ${waitTime} minutes before requesting another reset`,
        429
      );
    }

    // Generate reset token
    const resetToken = generateEmailVerificationToken();
    const hashedToken = hashToken(resetToken);

    // Update user with reset token
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = getTokenExpiration("ACCESS.SHORT");
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    handleError(res, error, "Error sending password reset email");
  }
};

/**
 * Send custom notification email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendNotification = async (req, res) => {
  try {
    // Check if user exists in request
    if (!req.user) {
      return handleError(
        res,
        new Error("User not authenticated"),
        "Authentication required",
        401
      );
    }

    const { subject, text, html } = req.body;

    // Validate required fields
    if (!subject || (!text && !html)) {
      return handleError(
        res,
        new Error("Missing required fields"),
        "Subject and either text or html content are required",
        400
      );
    }

    // Rate limiting check (example: max 5 notifications per hour)
    // You might want to implement proper rate limiting middleware
    if (
      req.user.lastNotificationSent &&
      Date.now() - new Date(req.user.lastNotificationSent).getTime() < 60000
    ) {
      // 1 minute
      return handleError(
        res,
        new Error("Rate limit exceeded"),
        "Please wait before sending another notification",
        429
      );
    }

    // Send notification email
    await sendEmail({
      to: req.user.email,
      subject: subject.trim(),
      text: text?.trim(),
      html: html?.trim() || text?.trim(),
    });

    // Update last notification timestamp
    req.user.lastNotificationSent = new Date();
    await req.user.save();

    res.status(200).json({
      success: true,
      message: "Notification email sent successfully",
    });
  } catch (error) {
    handleError(res, error, "Error sending notification email");
  }
};

module.exports = {
  sendVerification,
  verifyEmail,
  sendPasswordReset,
  sendNotification,
};
