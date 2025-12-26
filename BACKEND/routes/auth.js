const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        // Check if user already exists
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (existingUser) {
                return res.status(400).json({ error: 'User with this email already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            db.run(
                'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
                [email, hashedPassword, name],
                function (err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to create user' });
                    }

                    const token = jwt.sign(
                        { id: this.lastID, email, name },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    );

                    res.status(201).json({
                        message: 'User registered successfully',
                        token,
                        user: { id: this.lastID, email, name }
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login user
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, name: user.name },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: { id: user.id, email: user.email, name: user.name }
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
    db.get(
        'SELECT id, email, name, created_at FROM users WHERE id = ?',
        [req.user.id],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        }
    );
});

// Search users by email (for sharing)
router.get('/search', authenticateToken, (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email query is required' });
    }

    db.all(
        'SELECT id, email, name FROM users WHERE email LIKE ? AND id != ? LIMIT 10',
        [`%${email}%`, req.user.id],
        (err, users) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(users);
        }
    );
});

module.exports = router;
