import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { useAuth } from "./AuthContext";

function HomePage() {
  const { user, logout } = useAuth();
  const [assets, setAssets] = useState([]);
  const [newAsset, setNewAsset] = useState({
    asset_code: "",
    name: "",
    type: "laptop",
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchAssets();
  }, []);

  const exportToExcel = () => {
    const rows = assets.map((a) => ({
      "Asset Code": a.asset_code,
      "Name": a.name,
      "Type": a.type,
      "Created At": new Date(a.created_at).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");
    XLSX.writeFile(wb, "assets.xlsx");
  };

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
      setErrorMsg("");
      setSuccessMsg("Asset created successfully!");
    } catch (error) {
      console.error("Error creating asset:", error);
      const msg =
        error.response?.data?.error || "Asset code might already exist.";
      setSuccessMsg("");
      setErrorMsg(`Error creating asset: ${msg}`);
    }
  };

  return (
    <div className="home-page">
      <header className="app-header">
        <div className="header-main">
          <h1>📦 Asset Management System</h1>
          <p>Track assets with parent-child relationships</p>
        </div>
        <div className="header-actions">
          <span className="header-user">👤 {user?.username}</span>
          <button onClick={logout} className="btn btn-secondary btn-small">
            Logout
          </button>
        </div>
      </header>
      <div className="container">
        {successMsg && (
          <div className="success-alert">
            <div className="success-content">{successMsg}</div>
            <button onClick={() => setSuccessMsg("")} className="btn-close">
              ×
            </button>
          </div>
        )}
        {errorMsg && (
          <div className="error-alert">
            <div className="error-content">{errorMsg}</div>
            <button onClick={() => setErrorMsg("")} className="btn-close">
              ×
            </button>
          </div>
        )}
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
          <div className="section-title-row">
            <h2>All Assets ({assets.length})</h2>
            <button
              onClick={exportToExcel}
              disabled={assets.length === 0}
              className="btn btn-outline"
            >
              Export to Excel
            </button>
          </div>
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
