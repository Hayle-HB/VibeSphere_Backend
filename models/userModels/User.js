const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const {
  hashPassword,
  comparePassword,
  TOKEN_CONFIG,
} = require("../../services/authServices");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Don't return password by default
    },
    avatar: {
      type: String,
      default: "default-avatar.png",
    },
    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
      required: true,
    },
    providerId: {
      type: String,
      sparse: true,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 🔹 Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔹 Ensure email is always stored in lowercase
userSchema.pre("save", function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// 🔹 Compare password instance method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await comparePassword(candidatePassword, this.password);
};

// 🔹 Check if user is active
userSchema.methods.isUserActive = function () {
  return this.isActive;
};

// 🔹 Update last login timestamp
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  return await this.save();
};

// 🔹 Virtual field for user profile URL
userSchema.virtual("profileUrl").get(function () {
  return `/users/${this._id}`;
});

// 🔹 Indexes for efficient querying
userSchema.index({ email: 1, provider: 1 });
userSchema.index({ providerId: 1, provider: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
