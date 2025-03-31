# Portfolio Maker - Backend

A robust and scalable backend for the Portfolio Maker application, built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Authentication System**: Complete user authentication with JWT
- **Email Service**: Send verification and notification emails
- **Security**: Implements best security practices with bcrypt, helmet, and rate limiting
- **MongoDB Database**: Structured data models for users and portfolio content
- **RESTful API**: Well-designed endpoints for frontend integration
- **Error Handling**: Comprehensive error management system

## 📋 Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

## 🔧 Installation

1. Clone the repository

   ```
   git clone <repository-url>
   cd portfolio-maker/back
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add the following variables:

   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/portfolio-maker
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
- `POST /api/auth/login`: Authenticate a user
- `POST /api/auth/logout`: Log out a user
- `GET /api/auth/check`: Check authentication status

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
│   └── StoryModels/    # Portfolio content models
├── public/             # Static files
├── routes/             # API routes
├── services/           # Business logic
├── tests/              # Test files
├── utils/              # Utility functions
├── views/              # EJS templates
├── .env                # Environment variables
├── .gitignore          # Git ignore file
├── package.json        # Project dependencies
├── server.js           # Application entry point
└── README.md           # This file
```

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT authentication
- Helmet for HTTP headers
- Rate limiting to prevent brute force attacks
- Input validation with Joi
- HTTP-only cookies

## 🧪 Testing

```
npm test
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

This project is licensed under the ISC License - see the `package.json` file for details.
