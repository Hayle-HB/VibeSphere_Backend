const { verifyToken } = require("../services/authServices");

/**
 * Extract token from request headers, query string, or cookies
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null if not found
 */
const extractToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    // Token from Authorization header
    return req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    // Token from cookies
    return req.cookies.accessToken;
  } else if (req.query && req.query.token) {
    // Token from query params (useful for WebSocket connections)
    return req.query.token;
  }
  return null;
};





/**
 * Required authentication middleware - blocks unauthenticated requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */

const requireAuth = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }

  // Attach user info to request object
  req.user = decoded;
  next();
};

/**
 * Optional authentication middleware - continues even for unauthenticated requests
 * @param {Object} req - Express request object
 * @param {Function} next - Express next function
 */
const optionalAuth = (req, res, next) => {
  const token = extractToken(req);

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};

/**
 * Role-based authorization middleware
 * @param {string|string[]} roles - Required role(s) for access
 * @returns {Function} Middleware function
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    // Must be used after requireAuth
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const userRoles = req.user.roles || [];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    // Check if user has at least one of the required roles
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to access this resource.",
      });
    }

    next();
  };
};

/**
 * Error handling middleware for authentication errors
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authErrorHandler = (err, req, res, next) => {
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message:
        err.name === "TokenExpiredError"
          ? "Your session has expired. Please log in again."
          : "Invalid authentication token.",
    });
  }

  next(err);
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  authErrorHandler,
};
