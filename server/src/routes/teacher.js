import express from 'express';
import { all, get, run } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

function isTeacher(req) {
	return req.user?.role === 'teacher';
}

async function ensureTeacherClassOwner(teacherUserId, classId) {
	return get(
		`SELECT c.id
		 FROM teacher_classes c
		 JOIN teacher_subjects s ON s.id = c.subject_id
		 WHERE c.id = ? AND s.teacher_user_id = ?`,
		[classId, teacherUserId]
	);
}

router.get('/daily-status', async (req, res) => {
	if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher only' });
	const date = req.query.date || new Date().toISOString().slice(0, 10);
	const row = await get(
		`SELECT date, status, note FROM teacher_daily_status WHERE teacher_user_id = ? AND date = ?`,
		[req.user.id, date]
	);
	return res.json({ dailyStatus: row || { date, status: 'present', note: '' } });
});

router.post('/daily-status', async (req, res) => {
	if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher only' });
	const date = req.body?.date || new Date().toISOString().slice(0, 10);
	const status = req.body?.status === 'absent' ? 'absent' : 'present';
	const note = req.body?.note || null;
	await run(
		`INSERT INTO teacher_daily_status (teacher_user_id, date, status, note)
		 VALUES (?, ?, ?, ?)
		 ON CONFLICT(teacher_user_id, date)
		 DO UPDATE SET status = excluded.status, note = excluded.note`,
		[req.user.id, date, status, note]
	);
	return res.json({ ok: true });
});

router.get('/subjects', async (req, res) => {
	if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher only' });
	const rows = await all(
		`SELECT s.*,
		        (SELECT COUNT(*) FROM teacher_classes c WHERE c.subject_id = s.id) as class_count
		 FROM teacher_subjects s
		 WHERE s.teacher_user_id = ?
		 ORDER BY s.created_at DESC`,
		[req.user.id]
	);
	return res.json({ subjects: rows });
});

router.post('/subjects', async (req, res) => {
	if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher only' });
	const subjectCode = String(req.body?.subjectId || '').trim().toUpperCase();
	const subjectName = String(req.body?.subjectName || '').trim();
	if (!subjectCode || !subjectName) return res.status(400).json({ error: 'Subject ID and name are required' });
	const exists = await get(
		`SELECT id FROM teacher_subjects WHERE teacher_user_id = ? AND UPPER(subject_code) = UPPER(?)`,
		[req.user.id, subjectCode]
	);
	if (exists) return res.status(409).json({ error: 'Invalid ID/Email' });
	const result = await run(
		`INSERT INTO teacher_subjects (teacher_user_id, subject_code, subject_name) VALUES (?, ?, ?)`,
		[req.user.id, subjectCode, subjectName]
	);
	return res.status(201).json({ subject: { id: result.id, subject_code: subjectCode, subject_name: subjectName } });
});

router.get('/subjects/:subjectId/classes', async (req, res) => {
	if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher only' });
	const subject = await get(`SELECT id FROM teacher_subjects WHERE id = ? AND teacher_user_id = ?`, [req.params.subjectId, req.user.id]);
	if (!subject) return res.status(404).json({ error: 'Subject not found' });
	const classes = await all(
		`SELECT c.*, (SELECT COUNT(*) FROM teacher_class_students cs WHERE cs.class_id = c.id) as student_count
		 FROM teacher_classes c WHERE c.subject_id = ? ORDER BY c.created_at DESC`,
		[subject.id]
	);
	return res.json({ classes });
});

router.post('/subjects/:subjectId/classes', async (req, res) => {
	if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher only' });
	const subject = await get(`SELECT id FROM teacher_subjects WHERE id = ? AND teacher_user_id = ?`, [req.params.subjectId, req.user.id]);
	if (!subject) return res.status(404).json({ error: 'Subject not found' });
	const classCode = String(req.body?.classId || '').trim().toUpperCase();
	if (!classCode) return res.status(400).json({ error: 'Class ID is required' });
	const exists = await get(`SELECT id FROM teacher_classes WHERE subject_id = ? AND UPPER(class_code) = UPPER(?)`, [subject.id, classCode]);
	if (exists) return res.status(409).json({ error: 'Invalid ID/Email' });
	const result = await run(`INSERT INTO teacher_classes (subject_id, class_code) VALUES (?, ?)`, [subject.id, classCode]);
	return res.status(201).json({ classItem: { id: result.id, class_code: classCode } });
});

/** Match timetable slot subject text to teacher's classes (for attendance from calendar). Must be before /classes/:classId routes. */
router.get('/classes/lookup', async (req, res) => {
	if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher only' });
	const q = String(req.query.subject || '').trim();
	const teacherId = req.user.id;
	const listAllClasses = async () =>
		all(
			`SELECT c.id, c.class_code, ts.subject_code, ts.subject_name, ts.id as subject_id
			 FROM teacher_classes c
			 JOIN teacher_subjects ts ON ts.id = c.subject_id
			 WHERE ts.teacher_user_id = ?
			 ORDER BY ts.subject_code, c.class_code`,
			[teacherId]
		);
	if (!q) {
		const classes = await listAllClasses();
		return res.json({ classes, matched: false });
	}
	const upper = q.toUpperCase();
	let rows = await all(
		`SELECT c.id, c.class_code, ts.subject_code, ts.subject_name, ts.id as subject_id
		 FROM teacher_classes c
		 JOIN teacher_subjects ts ON ts.id = c.subject_id
		 WHERE ts.teacher_user_id = ? AND (
		   UPPER(ts.subject_code) = ? OR UPPER(ts.subject_name) = ?
		   OR INSTR(?, UPPER(ts.subject_code)) > 0
		   OR INSTR(?, UPPER(ts.subject_name)) > 0
		   OR INSTR(UPPER(ts.subject_name), ?) > 0
		   OR INSTR(UPPER(ts.subject_code), ?) > 0
		 )
		 ORDER BY c.class_code`,
		[teacherId, upper, upper, upper, upper, upper, upper]
	);
	const matched = rows.length > 0;
	if (!matched) rows = await listAllClasses();
	return res.json({ classes: rows, matched });
});

