import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "./AuthContext";

function UserManagementPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "viewer" });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users");
      setUsers(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to load users");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/users", newUser);
      setNewUser({ username: "", password: "", role: "viewer" });
      setSuccessMsg(`User "${newUser.username}" created`);
      setErrorMsg("");
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to create user");
      setSuccessMsg("");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/users/${id}`);
      setConfirmDeleteId(null);
      setSuccessMsg("User deleted");
      setErrorMsg("");
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to delete user");
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="asset-detail-page">
      <header className="detail-header-bar">
        <Link to="/" className="btn btn-secondary">← Back</Link>
        <h1>👥 User Management</h1>
        <div className="header-actions">
          <span className="header-user">👤 {user?.username}</span>
          <button onClick={logout} className="btn btn-secondary btn-small">Logout</button>
        </div>
      </header>

      {successMsg && (
        <div className="success-alert">
          <div className="success-content">{successMsg}</div>
          <button onClick={() => setSuccessMsg("")} className="btn-close">×</button>
        </div>
      )}
      {errorMsg && (
        <div className="error-alert">
          <div className="error-content">{errorMsg}</div>
          <button onClick={() => setErrorMsg("")} className="btn-close">×</button>
        </div>
      )}

      <div className="asset-detail-card">
        {/* Create User Form */}
        <h2>Create New User</h2>
        <form onSubmit={handleCreateUser} className="asset-form-row" style={{ marginBottom: "2rem" }}>
          <div className="form-field form-field-grow">
            <label>Username</label>
            <input
              type="text"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              placeholder="e.g., john_doe"
              required
            />
          </div>
          <div className="form-field form-field-grow">
            <label>Password</label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="Enter password"
              required
            />
          </div>
          <div className="form-field">
            <label>Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-field form-field-submit">
            <label>&nbsp;</label>
            <button type="submit" className="btn btn-primary">+ Create User</button>
          </div>
        </form>

        {/* User List */}
        <h2>All Users ({users.length})</h2>
        <table className="asset-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Created At</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={4} className="table-empty">No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.username}</strong>{u.id === user?.id && <span className="you-badge"> (you)</span>}</td>
                  <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                  <td className="col-date">{new Date(u.created_at).toLocaleString()}</td>
                  <td className="col-actions">
                    {u.id !== user?.id && (
                      confirmDeleteId === u.id ? (
                        <>
                          <span className="delete-confirm-text">Delete?</span>
                          <button onClick={() => handleDelete(u.id)} className="btn btn-danger btn-small">Yes</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="btn btn-secondary btn-small">No</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(u.id)} className="btn btn-danger btn-small">Delete</button>
                      )
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagementPage;
