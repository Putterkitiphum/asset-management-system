import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function HomePage() {
  const [assets, setAssets] = useState([]);
  const [newAsset, setNewAsset] = useState({
    asset_code: "",
    name: "",
    type: "laptop",
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await axios.get("/api/assets");
      setAssets(response.data);
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/assets", newAsset);
      setNewAsset({ asset_code: "", name: "", type: "laptop" });
      fetchAssets();
      alert("Asset created successfully!");
    } catch (error) {
      console.error("Error creating asset:", error);
      alert("Error creating asset. Asset code might already exist.");
    }
  };

  return (
    <div className="home-page">
      <header className="app-header">
        <h1>📦 Asset Management System</h1>
        <p>Track assets with parent-child relationships</p>
      </header>
      <div className="container">
        {/* Create Asset Form */}
        <div className="section">
          <h2>Create New Asset</h2>
          <form onSubmit={handleCreateAsset} className="asset-form">
            <div className="form-group">
              <label>Asset Code:</label>
              <input
                type="text"
                value={newAsset.asset_code}
                onChange={(e) =>
                  setNewAsset({
                    ...newAsset,
                    asset_code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., KHO123"
                required
              />
            </div>

            <div className="form-group">
              <label>Asset Name:</label>
              <input
                type="text"
                value={newAsset.name}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, name: e.target.value })
                }
                placeholder="e.g., Dell Laptop"
                required
              />
            </div>

            <div className="form-group">
              <label>Type:</label>
              <select
                value={newAsset.type}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, type: e.target.value })
                }
              >
                <option value="laptop">Laptop</option>
                <option value="printer">Printer</option>
                <option value="license">License</option>
                <option value="monitor">Monitor</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button type="submit">Create Asset</button>
          </form>
        </div>

        {/* Asset List */}
        <div className="section">
          <h2>All Assets ({assets.length})</h2>
          <div className="asset-list">
            {assets.map((asset) => (
              <Link
                to={`/asset/${asset.asset_code}`}
                key={asset.id}
                className="asset-card"
              >
                <div className="asset-code">{asset.asset_code}</div>
                <div className="asset-name">{asset.name}</div>
                <div className="asset-type">{asset.type}</div>
                <div className="view-details">View Details →</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
