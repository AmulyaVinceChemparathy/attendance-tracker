# 📊 Attendance Tracker

A full-stack web application for managing student attendance with timetable scheduling, daily attendance marking, and comprehensive reporting features.

## 🚀 Features

### 👥 User Management
- **User Registration & Login** - Secure authentication with JWT tokens
- **Profile Management** - Update personal information and change passwords
- **Multi-user Support** - Each user has isolated data

### 📚 Timetable Management
- **Weekly Schedule** - Visual calendar grid for class scheduling
- **Class Details** - Subject, teacher, location, and time slots
- **CRUD Operations** - Add, edit, and delete classes
- **Day-wise Organization** - Schedule classes for each day of the week

### ✅ Attendance Tracking
- **Daily Attendance** - Mark present/absent for each class
- **Reason Tracking** - Record reasons for absence (health, travel, etc.)
- **Date-based System** - Track attendance by specific dates
- **Quick Actions** - Fast attendance marking interface

### 📈 Reports & Analytics
- **Attendance Statistics** - Overall attendance percentages
- **Date Range Filtering** - Filter records by date ranges
- **Detailed History** - Complete attendance history
- **Export Capabilities** - Generate attendance reports

## 🏗️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **React Router DOM** - Client-side routing
- **Vanilla CSS** - Custom styling with Grid/Flexbox
- **JWT Authentication** - Secure token-based auth

### Backend
- **Node.js 18** - JavaScript runtime
- **Express.js** - Web framework
- **SQLite3** - Lightweight database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

### Database
- **SQLite** - File-based relational database
- **3 Main Tables** - Users, Classes, Attendance
- **Foreign Keys** - Data integrity and relationships
- **Cascade Deletes** - Automatic cleanup

### Deployment
- **Docker** - Containerized deployment
- **Docker Compose** - Multi-container orchestration
- **Multi-stage Build** - Optimized production images
- **Health Checks** - Container monitoring

## 📁 Project Structure

```
attendance-tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── state/         # State management
│   │   └── lib/           # Utilities
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Custom middleware
│   │   └── lib/          # Database utilities
│   └── package.json
├── docker-compose.yml     # Docker orchestration
├── Dockerfile            # Multi-stage build
└── README.md
```

## 🗄️ Database Schema

### Users Table
```sql
users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullname TEXT NOT NULL,
  department TEXT NOT NULL,
  semester TEXT NOT NULL,
  batch TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
)
```

### Classes Table
```sql
classes (
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
)
```

### Attendance Table
```sql
attendance (
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
)
```

## 🚀 Quick Start

### Prerequisites
- **Docker** and **Docker Compose** installed
- **Git** for cloning the repository

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd attendance-tracker
   ```

2. **Set environment variables** (optional)
   ```bash
   # Create .env file with custom JWT secret
   echo "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production" > .env
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Open your browser and go to `http://localhost:3000`
   - Register a new account or login

### Development Setup

#### Frontend Development
```bash
cd client
npm install
npm run dev          # Runs on http://localhost:5173
```

#### Backend Development
```bash
cd server
npm install
npm run dev          # Runs on http://localhost:3000
```

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=production                    # Environment mode
JWT_SECRET=your-secret-key            # JWT signing secret
PORT=3000                            # Server port
DB_PATH=/app/data/data.sqlite        # Database file path
```

### Docker Configuration
- **Port:** 3000 (configurable in docker-compose.yml)
- **Database:** SQLite file in Docker volume
- **Health Check:** `/health` endpoint
- **Restart Policy:** unless-stopped

## 📡 API Endpoints

### Authentication
```
POST /api/auth/register      # User registration
POST /api/auth/login         # User login
GET  /api/auth/me           # Get user profile
```

### Timetable Management
```
GET    /api/schedule         # Get user's classes
POST   /api/schedule         # Add new class
PUT    /api/schedule/:id     # Update class
DELETE /api/schedule/:id     # Delete class
```

### Attendance Tracking
```
GET    /api/attendance       # Get attendance records
POST   /api/attendance       # Mark attendance
PUT    /api/attendance/:id   # Update attendance
DELETE /api/attendance/:id  # Delete attendance
```

### Health Checks
```
GET /health                 # Application health
GET /api/health            # API health check
```

## 🐳 Docker Deployment

### Production Deployment
```bash
# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Features
- **Multi-stage build** for optimized images
- **Non-root user** for security
- **Health checks** for monitoring
- **Volume persistence** for database
- **Signal handling** with dumb-init

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt for password security
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Server-side validation
- **SQL Injection Protection** - Parameterized queries
- **Non-root Container** - Enhanced security

## 📊 Usage Guide

### 1. Getting Started
1. **Register** a new account with your details
2. **Login** to access the dashboard
3. **Setup Timetable** by adding your classes
4. **Mark Attendance** daily for each class

### 2. Timetable Management
- Navigate to **Timetable** page
- Click **Add Class** to schedule new classes
- Fill in subject, teacher, location, and time
- Use the calendar grid to visualize your schedule

### 3. Daily Attendance
- Go to **Daily** page
- Select the date you want to mark attendance
- Mark each class as present or absent
- Add reasons for absences if needed

### 4. View Reports
- Visit **Attendances** page for detailed reports
- Filter by date ranges
- View attendance statistics
- Export data for external use

## 🛠️ Troubleshooting

### Common Issues

#### Docker Issues
```bash
# Check if port 3000 is available
netstat -ano | findstr :3000

# Restart Docker services
docker-compose down
docker-compose up --build
```

#### Database Issues
```bash
# Check database file
docker-compose exec app ls -la /app/data/

# Reset database (WARNING: Deletes all data)
docker-compose down -v
docker-compose up --build
```

#### Authentication Issues
- Clear browser localStorage
- Check JWT_SECRET environment variable
- Verify token expiration (7 days default)

### Debug Mode
```bash
# Enable debug logging
docker-compose logs -f app
```

## 📈 Performance & Scaling

### Current Limitations
- **Single Instance** - SQLite doesn't support multiple writers
- **File-based Database** - Not suitable for high concurrency
- **Memory Usage** - Suitable for small to medium applications

### Scaling Considerations
- **Database Migration** - Consider PostgreSQL for production
- **Load Balancing** - Multiple app instances with shared database
- **Caching** - Redis for session management
- **CDN** - Static file delivery optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review Docker logs for error details

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added Docker deployment
- **v1.2.0** - Enhanced UI and reporting features

---

**Built with ❤️ using React, Node.js, and Docker**

