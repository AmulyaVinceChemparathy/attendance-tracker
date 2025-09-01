import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

export default function Register() {
	const [form, setForm] = useState({ fullname:'', department:'', semester:'', batch:'', rollNumber:'', email:'', password:'' });
	const [error, setError] = useState('');
	const { setToken } = useAuth();
	const navigate = useNavigate();
	async function submit(e) {
		e.preventDefault();
		setError('');
		try {
			const res = await api('/auth/register', { method: 'POST', body: form });
			setToken(res.token);
			navigate('/');
		} catch (e) {
			setError(e.message);
		}
	}
	return (
		<div className="card">
			<h2>Create Account</h2>
			<form onSubmit={submit} className="form">
				<input placeholder="Full name" value={form.fullname} onChange={e=>setForm({...form, fullname:e.target.value})} required />
				<input placeholder="Department" value={form.department} onChange={e=>setForm({...form, department:e.target.value})} required />
				<input placeholder="Semester" value={form.semester} onChange={e=>setForm({...form, semester:e.target.value})} required />
				<input placeholder="Batch" value={form.batch} onChange={e=>setForm({...form, batch:e.target.value})} required />
				<input placeholder="Roll number" value={form.rollNumber} onChange={e=>setForm({...form, rollNumber:e.target.value})} required />
				<input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
				<input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
				<button type="submit">Register</button>
				{error && <div className="error">{error}</div>}
			</form>
			<p>Already have an account? <Link to="/login">Login</Link></p>
		</div>
	);
} 