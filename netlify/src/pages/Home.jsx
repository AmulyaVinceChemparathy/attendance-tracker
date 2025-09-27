import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Home() {
	const [stats, setStats] = useState([]);
	const [loading, setLoading] = useState(true);
	const { user, logout } = useAuth();

	useEffect(() => {
		loadStats();
	}, []);

	async function loadStats() {
		try {
			const response = await api('/attendance/stats');
			setStats(response.stats || []);
		} catch (error) {
			console.error('Failed to load stats:', error);
		} finally {
			setLoading(false);
		}
	}

	const getStatusColor = (percentage) => {
		if (percentage >= 75) return '#38a169';
		if (percentage >= 50) return '#d69e2e';
		return '#e53e3e';
	};

	const getStatusMessage = (percentage) => {
		if (percentage >= 75) return 'Safe';
		if (percentage >= 50) return 'Warning';
		return 'Critical';
	};

	return (
		<div>
			<div className="header">
				<h1>Attendance Tracker</h1>
				<nav>
					<Link to="/">Home</Link>
					<Link to="/timetable">Timetable</Link>
					<Link to="/daily">Daily</Link>
					<Link to="/attendances">Attendances</Link>
					<button onClick={logout} className="logout-btn">Logout</button>
				</nav>
			</div>

			<div className="card">
				<h2>Welcome, {user?.name || 'Student'}!</h2>
				<p>Track your class attendance and stay on top of your academic progress.</p>
			</div>

			{loading ? (
				<div className="card">
					<div className="loading">Loading attendance data...</div>
				</div>
			) : (
				<div className="card">
					<h3>Attendance Overview</h3>
					{stats.length === 0 ? (
						<div className="empty-state">
							<p>No attendance data available</p>
							<p>Start by adding classes to your timetable</p>
						</div>
					) : (
						<div className="stats-grid">
							{stats.map((stat) => {
								const percentage = stat.attendanceRate ? Math.round(stat.attendanceRate * 100) : 0;
								const statusColor = getStatusColor(percentage);
								const statusMessage = getStatusMessage(percentage);

								return (
									<div key={stat.class_id} className="stat-card" style={{ borderColor: statusColor }}>
										<div className="stat-header">
											<h4>{stat.subject}</h4>
											<span className="status-badge" style={{ backgroundColor: statusColor }}>
												{statusMessage}
											</span>
										</div>
										<div className="stat-content">
											<p>Present: {stat.present || 0} / Total: {stat.total || 0}</p>
											<p className="percentage" style={{ color: statusColor }}>
												{percentage}% attendance
											</p>
											<div className="progress-bar">
												<div 
													className="progress-fill" 
													style={{ 
														width: `${Math.min(100, percentage)}%`,
														backgroundColor: statusColor 
													}}
												></div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}

			<div className="card">
				<h3>Quick Actions</h3>
				<ul className="menu">
					<li><Link to="/timetable">Setup / Edit Timetable</Link></li>
					<li><Link to="/daily">Today's Attendance</Link></li>
					<li><Link to="/attendances">View All Attendances</Link></li>
				</ul>
			</div>
		</div>
	);
}


