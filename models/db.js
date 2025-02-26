const sqlite3 = require("sqlite3").verbose();

// Initialize database connection
const db = new sqlite3.Database("attendance.db", (err) => {
    if (err) console.error("Database connection error:", err.message);
    else console.log("✅ Connected to SQLite database.");
});

// Create tables if they don't exist
db.serialize(() => {
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
});

module.exports = db;
