const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'health_wallet.db');
const db = new sqlite3.Database(dbPath);

const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Users table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    name TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Reports table
            db.run(`
                CREATE TABLE IF NOT EXISTS reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    report_type TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    file_name TEXT NOT NULL,
                    report_date DATE NOT NULL,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `);

            // Vitals table
            db.run(`
                CREATE TABLE IF NOT EXISTS vitals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    vital_type TEXT NOT NULL,
                    value REAL NOT NULL,
                    unit TEXT NOT NULL,
                    recorded_at DATETIME NOT NULL,
                    notes TEXT,
                    report_id INTEGER,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (report_id) REFERENCES reports(id)
                )
            `);

            // Shared access table
            db.run(`
                CREATE TABLE IF NOT EXISTS shared_access (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    report_id INTEGER NOT NULL,
                    owner_id INTEGER NOT NULL,
                    shared_with_id INTEGER NOT NULL,
                    access_type TEXT DEFAULT 'read',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (report_id) REFERENCES reports(id),
                    FOREIGN KEY (owner_id) REFERENCES users(id),
                    FOREIGN KEY (shared_with_id) REFERENCES users(id)
                )
            `, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Database initialized successfully');
                    resolve();
                }
            });
        });
    });
};

module.exports = { db, initializeDatabase };
