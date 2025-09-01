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
			const res = await api('/auth/login', { method: 'POST', body: { email, password } });
			setToken(res.token);
			navigate('/');
		} catch (e) {
			setError(e.message);
		}
	}
	return (
		<div className="card">
			<h2>Login</h2>
			<form onSubmit={submit} className="form">
				<input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
				<input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
				<button type="submit">Login</button>
				{error && <div className="error">{error}</div>}
			</form>
			<p>No account? <Link to="/register">Register</Link></p>
		</div>
	);
} 