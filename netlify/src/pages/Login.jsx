import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const { login } = useAuth();
	const navigate = useNavigate();

	async function submit(e) {
		e.preventDefault();
		setError('');
		try {
			const result = await login(email, password);
			if (result.success) {
				navigate('/');
			} else {
				setError(result.error);
			}
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


