const { dbGet, dbAll, dbRun } = require('../config/database');

const getAllAssets = async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM assets ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAssetByCode = async (req, res) => {
  const assetCode = req.params.code;
  try {
    const asset = await dbGet("SELECT * FROM assets WHERE asset_code = ?", [assetCode]);
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    const [children, parents] = await Promise.all([
      dbAll(
        `SELECT a.* FROM assets a
         JOIN asset_relationships r ON a.asset_code = r.child_asset_code
         WHERE r.parent_asset_code = ?`,
        [assetCode]
      ),
      dbAll(
        `SELECT a.* FROM assets a
         JOIN asset_relationships r ON a.asset_code = r.parent_asset_code
         WHERE r.child_asset_code = ?`,
        [assetCode]
      ),
    ]);

    res.json({ ...asset, children, parents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createAsset = async (req, res) => {
  const { asset_code, name, type, assigned_to, location, comments } = req.body;

  if (!asset_code || !name || !type || !assigned_to || !location) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const { lastID } = await dbRun(
      "INSERT INTO assets (asset_code, name, type, assigned_to, location, comments) VALUES (?, ?, ?, ?, ?, ?)",
      [asset_code.toUpperCase(), name, type, assigned_to, location, comments || null]
    );
    res.json({ id: lastID, asset_code: asset_code.toUpperCase(), name, type, assigned_to, location, comments });
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "Asset code already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

const updateAsset = async (req, res) => {
  const { code } = req.params;
  const { asset_code, name, type, assigned_to, location, comments } = req.body;

  if (!asset_code || !name || !type || !assigned_to || !location) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const newCode = asset_code.toUpperCase();
  const oldCode = code.toUpperCase();

  try {
    if (newCode !== oldCode) {
      await dbRun(
        "UPDATE asset_relationships SET parent_asset_code = ? WHERE parent_asset_code = ?",
        [newCode, oldCode]
      );
      await dbRun(
        "UPDATE asset_relationships SET child_asset_code = ? WHERE child_asset_code = ?",
        [newCode, oldCode]
      );
    }
    const { changes } = await dbRun(
      "UPDATE assets SET asset_code = ?, name = ?, type = ?, assigned_to = ?, location = ?, comments = ? WHERE asset_code = ?",
      [newCode, name, type, assigned_to, location, comments || null, oldCode]
    );
    if (changes === 0) return res.status(404).json({ error: "Asset not found" });
    res.json({ asset_code: newCode, name, type, assigned_to, location, comments });
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "Asset code already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

const deleteAsset = async (req, res) => {
  const { code } = req.params;

  try {
    await dbRun(
      "DELETE FROM asset_relationships WHERE parent_asset_code = ? OR child_asset_code = ?",
      [code.toUpperCase(), code.toUpperCase()]
    );
    const { changes } = await dbRun(
      "DELETE FROM assets WHERE asset_code = ?",
      [code.toUpperCase()]
    );
    if (changes === 0) return res.status(404).json({ error: "Asset not found" });
    res.json({ message: "Asset deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAssetsForDropdown = async (req, res) => {
  try {
    const rows = await dbAll("SELECT asset_code, name, type FROM assets ORDER BY asset_code");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllAssets, getAssetByCode, createAsset, updateAsset, deleteAsset, getAssetsForDropdown };
