const express = require("express");
const router = express.Router();
const assetRoutes = require("./assetRoutes");
const relationshipRoutes = require("./relationshipRoutes");
const authRoutes = require("./authRoutes");
const { authenticate } = require("../middleware/auth");

// Public — no token needed
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Asset Management API is running",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);

// Protected — all asset routes require a valid JWT
router.use("/assets", authenticate, assetRoutes);
router.use("/assets", authenticate, relationshipRoutes);

module.exports = router;
