const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userDir = path.join(__dirname, '..', 'uploads', req.user.id.toString());
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and images are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload a new report
router.post('/', authenticateToken, upload.single('file'), (req, res) => {
    try {
        const { title, report_type, report_date, notes } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'File is required' });
        }

        if (!title || !report_type || !report_date) {
            return res.status(400).json({ error: 'Title, report type, and date are required' });
        }

        const filePath = path.join(req.user.id.toString(), file.filename);

        db.run(
            `INSERT INTO reports (user_id, title, report_type, file_path, file_name, report_date, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, title, report_type, filePath, file.originalname, report_date, notes || null],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to save report' });
                }
                res.status(201).json({
                    message: 'Report uploaded successfully',
                    report: {
                        id: this.lastID,
                        title,
                        report_type,
                        file_name: file.originalname,
                        report_date,
                        notes
                    }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all reports for current user with filters
router.get('/', authenticateToken, (req, res) => {
    const { report_type, start_date, end_date, search } = req.query;

    let query = `SELECT * FROM reports WHERE user_id = ?`;
    let params = [req.user.id];

    if (report_type) {
        query += ` AND report_type = ?`;
        params.push(report_type);
    }

    if (start_date) {
        query += ` AND report_date >= ?`;
        params.push(start_date);
    }

    if (end_date) {
        query += ` AND report_date <= ?`;
        params.push(end_date);
    }

    if (search) {
        query += ` AND (title LIKE ? OR notes LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY report_date DESC`;

    db.all(query, params, (err, reports) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(reports);
    });
});

// Get a single report
router.get('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    // Check if user owns the report or has shared access
    db.get(
        `SELECT r.* FROM reports r
         LEFT JOIN shared_access sa ON r.id = sa.report_id AND sa.shared_with_id = ?
         WHERE r.id = ? AND (r.user_id = ? OR sa.id IS NOT NULL)`,
        [req.user.id, id, req.user.id],
        (err, report) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!report) {
                return res.status(404).json({ error: 'Report not found or access denied' });
            }
            res.json(report);
        }
    );
});

// Download report file
router.get('/:id/download', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.get(
        `SELECT r.* FROM reports r
         LEFT JOIN shared_access sa ON r.id = sa.report_id AND sa.shared_with_id = ?
         WHERE r.id = ? AND (r.user_id = ? OR sa.id IS NOT NULL)`,
        [req.user.id, id, req.user.id],
        (err, report) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!report) {
                return res.status(404).json({ error: 'Report not found or access denied' });
            }

            const filePath = path.join(__dirname, '..', 'uploads', report.file_path);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'File not found' });
            }

            res.download(filePath, report.file_name);
        }
    );
});

// Delete a report
router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM reports WHERE id = ? AND user_id = ?', [id, req.user.id], (err, report) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Delete the file
        const filePath = path.join(__dirname, '..', 'uploads', report.file_path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete shared access records
        db.run('DELETE FROM shared_access WHERE report_id = ?', [id]);

        // Delete the report record
        db.run('DELETE FROM reports WHERE id = ?', [id], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete report' });
            }
            res.json({ message: 'Report deleted successfully' });
        });
    });
});

module.exports = router;
