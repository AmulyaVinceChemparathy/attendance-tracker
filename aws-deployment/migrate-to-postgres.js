// Database migration script from SQLite to PostgreSQL
import sqlite3 from 'sqlite3';
import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

// Configuration
const SQLITE_DB_PATH = './server/data.sqlite';
const POSTGRES_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'attendance_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

async function migrateDatabase() {
  console.log('🔄 Starting database migration from SQLite to PostgreSQL...');
  
  // Connect to SQLite
  const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH);
  
  // Connect to PostgreSQL
  const pgClient = new Client(POSTGRES_CONFIG);
  await pgClient.connect();
  
  try {
    // Create tables in PostgreSQL
    console.log('📋 Creating PostgreSQL tables...');
    
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS attendances (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        schedule_id INTEGER REFERENCES schedules(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(50) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, schedule_id, date)
      );
    `);
    
    // Migrate users
    console.log('👥 Migrating users...');
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const user of users) {
      await pgClient.query(
        'INSERT INTO users (id, username, email, password_hash, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
        [user.id, user.username, user.email, user.password_hash, user.created_at]
      );
    }
    
    // Migrate schedules
    console.log('📅 Migrating schedules...');
    const schedules = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM schedules', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const schedule of schedules) {
      await pgClient.query(
        'INSERT INTO schedules (id, user_id, subject, day_of_week, start_time, end_time, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
        [schedule.id, schedule.user_id, schedule.subject, schedule.day_of_week, schedule.start_time, schedule.end_time, schedule.created_at]
      );
    }
    
    // Migrate attendances
    console.log('✅ Migrating attendances...');
    const attendances = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM attendances', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const attendance of attendances) {
      await pgClient.query(
        'INSERT INTO attendances (id, user_id, schedule_id, date, status, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (user_id, schedule_id, date) DO NOTHING',
        [attendance.id, attendance.user_id, attendance.schedule_id, attendance.date, attendance.status, attendance.notes, attendance.created_at]
      );
    }
    
    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    sqliteDb.close();
    await pgClient.end();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDatabase().catch(console.error);
}

export { migrateDatabase };
