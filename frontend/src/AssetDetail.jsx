import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

function AssetDetail() {
  const { assetCode } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedParent, setSelectedParent] = useState("");
  const [allAssets, setAllAssets] = useState([]);
  const [error, setError] = useState("");
  const [backendUrl] = useState("http://localhost:3001");

  // Fetch all assets for dropdown
  useEffect(() => {
    fetchAllAssets();
  }, []);

  // Fetch asset details
  useEffect(() => {
    if (assetCode) {
      fetchAssetDetails();
    }
  }, [assetCode]);

  const fetchAllAssets = async () => {
    try {
      console.log("Fetching assets from:", `${backendUrl}/api/assets/dropdown`);
      const response = await axios.get(`${backendUrl}/api/assets/dropdown`, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log("Assets loaded:", response.data);
      setAllAssets(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching all assets:", error);
      setError(`Failed to load assets list: ${error.message}`);
      
      // Try alternative endpoint
      try {
        console.log("Trying alternative endpoint...");
        const altResponse = await axios.get(`${backendUrl}/api/assets`, {
          timeout: 3000
        });
        console.log("Alternative endpoint worked, using that data");
        setAllAssets(altResponse.data);
        setError("");
      } catch (altError) {
        console.error("Alternative endpoint also failed:", altError);
        setError(`Cannot connect to backend. Make sure it's running on ${backendUrl}`);
      }
    }
  };

  const fetchAssetDetails = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("Fetching asset details for:", assetCode);
      const response = await axios.get(`${backendUrl}/api/assets/${assetCode}`, {
        timeout: 5000
      });
      console.log("Asset details loaded:", response.data);
      setAsset(response.data);
    } catch (error) {
      console.error("Error fetching asset details:", error);
      if (error.response?.status === 404) {
        setError(`Asset "${assetCode}" not found`);
      } else {
        setError(`Failed to load asset details: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddParent = async () => {
    if (!selectedParent) {
      alert("Please select a parent asset first");
      return;
    }

    try {
      setError("");
      console.log(`Adding parent: ${selectedParent} to child: ${assetCode}`);
      const response = await axios.post(
        `${backendUrl}/api/assets/${assetCode}/parents/${selectedParent}`,
        {},
        { 
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Parent added successfully:", response.data);
      
      // Refresh asset details and assets list
      await Promise.all([
        fetchAssetDetails(),
        fetchAllAssets()
      ]);
      
      // Clear selection
      setSelectedParent("");
      
      // Show success message
      alert(`Successfully added ${selectedParent} as parent of ${assetCode}`);
    } catch (error) {
      console.error("Error adding parent:", error);
      
      if (error.response?.data?.error) {
        setError(`Error: ${error.response.data.error}`);
      } else if (error.code === 'ECONNABORTED') {
        setError("Request timed out. Please try again.");
      } else if (error.message === "Network Error") {
        setError(`Cannot connect to backend at ${backendUrl}`);
      } else {
        setError(`Failed to add parent: ${error.message}`);
      }
    }
  };

  const handleRemoveParent = async (parentCode) => {
    if (!window.confirm(`Are you sure you want to remove ${parentCode} as parent?`)) {
      return;
    }

    try {
      setError("");
      await axios.delete(`${backendUrl}/api/assets/${assetCode}/parents/${parentCode}`, {
        timeout: 5000
      });
      
      // Refresh asset details
      fetchAssetDetails();
      
      alert(`Successfully removed ${parentCode} as parent`);
    } catch (error) {
      console.error("Error removing parent:", error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError(`Failed to remove parent: ${error.message}`);
      }
    }
  };

  const retryConnection = () => {
    setError("");
    setLoading(true);
    Promise.all([fetchAllAssets(), fetchAssetDetails()]).finally(() => {
      setLoading(false);
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <h2>Loading asset details...</h2>
        <div className="spinner"></div>
        <button onClick={() => setLoading(false)} className="btn btn-secondary mt-2">
          Cancel Loading
        </button>
      </div>
    );
  }

  if (!asset && !loading) {
    return (
      <div className="not-found">
        <h2>Asset not found: {assetCode}</h2>
        <p>The asset you're looking for doesn't exist.</p>
        <div className="action-buttons">
          <Link to="/" className="btn btn-secondary">
            ← Back to All Assets
          </Link>
          <button onClick={retryConnection} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="asset-detail-page">
      <header>
        <Link to="/" className="btn btn-secondary">
          ← Back to All Assets
        </Link>
        <h1>📋 Asset Details</h1>
      </header>

      {/* Error message display */}
      {error && (
        <div className="error-alert">
          <div className="error-content">
            <strong>Connection Error:</strong> {error}
            <div className="error-help mt-2">
              <small>
                Backend URL: {backendUrl}<br />
                Check if backend is running on port 3001
              </small>
            </div>
          </div>
          <div className="error-actions">
            <button onClick={retryConnection} className="btn btn-primary btn-small">
              Retry
            </button>
            <button onClick={() => setError("")} className="btn-close">×</button>
          </div>
        </div>
      )}

      {asset && (
        <div className="asset-detail-card">
          <div className="detail-header">
            <div className="asset-title">
              <h2>{asset.asset_code}</h2>
              <span className="asset-type-badge">{asset.type}</span>
            </div>
            <div className="asset-actions">
              <button 
                onClick={retryConnection} 
                className="btn btn-outline btn-small"
                title="Refresh data"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          <div className="detail-content">
            <h3>{asset.name}</h3>
            <p className="created-date">
              <strong>Created:</strong> {new Date(asset.created_at).toLocaleDateString()} at {new Date(asset.created_at).toLocaleTimeString()}
            </p>
          </div>

          {/* Parent Assets Section */}
          <div className="relationship-section">
            <div className="section-header">
              <h4>📂 Parent Assets ({asset.parents.length})</h4>
              <span className="section-help">Assets that contain this asset</span>
            </div>
            {asset.parents.length > 0 ? (
              <div className="relationship-list">
                {asset.parents.map((parent) => (
                  <div key={parent.id} className="relationship-item">
                    <div className="relationship-info">
                      <Link
                        to={`/asset/${parent.asset_code}`}
                        className="asset-link"
                      >
                        <span className="parent-code">{parent.asset_code}</span>
                        <span className="parent-name">{parent.name}</span>
                        <span className="parent-type">{parent.type}</span>
                      </Link>
                    </div>
                    <button
                      onClick={() => handleRemoveParent(parent.asset_code)}
                      className="btn btn-danger btn-small"
                      title={`Remove ${parent.asset_code} as parent`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p className="no-data">No parent assets</p>
                <p className="empty-help">This asset is not contained within any other assets.</p>
              </div>
            )}
          </div>

          {/* Add Parent Form */}
          <div className="add-parent-section">
            <div className="section-header">
              <h4>➕ Add Parent Asset</h4>
              <span className="section-help">Select an asset to become the parent of this asset</span>
            </div>
            
            <div className="add-parent-form">
              <select
                value={selectedParent}
                onChange={(e) => {
                  setSelectedParent(e.target.value);
                  setError("");
                }}
                className="parent-select"
                disabled={allAssets.length === 0}
              >
                <option value="">
                  {allAssets.length === 0 ? "Loading assets..." : "-- Select a parent asset --"}
                </option>
                {allAssets.length > 0 && allAssets
                  .filter(
                    (a) =>
                      a.asset_code !== asset.asset_code &&
                      !asset.parents.some((p) => p.asset_code === a.asset_code)
                  )
                  .map((assetOption) => (
                    <option 
                      key={assetOption.asset_code} 
                      value={assetOption.asset_code}
                    >
                      {assetOption.asset_code} - {assetOption.name} ({assetOption.type})
                    </option>
                  ))}
              </select>
              
              <button
                onClick={handleAddParent}
                disabled={!selectedParent || allAssets.length === 0}
                className="btn btn-success"
              >
                Add Parent
              </button>
            </div>
            
            {selectedParent && allAssets.length > 0 && (
              <div className="selected-info">
                <strong>Selected:</strong> {selectedParent} - {
                  allAssets.find(a => a.asset_code === selectedParent)?.name || "Unknown asset"
                }
              </div>
            )}

            {allAssets.length === 0 && !error && (
              <div className="loading-state">
                <div className="spinner small"></div>
                <span>Loading available assets...</span>
              </div>
            )}
          </div>

          {/* Child Assets Section */}
          <div className="relationship-section">
            <div className="section-header">
              <h4>📦 Child Assets ({asset.children.length})</h4>
              <span className="section-help">Assets contained within this asset</span>
            </div>
            {asset.children.length > 0 ? (
              <div className="relationship-list">
                {asset.children.map((child) => (
                  <div key={child.id} className="relationship-item">
                    <div className="relationship-info">
                      <Link
                        to={`/asset/${child.asset_code}`}
                        className="asset-link"
                      >
                        <span className="child-code">{child.asset_code}</span>
                        <span className="child-name">{child.name}</span>
                      </Link>
                    </div>
                    <span className="child-type">{child.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p className="no-data">No child assets</p>
                <p className="empty-help">This asset does not contain any other assets.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetDetail;