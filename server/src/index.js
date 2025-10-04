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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration
const corsOptions = {
	origin: process.env.NODE_ENV === 'production' 
		? [
			process.env.FRONTEND_URL, 
			'https://attendance-tracker-production.up.railway.app', 
			'https://attendance-tracker.onrender.com',
			'https://attendance-tracker-production.up.railway.app',
			'https://attendance-tracker.onrender.com'
		]
		: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4000'],
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
	console.error('Missing required environment variables:', missingEnvVars);
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