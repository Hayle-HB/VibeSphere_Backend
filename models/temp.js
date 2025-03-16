const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
});

// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   refreshToken: { type: String },
//   role: { type: String, enum: ["user", "admin"], default: "user" },
//   isActive: { type: Boolean, default: true },
//   isVerified: { type: Boolean, default: false },
//   verificationToken: { type: String },
//   verificationTokenExpires: { type: Date },
//   resetPasswordToken: { type: String },
//   resetPasswordTokenExpires: { type: Date },
//   profilePicture: { type: String },
//   bio: { type: String },
//   location: { type: String },
//   website: { type: String },

//   followers: { type: [mongoose.Schema.Types.ObjectId], ref: "User" },
//   following: { type: [mongoose.Schema.Types.ObjectId], ref: "User" },
//   posts: { type: [mongoose.Schema.Types.ObjectId], ref: "Post" },
//   comments: { type: [mongoose.Schema.Types.ObjectId], ref: "Comment" },
//   likes: { type: [mongoose.Schema.Types.ObjectId], ref: "Like" },
//   dislikes: { type: [mongoose.Schema.Types.ObjectId], ref: "Dislike" },
//   savedPosts: { type: [mongoose.Schema.Types.ObjectId], ref: "Post" },
//   notifications: { type: [mongoose.Schema.Types.ObjectId], ref: "Notification" },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
// });

// const User = mongoose.model("User", userSchema);

// module.exports = User;
