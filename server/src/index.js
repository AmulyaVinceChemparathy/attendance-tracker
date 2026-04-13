import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb } from './lib/db.js';
import authRoutes from './routes/auth.js';
import scheduleRoutes from './routes/schedule.js';
import attendanceRoutes from './routes/attendance.js';
import teacherRoutes from './routes/teacher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from cwd first, then from project root (parent of server/)
dotenv.config();
const projectRoot = path.resolve(__dirname, '../..');
if (!process.env.JWT_SECRET) {
	dotenv.config({ path: path.join(projectRoot, '.env') });
}

const app = express();

// CORS: allow localhost so local dev always works; add FRONTEND_URL when deploying to cloud
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4000'];
if (process.env.FRONTEND_URL) {
	allowedOrigins.push(process.env.FRONTEND_URL);
}
const corsOptions = {
	origin: allowedOrigins,
	credentials: true,
	optionsSuccessStatus: 200,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the React app build directory
if (process.env.NODE_ENV === 'production') {
	const buildPath = path.join(__dirname, '../public');
	app.use(express.static(buildPath));
}

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

// Test endpoint to verify server is working
app.get('/api/test', (_req, res) => {
	console.log('Test endpoint hit');
	return res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});


// Root health check (used by some hosts; safe for local too)
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
app.use('/api/teacher', teacherRoutes);

// Catch-all handler: send back React's index.html file for any non-API routes
if (process.env.NODE_ENV === 'production') {
	app.get('*', (req, res) => {
		const indexPath = path.join(__dirname, '../public/index.html');
		res.sendFile(indexPath, (err) => {
			if (err) {
				console.error('Error serving index.html:', err);
				res.status(404).json({ error: 'Frontend not found' });
			}
		});
	});
}

const PORT = process.env.PORT || 3000;

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
	console.error('Missing required environment variables:', missingEnvVars.join(', '));
	console.error('Set JWT_SECRET (e.g. in .env, or: export JWT_SECRET=your-secret-key / docker run -e JWT_SECRET=...)');
	process.exit(1);
}

// Check if database directory exists
const dbDir = path.dirname(process.env.DB_PATH || path.join(__dirname, '../data.sqlite'));
if (!fs.existsSync(dbDir)) {
	console.log('Creating database directory:', dbDir);
	fs.mkdirSync(dbDir, { recursive: true });
}

initDb().then(() => {
	app.listen(PORT, '0.0.0.0', () => {
		console.log(`Server listening on http://0.0.0.0:${PORT}`);
		console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
	});
}).catch((err) => {
	console.error('Failed to init DB', err);
	process.exit(1);
}); 