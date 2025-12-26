const express = require('express');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Share a report with another user
router.post('/', authenticateToken, (req, res) => {
    try {
        const { report_id, shared_with_email, access_type = 'read' } = req.body;

        if (!report_id || !shared_with_email) {
            return res.status(400).json({ error: 'Report ID and email are required' });
        }

        // Verify the user owns the report
        db.get(
            'SELECT * FROM reports WHERE id = ? AND user_id = ?',
            [report_id, req.user.id],
            (err, report) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                if (!report) {
                    return res.status(404).json({ error: 'Report not found or you do not own it' });
                }

                // Find the user to share with
                db.get(
                    'SELECT id, email, name FROM users WHERE email = ?',
                    [shared_with_email],
                    (err, sharedWithUser) => {
                        if (err) {
                            return res.status(500).json({ error: 'Database error' });
                        }
                        if (!sharedWithUser) {
                            return res.status(404).json({ error: 'User not found with that email' });
                        }
                        if (sharedWithUser.id === req.user.id) {
                            return res.status(400).json({ error: 'Cannot share with yourself' });
                        }

                        // Check if already shared
                        db.get(
                            'SELECT * FROM shared_access WHERE report_id = ? AND shared_with_id = ?',
                            [report_id, sharedWithUser.id],
                            (err, existingShare) => {
                                if (err) {
                                    return res.status(500).json({ error: 'Database error' });
                                }
                                if (existingShare) {
                                    return res.status(400).json({ error: 'Report already shared with this user' });
                                }

                                // Create the share
                                db.run(
                                    `INSERT INTO shared_access (report_id, owner_id, shared_with_id, access_type)
                                     VALUES (?, ?, ?, ?)`,
                                    [report_id, req.user.id, sharedWithUser.id, access_type],
                                    function (err) {
                                        if (err) {
                                            return res.status(500).json({ error: 'Failed to share report' });
                                        }
                                        res.status(201).json({
                                            message: 'Report shared successfully',
                                            share: {
                                                id: this.lastID,
                                                report_id,
                                                shared_with: {
                                                    id: sharedWithUser.id,
                                                    email: sharedWithUser.email,
                                                    name: sharedWithUser.name
                                                },
                                                access_type
                                            }
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get reports shared with the current user
router.get('/shared-with-me', authenticateToken, (req, res) => {
    db.all(
        `SELECT r.*, sa.access_type, sa.created_at as shared_at,
                u.name as owner_name, u.email as owner_email
         FROM reports r
         INNER JOIN shared_access sa ON r.id = sa.report_id
         INNER JOIN users u ON r.user_id = u.id
         WHERE sa.shared_with_id = ?
         ORDER BY sa.created_at DESC`,
        [req.user.id],
        (err, reports) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(reports);
        }
    );
});

// Get all shares for reports owned by the current user
router.get('/my-shares', authenticateToken, (req, res) => {
    db.all(
        `SELECT sa.*, r.title as report_title, r.report_type,
                u.name as shared_with_name, u.email as shared_with_email
         FROM shared_access sa
         INNER JOIN reports r ON sa.report_id = r.id
         INNER JOIN users u ON sa.shared_with_id = u.id
         WHERE sa.owner_id = ?
         ORDER BY sa.created_at DESC`,
        [req.user.id],
        (err, shares) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(shares);
        }
    );
});

// Revoke access (delete a share)
router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.get(
        'SELECT * FROM shared_access WHERE id = ? AND owner_id = ?',
        [id, req.user.id],
        (err, share) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!share) {
                return res.status(404).json({ error: 'Share not found or you are not the owner' });
            }

            db.run('DELETE FROM shared_access WHERE id = ?', [id], function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to revoke access' });
                }
                res.json({ message: 'Access revoked successfully' });
            });
        }
    );
});

module.exports = router;
