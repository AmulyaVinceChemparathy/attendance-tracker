import express from 'express';
import { all, get, run } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
	const classes = await all('SELECT * FROM classes WHERE user_id = ? ORDER BY day_of_week, start_time', [req.user.id]);
	console.log('All classes for user:', classes.map(c => ({ id: c.id, subject: c.subject, teacher: c.teacher })));
	return res.json({ classes });
});


router.post('/', async (req, res) => {
	const { dayOfWeek, startTime, endTime, subject, teacher, location } = req.body;
	if (dayOfWeek == null || !startTime || !endTime || !subject || !teacher) {
		return res.status(400).json({ error: 'Missing required fields' });
	}
	const result = await run(
		`INSERT INTO classes (user_id, day_of_week, start_time, end_time, subject, teacher, location)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[req.user.id, dayOfWeek, startTime, endTime, subject, teacher, location || null]
	);
	const created = await get('SELECT * FROM classes WHERE id = ?', [result.id]);
	return res.status(201).json({ class: created });
});

router.put('/:id', async (req, res) => {
	const id = Number(req.params.id);
	const existing = await get('SELECT * FROM classes WHERE id = ? AND user_id = ?', [id, req.user.id]);
	if (!existing) return res.status(404).json({ error: 'Not found' });
	const { dayOfWeek, startTime, endTime, subject, teacher, location } = req.body;
	await run(
		`UPDATE classes SET day_of_week = ?, start_time = ?, end_time = ?, subject = ?, teacher = ?, location = ? WHERE id = ?`,
		[
			dayOfWeek ?? existing.day_of_week,
			startTime ?? existing.start_time,
			endTime ?? existing.end_time,
			subject ?? existing.subject,
			teacher ?? existing.teacher,
			location ?? existing.location,
			id,
		]
	);
	const updated = await get('SELECT * FROM classes WHERE id = ?', [id]);
	return res.json({ class: updated });
});

router.delete('/:id', async (req, res) => {
	const id = Number(req.params.id);
	const existing = await get('SELECT * FROM classes WHERE id = ? AND user_id = ?', [id, req.user.id]);
	if (!existing) return res.status(404).json({ error: 'Not found' });
	await run('DELETE FROM classes WHERE id = ?', [id]);
	return res.json({ ok: true });
});


export default router; 