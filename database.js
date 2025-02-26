const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "attendance.db",
    logging: false // Disable logging for cleaner output
});

sequelize.authenticate()
    .then(() => console.log("✅ Database connected!"))
    .catch(err => console.error("❌ Database connection failed:", err));

module.exports = sequelize;
