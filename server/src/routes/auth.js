import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { get, run } from '../lib/db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();
const f = (v) => (v != null && String(v).trim() !== '' ? String(v).trim() : '');

async function generateUniqueUserId(prefix, columnName) {
	while (true) {
		const candidate = `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
		const existing = columnName === 'student_id'
			? await get(
				`SELECT 1 as exists_flag
				 FROM students s
				 LEFT JOIN teachers t ON UPPER(t.teacher_id) = UPPER(s.student_id)
				 WHERE UPPER(s.student_id) = UPPER(?) OR UPPER(t.teacher_id) = UPPER(?)
				 LIMIT 1`,
				[candidate, candidate]
			)
			: await get(
				`SELECT 1 as exists_flag
				 FROM teachers t
				 LEFT JOIN students s ON UPPER(s.student_id) = UPPER(t.teacher_id)
				 WHERE UPPER(t.teacher_id) = UPPER(?) OR UPPER(s.student_id) = UPPER(?)
				 LIMIT 1`,
				[candidate, candidate]
			);
		if (!existing) return candidate;
	}
}

function normalizeId(v) {
	return f(v).toUpperCase();
}

function getMailer() {
	if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
	return nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.GMAIL_USER,
			pass: process.env.GMAIL_APP_PASSWORD,
		},
	});
}

router.post('/register', async (req, res) => {
	try {
		const { role = 'student', fullname, department, semester, batch, rollNumber, studentId: requestedStudentId, teacherId: requestedTeacherId, email, password } = req.body;
		const isTeacher = role === 'teacher';

		const fn = f(fullname);
		const em = f(email);
		const pw = f(password);

		if (!fn) return res.status(400).json({ error: 'Full name is required' });
		if (!em) return res.status(400).json({ error: 'Email is required' });
		if (!pw) return res.status(400).json({ error: 'Password is required' });

		if (!isTeacher) {
			if (!f(department) || !f(semester) || !f(batch) || !f(rollNumber)) return res.status(400).json({ error: 'Department, semester, batch and roll number are required for students' });
		}

		const existing = await get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [em.toLowerCase()]);
		if (existing) return res.status(409).json({ error: 'Invalid ID/Email' });

		const passwordHash = await bcrypt.hash(pw, 10);
		let studentId = null;
		if (!isTeacher) {
			const provided = normalizeId(requestedStudentId);
			if (provided) {
				const existingStudentId = await get(
					`SELECT 1 as exists_flag
					 FROM students
					 WHERE UPPER(student_id) = UPPER(?)
					 UNION
					 SELECT 1 as exists_flag
					 FROM teachers
					 WHERE UPPER(teacher_id) = UPPER(?)
					 LIMIT 1`,
					[provided, provided]
				);
				if (existingStudentId) return res.status(409).json({ error: 'Invalid ID/Email' });
				studentId = provided;
			} else {
				studentId = await generateUniqueUserId('STD', 'student_id');
			}
		}
		let teacherId = null;
		if (isTeacher) {
			const providedTeacherId = normalizeId(requestedTeacherId);
			if (providedTeacherId) {
				const existingTeacherId = await get(
					`SELECT 1 as exists_flag
					 FROM teachers
					 WHERE UPPER(teacher_id) = UPPER(?)
					 UNION
					 SELECT 1 as exists_flag
					 FROM students
					 WHERE UPPER(student_id) = UPPER(?)
					 LIMIT 1`,
					[providedTeacherId, providedTeacherId]
				);
				if (existingTeacherId) return res.status(409).json({ error: 'Invalid ID/Email' });
				teacherId = providedTeacherId;
			} else {
				teacherId = await generateUniqueUserId('TCH', 'teacher_id');
			}
		}

		await run('BEGIN TRANSACTION');
		let result;
		try {
			result = await run(
				`INSERT INTO users (fullname, department, semester, batch, roll_number, email, password_hash, role, student_id, teacher_id)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					fn,
					isTeacher ? '' : f(department),
					isTeacher ? '' : f(semester),
					isTeacher ? '' : f(batch),
					isTeacher ? '' : f(rollNumber),
					em.toLowerCase(),
					passwordHash,
					isTeacher ? 'teacher' : 'student',
					isTeacher ? null : studentId,
					isTeacher ? teacherId : null
				]
			);
			if (isTeacher) {
				await run(
					`INSERT INTO teachers (user_id, teacher_id, fullname) VALUES (?, ?, ?)`,
					[result.id, teacherId, fn]
				);
			} else {
				await run(
					`INSERT INTO students (user_id, student_id, fullname, department, semester, batch, roll_number)
					 VALUES (?, ?, ?, ?, ?, ?, ?)`,
					[result.id, studentId, fn, f(department), f(semester), f(batch), f(rollNumber)]
				);
			}
			await run('COMMIT');
		} catch (txErr) {
			await run('ROLLBACK').catch(() => {});
			throw txErr;
		}
		const token = signToken({ id: result.id, role: isTeacher ? 'teacher' : 'student' });
		return res.status(201).json({
			token,
			userId: isTeacher ? teacherId : studentId,
			role: isTeacher ? 'teacher' : 'student',
		});
	} catch (err) {
		console.error('Registration error:', err);
		return res.status(500).json({ error: 'Server error' });
	}
});

