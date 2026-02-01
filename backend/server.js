const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database("./database/assets.db", (err) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Connected to SQLite database");
    initializeDatabase();
  }
});

// Initialize database with tables
function initializeDatabase() {
  db.run(`
        CREATE TABLE IF NOT EXISTS assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  db.run(`
        CREATE TABLE IF NOT EXISTS asset_relationships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parent_asset_code TEXT NOT NULL,
            child_asset_code TEXT NOT NULL,
            FOREIGN KEY (parent_asset_code) REFERENCES assets(asset_code),
            FOREIGN KEY (child_asset_code) REFERENCES assets(asset_code),
            UNIQUE(parent_asset_code, child_asset_code)
        )
    `);
}

// API Routes

// Get all assets
app.get("/api/assets", (req, res) => {
  db.all("SELECT * FROM assets ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get a single asset with its children
app.get("/api/assets/:code", (req, res) => {
  const assetCode = req.params.code;

  // Get asset details
  db.get(
    "SELECT * FROM assets WHERE asset_code = ?",
    [assetCode],
    (err, asset) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (!asset) {
        res.status(404).json({ error: "Asset not found" });
        return;
      }

      // Get child assets
      db.all(
        `
            SELECT a.* 
            FROM assets a
            JOIN asset_relationships r ON a.asset_code = r.child_asset_code
            WHERE r.parent_asset_code = ?
        `,
        [assetCode],
        (err, children) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          // Get parent assets
          db.all(
            `
                SELECT a.* 
                FROM assets a
                JOIN asset_relationships r ON a.asset_code = r.parent_asset_code
                WHERE r.child_asset_code = ?
            `,
            [assetCode],
            (err, parents) => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }

              res.json({
                ...asset,
                children,
                parents,
              });
            },
          );
        },
      );
    },
  );
});

// Create a new asset
app.post("/api/assets", (req, res) => {
  const { asset_code, name, type } = req.body;

  if (!asset_code || !name || !type) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  db.run(
    "INSERT INTO assets (asset_code, name, type) VALUES (?, ?, ?)",
    [asset_code, name, type],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, asset_code, name, type });
    },
  );
});

// Add parent-child relationship
app.post("/api/assets/:childCode/parents/:parentCode", (req, res) => {
  const { childCode, parentCode } = req.params;

  db.run(
    "INSERT INTO asset_relationships (parent_asset_code, child_asset_code) VALUES (?, ?)",
    [parentCode, childCode],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: "Relationship added successfully" });
    },
  );
});

// Remove parent-child relationship
app.delete("/api/assets/:childCode/parents/:parentCode", (req, res) => {
  const { childCode, parentCode } = req.params;

  db.run(
    "DELETE FROM asset_relationships WHERE parent_asset_code = ? AND child_asset_code = ?",
    [parentCode, childCode],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: "Relationship removed successfully" });
    },
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
