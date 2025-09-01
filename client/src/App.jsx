import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './state/AuthContext.jsx';

export default function App() {
	const { token, setToken } = useAuth();
	const navigate = useNavigate();
	function logout() {
		setToken(null);
		navigate('/login');
	}
	return (
		<div className="app">
			<header className="header">
				<h1>Attendance Tracker</h1>
				<nav>
					<Link to="/">Home</Link>
					{token && <Link to="/timetable">Timetable</Link>}
					{token && <Link to="/daily">Daily</Link>}
					{token && <Link to="/attendances">Attendances</Link>}
					{!token && <Link to="/login">Login</Link>}
					{!token && <Link to="/register">Register</Link>}
					{token && <button onClick={logout}>Logout</button>}
				</nav>
			</header>
			<main className="main">
				<Outlet />
			</main>
		</div>
	);
} 