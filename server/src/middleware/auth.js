import jwt from 'jsonwebtoken';
import { get } from '../lib/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export function signToken(payload) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function requireAuth(req, res, next) {
	const header = req.headers.authorization || '';
	const token = header.startsWith('Bearer ') ? header.slice(7) : null;
	if (!token) return res.status(401).json({ error: 'Missing token' });
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		const user = await get('SELECT id, fullname, department, semester, batch, roll_number, email FROM users WHERE id = ?', [decoded.id]);
		if (!user) return res.status(401).json({ error: 'Invalid token' });
		req.user = user;
		next();
	} catch (err) {
		return res.status(401).json({ error: 'Invalid token' });
	}
} 