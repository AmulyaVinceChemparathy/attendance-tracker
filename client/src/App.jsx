import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './state/AuthContext.jsx';

export default function App() {
	const { token, logout, userRole, roleReady } = useAuth();
	const navigate = useNavigate();
	function handleLogout() {
		logout();
		navigate('/login');
	}
	const isTeacher = roleReady && userRole === 'teacher';
	return (
		<div className="app">
			<header className="header">
				<h1>Attendance Tracker</h1>
				<nav>
					<Link to="/">Home</Link>
					{token && isTeacher && (
						<>
							<Link to="/teacher/daily">Daily</Link>
							<Link to="/teacher/subjects">Subject</Link>
							<Link to="/timetable">Timetable</Link>
						</>
					)}
					{token && roleReady && !isTeacher && (
						<>
							<Link to="/timetable">Timetable</Link>
							<Link to="/daily">Daily</Link>
							<Link to="/attendances">Attendances</Link>
						</>
					)}
					{token && !roleReady && <span className="nav-muted">…</span>}
					{!token && <Link to="/login">Login</Link>}
					{!token && <Link to="/register">Register</Link>}
					{token && <button onClick={handleLogout}>Logout</button>}
				</nav>
			</header>
			<main className="main">
				<Outlet />
			</main>
		</div>
	);
} 