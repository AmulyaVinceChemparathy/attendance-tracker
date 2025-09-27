# Attendance Tracker iOS App

This is the iOS version of the Attendance Tracker application built with React Native.

## Features

- **Authentication**: Login and registration with secure token-based authentication
- **Timetable Management**: Add, edit, and delete class schedules
- **Daily Attendance**: Mark attendance for today's classes
- **Monthly Overview**: View attendance records organized by month
- **Subject Details**: Detailed attendance tracking per subject
- **Statistics**: Track attendance percentages and requirements

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- React Native CLI
- Xcode (for iOS development)
- iOS Simulator or physical iOS device

### Installation

1. Navigate to the ios directory:
   ```bash
   cd ios
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install iOS dependencies:
   ```bash
   cd ios && pod install && cd ..
   ```

4. Start the Metro bundler:
   ```bash
   npm start
   ```

5. Run the iOS app:
   ```bash
   npm run ios
   ```

## Project Structure

```
ios/
├── App.js                 # Main app component with navigation
├── src/
│   ├── context/          # React context for state management
│   │   └── AuthContext.js
│   ├── lib/              # API and utility functions
│   │   └── api.js
│   ├── screens/          # Screen components
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── HomeScreen.js
│   │   ├── TimetableScreen.js
│   │   ├── DailyScreen.js
│   │   └── AttendancesScreen.js
│   └── styles/           # Theme and styling
│       └── theme.js
├── package.json
└── README.md
```

## Key Features

### Authentication
- Secure login and registration
- Token-based authentication
- Automatic token refresh
- Logout functionality

### Timetable Management
- Add new classes with subject, teacher, time, and location
- Edit existing classes
- Delete classes
- Day-of-week selection
- Time picker for start/end times

### Daily Attendance
- View today's classes
- Mark attendance as present or absent
- Add reasons for absence
- Edit attendance records
- Date picker for different days

### Monthly Overview
- View attendance by month
- Subject-wise breakdown
- Attendance percentage tracking
- Detailed class records

### Statistics
- Overall attendance percentage
- Subject-wise statistics
- 75% requirement tracking
- Visual progress indicators

## API Integration

The app connects to the same backend API as the web application:
- Base URL: `http://localhost:3001` (configurable in `src/lib/api.js`)
- Authentication endpoints
- Schedule management
- Attendance tracking
- Statistics and reporting

## Styling

The app uses React Native Paper for Material Design components and a custom theme:
- Primary color: #667eea
- Secondary color: #764ba2
- Success color: #38a169
- Error color: #e53e3e
- Consistent spacing and typography

## Navigation

- Bottom tab navigation for main screens
- Stack navigation for authentication
- Modal presentations for forms
- Back navigation with breadcrumbs

## Development

### Running the App
```bash
# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Building for Production
```bash
# iOS
cd ios && xcodebuild -workspace AttendanceTracker.xcworkspace -scheme AttendanceTracker -configuration Release
```

## Dependencies

- React Native 0.72.6
- React Navigation 6.x
- React Native Paper 5.x
- React Native Vector Icons
- React Native Calendars
- AsyncStorage for data persistence
- Axios for API calls

## Notes

- The app is designed to work with the existing web backend
- All API endpoints are shared between web and mobile versions
- Authentication tokens are stored securely using AsyncStorage
- The app supports both light and dark themes (configurable)
- All screens are responsive and work on different screen sizes

