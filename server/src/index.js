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

// Health check
app.get('/api/health', (_req, res) => {
	return res.json({ ok: true });
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