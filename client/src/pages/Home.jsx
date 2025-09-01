import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function Home() {
	const [user, setUser] = useState(null);
	useEffect(() => {
		api('/auth/me').then(r => setUser(r.user)).catch(() => {});
	}, []);
	return (
		<div>
			<h2>Welcome{user ? `, ${user.fullname}` : ''}</h2>
			<ul className="menu">
				<li><Link to="/timetable">Setup / Edit Timetable</Link></li>
				<li><Link to="/daily">Today's Attendance</Link></li>
				<li><Link to="/attendances">View All Attendances</Link></li>
			</ul>
		</div>
	);
} 