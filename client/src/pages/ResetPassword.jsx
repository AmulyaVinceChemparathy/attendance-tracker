import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function ResetPassword() {
	const [params] = useSearchParams();
	const token = params.get('token') || '';
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	async function submit(e) {
		e.preventDefault();
		setError('');
		setMessage('');
		if (!token) {
			setError('Invalid reset link.');
			return;
		}
		if (newPassword !== confirmPassword) {
			setError('Passwords do not match.');
			return;
		}
		setLoading(true);
		try {
			const res = await api('/auth/reset-password', {
				method: 'POST',
				body: { token, newPassword },
			});
			setMessage(res.message || 'Password reset successful.');
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="card">
			<h2>Reset Password</h2>
			<form onSubmit={submit} className="form">
				<input
					type="password"
					name="newPassword"
					placeholder="New password"
					value={newPassword}
					onChange={(e) => setNewPassword(e.target.value)}
					required
				/>
				<input
					type="password"
					name="confirmPassword"
					placeholder="Confirm new password"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
					required
				/>
				<button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Reset Password'}</button>
				{error && <div className="error">{error}</div>}
				{message && <div className="success">{message}</div>}
			</form>
			<p><Link to="/login">Back to Login</Link></p>
		</div>
	);
}
