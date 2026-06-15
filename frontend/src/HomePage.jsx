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
    assigned_to: "",
    location: "",
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [columnFilters, setColumnFilters] = useState({
    asset_code: "",
    name: "",
    type: "",
    assigned_to: "",
    location: "",
  });
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => {
    fetchAssets();
  }, []);

  const exportToExcel = () => {
    const rows = assets.map((a) => ({
      "Asset Code": a.asset_code,
      Name: a.name,
      Type: a.type,
      "Assigned To": a.assigned_to,
      Location: a.location,
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
      setNewAsset({
        asset_code: "",
        name: "",
        type: "laptop",
        assigned_to: "",
        location: "",
      });
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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const getAssetColumnValue = (asset, field) => {
    if (field === "created_at") {
      return new Date(asset.created_at).toLocaleString();
    }
    return asset[field] ?? "";
  };

  const updateColumnFilter = (field, value) => {
    setColumnFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const clearColumnFilters = () => {
    setColumnFilters({
      asset_code: "",
      name: "",
      type: "",
      assigned_to: "",
      location: "",
    });
  };

  const hasColumnFilters = Object.values(columnFilters).some(Boolean);

  const filteredAssets = assets.filter((asset) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch =
      asset.asset_code.toLowerCase().includes(normalizedSearch) ||
      asset.name.toLowerCase().includes(normalizedSearch) ||
      asset.type.toLowerCase().includes(normalizedSearch) ||
      asset.assigned_to?.toLowerCase().includes(normalizedSearch) ||
      asset.location?.toLowerCase().includes(normalizedSearch) ||
      getAssetColumnValue(asset, "created_at")
        .toLowerCase()
        .includes(normalizedSearch);

    const assetDate = new Date(asset.created_at);
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
    const matchesDate =
      (!fromDate || assetDate >= fromDate) && (!toDate || assetDate <= toDate);

    const matchesColumnFilters = Object.entries(columnFilters).every(
      ([field, value]) =>
        getAssetColumnValue(asset, field)
          .toString()
          .toLowerCase()
          .includes(value.toLowerCase())
    );

    return matchesSearch && matchesDate && matchesColumnFilters;
  });

  const clearDateFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    if (!sortField) return 0;
    if (sortField === "created_at") {
      const diff = new Date(a.created_at) - new Date(b.created_at);
      return sortDir === "asc" ? diff : -diff;
    }
    const aVal = (a[sortField] ?? "").toLowerCase();
    const bVal = (b[sortField] ?? "").toLowerCase();
    const cmp = aVal.localeCompare(bVal);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortHeader = ({ field, children }) => (
    <th className={`sortable-th${sortField === field ? " sorted" : ""}`} onClick={() => handleSort(field)}>
      {children}
      <span className="sort-arrow">{sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"}</span>
    </th>
  );

  return (
    <div className="home-page">
      <header className="app-header">
        <div className="header-main">
          <h1>📦 Asset Management System</h1>
          <p>Track assets with parent-child relationships</p>
        </div>
        <div className="header-actions">
          <span className="header-user">👤 {user?.username}</span>
          <span className="header-role-badge">{user?.role}</span>
          {user?.role === "admin" && (
            <Link to="/users" className="btn btn-manage-users btn-small">👥 Manage Users</Link>
          )}
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
        {/* Create Asset Form — admin only */}
        {user?.role === "admin" && <div className="section section-wide">
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
                <option value="furniture">Furniture</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-field form-field-grow">
              <label>Assigned To</label>
              <input
                type="text"
                value={newAsset.assigned_to}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, assigned_to: e.target.value })
                }
                placeholder="e.g., John Doe"
                required
              />
            </div>

            <div className="form-field form-field-grow">
              <label>Location</label>
              <input
                type="text"
                value={newAsset.location}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, location: e.target.value })
                }
                placeholder="e.g., Office 3B"
                required
              />
            </div>

            <div className="form-field form-field-submit">
              <label>&nbsp;</label>
              <button type="submit" className="btn btn-primary">
                + Create Asset
              </button>
            </div>
          </form>
        </div>}

        {/* Asset List */}
        <div className="section section-wide">
          <div className="section-title-row">
            <h2>All Assets ({filteredAssets.length})</h2>
            <button
              onClick={exportToExcel}
              disabled={assets.length === 0}
              className="btn btn-outline"
            >
              Export to Excel
            </button>
          </div>
          <div className="search-bar-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-bar"
              placeholder="Search by code, name, assigned to, or location…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="search-clear-btn" onClick={() => setSearchTerm("")}>×</button>
            )}
          </div>
          <div className="date-filter-row">
            <div className="date-filter-field">
              <label htmlFor="created-from">Created from</label>
              <input
                id="created-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="date-filter-field">
              <label htmlFor="created-to">Created to</label>
              <input
                id="created-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                className="btn btn-outline btn-small date-filter-clear"
                onClick={clearDateFilters}
              >
                Clear dates
              </button>
            )}
            {hasColumnFilters && (
              <button
                type="button"
                className="btn btn-outline btn-small date-filter-clear"
                onClick={clearColumnFilters}
              >
                Clear column searches
              </button>
            )}
          </div>
          <table className="asset-table">
            <thead>
              <tr>
                <th>Asset Code</th>
                <SortHeader field="name">Asset Name</SortHeader>
                <SortHeader field="type">Type</SortHeader>
                <SortHeader field="assigned_to">Assigned To</SortHeader>
                <SortHeader field="location">Location</SortHeader>
                <SortHeader field="created_at">Created At</SortHeader>
                <th></th>
              </tr>
              <tr className="column-filter-row">
                <th>
                  <input
                    type="search"
                    className="column-filter-input"
                    placeholder="Search code"
                    value={columnFilters.asset_code}
                    onChange={(e) =>
                      updateColumnFilter("asset_code", e.target.value)
                    }
                  />
                </th>
                <th>
                  <input
                    type="search"
                    className="column-filter-input"
                    placeholder="Search name"
                    value={columnFilters.name}
                    onChange={(e) => updateColumnFilter("name", e.target.value)}
                  />
                </th>
                <th>
                  <input
                    type="search"
                    className="column-filter-input"
                    placeholder="Search type"
                    value={columnFilters.type}
                    onChange={(e) => updateColumnFilter("type", e.target.value)}
                  />
                </th>
                <th>
                  <input
                    type="search"
                    className="column-filter-input"
                    placeholder="Search person"
                    value={columnFilters.assigned_to}
                    onChange={(e) =>
                      updateColumnFilter("assigned_to", e.target.value)
                    }
                  />
                </th>
                <th>
                  <input
                    type="search"
                    className="column-filter-input"
                    placeholder="Search location"
                    value={columnFilters.location}
                    onChange={(e) =>
                      updateColumnFilter("location", e.target.value)
                    }
                  />
                </th>
                <th>
                  <span className="column-filter-spacer" />
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty">
                    {searchTerm || dateFrom || dateTo || hasColumnFilters
                      ? "No assets match the current filters"
                      : "No assets found"}
                  </td>
                </tr>
              ) : (
                sortedAssets.map((asset) => (
                    <tr key={asset.id}>
                      <td className="col-code">
                        <Link
                          to={`/asset/${asset.asset_code}`}
                          className="col-code-link"
                        >
                          {asset.asset_code}
                        </Link>
                      </td>
                      <td>{asset.name}</td>
                      <td>
                        <span className="asset-type">{asset.type}</span>
                      </td>
                      <td className="col-muted">
                        {asset.assigned_to || (
                          <span className="col-empty">—</span>
                        )}
                      </td>
                      <td className="col-muted">
                        {asset.location || <span className="col-empty">—</span>}
                      </td>
                      <td className="col-date">
                        {new Date(asset.created_at).toLocaleString()}
                      </td>
                      <td className="col-actions">
                        <Link
                          to={`/asset/${asset.asset_code}`}
                          className="btn btn-outline btn-small"
                        >
                          View
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