router.post('/classes/:classId/students', async (req, res) => {
	if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher only' });
	const owned = await ensureTeacherClassOwner(req.user.id, req.params.classId);
	if (!owned) return res.status(404).json({ error: 'Class not found' });
	const studentId = String(req.body?.studentId || '').trim().toUpperCase();
	if (!studentId) return res.status(400).json({ error: 'Student ID is required' });
	const student = await get(`SELECT user_id FROM students WHERE UPPER(student_id) = UPPER(?)`, [studentId]);
	if (!student) return res.status(404).json({ error: 'Student not found' });
	await run(
		`INSERT OR IGNORE INTO teacher_class_students (class_id, student_user_id) VALUES (?, ?)`,
		[req.params.classId, student.user_id]
	);
	return res.json({ ok: true });
});

router.get('/classes/:classId/students', async (req, res) => {
	if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher only' });
	const owned = await ensureTeacherClassOwner(req.user.id, req.params.classId);
	if (!owned) return res.status(404).json({ error: 'Class not found' });
	const students = await all(
		`SELECT s.user_id, s.student_id, s.fullname
		 FROM teacher_class_students cs
		 JOIN students s ON s.user_id = cs.student_user_id
		 WHERE cs.class_id = ?
		 ORDER BY s.fullname`,
		[req.params.classId]
	);
	const withPct = [];
	for (const s of students) {
		const stat = await get(
			`SELECT COUNT(*) as total, SUM(CASE WHEN attended = 1 THEN 1 ELSE 0 END) as present
			 FROM teacher_class_attendance
			 WHERE class_id = ? AND student_user_id = ?`,
			[req.params.classId, s.user_id]
		);
		const pct = stat?.total ? Math.round((100 * (stat.present || 0)) / stat.total) : 0;
		withPct.push({ ...s, attendance_percentage: pct });
	}
	return res.json({ students: withPct });
});

router.get('/classes/:classId/students/:studentUserId/record', async (req, res) => {
	if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher only' });
	const owned = await ensureTeacherClassOwner(req.user.id, req.params.classId);
	if (!owned) return res.status(404).json({ error: 'Class not found' });
	const rec = await get(
		`SELECT * FROM teacher_student_records WHERE class_id = ? AND student_user_id = ?`,
		[req.params.classId, req.params.studentUserId]
	);
	return res.json({ record: rec || { class_id: Number(req.params.classId), student_user_id: Number(req.params.studentUserId), exams_mark_scored: null, assignment_submitted: 0, assignment_mark_given: null, notes: '' } });
});

router.put('/classes/:classId/students/:studentUserId/record', async (req, res) => {
	if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher only' });
	const owned = await ensureTeacherClassOwner(req.user.id, req.params.classId);
	if (!owned) return res.status(404).json({ error: 'Class not found' });
	const exams = req.body?.examsMarkScored ?? null;
	const assignmentSubmitted = req.body?.assignmentSubmitted ? 1 : 0;
	const assignmentMark = req.body?.assignmentMarkGiven ?? null;
	const notes = req.body?.notes ?? null;
	await run(
		`INSERT INTO teacher_student_records (class_id, student_user_id, exams_mark_scored, assignment_submitted, assignment_mark_given, notes)
		 VALUES (?, ?, ?, ?, ?, ?)
		 ON CONFLICT(class_id, student_user_id)
		 DO UPDATE SET
		   exams_mark_scored = excluded.exams_mark_scored,
		   assignment_submitted = excluded.assignment_submitted,
		   assignment_mark_given = excluded.assignment_mark_given,
		   notes = excluded.notes`,
		[req.params.classId, req.params.studentUserId, exams, assignmentSubmitted, assignmentMark, notes]
	);
	return res.json({ ok: true });
});

router.post('/classes/:classId/attendance/daily', async (req, res) => {
	if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher only' });
	const owned = await ensureTeacherClassOwner(req.user.id, req.params.classId);
	if (!owned) return res.status(404).json({ error: 'Class not found' });
	const date = req.body?.date || new Date().toISOString().slice(0, 10);
	const absentSet = new Set((req.body?.absentStudentIds || []).map((x) => Number(x)));
	const students = await all(`SELECT student_user_id FROM teacher_class_students WHERE class_id = ?`, [req.params.classId]);
	for (const s of students) {
		const attended = absentSet.has(Number(s.student_user_id)) ? 0 : 1;
		await run(
			`INSERT INTO teacher_class_attendance (class_id, student_user_id, date, attended)
			 VALUES (?, ?, ?, ?)
			 ON CONFLICT(class_id, student_user_id, date)
			 DO UPDATE SET attended = excluded.attended`,
			[req.params.classId, s.student_user_id, date, attended]
		);
	}
	return res.json({ ok: true });
});

export default router;

