import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data.sqlite');

export const db = new sqlite3.Database(DB_PATH);

export function run(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.run(sql, params, function (err) {
			if (err) return reject(err);
			resolve({ id: this.lastID, changes: this.changes });
		});
	});
}

export function all(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.all(sql, params, (err, rows) => {
			if (err) return reject(err);
			resolve(rows);
		});
	});
}

export function get(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.get(sql, params, (err, row) => {
			if (err) return reject(err);
			resolve(row);
		});
	});
}

async function generateUniqueUserId(prefix, columnName) {
	while (true) {
		const candidate = `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
		const existing = await get(`SELECT id FROM users WHERE ${columnName} = ?`, [candidate]);
		if (!existing) return candidate;
	}
}

export async function initDb() {
	await run(`PRAGMA foreign_keys = ON;`);
	await run(`CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		fullname TEXT NOT NULL,
		department TEXT,
		semester TEXT,
		batch TEXT,
		roll_number TEXT,
		email TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		role TEXT NOT NULL DEFAULT 'student',
		student_id TEXT,
		teacher_id TEXT,
		created_at TEXT DEFAULT (datetime('now'))
	);`);

	await run(`CREATE TABLE IF NOT EXISTS students (
		user_id INTEGER PRIMARY KEY,
		student_id TEXT UNIQUE NOT NULL,
		fullname TEXT NOT NULL,
		department TEXT NOT NULL,
		semester TEXT NOT NULL,
		batch TEXT NOT NULL,
		roll_number TEXT NOT NULL,
		created_at TEXT DEFAULT (datetime('now')),
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);`);

	await run(`CREATE TABLE IF NOT EXISTS teachers (
		user_id INTEGER PRIMARY KEY,
		teacher_id TEXT UNIQUE NOT NULL,
		fullname TEXT NOT NULL,
		created_at TEXT DEFAULT (datetime('now')),
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);`);

	// Migrate existing DB: add role, student_id, teacher_id if missing
	const cols = await all(`PRAGMA table_info(users)`);
	const names = (cols || []).map((c) => c.name);
	for (const col of [
		['role', `ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'`],
		['student_id', `ALTER TABLE users ADD COLUMN student_id TEXT`],
		['teacher_id', `ALTER TABLE users ADD COLUMN teacher_id TEXT`]
	]) {
		if (!names.includes(col[0])) await run(col[1]).catch(() => {});
	}

	// Normalize existing user roles and backfill missing IDs.
	await run(`UPDATE users SET role = 'student' WHERE role IS NULL OR TRIM(role) = ''`).catch(() => {});
	const users = await all(`SELECT id, role, student_id, teacher_id FROM users`);
	for (const user of users) {
		if (user.role === 'teacher') {
			if (!user.teacher_id || String(user.teacher_id).trim() === '') {
				const teacherId = await generateUniqueUserId('TCH', 'teacher_id');
				await run(`UPDATE users SET teacher_id = ? WHERE id = ?`, [teacherId, user.id]);
			}
		} else if (!user.student_id || String(user.student_id).trim() === '') {
			const studentId = await generateUniqueUserId('STD', 'student_id');
			await run(`UPDATE users SET student_id = ? WHERE id = ?`, [studentId, user.id]);
		}
	}

	await run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_student_id_unique ON users(student_id) WHERE student_id IS NOT NULL`).catch(() => {});
	await run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_teacher_id_unique ON users(teacher_id) WHERE teacher_id IS NOT NULL`).catch(() => {});
	await run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower_unique ON users(LOWER(email))`).catch(() => {});
	await run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_students_student_id_upper_unique ON students(UPPER(student_id))`).catch(() => {});
	await run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_teacher_id_upper_unique ON teachers(UPPER(teacher_id))`).catch(() => {});

	// Enforce cross-table uniqueness between student_id and teacher_id.
	await run(`CREATE TRIGGER IF NOT EXISTS trg_students_student_id_cross_unique_insert
	BEFORE INSERT ON students
	FOR EACH ROW
	WHEN EXISTS (SELECT 1 FROM teachers WHERE UPPER(teacher_id) = UPPER(NEW.student_id))
	BEGIN
		SELECT RAISE(ABORT, 'Student ID conflicts with an existing teacher ID');
	END;`).catch(() => {});
	await run(`CREATE TRIGGER IF NOT EXISTS trg_students_student_id_cross_unique_update
	BEFORE UPDATE OF student_id ON students
	FOR EACH ROW
	WHEN EXISTS (SELECT 1 FROM teachers WHERE UPPER(teacher_id) = UPPER(NEW.student_id))
	BEGIN
		SELECT RAISE(ABORT, 'Student ID conflicts with an existing teacher ID');
	END;`).catch(() => {});
	await run(`CREATE TRIGGER IF NOT EXISTS trg_teachers_teacher_id_cross_unique_insert
	BEFORE INSERT ON teachers
	FOR EACH ROW
	WHEN EXISTS (SELECT 1 FROM students WHERE UPPER(student_id) = UPPER(NEW.teacher_id))
	BEGIN
		SELECT RAISE(ABORT, 'Teacher ID conflicts with an existing student ID');
	END;`).catch(() => {});
	await run(`CREATE TRIGGER IF NOT EXISTS trg_teachers_teacher_id_cross_unique_update
	BEFORE UPDATE OF teacher_id ON teachers
	FOR EACH ROW
	WHEN EXISTS (SELECT 1 FROM students WHERE UPPER(student_id) = UPPER(NEW.teacher_id))
	BEGIN
		SELECT RAISE(ABORT, 'Teacher ID conflicts with an existing student ID');
	END;`).catch(() => {});

	// Enforce cross-column ID uniqueness: an ID value can exist only once across student_id/teacher_id.
	await run(`CREATE TRIGGER IF NOT EXISTS trg_users_student_id_cross_unique_insert
	BEFORE INSERT ON users
	FOR EACH ROW
	WHEN NEW.student_id IS NOT NULL
	  AND EXISTS (SELECT 1 FROM users WHERE UPPER(teacher_id) = UPPER(NEW.student_id))
	BEGIN
		SELECT RAISE(ABORT, 'Student ID conflicts with an existing teacher ID');
	END;`).catch(() => {});

	await run(`CREATE TRIGGER IF NOT EXISTS trg_users_teacher_id_cross_unique_insert
	BEFORE INSERT ON users
	FOR EACH ROW
	WHEN NEW.teacher_id IS NOT NULL
	  AND EXISTS (SELECT 1 FROM users WHERE UPPER(student_id) = UPPER(NEW.teacher_id))
	BEGIN
		SELECT RAISE(ABORT, 'Teacher ID conflicts with an existing student ID');
	END;`).catch(() => {});

	await run(`CREATE TRIGGER IF NOT EXISTS trg_users_student_id_cross_unique_update
	BEFORE UPDATE OF student_id ON users
	FOR EACH ROW
	WHEN NEW.student_id IS NOT NULL
	  AND EXISTS (SELECT 1 FROM users WHERE id != NEW.id AND UPPER(teacher_id) = UPPER(NEW.student_id))
	BEGIN
		SELECT RAISE(ABORT, 'Student ID conflicts with an existing teacher ID');
	END;`).catch(() => {});

	await run(`CREATE TRIGGER IF NOT EXISTS trg_users_teacher_id_cross_unique_update
	BEFORE UPDATE OF teacher_id ON users
	FOR EACH ROW
	WHEN NEW.teacher_id IS NOT NULL
	  AND EXISTS (SELECT 1 FROM users WHERE id != NEW.id AND UPPER(student_id) = UPPER(NEW.teacher_id))
	BEGIN
		SELECT RAISE(ABORT, 'Teacher ID conflicts with an existing student ID');
	END;`).catch(() => {});

	await run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		token TEXT UNIQUE NOT NULL,
		expires_at TEXT NOT NULL,
		used_at TEXT,
		created_at TEXT DEFAULT (datetime('now')),
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);`);

	// Keep role tables and users table in sync (self-healing for legacy/partial writes).
	const userRows = await all(`SELECT id, role, fullname, department, semester, batch, roll_number, student_id, teacher_id FROM users`);
	for (const u of userRows) {
		if (u.role === 'teacher') {
			let teacherId = u.teacher_id && String(u.teacher_id).trim() ? String(u.teacher_id).trim().toUpperCase() : '';
			if (!teacherId) {
				teacherId = await generateUniqueUserId('TCH', 'teacher_id');
				await run(`UPDATE users SET teacher_id = ?, student_id = NULL WHERE id = ?`, [teacherId, u.id]);
			}
			await run(`INSERT OR REPLACE INTO teachers (user_id, teacher_id, fullname) VALUES (?, ?, ?)`, [u.id, teacherId, u.fullname || '']);
			await run(`DELETE FROM students WHERE user_id = ?`, [u.id]).catch(() => {});
		} else {
			let studentId = u.student_id && String(u.student_id).trim() ? String(u.student_id).trim().toUpperCase() : '';
			if (!studentId) {
				studentId = await generateUniqueUserId('STD', 'student_id');
				await run(`UPDATE users SET student_id = ?, teacher_id = NULL WHERE id = ?`, [studentId, u.id]);
			}
			await run(
				`INSERT OR REPLACE INTO students (user_id, student_id, fullname, department, semester, batch, roll_number)
				 VALUES (?, ?, ?, ?, ?, ?, ?)`,
				[u.id, studentId, u.fullname || '', u.department || '', u.semester || '', u.batch || '', u.roll_number || '']
			);
			await run(`DELETE FROM teachers WHERE user_id = ?`, [u.id]).catch(() => {});
		}
	}

	await run(`CREATE TABLE IF NOT EXISTS classes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		day_of_week INTEGER NOT NULL, -- 0=Sun ... 6=Sat
		start_time TEXT NOT NULL, -- HH:MM
		end_time TEXT NOT NULL,   -- HH:MM
		subject TEXT NOT NULL,
		teacher TEXT NOT NULL,
		location TEXT,
		created_at TEXT DEFAULT (datetime('now')),
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);`);

	await run(`CREATE TABLE IF NOT EXISTS attendance (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		class_id INTEGER NOT NULL,
		date TEXT NOT NULL, -- YYYY-MM-DD
		attended INTEGER NOT NULL, -- 1 yes, 0 no
		reason_category TEXT, -- health, program, travel, public_holiday, no_class, strike, other
		reason_text TEXT,
		created_at TEXT DEFAULT (datetime('now')),
		UNIQUE(user_id, class_id, date),
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
	);`);

	await run(`CREATE TABLE IF NOT EXISTS teacher_daily_status (
		teacher_user_id INTEGER NOT NULL,
		date TEXT NOT NULL,
		status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
		note TEXT,
		PRIMARY KEY (teacher_user_id, date),
		FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE CASCADE
	);`);

	await run(`CREATE TABLE IF NOT EXISTS teacher_subjects (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		teacher_user_id INTEGER NOT NULL,
		subject_code TEXT NOT NULL,
		subject_name TEXT NOT NULL,
		created_at TEXT DEFAULT (datetime('now')),
		FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE CASCADE
	);`);

	await run(`CREATE TABLE IF NOT EXISTS teacher_classes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		subject_id INTEGER NOT NULL,
		class_code TEXT NOT NULL,
		created_at TEXT DEFAULT (datetime('now')),
		FOREIGN KEY (subject_id) REFERENCES teacher_subjects(id) ON DELETE CASCADE
	);`);

	await run(`CREATE TABLE IF NOT EXISTS teacher_class_students (
		class_id INTEGER NOT NULL,
		student_user_id INTEGER NOT NULL,
		PRIMARY KEY (class_id, student_user_id),
		FOREIGN KEY (class_id) REFERENCES teacher_classes(id) ON DELETE CASCADE,
		FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
	);`);

	await run(`CREATE TABLE IF NOT EXISTS teacher_student_records (
		class_id INTEGER NOT NULL,
		student_user_id INTEGER NOT NULL,
		exams_mark_scored INTEGER,
		assignment_submitted INTEGER DEFAULT 0,
		assignment_mark_given INTEGER,
		notes TEXT,
		updated_at TEXT DEFAULT (datetime('now')),
		PRIMARY KEY (class_id, student_user_id),
		FOREIGN KEY (class_id) REFERENCES teacher_classes(id) ON DELETE CASCADE,
		FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
	);`);

	await run(`CREATE TABLE IF NOT EXISTS teacher_class_attendance (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		class_id INTEGER NOT NULL,
		student_user_id INTEGER NOT NULL,
		date TEXT NOT NULL,
		attended INTEGER NOT NULL,
		UNIQUE(class_id, student_user_id, date),
		FOREIGN KEY (class_id) REFERENCES teacher_classes(id) ON DELETE CASCADE,
		FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
	);`);
} 