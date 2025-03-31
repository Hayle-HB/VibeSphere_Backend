const {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  TOKEN_CONFIG,
} = require("../services/authServices");
const {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  verifyEmail,
  resendVerificationEmail,
} = require("../services/emailService");
const User = require("../models/userModels/User");
const crypto = require("crypto");

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      provider: "local",
      isVerified: false, // Set initial verification status to false
    });

    // Generate tokens
    const accessToken = generateToken(user._id.toString(), false, {
      roles: [user.role],
    });
    const refreshToken = generateRefreshToken(user._id.toString());

    // Store refresh token in user document
    user.refreshToken = refreshToken;
    await user.save();

    // Remove sensitive data
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000, // 1 hour
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth/refresh",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Generate verification code and send verification email
    const verificationCode = crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase();
    await sendVerificationEmail(user.email, verificationCode);

    res.status(201).json({
      success: true,
      message:
        "User registered successfully. Please check your email to verify your account.",
      user: userData,
      token: accessToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
const loginUser = async (req, res) => {
  const { email, password, rememberMe = false } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email }).select(
      "+password +refreshToken"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (!user.isUserActive()) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate tokens
    const accessToken = generateToken(user._id.toString(), rememberMe, {
      roles: [user.role],
    });
    const refreshToken = generateRefreshToken(user._id.toString());

    // Update user
    user.refreshToken = refreshToken;
    await user.updateLastLogin();

    // Remove sensitive data
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    // Set cookies
    const accessTokenExpiry = rememberMe ? 24 * 3600000 : 3600000; // 24 hours or 1 hour

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: accessTokenExpiry,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth/refresh",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userData,
      token: accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
  // Get refresh token from cookie
  const refreshToken =
    req.cookies.refreshToken || req.body.refreshToken || null;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token not provided",
    });
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Find user with matching refresh token
    const user = await User.findById(decoded.userID).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Generate new tokens
    const newAccessToken = generateToken(user._id.toString(), false, {
      roles: [user.role],
    });
    const newRefreshToken = generateRefreshToken(user._id.toString());

    // Update user
    user.refreshToken = newRefreshToken;
    await user.save();

    // Set cookies
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000, // 1 hour
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth/refresh",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      token: newAccessToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Error refreshing token",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
const logoutUser = async (req, res) => {
  try {
    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

    // If user is authenticated, clear refresh token in DB
    if (req.user) {
      await User.findByIdAndUpdate(req.user.userID, { refreshToken: null });
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userID);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
/**
 * Forgot password - sends reset password email
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token and set to resetPasswordToken field
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Update user document with reset token fields
    const updated = await User.findOneAndUpdate(
      { _id: user._id },
      {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: Date.now() + 30 * 60 * 1000, // 30 minutes
      },
      { new: true }
    );

    if (!updated) {
      return res.status(500).json({
        success: false,
        message: "Could not save reset token",
      });
    }

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/?action=reset-password&token=${resetToken}`;

    // For testing purposes - return token in response instead of sending email
    // Remove this in production and uncomment the email sending code
    return res.status(200).json({
      success: true,
      message: "Password reset token generated",
      resetUrl,
      token: resetToken, // This would be removed in production
    });

    /* Uncomment this when you have email functionality set up
    // Send email
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request", 
      message: `You requested a password reset. Please go to: ${resetUrl}`,
    });

    res.status(200).json({
      success: true,
      message: "Password reset email sent",
    });
    */
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending password reset email",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    // Extract token from query params if present, otherwise use body
    let token = req.query.token || req.body.token;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid token and check if token is expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      // Log the token details for debugging
      console.log("Reset attempt with token:", {
        providedToken: token,
        hashedToken: resetPasswordToken,
        currentTime: Date.now(),
      });

      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired reset token. Please request a new password reset.",
      });
    }

    // Set new password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getCurrentUser,
  getUsers,
  forgotPassword,
  resetPassword,
};
