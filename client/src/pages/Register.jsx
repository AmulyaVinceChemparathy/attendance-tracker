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
			console.log('Attempting registration with:', { ...form, password: '***' });
			const res = await api('/auth/register', { method: 'POST', body: form });
			console.log('Register response:', res);
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
			console.error('Registration error:', e);
			setError(e.message);
		}
	}
	return (
		<div className="card">
			<h2>Create Account</h2>
			<form onSubmit={submit} className="form">
				<input 
					id="register-fullname" 
					name="fullname" 
					placeholder="Full name" 
					value={form.fullname} 
					onChange={e=>setForm({...form, fullname:e.target.value})} 
					required 
				/>
				<input 
					id="register-department" 
					name="department" 
					placeholder="Department" 
					value={form.department} 
					onChange={e=>setForm({...form, department:e.target.value})} 
					required 
				/>
				<input 
					id="register-semester" 
					name="semester" 
					placeholder="Semester" 
					value={form.semester} 
					onChange={e=>setForm({...form, semester:e.target.value})} 
					required 
				/>
				<input 
					id="register-batch" 
					name="batch" 
					placeholder="Batch" 
					value={form.batch} 
					onChange={e=>setForm({...form, batch:e.target.value})} 
					required 
				/>
				<input 
					id="register-rollNumber" 
					name="rollNumber" 
					placeholder="Roll number" 
					value={form.rollNumber} 
					onChange={e=>setForm({...form, rollNumber:e.target.value})} 
					required 
				/>
				<input 
					id="register-email" 
					name="email" 
					type="email" 
					placeholder="Email" 
					value={form.email} 
					onChange={e=>setForm({...form, email:e.target.value})} 
					required 
				/>
				<input 
					id="register-password" 
					name="password" 
					type="password" 
					placeholder="Password" 
					value={form.password} 
					onChange={e=>setForm({...form, password:e.target.value})} 
					required 
				/>
				<button type="submit">Register</button>
				{error && <div className="error">{error}</div>}
			</form>
			<p>Already have an account? <Link to="/login">Login</Link></p>
		</div>
	);
} 