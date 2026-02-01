const db = require('../config/database');

// Add parent-child relationship
const addParentRelationship = (req, res) => {
  const { childCode, parentCode } = req.params;
  console.log(`Adding relationship: ${parentCode} -> ${childCode}`);

  // First, check if both assets exist
  db.get(
    "SELECT asset_code FROM assets WHERE asset_code = ?",
    [childCode.toUpperCase()],
    (err, child) => {
      if (err) {
        console.error("Error checking child asset:", err.message);
        res.status(500).json({ error: err.message });
        return;
      }

      if (!child) {
        res.status(404).json({ error: `Child asset ${childCode} not found` });
        return;
      }

      db.get(
        "SELECT asset_code FROM assets WHERE asset_code = ?",
        [parentCode.toUpperCase()],
        (err, parent) => {
          if (err) {
            console.error("Error checking parent asset:", err.message);
            res.status(500).json({ error: err.message });
            return;
          }

          if (!parent) {
            res
              .status(404)
              .json({ error: `Parent asset ${parentCode} not found` });
            return;
          }

          // Check for circular relationship (don't allow parent to be child of its child)
          if (childCode === parentCode) {
            res
              .status(400)
              .json({ error: "An asset cannot be a parent of itself" });
            return;
          }

          // Check if relationship already exists
          db.get(
            "SELECT id FROM asset_relationships WHERE parent_asset_code = ? AND child_asset_code = ?",
            [parentCode.toUpperCase(), childCode.toUpperCase()],
            (err, existing) => {
              if (err) {
                console.error(
                  "Error checking existing relationship:",
                  err.message,
                );
                res.status(500).json({ error: err.message });
                return;
              }

              if (existing) {
                res.status(400).json({ error: "Relationship already exists" });
                return;
              }

              // Insert the relationship
              db.run(
                "INSERT INTO asset_relationships (parent_asset_code, child_asset_code) VALUES (?, ?)",
                [parentCode.toUpperCase(), childCode.toUpperCase()],
                function (err) {
                  if (err) {
                    console.error("Error adding relationship:", err.message);
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  console.log(
                    `Relationship added: ${parentCode} -> ${childCode}`,
                  );
                  res.json({
                    message: "Relationship added successfully",
                    parent: parentCode,
                    child: childCode,
                    id: this.lastID,
                  });
                },
              );
            },
          );
        },
      );
    },
  );
};

// Remove parent-child relationship
const removeParentRelationship = (req, res) => {
  const { childCode, parentCode } = req.params;
  console.log(`Removing relationship: ${parentCode} -> ${childCode}`);

  db.run(
    "DELETE FROM asset_relationships WHERE parent_asset_code = ? AND child_asset_code = ?",
    [parentCode.toUpperCase(), childCode.toUpperCase()],
    function (err) {
      if (err) {
        console.error("Error removing relationship:", err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log(`Relationship removed: ${parentCode} -> ${childCode}`);
      res.json({
        message: "Relationship removed successfully",
        parent: parentCode,
        child: childCode,
      });
    },
  );
};

module.exports = {
  addParentRelationship,
  removeParentRelationship,
};