import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function ForgotPassword() {
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	async function submit(e) {
		e.preventDefault();
		setError('');
		setMessage('');
		setLoading(true);
		try {
			const res = await api('/auth/forgot-password', {
				method: 'POST',
				body: { email: email.trim() },
			});
			setMessage(res.message || 'If an account exists for this email, a reset link has been sent.');
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="card">
			<h2>Forgot Password</h2>
			<form onSubmit={submit} className="form">
				<input
					type="email"
					name="email"
					placeholder="Enter your Gmail"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				<button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button>
				{error && <div className="error">{error}</div>}
				{message && <div className="success">{message}</div>}
			</form>
			<p><Link to="/login">Back to Login</Link></p>
		</div>
	);
}
