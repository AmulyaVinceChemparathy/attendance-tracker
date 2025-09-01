import express from 'express';
import bcrypt from 'bcryptjs';
import { get, run } from '../lib/db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
	try {
		const { fullname, department, semester, batch, rollNumber, email, password } = req.body;
		if (!fullname || !department || !semester || !batch || !rollNumber || !email || !password) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const existing = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
		if (existing) return res.status(409).json({ error: 'Email already registered' });
		const passwordHash = await bcrypt.hash(password, 10);
		const result = await run(
			`INSERT INTO users (fullname, department, semester, batch, roll_number, email, password_hash)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[fullname, department, semester, batch, rollNumber, email.toLowerCase(), passwordHash]
		);
		const token = signToken({ id: result.id });
		return res.status(201).json({ token });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Server error' });
	}
});

router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
		const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
		if (!user) return res.status(401).json({ error: 'Invalid credentials' });
		const ok = await bcrypt.compare(password, user.password_hash);
		if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
		const token = signToken({ id: user.id });
		return res.json({ token });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Server error' });
	}
});

router.get('/me', requireAuth, async (req, res) => {
	return res.json({ user: req.user });
});

export default router; 