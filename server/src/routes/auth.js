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

router.put('/profile', requireAuth, async (req, res) => {
	try {
		const { fullname, department, semester, batch, rollNumber, email } = req.body;
		
		// Check if email is being changed and if it's already taken
		if (email && email !== req.user.email) {
			const existing = await get('SELECT id FROM users WHERE email = ? AND id != ?', [email.toLowerCase(), req.user.id]);
			if (existing) return res.status(409).json({ error: 'Email already registered' });
		}
		
		// Update user profile
		await run(
			`UPDATE users SET 
				fullname = COALESCE(?, fullname),
				department = COALESCE(?, department),
				semester = COALESCE(?, semester),
				batch = COALESCE(?, batch),
				roll_number = COALESCE(?, roll_number),
				email = COALESCE(?, email)
			 WHERE id = ?`,
			[fullname, department, semester, batch, rollNumber, email?.toLowerCase(), req.user.id]
		);
		
		// Get updated user data
		const updatedUser = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
		return res.json({ user: updatedUser });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Server error' });
	}
});

router.put('/password', requireAuth, async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;
		
		if (!currentPassword || !newPassword) {
			return res.status(400).json({ error: 'Current password and new password are required' });
		}
		
		// Verify current password
		const user = await get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
		const isValid = await bcrypt.compare(currentPassword, user.password_hash);
		
		if (!isValid) {
			return res.status(401).json({ error: 'Current password is incorrect' });
		}
		
		// Update password
		const newPasswordHash = await bcrypt.hash(newPassword, 10);
		await run('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, req.user.id]);
		
		return res.json({ message: 'Password updated successfully' });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Server error' });
	}
});

export default router; 