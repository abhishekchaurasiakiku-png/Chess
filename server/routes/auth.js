const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_chess_key';

// IN-MEMORY DATABASE
const users = [];

// Register Route
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Simple validation
        if (!username || !password) return res.status(400).json({ message: 'Missing fields' });

        const existingUser = users.find(u => u.username === username);
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists. Try another.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            _id: Date.now().toString(),
            username,
            password: hashedPassword,
            rating: 1200
        };
        users.push(newUser);

        const token = jwt.sign({ userId: newUser._id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { username: newUser.username, rating: newUser.rating } });
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = users.find(u => u.username === username);
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { username: user.username, rating: user.rating } });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;
