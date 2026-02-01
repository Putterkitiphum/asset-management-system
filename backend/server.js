const express = require("express");
const cors = require("cors");
const path = require("path");

// Import routes
const apiRoutes = require('./routes');

const app = express();
const PORT = 3001;

const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

// Middleware
app.use(express.json());

// CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
);

// Database connection (will be initialized via the database.js module)
require('./config/database');

// Use API routes
app.use('/api', apiRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `The route ${req.method} ${req.url} does not exist`,
    availableRoutes: [
      "GET    /api/health",
      "GET    /api/test",
      "GET    /api/assets",
      "GET    /api/assets/dropdown",
      "GET    /api/assets/:code",
      "POST   /api/assets",
      "POST   /api/assets/:childCode/parents/:parentCode",
      "DELETE /api/assets/:childCode/parents/:parentCode"
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  
  // Handle CORS errors
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      error: "CORS Error",
      message: err.message,
      allowedOrigins: allowedOrigins
    });
  }
  
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'development' ? err.message : "Something went wrong"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Database location: ${path.join(__dirname, 'assets.db')}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Main endpoints:`);
  console.log(`   GET    http://localhost:${PORT}/api/assets`);
  console.log(`   POST   http://localhost:${PORT}/api/assets`);
  console.log(`   GET    http://localhost:${PORT}/api/assets/KHO123`);
});