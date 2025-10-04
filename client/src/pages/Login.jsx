import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

export default function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const { setToken } = useAuth();
	const navigate = useNavigate();
	async function submit(e) {
		e.preventDefault();
		setError('');
		try {
			console.log('Attempting login with:', { email, password: '***' });
			const res = await api('/auth/login', { method: 'POST', body: { email, password } });
			console.log('Login response:', res);
			if (res.token) {
				// Set token in localStorage immediately
				localStorage.setItem('token', res.token);
				setToken(res.token);
				console.log('Token set, navigating to home');
				navigate('/');
			} else {
				setError('No token received from server');
			}
		} catch (e) {
			console.error('Login error:', e);
			setError(e.message);
		}
	}
	return (
		<div className="card">
			<h2>Login</h2>
			<form onSubmit={submit} className="form">
				<input 
					id="login-email" 
					name="email" 
					type="email" 
					placeholder="Email" 
					value={email} 
					onChange={e=>setEmail(e.target.value)} 
					required 
				/>
				<input 
					id="login-password" 
					name="password" 
					type="password" 
					placeholder="Password" 
					value={password} 
					onChange={e=>setPassword(e.target.value)} 
					required 
				/>
				<button type="submit">Login</button>
				{error && <div className="error">{error}</div>}
			</form>
			<p>No account? <Link to="/register">Register</Link></p>
		</div>
	);
} 