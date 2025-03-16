const express = require("express");
const router = express.Router();
const {
  requireAuth,
  optionalAuth,
  requireRole,
} = require("../middlewares/authMiddleware");
const {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getCurrentUser,
  getUsers,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const {
  validateUser,
  validateLogin,
  validateEmail,
  validateResetPassword,
} = require("../middlewares/validateUser");

// Public routes with validation
router.post("/register", validateUser, registerUser);
router.post("/login", validateLogin, loginUser);
router.post("/refresh", refreshToken);
router.post("/forgot-password", validateEmail, forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);
router.post("/logout", requireAuth, logoutUser);
router.get("/me", requireAuth, getCurrentUser);


router.get("/users", requireAuth, requireRole("admin"), getUsers);

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth service is operational",
  });
});

module.exports = router;
