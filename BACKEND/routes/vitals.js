const express = require('express');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Add a new vital reading
router.post('/', authenticateToken, (req, res) => {
    try {
        const { vital_type, value, unit, recorded_at, notes, report_id } = req.body;

        if (!vital_type || value === undefined || !unit || !recorded_at) {
            return res.status(400).json({
                error: 'Vital type, value, unit, and recorded date are required'
            });
        }

        db.run(
            `INSERT INTO vitals (user_id, vital_type, value, unit, recorded_at, notes, report_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, vital_type, value, unit, recorded_at, notes || null, report_id || null],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to save vital' });
                }
                res.status(201).json({
                    message: 'Vital recorded successfully',
                    vital: {
                        id: this.lastID,
                        vital_type,
                        value,
                        unit,
                        recorded_at,
                        notes
                    }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all vitals for current user with filters
router.get('/', authenticateToken, (req, res) => {
    const { vital_type, start_date, end_date } = req.query;

    let query = `SELECT * FROM vitals WHERE user_id = ?`;
    let params = [req.user.id];

    if (vital_type) {
        query += ` AND vital_type = ?`;
        params.push(vital_type);
    }

    if (start_date) {
        query += ` AND recorded_at >= ?`;
        params.push(start_date);
    }

    if (end_date) {
        query += ` AND recorded_at <= ?`;
        params.push(end_date);
    }

    query += ` ORDER BY recorded_at DESC`;

    db.all(query, params, (err, vitals) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(vitals);
    });
});

// Get vitals trends (grouped by type for charting)
router.get('/trends', authenticateToken, (req, res) => {
    const { start_date, end_date } = req.query;

    let query = `SELECT vital_type, value, unit, recorded_at 
                 FROM vitals WHERE user_id = ?`;
    let params = [req.user.id];

    if (start_date) {
        query += ` AND recorded_at >= ?`;
        params.push(start_date);
    }

    if (end_date) {
        query += ` AND recorded_at <= ?`;
        params.push(end_date);
    }

    query += ` ORDER BY vital_type, recorded_at ASC`;

    db.all(query, params, (err, vitals) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        // Group vitals by type
        const trends = vitals.reduce((acc, vital) => {
            if (!acc[vital.vital_type]) {
                acc[vital.vital_type] = {
                    type: vital.vital_type,
                    unit: vital.unit,
                    data: []
                };
            }
            acc[vital.vital_type].data.push({
                value: vital.value,
                date: vital.recorded_at
            });
            return acc;
        }, {});

        res.json(Object.values(trends));
    });
});

// Get latest vital reading for each type
router.get('/latest', authenticateToken, (req, res) => {
    db.all(
        `SELECT v1.* FROM vitals v1
         INNER JOIN (
             SELECT vital_type, MAX(recorded_at) as max_date
             FROM vitals WHERE user_id = ?
             GROUP BY vital_type
         ) v2 ON v1.vital_type = v2.vital_type AND v1.recorded_at = v2.max_date
         WHERE v1.user_id = ?`,
        [req.user.id, req.user.id],
        (err, vitals) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(vitals);
        }
    );
});

// Delete a vital
router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM vitals WHERE id = ? AND user_id = ?', [id, req.user.id], (err, vital) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!vital) {
            return res.status(404).json({ error: 'Vital not found' });
        }

        db.run('DELETE FROM vitals WHERE id = ?', [id], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete vital' });
            }
            res.json({ message: 'Vital deleted successfully' });
        });
    });
});

module.exports = router;
