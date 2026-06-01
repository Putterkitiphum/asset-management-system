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
          <div className="success-alert full-width">
            <div className="success-content">{successMsg}</div>
            <button onClick={() => setSuccessMsg("")} className="btn-close">
              ×
            </button>
          </div>
        )}
        {errorMsg && (
          <div className="error-alert full-width">
            <div className="error-content">{errorMsg}</div>
            <button onClick={() => setErrorMsg("")} className="btn-close">
              ×
            </button>
          </div>
        )}
        {/* Create Asset Form */}
        <div className="section section-wide">
          <h2>Create New Asset</h2>
          <form onSubmit={handleCreateAsset} className="asset-form-row">
            <div className="form-field">
              <label>Asset Code</label>
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

            <div className="form-field form-field-grow">
              <label>Asset Name</label>
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

            <div className="form-field">
              <label>Type</label>
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

            <div className="form-field form-field-submit">
              <label>&nbsp;</label>
              <button type="submit" className="btn btn-primary">
                + Create Asset
              </button>
            </div>
          </form>
        </div>

        {/* Asset List */}
        <div className="section section-wide">
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
          <table className="asset-table">
            <thead>
              <tr>
                <th>Asset Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Created At</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">No assets found</td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id}>
                    <td className="col-code">{asset.asset_code}</td>
                    <td>{asset.name}</td>
                    <td><span className="asset-type">{asset.type}</span></td>
                    <td className="col-date">{new Date(asset.created_at).toLocaleString()}</td>
                    <td className="col-action">
                      <Link to={`/asset/${asset.asset_code}`} className="btn btn-outline btn-small">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
