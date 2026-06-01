import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "./AuthContext";

function AssetDetail() {
  const { user, logout } = useAuth();
  const { assetCode } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [selectedParent, setSelectedParent] = useState("");
  const [allAssets, setAllAssets] = useState([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchAllAssets();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (assetCode) {
      fetchAssetDetails();
    }
  }, [assetCode]);

  const fetchAllAssets = async () => {
    setLoadingAssets(true);
    try {
      const response = await axios.get("/api/assets/dropdown");
      setAllAssets(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching assets list:", error);
      setError(`Failed to load assets list: ${error.message}`);
    } finally {
      setLoadingAssets(false);
    }
  };

  const fetchAssetDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`/api/assets/${assetCode}`);
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
      setError("Please select a parent asset first");
      return;
    }

    try {
      setError("");
      await axios.post(`/api/assets/${assetCode}/parents/${selectedParent}`);
      await Promise.all([fetchAssetDetails(), fetchAllAssets()]);
      setSelectedParent("");
      setSearchQuery("");
      setSuccessMsg(`Successfully added ${selectedParent} as parent of ${assetCode}`);
    } catch (error) {
      console.error("Error adding parent:", error);
      if (error.response?.data?.error) {
        setError(`Error: ${error.response.data.error}`);
      } else if (error.code === "ECONNABORTED") {
        setError("Request timed out. Please try again.");
      } else {
        setError(`Failed to add parent: ${error.message}`);
      }
    }
  };

  const handleRemoveParent = async (parentCode) => {
    try {
      setError("");
      await axios.delete(`/api/assets/${assetCode}/parents/${parentCode}`);
      setConfirmRemove(null);
      fetchAssetDetails();
      setSuccessMsg(`Successfully removed ${parentCode} as parent`);
    } catch (error) {
      console.error("Error removing parent:", error);
      setConfirmRemove(null);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError(`Failed to remove parent: ${error.message}`);
      }
    }
  };

  const retryConnection = () => {
    setError("");
    setSuccessMsg("");
    fetchAllAssets();
    fetchAssetDetails();
  };

  const handleStartEdit = () => {
    setEditValues({
      asset_code: asset.asset_code,
      name: asset.name,
      type: asset.type,
      assigned_to: asset.assigned_to || "",
      location: asset.location || "",
      comments: asset.comments || "",
    });
    setIsEditing(true);
    setConfirmDelete(false);
    setError("");
  };

  const handleSaveEdit = async () => {
    try {
      const { data } = await axios.put(`/api/assets/${assetCode}`, editValues);
      setIsEditing(false);
      if (data.asset_code !== assetCode) {
        navigate(`/asset/${data.asset_code}`);
      } else {
        setSuccessMsg("Asset updated successfully");
        fetchAssetDetails();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update asset");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/assets/${assetCode}`);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete asset");
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <h2>Loading asset details...</h2>
        <div className="spinner"></div>
        <button
          onClick={() => setLoading(false)}
          className="btn btn-secondary mt-2"
        >
          Cancel Loading
        </button>
      </div>
    );
  }

  if (!asset) {
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
      <header className="detail-header-bar">
        <Link to="/" className="btn btn-secondary">
          ← Back to All Assets
        </Link>
        <h1>📋 Asset Details</h1>
        <div className="header-actions">
          <span className="header-user">👤 {user?.username}</span>
          <button onClick={logout} className="btn btn-secondary btn-small">
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="error-alert">
          <div className="error-content">
            <strong>Error:</strong> {error}
          </div>
          <div className="error-actions">
            <button
              onClick={retryConnection}
              className="btn btn-primary btn-small"
            >
              Retry
            </button>
            <button onClick={() => setError("")} className="btn-close">
              ×
            </button>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="success-alert">
          <div className="success-content">{successMsg}</div>
          <button onClick={() => setSuccessMsg("")} className="btn-close">
            ×
          </button>
        </div>
      )}

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
            {user?.role === "admin" && !isEditing && !confirmDelete && (
              <button onClick={handleStartEdit} className="btn btn-primary btn-small">
                Edit
              </button>
            )}
            {user?.role === "admin" && !isEditing && (
              confirmDelete ? (
                <>
                  <span className="delete-confirm-text">Delete?</span>
                  <button onClick={handleDelete} className="btn btn-danger btn-small">Yes</button>
                  <button onClick={() => setConfirmDelete(false)} className="btn btn-secondary btn-small">No</button>
                </>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="btn btn-danger btn-small">
                  Delete
                </button>
              )
            )}
          </div>
        </div>

        <div className="detail-content">
          {isEditing ? (
            <div className="detail-edit-form">
              <div className="form-field">
                <label>Asset Code</label>
                <input
                  type="text"
                  value={editValues.asset_code}
                  onChange={(e) => setEditValues({ ...editValues, asset_code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div className="form-field form-field-grow">
                <label>Asset Name</label>
                <input
                  type="text"
                  value={editValues.name}
                  onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Type</label>
                <select
                  value={editValues.type}
                  onChange={(e) => setEditValues({ ...editValues, type: e.target.value })}
                >
                  <option value="laptop">Laptop</option>
                  <option value="printer">Printer</option>
                  <option value="license">License</option>
                  <option value="monitor">Monitor</option>
                  <option value="furniture">Furniture</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-field form-field-grow">
                <label>Assigned To</label>
                <input
                  type="text"
                  value={editValues.assigned_to}
                  onChange={(e) => setEditValues({ ...editValues, assigned_to: e.target.value })}
                  placeholder="e.g., John Doe"
                />
              </div>
              <div className="form-field form-field-grow">
                <label>Location</label>
                <input
                  type="text"
                  value={editValues.location}
                  onChange={(e) => setEditValues({ ...editValues, location: e.target.value })}
                  placeholder="e.g., Office 3B"
                />
              </div>
              <div className="form-field form-field-full">
                <label>Comments</label>
                <textarea
                  value={editValues.comments}
                  onChange={(e) => setEditValues({ ...editValues, comments: e.target.value })}
                  placeholder="Any notes or comments about this asset…"
                  rows={3}
                />
              </div>
              <div className="detail-edit-actions">
                <button onClick={handleSaveEdit} className="btn btn-success">Save Changes</button>
                <button onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h3>{asset.name}</h3>
              <div className="detail-meta">
                <p className="detail-meta-item">
                  <strong>Assigned To:</strong>{" "}
                  <span>{asset.assigned_to || <span className="col-empty">Not assigned</span>}</span>
                </p>
                <p className="detail-meta-item">
                  <strong>Location:</strong>{" "}
                  <span>{asset.location || <span className="col-empty">Not set</span>}</span>
                </p>
                <p className="detail-meta-item">
                  <strong>Created:</strong>{" "}
                  {new Date(asset.created_at).toLocaleDateString()} at{" "}
                  {new Date(asset.created_at).toLocaleTimeString()}
                </p>
              </div>
              <div className="detail-comments">
                <strong>Comments</strong>
                {asset.comments ? (
                  <p className="comments-text">{asset.comments}</p>
                ) : (
                  <p className="col-empty">No comments</p>
                )}
              </div>
            </>
          )}
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
                  {user?.role === "admin" && (confirmRemove === parent.asset_code ? (
                    <div className="confirm-remove">
                      <span>Remove {parent.asset_code}?</span>
                      <button
                        onClick={() => handleRemoveParent(parent.asset_code)}
                        className="btn btn-danger btn-small"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmRemove(null)}
                        className="btn btn-secondary btn-small"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRemove(parent.asset_code)}
                      className="btn btn-danger btn-small"
                      title={`Remove ${parent.asset_code} as parent`}
                    >
                      Remove
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="no-data">No parent assets</p>
              <p className="empty-help">
                This asset is not contained within any other assets.
              </p>
            </div>
          )}
        </div>

        {/* Add Parent Form — admin only */}
        {user?.role === "admin" && <div className="add-parent-section">
          <div className="section-header">
            <h4>➕ Add Parent Asset</h4>
            <span className="section-help">
              Select an asset to become the parent of this asset
            </span>
          </div>

          <div className="add-parent-form">
            <div className="parent-search-wrapper" ref={searchRef}>
              <input
                type="text"
                className={`parent-search-input${selectedParent ? " parent-search-selected" : ""}`}
                placeholder={loadingAssets ? "Loading assets..." : "Search by code or name…"}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedParent("");
                  setShowDropdown(true);
                  setError("");
                }}
                onFocus={() => setShowDropdown(true)}
                disabled={loadingAssets}
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedParent("");
                    setShowDropdown(false);
                  }}
                >
                  ×
                </button>
              )}
              {showDropdown && !loadingAssets && (() => {
                const filtered = allAssets
                  .filter(
                    (a) =>
                      a.asset_code !== asset.asset_code &&
                      !asset.parents.some((p) => p.asset_code === a.asset_code)
                  )
                  .filter(
                    (a) =>
                      searchQuery === "" ||
                      a.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.type.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                return (
                  <div className="parent-dropdown">
                    {filtered.length === 0 ? (
                      <div className="dropdown-empty">No assets match "{searchQuery}"</div>
                    ) : (
                      filtered.map((a) => (
                        <div
                          key={a.asset_code}
                          className="dropdown-item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSelectedParent(a.asset_code);
                            setSearchQuery(`${a.asset_code} — ${a.name}`);
                            setShowDropdown(false);
                            setError("");
                          }}
                        >
                          <span className="dropdown-code">{a.asset_code}</span>
                          <span className="dropdown-name">{a.name}</span>
                          <span className="dropdown-type">{a.type}</span>
                        </div>
                      ))
                    )}
                  </div>
                );
              })()}
            </div>

            <button
              onClick={handleAddParent}
              disabled={!selectedParent || loadingAssets}
              className="btn btn-success"
            >
              Add Parent
            </button>
          </div>
        </div>}

        {/* Child Assets Section */}
        <div className="relationship-section">
          <div className="section-header">
            <h4>📦 Child Assets ({asset.children.length})</h4>
            <span className="section-help">
              Assets contained within this asset
            </span>
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
              <p className="empty-help">
                This asset does not contain any other assets.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssetDetail;
