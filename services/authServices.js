const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// Constants for token configuration
const TOKEN_CONFIG = {
  ACCESS: {
    SHORT: "1h", // Short-lived access token
    EXTENDED: "24h", // Extended access token for "remember me"
  },
  REFRESH: "30d", // Refresh token duration
  SALT_ROUNDS: 12, // Higher rounds = more secure but slower
  EMAIL_VERIFICATION: "3d", // Email verification token expiration
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
    ...additionalClaims,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: rememberMe
      ? TOKEN_CONFIG.ACCESS.EXTENDED
      : TOKEN_CONFIG.ACCESS.SHORT,
    algorithm: "HS512", // Using a stronger algorithm
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
      algorithms: ["HS512"],
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
  if (password.length < 8)
    throw new Error("Password must be at least 8 characters");

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
    jti: generateSecureToken(),
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: TOKEN_CONFIG.REFRESH,
    algorithm: "HS512",
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
      algorithms: ["HS512"],
    });

    // Additional validation
    if (decoded.type !== "refresh") return null;

    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Generate email verification token
 * @returns {string} Plaintext token to send in email
 */
const generateEmailVerificationToken = () => {
  return generateSecureToken();
};

/**
 * Hash a token for secure storage
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Get token expiration time based on token type
 * @param {string} tokenType - Type of token (e.g., EMAIL_VERIFICATION)
 * @returns {Date} Expiration date
 */
const getTokenExpiration = (tokenType) => {
  const expiresIn = TOKEN_CONFIG[tokenType] || TOKEN_CONFIG.EMAIL_VERIFICATION;

  // Convert time string (e.g., "3d") to milliseconds
  let ms = 0;
  const match = expiresIn.match(/^(\d+)([smhdw])$/);

  if (match) {
    const [_, amount, unit] = match;
    const multipliers = {
      s: 1000, // seconds
      m: 60 * 1000, // minutes
      h: 60 * 60 * 1000, // hours
      d: 24 * 60 * 60 * 1000, // days
      w: 7 * 24 * 60 * 60 * 1000, // weeks
    };

    ms = parseInt(amount) * multipliers[unit];
  }

  return new Date(Date.now() + ms);
};

/**
 * Verify a token against its hashed version
 * @param {string} token - Token to verify
 * @param {string} hashedToken - Stored hashed token
 * @param {Date} expireDate - Expiration date
 * @returns {boolean} Whether token is valid
 */
const verifyHashedToken = (token, hashedToken, expireDate) => {
  const hash = hashToken(token);
  return hashedToken === hash && expireDate > Date.now();
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateRefreshToken,
  verifyRefreshToken,
  generateEmailVerificationToken,
  hashToken,
  getTokenExpiration,
  verifyHashedToken,
  TOKEN_CONFIG,
};
