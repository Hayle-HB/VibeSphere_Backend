const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// Constants for token configuration
const TOKEN_CONFIG = {
  ACCESS: {
    SHORT: "1h",    // Short-lived access token
    EXTENDED: "24h" // Extended access token for "remember me"
  },
  REFRESH: "30d",   // Refresh token duration
  SALT_ROUNDS: 12   // Higher rounds = more secure but slower
};

/**
 * Generate a cryptographically secure random token
 * @returns {string} Random token
 */
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Generate an access token with enhanced security
 * @param {string} userID - User identifier
 * @param {boolean} rememberMe - Extended session flag
 * @param {Object} additionalClaims - Additional JWT claims
 * @returns {string} Signed JWT token
 */
const generateToken = (userID, rememberMe = false, additionalClaims = {}) => {
  if (!userID) throw new Error("User ID is required");
  
  const payload = {
    userID,
    type: "access",
    iat: Math.floor(Date.now() / 1000),
    jti: generateSecureToken(),
    ...additionalClaims
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? TOKEN_CONFIG.ACCESS.EXTENDED : TOKEN_CONFIG.ACCESS.SHORT,
    algorithm: "HS512" // Using a stronger algorithm
  });
};

/**
 * Verify and decode access token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS512"]
    });
    
    // Additional validation
    if (decoded.type !== "access") return null;
    
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Hash password with enhanced security
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  if (!password) throw new Error("Password is required");
  if (password.length < 8) throw new Error("Password must be at least 8 characters");
  
  const salt = await bcrypt.genSalt(TOKEN_CONFIG.SALT_ROUNDS);
  return await bcrypt.hash(password, salt);
};

/**
 * Securely compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Comparison result
 */
const comparePassword = async (password, hash) => {
  if (!password || !hash) return false;
  return await bcrypt.compare(password, hash);
};

/**
 * Generate refresh token with enhanced security
 * @param {string} userID - User identifier
 * @returns {string} Signed refresh token
 */
const generateRefreshToken = (userID) => {
  if (!userID) throw new Error("User ID is required");
  
  const payload = {
    userID,
    type: "refresh",
    iat: Math.floor(Date.now() / 1000),
    jti: generateSecureToken()
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: TOKEN_CONFIG.REFRESH,
    algorithm: "HS512"
  });
};

/**
 * Verify and decode refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */

const verifyRefreshToken = (token) => {
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      algorithms: ["HS512"]
    });
    
    // Additional validation
    if (decoded.type !== "refresh") return null;
    
    return decoded;
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateRefreshToken,
  verifyRefreshToken,
  TOKEN_CONFIG // Exported for testing purposes
};