router.post('/login', async (req, res) => {
	try {
		const { password, role = 'student', userId } = req.body;
		if (!f(userId) || !f(password)) return res.status(400).json({ error: 'ID and password are required' });

		const isTeacher = role === 'teacher';
		const normalizedId = normalizeId(userId);
		let user = null;
		if (isTeacher) {
			user = await get(
				`SELECT u.* FROM teachers t
				 JOIN users u ON u.id = t.user_id
				 WHERE UPPER(t.teacher_id) = UPPER(?)
				   AND u.role = 'teacher'
				   AND NOT EXISTS (SELECT 1 FROM students s2 WHERE s2.user_id = u.id)`,
				[normalizedId]
			);
		} else {
			user = await get(
				`SELECT u.* FROM students s
				 JOIN users u ON u.id = s.user_id
				 WHERE UPPER(s.student_id) = UPPER(?)
				   AND u.role = 'student'
				   AND NOT EXISTS (SELECT 1 FROM teachers t2 WHERE t2.user_id = u.id)`,
				[normalizedId]
			);
		}
		if (!user) return res.status(401).json({ error: 'Invalid credentials' });

		const ok = await bcrypt.compare(password, user.password_hash);
		if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

		const token = signToken({ id: user.id, role: user.role });
		return res.json({ token });
	} catch (err) {
		console.error('Login error:', err);
		return res.status(500).json({ error: 'Server error' });
	}
});

