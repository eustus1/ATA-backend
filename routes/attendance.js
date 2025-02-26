const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();

// Initialize database
const db = new sqlite3.Database("attendance.db", (err) => {
    if (err) console.error(err.message);
});

// Mark Attendance
router.post("/", (req, res) => {
    const { user_id } = req.body;
    db.run("INSERT INTO attendance (user_id) VALUES (?)", [user_id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, user_id });
    });
});

// Get Attendance Records
router.get("/", (req, res) => {
    db.all("SELECT * FROM attendance", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
