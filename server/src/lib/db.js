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

export async function initDb() {
	await run(`PRAGMA foreign_keys = ON;`);
	await run(`CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		fullname TEXT NOT NULL,
		department TEXT NOT NULL,
		semester TEXT NOT NULL,
		batch TEXT NOT NULL,
		roll_number TEXT NOT NULL,
		email TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		created_at TEXT DEFAULT (datetime('now'))
	);`);

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
} 