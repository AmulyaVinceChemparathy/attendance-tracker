import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Timetable from './pages/Timetable.jsx';
import Daily from './pages/Daily.jsx';
import Attendances from './pages/Attendances.jsx';
import { AuthProvider, useAuth } from './state/AuthContext.jsx';
import './styles.css';

function PrivateRoute({ children }) {
	const { token } = useAuth();
	return token ? children : <Navigate to="/login" replace />;
}

createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<App />}>
						<Route index element={<PrivateRoute><Home /></PrivateRoute>} />
						<Route path="register" element={<Register />} />
						<Route path="login" element={<Login />} />
						<Route path="timetable" element={<PrivateRoute><Timetable /></PrivateRoute>} />
						<Route path="daily" element={<PrivateRoute><Daily /></PrivateRoute>} />
						<Route path="attendances" element={<PrivateRoute><Attendances /></PrivateRoute>} />
					</Route>
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	</React.StrictMode>
); 