// Import required modules
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database
const db = new sqlite3.Database("attendance.db", (err) => {
    if (err) console.error(err.message);
    console.log("Connected to SQLite database.");
});

// Create users and attendance tables
const initDB = () => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT CHECK(role IN ('trainer', 'admin')) DEFAULT 'trainer'
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        method TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
};
initDB();

// Middleware to authenticate admin users
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized - No Token Provided" });

    jwt.verify(token, "secret", (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid Token" });
        if (decoded.role !== "admin") return res.status(403).json({ error: "Access Denied - Admins Only" });

        req.user = decoded;
        next();
    });
};

// Register User
app.post("/register", async (req, res) => {
    const { username, password, role } = req.body;
    if (!["trainer", "admin"].includes(role)) return res.status(400).json({ error: "Invalid role" });

    const hashedPassword = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", 
        [username, hashedPassword, role], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, username, role });
    });
});

// Login User
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: "User not found" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, role: user.role }, "secret", { expiresIn: "1h" });
        res.json({ token, role: user.role });
    });
});

// Mark Attendance
app.post("/attendance", (req, res) => {
    const { user_id } = req.body;
    db.run("INSERT INTO attendance (user_id) VALUES (?)", [user_id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, user_id });
    });
});

// Get Attendance Records (For Admin Only)
app.get("/admin/attendance", authenticateAdmin, (req, res) => {
    db.all("SELECT * FROM attendance", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

// Check-In Route
app.post("/check-in", (req, res) => {
    const { student_id, method } = req.body;
    if (!student_id || !method) {
        return res.status(400).json({ error: "Missing student ID or method" });
    }
    db.run("INSERT INTO attendance (user_id, method) VALUES (?, ?)", [student_id, method], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, student_id, method });
    });
});

// Test API
app.get("/", (req, res) => {
    res.send("API is running...");
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
