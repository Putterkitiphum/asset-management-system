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
  const { asset_code, name, type } = req.body;

  if (!asset_code || !name || !type) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { lastID } = await dbRun(
      "INSERT INTO assets (asset_code, name, type) VALUES (?, ?, ?)",
      [asset_code.toUpperCase(), name, type]
    );
    res.json({ id: lastID, asset_code: asset_code.toUpperCase(), name, type });
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "Asset code already exists" });
    }
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

module.exports = { getAllAssets, getAssetByCode, createAsset, getAssetsForDropdown };
