require("dotenv").config();
const connectDB = require("./config/mongoDB");    
const express = require("express"); 
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const session = require("express-session");
const flash = require("connect-flash");
const { requireAuth } = require("./middlewares/authMiddleware");


// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);

// Logging in development environment
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Set up EJS view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Session management
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Flash messages
app.use(flash());

// Set global variables for all views
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");

  // Check if user is authenticated by verifying JWT from cookie
  if (req.cookies.accessToken) {
    try {
      // Mock user data for testing
      res.locals.user = {
        name: "Test User",
        email: "user@example.com",
        role: "user",
        _id: "testuser123",
        avatar: "https://via.placeholder.com/150",
        lastLogin: new Date(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      };
    } catch (err) {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }

  next();
});

// API routes
const authRoutes = require("./routes/authRoutes");
const emailRoutes = require("./routes/emailRoutes");
const testRoutes = require("./testRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/email", emailRoutes);
app.use("/test", testRoutes);

// Main route - use all.ejs for testing everything
app.get("/", (req, res) => {
  res.render("all");
});

// Login & signup routes that redirect to main test page
app.get("/login", (req, res) => {
  // If user is already logged in, redirect to home
  if (req.cookies.accessToken) {
    req.flash("success", "You are already logged in");
    return res.redirect("/");
  }
  res.render("all", { activeTab: "login" });
});

app.get("/signup", (req, res) => {
  // If user is already logged in, redirect to home
  if (req.cookies.accessToken) {
    req.flash("success", "You are already logged in");
    return res.redirect("/");
  }
  res.render("all", { activeTab: "signup" });
});

// Dummy protected route for testing
app.get("/protected", requireAuth, (req, res) => {
  res.render("all", {
    success: "You accessed a protected route successfully!",
    activeTab: "protected",
  });
});

// Auth state check middleware for frontend
app.get("/api/auth/check", (req, res) => {
  const token = req.cookies.accessToken;
  if (token) {
    return res.status(200).json({ authenticated: true });
  }
  res.status(401).json({ authenticated: false });
});

// Logout route (for form submissions)
app.post("/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
  req.flash("success", "You have been logged out successfully");
  res.redirect("/");
});

// API logout redirect
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
  req.flash("success", "You have been logged out successfully");
  res.redirect("/");
});

// 404 handler that uses all.ejs
app.use((req, res, next) => {
  res.status(404).render("all", {
    error: "404 Not Found - The page you're looking for doesn't exist.",
    activeTab: "error",
  });
});

// Error handler that uses all.ejs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).render("all", {
    error:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
    errorDetails: process.env.NODE_ENV !== "production" ? err.stack : null,
    activeTab: "error",
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Auth test page available at: http://localhost:${PORT}`);
});
