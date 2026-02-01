const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "..", "assets.db");

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite database at:", dbPath);
    initializeDatabase();
  }
});

// Initialize database with tables
function initializeDatabase() {
  console.log("Initializing database tables...");

  // Create assets table
  db.run(
    `
        CREATE TABLE IF NOT EXISTS assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,
    (err) => {
      if (err) {
        console.error("Error creating assets table:", err.message);
      } else {
        console.log("Assets table ready");
      }
    },
  );

  // Create relationships table
  db.run(
    `
        CREATE TABLE IF NOT EXISTS asset_relationships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parent_asset_code TEXT NOT NULL,
            child_asset_code TEXT NOT NULL,
            FOREIGN KEY (parent_asset_code) REFERENCES assets(asset_code),
            FOREIGN KEY (child_asset_code) REFERENCES assets(asset_code),
            UNIQUE(parent_asset_code, child_asset_code)
        )
    `,
    (err) => {
      if (err) {
        console.error("Error creating relationships table:", err.message);
      } else {
        console.log("Relationships table ready");
        
        // Insert sample data if database is empty
        insertSampleData();
      }
    },
  );
}

// Insert sample data for testing
function insertSampleData() {
  // Check if we already have data
  db.get("SELECT COUNT(*) as count FROM assets", (err, result) => {
    if (err) {
      console.error("Error checking data:", err.message);
      return;
    }

    if (result.count === 0) {
      console.log("Inserting sample data...");

      const sampleAssets = [
        ["KHO123", "Dell Laptop", "laptop"],
        ["KHO573", "HP Printer", "printer"],
        ["KHOWD111", "Windows 11 Pro License", "license"],
        ["KHO789", "Samsung Monitor", "monitor"],
        ["KHO456", "Office Chair", "furniture"],
      ];

      let insertedCount = 0;
      sampleAssets.forEach(([code, name, type]) => {
        db.run(
          "INSERT OR IGNORE INTO assets (asset_code, name, type) VALUES (?, ?, ?)",
          [code, name, type],
          function (err) {
            if (err) {
              console.error(`Error inserting ${code}:`, err.message);
            } else {
              insertedCount++;
              console.log(`Inserted sample asset: ${code} - ${name}`);
            }

            // After all assets inserted, add relationships
            if (insertedCount === sampleAssets.length) {
              addSampleRelationships();
            }
          },
        );
      });
    } else {
      console.log(`Database already has ${result.count} assets`);
    }
  });
}

// Add sample relationships
function addSampleRelationships() {
  console.log("Adding sample relationships...");

  // Make KHO123 (laptop) parent of KHOWD111 (license)
  db.run(
    "INSERT OR IGNORE INTO asset_relationships (parent_asset_code, child_asset_code) VALUES (?, ?)",
    ["KHO123", "KHOWD111"],
    (err) => {
      if (err) {
        console.error("Error adding relationship:", err.message);
      } else {
        console.log("Added relationship: KHO123 -> KHOWD111");
      }
    },
  );
}

module.exports = db;