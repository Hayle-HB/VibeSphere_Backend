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

/**
 * @route   POST /api/email/contact-developer
 * @desc    Send email to developer
 * @access  Public
 * @note    TEMPORARY: This route handler will be moved to a proper controller.
 *          Currently kept in routes for personal testing purposes only.
 */
router.post("/contact-developer", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "Please provide name, email and message" });
    }

    // Import the sendEmail utility
    const { sendEmail } = require("../services/emailService");

    // Format the email content with HTML for better readability
    const emailSubject = subject
      ? `VibeSphere Contact: ${subject}`
      : "VibeSphere Contact Message";
    const emailContent = `
      <h2>Contact from VibeSphere</h2>
      <p><strong>From:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject || "No subject provided"}</p>
      <hr>
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, "<br>")}</p>
      <hr>
      <p><small>This message was sent from the VibeSphere contact form.</small></p>
    `;

    await sendEmail({
      to: "haylemeskelhaylemariam@gmail.com",
      subject: emailSubject,
      html: emailContent,
      text: `From: ${name}\nEmail: ${email}\nSubject: ${
        subject || "No subject"
      }\n\nMessage:\n${message}`,
    });

    res.status(200).json({
      success: true,
      message: "Your message has been sent successfully",
    });
  } catch (error) {
    console.error("Error sending contact email:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send email. Please try again later.",
    });
  }
});

module.exports = router;
