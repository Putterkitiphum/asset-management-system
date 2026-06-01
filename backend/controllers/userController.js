const bcrypt = require("bcryptjs");
const { dbGet, dbAll, dbRun } = require("../config/database");

const getUsers = async (req, res) => {
  try {
    const users = await dbAll(
      "SELECT id, username, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createUser = async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: "Username, password, and role are required" });
  }
  if (!["admin", "viewer"].includes(role)) {
    return res.status(400).json({ error: "Role must be 'admin' or 'viewer'" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const { lastID } = await dbRun(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
      [username, hash, role]
    );
    res.json({ id: lastID, username, role });
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "Username already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: "You cannot delete your own account" });
  }

  try {
    const { changes } = await dbRun("DELETE FROM users WHERE id = ?", [id]);
    if (changes === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getUsers, createUser, deleteUser };
