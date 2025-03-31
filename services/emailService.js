const nodemailer = require("nodemailer");

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email using the configured transporter
 * @param {Object} options Email options (to, subject, text, html)
 * @returns {Promise<Object>} Nodemailer info object
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: `"VibeSphere" <${process.env.EMAIL_USER}>`,
    to,
    subject,
  };

  if (html) {
    mailOptions.html = html;
  } else if (text) {
    mailOptions.text = text;
  } else {
    throw new Error("Either html or text content must be provided");
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully. Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

/**
 * Send verification email with code
 * @param {string} to Recipient email address
 * @param {string} verificationCode Verification code
 */
const sendVerificationEmail = async (to, verificationCode) => {
  const subject = "Verify Your Email Address - VibeSphere";
  const text = `Welcome to VibeSphere! Your verification code is: ${verificationCode}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0066ff; margin-bottom: 20px;">Welcome to VibeSphere!</h2>
      <p>Thank you for joining VibeSphere. To complete your registration, please verify your email address using this code:</p>
      <div style="background-color: #f4f4f4; padding: 20px; margin: 25px 0; text-align: center; border-radius: 8px;">
        <h3 style="color: #333; letter-spacing: 5px; margin: 0;">${verificationCode}</h3>
      </div>
      <p>This code will expire in 3 days. If you didn't create an account with VibeSphere, please disregard this email.</p>
      <hr style="border: 1px solid #eee; margin: 25px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
    </div>
  `;
  await sendEmail({ to, subject, text, html });
};

/**
 * Send password reset email with token
 * @param {string} to Recipient email address
 * @param {string} resetToken Password reset token
 */
const sendPasswordResetEmail = async (to, resetToken) => {
  const subject = "Reset Your Password - VibeSphere";
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const text = `Reset your password by visiting: ${resetLink}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0066ff; margin-bottom: 20px;">Password Reset Request</h2>
      <p>We received a request to reset your VibeSphere account password. Click the button below to proceed:</p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="${resetLink}" 
           style="background-color: #0066ff; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
           Reset Password
        </a>
      </div>
      <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
      <p>If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.</p>
      <hr style="border: 1px solid #eee; margin: 25px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
    </div>
  `;
  await sendEmail({ to, subject, text, html });
};

/**
 * Send welcome email to new users
 * @param {string} to Recipient email address
 * @param {string} name User's name
 */
const sendWelcomeEmail = async (to, name) => {
  const subject = "Welcome to VibeSphere! 🎉";
  const text = `Welcome to VibeSphere, ${name}! We're excited to have you join our community.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0066ff; margin-bottom: 20px;">Welcome to VibeSphere! 🎉</h2>
      <p>Dear ${name},</p>
      <p>We're thrilled to welcome you to the VibeSphere community! Your journey with us begins now.</p>
      <div style="background-color: #f4f4f4; padding: 25px; margin: 25px 0; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #333;">Getting Started</h3>
        <ul style="padding-left: 20px; margin-bottom: 0;">
          <li style="margin-bottom: 10px;">Complete your profile to connect with like-minded individuals</li>
          <li style="margin-bottom: 10px;">Explore our innovative features and personalization options</li>
          <li style="margin-bottom: 10px;">Join communities that match your interests</li>
          <li style="margin-bottom: 10px;">Share your unique experiences and perspectives</li>
        </ul>
      </div>
      <p>Our support team is available 24/7 to assist you with any questions or concerns.</p>
      <hr style="border: 1px solid #eee; margin: 25px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
    </div>
  `;
  await sendEmail({ to, subject, text, html });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
