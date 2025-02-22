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

// Create users table
const initDB = () => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
};
initDB();

// Register User
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, username });
    });
});

// Login User
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: "User not found" });
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });
        const token = jwt.sign({ id: user.id }, "secret", { expiresIn: "1h" });
        res.json({ token });
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

// Get Attendance Records
app.get("/attendance", (req, res) => {
    db.all("SELECT * FROM attendance", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

// Test API
app.get("/", (req, res) => {
    res.send("API is running...");
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
