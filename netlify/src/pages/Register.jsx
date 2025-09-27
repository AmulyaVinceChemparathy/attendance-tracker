import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
	const [form, setForm] = useState({ name:'', email:'', password:'' });
	const [error, setError] = useState('');
	const { register } = useAuth();
	const navigate = useNavigate();

	async function submit(e) {
		e.preventDefault();
		setError('');
		try {
			const result = await register(form.name, form.email, form.password);
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
			<h2>Create Account</h2>
			<form onSubmit={submit} className="form">
				<input placeholder="Full name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
				<input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
				<input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
				<button type="submit">Register</button>
				{error && <div className="error">{error}</div>}
			</form>
			<p>Already have an account? <Link to="/login">Login</Link></p>
		</div>
	);
}

