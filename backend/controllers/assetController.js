const db = require('../config/database');

// Get all assets
const getAllAssets = (req, res) => {
  db.all("SELECT * FROM assets ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      console.error("Error fetching assets:", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`Fetched ${rows.length} assets`);
    res.json(rows);
  });
};

// Get a single asset with its children and parents
const getAssetByCode = (req, res) => {
  const assetCode = req.params.code;
  console.log(`Fetching details for asset: ${assetCode}`);

  // Get asset details
  db.get(
    "SELECT * FROM assets WHERE asset_code = ?",
    [assetCode],
    (err, asset) => {
      if (err) {
        console.error("Error fetching asset:", err.message);
        res.status(500).json({ error: err.message });
        return;
      }

      if (!asset) {
        console.log(`Asset not found: ${assetCode}`);
        res.status(404).json({ error: "Asset not found" });
        return;
      }

      console.log(`Found asset: ${asset.asset_code} - ${asset.name}`);

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
            console.error("Error fetching children:", err.message);
            res.status(500).json({ error: err.message });
            return;
          }

          console.log(`Found ${children.length} child assets`);

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
                console.error("Error fetching parents:", err.message);
                res.status(500).json({ error: err.message });
                return;
              }

              console.log(`Found ${parents.length} parent assets`);

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
};

// Create a new asset
const createAsset = (req, res) => {
  const { asset_code, name, type } = req.body;
  console.log(`Creating new asset: ${asset_code} - ${name} (${type})`);

  if (!asset_code || !name || !type) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  db.run(
    "INSERT INTO assets (asset_code, name, type) VALUES (?, ?, ?)",
    [asset_code.toUpperCase(), name, type],
    function (err) {
      if (err) {
        console.error("Error creating asset:", err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log(`Asset created with ID: ${this.lastID}`);
      res.json({
        id: this.lastID,
        asset_code: asset_code.toUpperCase(),
        name,
        type,
      });
    },
  );
};

// Get assets for dropdown
const getAssetsForDropdown = (req, res) => {
  db.all(
    "SELECT asset_code, name, type FROM assets ORDER BY asset_code",
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    },
  );
};

module.exports = {
  getAllAssets,
  getAssetByCode,
  createAsset,
  getAssetsForDropdown,
};