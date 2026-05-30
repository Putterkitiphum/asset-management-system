const { dbGet, dbRun } = require('../config/database');

const addParentRelationship = async (req, res) => {
  const { childCode, parentCode } = req.params;

  if (childCode.toUpperCase() === parentCode.toUpperCase()) {
    return res.status(400).json({ error: "An asset cannot be a parent of itself" });
  }

  try {
    const [child, parent] = await Promise.all([
      dbGet("SELECT asset_code FROM assets WHERE asset_code = ?", [childCode.toUpperCase()]),
      dbGet("SELECT asset_code FROM assets WHERE asset_code = ?", [parentCode.toUpperCase()]),
    ]);

    if (!child) return res.status(404).json({ error: `Child asset ${childCode} not found` });
    if (!parent) return res.status(404).json({ error: `Parent asset ${parentCode} not found` });

    const existing = await dbGet(
      "SELECT id FROM asset_relationships WHERE parent_asset_code = ? AND child_asset_code = ?",
      [parentCode.toUpperCase(), childCode.toUpperCase()]
    );
    if (existing) return res.status(400).json({ error: "Relationship already exists" });

    const { lastID } = await dbRun(
      "INSERT INTO asset_relationships (parent_asset_code, child_asset_code) VALUES (?, ?)",
      [parentCode.toUpperCase(), childCode.toUpperCase()]
    );

    res.json({ message: "Relationship added successfully", parent: parentCode, child: childCode, id: lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeParentRelationship = async (req, res) => {
  const { childCode, parentCode } = req.params;

  try {
    const { changes } = await dbRun(
      "DELETE FROM asset_relationships WHERE parent_asset_code = ? AND child_asset_code = ?",
      [parentCode.toUpperCase(), childCode.toUpperCase()]
    );

    if (changes === 0) {
      return res.status(404).json({ error: "Relationship not found" });
    }

    res.json({ message: "Relationship removed successfully", parent: parentCode, child: childCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addParentRelationship, removeParentRelationship };
