import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './lib/db.js';
import authRoutes from './routes/auth.js';
import scheduleRoutes from './routes/schedule.js';
import attendanceRoutes from './routes/attendance.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoints
app.get('/health', (_req, res) => {
	return res.status(200).json({ 
		status: 'OK', 
		timestamp: new Date().toISOString(),
		uptime: process.uptime()
	});
});

app.get('/api/health', (_req, res) => {
	return res.json({ ok: true });
});

// Root health check for Railway
app.get('/', (_req, res) => {
	return res.status(200).json({ 
		status: 'OK', 
		message: 'Attendance Tracker API is running',
		timestamp: new Date().toISOString()
	});
});

app.use('/api/auth', authRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/attendance', attendanceRoutes);

const PORT = process.env.PORT || 4000;

initDb().then(() => {
	app.listen(PORT, () => {
		console.log(`Server listening on http://localhost:${PORT}`);
	});
}).catch((err) => {
	console.error('Failed to init DB', err);
	process.exit(1);
}); 