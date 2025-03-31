# VibeSphere - Social Media Backend

A robust and scalable backend for the VibeSphere social media application, built with Node.js, Express, and MongoDB.

## 🚀 Current Progress

### Authentication System (⭐ Complete)

- **JWT-based Authentication**: Secure token-based authentication with refresh token support
- **User Registration**: Complete signup flow with email verification
- **Login/Logout**: Session management with HTTP-only cookies for security
- **Password Management**: Secure password hashing and reset functionality
- **Role-based Access Control**: Different permission levels for regular users and administrators

### Current Functionality

- **User Management**: Create, read, update, and delete user profiles
- **Email Service**: Verification emails and password reset functionality
- **API Security**: Rate limiting, CORS protection, and secure HTTP headers
- **Session Handling**: Persistent user sessions with timeout and renewal
- **Error Management**: Comprehensive error handling and user feedback
- **Testing Interface**: Complete EJS-based UI for testing all authentication flows

## 🛡️ Security Features Implemented

- Password hashing with bcrypt
- HTTP-only cookie storage for JWT tokens
- CSRF protection mechanisms
- Input validation and sanitization with Joi
- Rate limiting to prevent brute force attacks
- Helmet for securing HTTP headers
- Session protection and timeout controls

## 📋 Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

## 🔧 Installation

1. Clone the repository

   ```
   git clone <repository-url>
   cd vibesphere/back
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add the following variables:

   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/vibesphere
   JWT_SECRET=your_jwt_secret
   SESSION_SECRET=your_session_secret
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   CORS_ORIGIN=http://localhost:5173
   NODE_ENV=development
   ```

4. Start the server
   ```
   npm start
   ```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/signup`: Register a new user
- `POST /api/auth/verify-email/:token`: Verify user email
- `POST /api/auth/login`: Authenticate a user
- `POST /api/auth/logout`: Log out a user
- `GET /api/auth/check`: Check authentication status
- `POST /api/auth/refresh`: Refresh access token
- `POST /api/auth/forgot-password`: Request password reset
- `POST /api/auth/reset-password/:token`: Reset password with token

### Email

- `POST /api/email/verify`: Send verification email
- `POST /api/email/contact`: Send contact form email

## 📂 Project Structure

```
.
├── config/             # Configuration files (DB, etc.)
├── controllers/        # Request handlers
├── middlewares/        # Express middlewares
├── models/             # Mongoose models
│   ├── userModels/     # User-related models
│   └── StoryModels/    # Content models (in progress)
├── public/             # Static files
├── routes/             # API routes
├── services/           # Business logic
├── tests/              # Test files
├── utils/              # Utility functions
├── views/              # EJS templates
│   ├── all.ejs         # Main testing interface that includes components
│   └── apiTesting/     # Modular UI components for API testing
├── .env                # Environment variables
├── .gitignore          # Git ignore file
├── package.json        # Project dependencies
├── server.js           # Application entry point
└── README.md           # This file
```

## 🧹 View Files Cleanup Needed

The project currently has duplicated view files that should be cleaned up:

1. **Files to Keep**:

   - `views/all.ejs` - Main testing interface that includes all components
   - `views/apiTesting/*` - All component files in this directory are used as includes

2. **Files to Remove** (duplicates or unused):

   - `views/auth.ejs` - Duplicate functionality, not used in server.js
   - `views/Dashboard.ejs` - Not currently used in server.js
   - `views/error.ejs` - Redundant as errors are displayed in all.ejs
   - `views/Home.ejs` - Not currently used in server.js
   - `views/Login.ejs` - Duplicate of views/apiTesting/Login.ejs
   - `views/Signup.ejs` - Duplicate of views/apiTesting/SignUp.ejs
   - `views/apiTesting/Error.ejs` - Empty file (0 bytes)

3. **Cleanup Notes**:
   - Server only renders the `all.ejs` template with different activeTab parameters
   - All functionality is modularized in the apiTesting directory
   - After cleanup, update any imports if necessary

## 🚀 Future Development Roadmap

- **Post Creation & Management**: Adding functionality for users to create, edit, and delete posts
- **Social Features**: Friend/follow system, likes, comments, and shares
- **Messaging**: Private messaging between users
- **Content Feed**: Personalized feed algorithm based on user interests
- **Notifications**: Real-time notification system
- **Media Handling**: Image and video upload and storage

## 🧪 Testing

```
npm test
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

This project is licensed under the ISC License - see the `package.json` file for details.
