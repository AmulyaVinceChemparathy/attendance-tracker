import jwt from 'jsonwebtoken';
import { get } from '../lib/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export function signToken(payload) {
	console.log('Signing token with payload:', payload);
	console.log('Using JWT_SECRET:', JWT_SECRET);
	const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
	console.log('Generated token:', token);
	return token;
}

export async function requireAuth(req, res, next) {
	const header = req.headers.authorization || '';
	console.log('Auth header:', header);
	const token = header.startsWith('Bearer ') ? header.slice(7) : null;
	console.log('Extracted token:', token ? 'Present' : 'Missing');
	if (!token) return res.status(401).json({ error: 'Missing token' });
	try {
		console.log('Verifying token with secret:', JWT_SECRET);
		const decoded = jwt.verify(token, JWT_SECRET);
		console.log('Decoded token:', decoded);
		const user = await get('SELECT id, fullname, department, semester, batch, roll_number, email FROM users WHERE id = ?', [decoded.id]);
		console.log('User found:', user ? 'Yes' : 'No');
		if (!user) return res.status(401).json({ error: 'Invalid token' });
		req.user = user;
		next();
	} catch (err) {
		console.error('Token verification error:', err.message);
		return res.status(401).json({ error: 'Invalid token' });
	}
} 