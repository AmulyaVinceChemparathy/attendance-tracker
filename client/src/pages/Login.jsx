import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

export default function Login() {
	const [activeSection, setActiveSection] = useState('student'); // 'student' | 'teacher'
	const [userId, setUserId] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const { setToken } = useAuth();
	const navigate = useNavigate();

	async function submit(e) {
		e.preventDefault();
		setError('');
		try {
			const body = { role: activeSection, userId: userId.trim(), password };
			const res = await api('/auth/login', { method: 'POST', body });
			if (res.token) {
				localStorage.setItem('token', res.token);
				setToken(res.token);
				navigate('/');
			} else {
				setError('No token received from server');
			}
		} catch (e) {
			setError(e.message);
		}
	}

	return (
		<div className="card">
			<h2>Login</h2>
			<div className="login-sections">
				<button
					type="button"
					className={`section-tab ${activeSection === 'student' ? 'active' : ''}`}
					onClick={() => { setActiveSection('student'); setError(''); }}
				>
					Student
				</button>
				<button
					type="button"
					className={`section-tab ${activeSection === 'teacher' ? 'active' : ''}`}
					onClick={() => { setActiveSection('teacher'); setError(''); }}
				>
					Teacher
				</button>
			</div>

			<form onSubmit={submit} className="form">
				<input
					id="login-userId"
					name="userId"
					type="text"
					placeholder={activeSection === 'teacher' ? 'Teacher ID' : 'Student ID'}
					value={userId}
					onChange={e => setUserId(e.target.value)}
					required
				/>
				<input
					id="login-password"
					name="password"
					type="password"
					placeholder="Password"
					value={password}
					onChange={e => setPassword(e.target.value)}
					required
				/>
				<button type="submit">Login</button>
				{error && <div className="error">{error}</div>}
			</form>
			<p><Link to="/forgot-password">Forgot password?</Link></p>
			<p>No account? <Link to="/register">Register</Link></p>
		</div>
	);
}
