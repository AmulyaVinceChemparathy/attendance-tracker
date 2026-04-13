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
		const role = decoded.role;
		let user = null;
		if (role === 'teacher') {
			user = await get(
				`SELECT u.id, t.fullname, '' AS department, '' AS semester, '' AS batch, '' AS roll_number, u.email, u.role, NULL AS student_id, t.teacher_id
				 FROM users u JOIN teachers t ON t.user_id = u.id
				 WHERE u.id = ? AND u.role = 'teacher'`,
				[decoded.id]
			);
		} else {
			user = await get(
				`SELECT u.id, s.fullname, s.department, s.semester, s.batch, s.roll_number, u.email, u.role, s.student_id, NULL AS teacher_id
				 FROM users u JOIN students s ON s.user_id = u.id
				 WHERE u.id = ? AND u.role = 'student'`,
				[decoded.id]
			);
		}
		if (!user) return res.status(401).json({ error: 'Invalid token' });
		req.user = user;
		next();
	} catch (err) {
		console.error('Token verification error');
		return res.status(401).json({ error: 'Invalid token' });
	}
} 