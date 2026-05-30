const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { dbGet } = require("../config/database");

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const user = await dbGet("SELECT * FROM users WHERE username = ?", [username]);

    // Use the same generic message for both "user not found" and "wrong password"
    // so attackers can't tell which one failed
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Sign a JWT that expires in 8 hours
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { login };
