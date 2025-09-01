import express from 'express';
import { all, get, run } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

function dateToDayOfWeek(dateStr) {
	// dateStr YYYY-MM-DD
	const [y, m, d] = dateStr.split('-').map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d));
	return dt.getUTCDay(); // 0..6
}

router.get('/daily', async (req, res) => {
	const date = (req.query.date || new Date().toISOString().slice(0, 10));
	const day = dateToDayOfWeek(date);
	const classes = await all(
		`SELECT * FROM classes WHERE user_id = ? AND day_of_week = ? ORDER BY start_time`,
		[req.user.id, day]
	);
	// mark attendance status if exists
	const result = [];
	for (const c of classes) {
		const a = await get('SELECT * FROM attendance WHERE user_id = ? AND class_id = ? AND date = ?', [req.user.id, c.id, date]);
		result.push({ ...c, attendance: a || null });
	}
	return res.json({ date, classes: result });
});

router.post('/', async (req, res) => {
	const { date, classId, attended, reasonCategory, reasonText } = req.body;
	if (!date || !classId || attended == null) return res.status(400).json({ error: 'Missing fields' });
	const found = await get('SELECT * FROM classes WHERE id = ? AND user_id = ?', [classId, req.user.id]);
	if (!found) return res.status(404).json({ error: 'Class not found' });
	try {
		await run(
			`INSERT INTO attendance (user_id, class_id, date, attended, reason_category, reason_text)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			[req.user.id, classId, date, attended ? 1 : 0, attended ? null : (reasonCategory || null), attended ? null : (reasonText || null)]
		);
	} catch (e) {
		// If duplicate, update
		await run(
			`UPDATE attendance SET attended = ?, reason_category = ?, reason_text = ? WHERE user_id = ? AND class_id = ? AND date = ?`,
			[attended ? 1 : 0, attended ? null : (reasonCategory || null), attended ? null : (reasonText || null), req.user.id, classId, date]
		);
	}
	const saved = await get('SELECT * FROM attendance WHERE user_id = ? AND class_id = ? AND date = ?', [req.user.id, classId, date]);
	return res.status(201).json({ attendance: saved });
});

router.get('/', async (req, res) => {
	const { from, to } = req.query;
	const records = await all(
		`SELECT a.*, c.subject, c.teacher, c.day_of_week, c.start_time, c.end_time
		 FROM attendance a JOIN classes c ON c.id = a.class_id
		 WHERE a.user_id = ? AND (? IS NULL OR a.date >= ?) AND (? IS NULL OR a.date <= ?)
		 ORDER BY a.date DESC, c.start_time`,
		[req.user.id, from || null, from || null, to || null, to || null]
	);
	return res.json({ attendance: records });
});

router.get('/stats', async (req, res) => {
	const totals = await all(
		`SELECT c.id as class_id, c.subject, COUNT(a.id) as total, SUM(CASE WHEN a.attended = 1 THEN 1 ELSE 0 END) as present
		 FROM classes c LEFT JOIN attendance a ON a.class_id = c.id AND a.user_id = ?
		 WHERE c.user_id = ?
		 GROUP BY c.id, c.subject
		 ORDER BY c.subject`,
		[req.user.id, req.user.id]
	);
	return res.json({ stats: totals.map(t => ({ ...t, attendanceRate: t.total ? t.present / t.total : null })) });
});

export default router; 