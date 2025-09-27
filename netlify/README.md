# Attendance Tracker - Netlify Deployment

This is a complete attendance tracking application designed for Netlify deployment with serverless functions.

## Features

- **User Authentication**: Login/Register with JWT tokens
- **Timetable Management**: Add, edit, and delete class schedules
- **Daily Attendance**: Mark attendance for each class
- **Monthly Overview**: View attendance statistics by month and subject
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
netlify/
├── src/                          # Frontend React application
│   ├── components/               # Reusable components
│   ├── pages/                   # Main application pages
│   ├── context/                 # React context providers
│   ├── lib/                     # Utility functions
│   └── styles.css               # Global styles
├── netlify/
│   └── functions/               # Serverless functions
│       ├── auth.js              # Authentication endpoints
│       ├── schedule.js           # Timetable management
│       └── attendance.js        # Attendance tracking
├── package.json                 # Dependencies
├── vite.config.js              # Vite configuration
├── netlify.toml                 # Netlify configuration
└── index.html                   # Entry point
```

## Deployment to Netlify

### Method 1: Deploy from Git Repository

1. **Push to GitHub/GitLab**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your repository
   - Build settings will be auto-detected from `netlify.toml`

### Method 2: Deploy from Local Folder

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Deploy**:
   ```bash
   cd netlify
   netlify deploy --prod
   ```

### Method 3: Drag and Drop

1. Build the project:
   ```bash
   cd netlify
   npm install
   npm run build
   ```

2. Go to [netlify.com](https://netlify.com)
3. Drag the `dist` folder to the deploy area

## Local Development

1. **Install Dependencies**:
   ```bash
   cd netlify
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Test Netlify Functions Locally**:
   ```bash
   npx netlify dev
   ```

## Environment Variables

Set these in your Netlify dashboard under Site Settings > Environment Variables:

- `JWT_SECRET`: Secret key for JWT tokens (required)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify JWT token

### Schedule Management
- `GET /api/schedule` - Get user's classes
- `POST /api/schedule` - Create new class
- `PUT /api/schedule/:id` - Update class
- `DELETE /api/schedule/:id` - Delete class

### Attendance Tracking
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/stats` - Get attendance statistics
- `POST /api/attendance` - Mark attendance
- `PUT /api/attendance/:id` - Update attendance record

## Features Overview

### 1. Authentication System
- Secure JWT-based authentication
- User registration and login
- Protected routes

### 2. Timetable Management
- Weekly calendar view
- Add/edit/delete classes
- Monthly calendar sidebar
- Time slot management

### 3. Attendance Tracking
- Daily attendance marking
- Reason tracking for absences
- Monthly statistics
- Subject-wise analysis

### 4. User Interface
- Modern glass-morphism design
- Responsive layout
- Interactive calendar
- Real-time updates

## Customization

### Styling
- Modify `src/styles.css` for custom themes
- CSS variables for easy color changes
- Responsive breakpoints included

### Functionality
- Add new API endpoints in `netlify/functions/`
- Extend user data in authentication
- Add new attendance reasons

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version (14+ required)
   - Ensure all dependencies are installed
   - Check for TypeScript errors

2. **Function Errors**:
   - Verify environment variables are set
   - Check function logs in Netlify dashboard
   - Ensure proper CORS headers

3. **Authentication Issues**:
   - Verify JWT_SECRET is set
   - Check token expiration
   - Clear browser storage

### Performance Optimization

1. **Enable Caching**:
   - Static assets are cached automatically
   - API responses can be cached with appropriate headers

2. **Image Optimization**:
   - Use WebP format for images
   - Implement lazy loading

3. **Bundle Size**:
   - Code splitting is enabled
   - Tree shaking removes unused code

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Netlify function logs
3. Test locally with `netlify dev`

## License

This project is open source and available under the MIT License.