router.post('/forgot-password', async (req, res) => {
	try {
		const email = f(req.body?.email).toLowerCase();
		if (!email) {
			return res.status(400).json({ error: 'Email is required' });
		}

		const user = await get('SELECT id, fullname, email FROM users WHERE email = ?', [email]);
		// Return generic message to avoid account enumeration.
		const generic = { message: 'If an account exists for this email, a reset link has been sent.' };
		if (!user) return res.json(generic);

		const rawToken = crypto.randomBytes(32).toString('hex');
		const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString(); // 30 mins
		await run(
			`INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
			[user.id, rawToken, expiresAt]
		);

		const mailer = getMailer();
		if (!mailer) return res.json(generic);

		const resetBase = process.env.RESET_PASSWORD_URL || 'http://localhost:5173/reset-password';
		const resetUrl = `${resetBase}?token=${encodeURIComponent(rawToken)}`;
		await mailer.sendMail({
			from: process.env.GMAIL_USER,
			to: user.email,
			subject: 'Attendance Tracker - Password Reset',
			text: `Hi ${user.fullname},\n\nUse this link to reset your password:\n${resetUrl}\n\nThis link expires in 30 minutes.\n`,
		});

		return res.json(generic);
	} catch (err) {
		console.error('Forgot password error:', err);
		return res.status(500).json({ error: 'Server error' });
	}
});

router.post('/reset-password', async (req, res) => {
	try {
		const token = f(req.body?.token);
		const newPassword = f(req.body?.newPassword);
		if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
		if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

		const row = await get(
			`SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token = ?`,
			[token]
		);
		if (!row) return res.status(400).json({ error: 'Invalid or expired token' });
		if (row.used_at) return res.status(400).json({ error: 'Reset token already used' });
		if (new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'Invalid or expired token' });

		const hash = await bcrypt.hash(newPassword, 10);
		await run(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, row.user_id]);
		await run(`UPDATE password_reset_tokens SET used_at = datetime('now') WHERE id = ?`, [row.id]);

		return res.json({ message: 'Password reset successful' });
	} catch (err) {
		console.error('Reset password error:', err);
		return res.status(500).json({ error: 'Server error' });
	}
});

router.get('/me', requireAuth, async (req, res) => {
	return res.json({ user: req.user });
});

router.put('/profile', requireAuth, async (req, res) => {
	try {
		const { fullname, department, semester, batch, rollNumber, email, studentId, teacherId } = req.body;
		const normalizedStudentId = studentId != null ? normalizeId(studentId) : undefined;
		const normalizedTeacherId = teacherId != null ? normalizeId(teacherId) : undefined;

		if (email && email.toLowerCase() !== req.user.email?.toLowerCase()) {
			const existing = await get('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?', [email, req.user.id]);
			if (existing) return res.status(409).json({ error: 'Invalid ID/Email' });
		}
		if (normalizedStudentId) {
			const existingStudentId = await get(
				`SELECT user_id as id FROM students WHERE user_id != ? AND UPPER(student_id) = UPPER(?)
				 UNION
				 SELECT user_id as id FROM teachers WHERE user_id != ? AND UPPER(teacher_id) = UPPER(?)
				 LIMIT 1`,
				[req.user.id, normalizedStudentId, req.user.id, normalizedStudentId]
			);
			if (existingStudentId) return res.status(409).json({ error: 'Invalid ID/Email' });
		}
		if (normalizedTeacherId) {
			const existingTeacherId = await get(
				`SELECT user_id as id FROM teachers WHERE user_id != ? AND UPPER(teacher_id) = UPPER(?)
				 UNION
				 SELECT user_id as id FROM students WHERE user_id != ? AND UPPER(student_id) = UPPER(?)
				 LIMIT 1`,
				[req.user.id, normalizedTeacherId, req.user.id, normalizedTeacherId]
			);
			if (existingTeacherId) return res.status(409).json({ error: 'Invalid ID/Email' });
		}

		const nextFullname = fullname ?? req.user.fullname;
		await run(
			`UPDATE users SET fullname = COALESCE(?, fullname), email = COALESCE(?, email) WHERE id = ?`,
			[nextFullname, email?.toLowerCase(), req.user.id]
		);

		if (req.user.role === 'teacher') {
			await run(
				`UPDATE teachers SET fullname = COALESCE(?, fullname), teacher_id = COALESCE(?, teacher_id) WHERE user_id = ?`,
				[nextFullname, normalizedTeacherId ?? req.user.teacher_id, req.user.id]
			);
		} else {
			await run(
				`UPDATE students
				 SET fullname = COALESCE(?, fullname),
					 department = COALESCE(?, department),
					 semester = COALESCE(?, semester),
					 batch = COALESCE(?, batch),
					 roll_number = COALESCE(?, roll_number),
					 student_id = COALESCE(?, student_id)
				 WHERE user_id = ?`,
				[
					nextFullname,
					department,
					semester,
					batch,
					rollNumber,
					normalizedStudentId ?? req.user.student_id,
					req.user.id
				]
			);
		}

		const updatedUser = req.user.role === 'teacher'
			? await get(
				`SELECT u.id, t.fullname, '' AS department, '' AS semester, '' AS batch, '' AS roll_number, u.email, u.role, NULL AS student_id, t.teacher_id
				 FROM users u JOIN teachers t ON t.user_id = u.id WHERE u.id = ?`,
				[req.user.id]
			)
			: await get(
				`SELECT u.id, s.fullname, s.department, s.semester, s.batch, s.roll_number, u.email, u.role, s.student_id, NULL AS teacher_id
				 FROM users u JOIN students s ON s.user_id = u.id WHERE u.id = ?`,
				[req.user.id]
			);
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