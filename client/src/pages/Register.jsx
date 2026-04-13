import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

const studentInitial = { fullname: '', studentId: '', department: '', semester: '', batch: '', rollNumber: '', email: '', password: '' };
const teacherInitial = { fullname: '', teacherId: '', email: '', password: '' };

export default function Register() {
	const [activeSection, setActiveSection] = useState('student'); // 'student' | 'teacher'
	const [studentForm, setStudentForm] = useState(studentInitial);
	const [teacherForm, setTeacherForm] = useState(teacherInitial);
	const [error, setError] = useState('');
	const [info, setInfo] = useState('');
	const { setToken } = useAuth();
	const navigate = useNavigate();

	async function submit(e) {
		e.preventDefault();
		setError('');
		setInfo('');
		try {
			const isTeacher = activeSection === 'teacher';
			const body = isTeacher
				? { role: 'teacher', ...teacherForm }
				: { role: 'student', ...studentForm };
			const res = await api('/auth/register', { method: 'POST', body });
			if (res.token) {
				if (res.userId) {
					setInfo(`Your ${isTeacher ? 'Teacher' : 'Student'} ID is: ${res.userId}`);
				}
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
			<h2>Create Account</h2>
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
				{activeSection === 'student' && (
					<>
						<input
							id="register-fullname"
							name="fullname"
							placeholder="Full name"
							value={studentForm.fullname}
							onChange={e => setStudentForm({ ...studentForm, fullname: e.target.value })}
							required
						/>
						<input
							id="register-studentId"
							name="studentId"
							placeholder="Student ID (optional, auto-generated if blank)"
							value={studentForm.studentId}
							onChange={e => setStudentForm({ ...studentForm, studentId: e.target.value })}
						/>
						<input
							id="register-department"
							name="department"
							placeholder="Department"
							value={studentForm.department}
							onChange={e => setStudentForm({ ...studentForm, department: e.target.value })}
							required
						/>
						<input
							id="register-semester"
							name="semester"
							placeholder="Semester"
							value={studentForm.semester}
							onChange={e => setStudentForm({ ...studentForm, semester: e.target.value })}
							required
						/>
						<input
							id="register-batch"
							name="batch"
							placeholder="Batch"
							value={studentForm.batch}
							onChange={e => setStudentForm({ ...studentForm, batch: e.target.value })}
							required
						/>
						<input
							id="register-rollNumber"
							name="rollNumber"
							placeholder="Roll number"
							value={studentForm.rollNumber}
							onChange={e => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
							required
						/>
						<input
							id="register-email"
							name="email"
							type="email"
							placeholder="Email"
							value={studentForm.email}
							onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
							required
						/>
						<input
							id="register-password"
							name="password"
							type="password"
							placeholder="Password"
							value={studentForm.password}
							onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
							required
						/>
					</>
				)}
				{activeSection === 'teacher' && (
					<>
						<input
							id="register-fullname"
							name="fullname"
							placeholder="Full name"
							value={teacherForm.fullname}
							onChange={e => setTeacherForm({ ...teacherForm, fullname: e.target.value })}
							required
						/>
						<input
							id="register-teacherId"
							name="teacherId"
							placeholder="Teacher ID (optional, auto-generated if blank)"
							value={teacherForm.teacherId}
							onChange={e => setTeacherForm({ ...teacherForm, teacherId: e.target.value })}
						/>
						<input
							id="register-email"
							name="email"
							type="email"
							placeholder="Email"
							value={teacherForm.email}
							onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
							required
						/>
						<input
							id="register-password"
							name="password"
							type="password"
							placeholder="Password"
							value={teacherForm.password}
							onChange={e => setTeacherForm({ ...teacherForm, password: e.target.value })}
							required
						/>
					</>
				)}
				<button type="submit">Register</button>
				{error && <div className="error">{error}</div>}
				{info && <div className="success">{info}</div>}
			</form>
			<p>Already have an account? <Link to="/login">Login</Link></p>
		</div>
	);
}
