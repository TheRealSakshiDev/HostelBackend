const express = require('express');
const router = express.Router();

const db = require('../config/database');

router.post('/login', (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }

    const sql = `
        SELECT user_id, username, role
        FROM users
        WHERE username = ? AND password = ?
    `;

    db.query(sql, [username, password], (err, results) => {

        if (err) {
            console.error('Database error:', err);

            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const user = results[0];

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                user_id: user.user_id,
                username: user.username,
                role: user.role
            }
        });
    });
});
// Register API
router.post("/register", (req, res) => {

    const { username, password } = req.body;

    // Check input
    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    // Check whether username already exists
    const checkSql = "SELECT * FROM users WHERE username = ?";

    db.query(checkSql, [username], (error, results) => {

        if (error) {
            console.error(error);

            return res.status(500).json({
                message: "Database error"
            });
        }

        // Username already exists
        if (results.length > 0) {
            return res.status(409).json({
                message: "Username already exists"
            });
        }

        // Insert new user
        const insertSql =
            "INSERT INTO users (username, password) VALUES (?, ?)";

        db.query(
            insertSql,
            [username, password],
            (insertError, result) => {

                if (insertError) {
                    console.error(insertError);

                    return res.status(500).json({
                        message: "Registration failed"
                    });
                }

                res.status(201).json({
                    message: "Registration successful",
                    userId: result.insertId
                });
            }
        );
    });
});

module.exports = router;