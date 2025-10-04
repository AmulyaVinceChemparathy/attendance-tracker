import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function Home() {
	const [user, setUser] = useState(null);
	const [showProfile, setShowProfile] = useState(false);
	const [showProfileEdit, setShowProfileEdit] = useState(false);
	const [showPasswordChange, setShowPasswordChange] = useState(false);
	const [profileForm, setProfileForm] = useState({});
	const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	useEffect(() => {
		loadUser();
	}, []);

	async function loadUser() {
		try {
			const r = await api('/auth/me');
			setUser(r.user);
			setProfileForm({
				fullname: r.user.fullname || '',
				department: r.user.department || '',
				semester: r.user.semester || '',
				batch: r.user.batch || '',
				rollNumber: r.user.roll_number || '',
				email: r.user.email || ''
			});
		} catch (e) {
			console.error('Failed to load user:', e);
			// If it's an authentication error, clear the token
			if (e.message.includes('token') || e.message.includes('Unauthorized')) {
				localStorage.removeItem('token');
				window.location.reload();
			}
		}
	}

	async function updateProfile(e) {
		e.preventDefault();
		setError('');
		setSuccess('');
		
		try {
			const response = await api('/auth/profile', { 
				method: 'PUT', 
				body: profileForm 
			});
			setUser(response.user);
			setShowProfileEdit(false);
			setSuccess('Profile updated successfully!');
		} catch (e) {
			setError(e.message);
		}
	}

	async function changePassword(e) {
		e.preventDefault();
		setError('');
		setSuccess('');
		
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			setError('New passwords do not match');
			return;
		}
		
		if (passwordForm.newPassword.length < 6) {
			setError('New password must be at least 6 characters long');
			return;
		}
		
		try {
			await api('/auth/password', { 
				method: 'PUT', 
				body: {
					currentPassword: passwordForm.currentPassword,
					newPassword: passwordForm.newPassword
				}
			});
			setShowPasswordChange(false);
			setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
			setSuccess('Password changed successfully!');
		} catch (e) {
			setError(e.message);
		}
	}

	return (
		<div>
			<div className="card">
				<h2>Welcome{user ? `, ${user.fullname}` : ''}</h2>
				
				{/* User Profile Section */}
				{user && (
					<div className="profile-section">
						<div className="profile-header">
							<button 
								onClick={() => setShowProfile(!showProfile)}
								className="profile-toggle-btn"
							>
								<span>Profile Information</span>
								<span className={`toggle-icon ${showProfile ? 'expanded' : ''}`}>▼</span>
							</button>
						</div>
						
						{showProfile && (
							<div className="profile-content">
								<div className="profile-actions">
									<button 
										onClick={() => setShowProfileEdit(!showProfileEdit)}
										className="edit-profile-btn"
									>
										{showProfileEdit ? 'Cancel' : 'Edit Profile'}
									</button>
								</div>
						
						{!showProfileEdit ? (
							<div className="profile-info">
								<div className="profile-grid">
									<div className="profile-item">
										<label>Full Name:</label>
										<span>{user.fullname}</span>
									</div>
									<div className="profile-item">
										<label>Email:</label>
										<span>{user.email}</span>
									</div>
									<div className="profile-item">
										<label>Department:</label>
										<span>{user.department}</span>
									</div>
									<div className="profile-item">
										<label>Semester:</label>
										<span>{user.semester}</span>
									</div>
									<div className="profile-item">
										<label>Batch:</label>
										<span>{user.batch}</span>
									</div>
									<div className="profile-item">
										<label>Roll Number:</label>
										<span>{user.roll_number}</span>
									</div>
								</div>
								<button 
									onClick={() => setShowPasswordChange(!showPasswordChange)}
									className="change-password-btn"
								>
									{showPasswordChange ? 'Cancel' : 'Change Password'}
								</button>
							</div>
						) : (
							<form onSubmit={updateProfile} className="form">
								<input 
									id="profile-fullname" 
									name="fullname" 
									placeholder="Full Name" 
									value={profileForm.fullname} 
									onChange={e => setProfileForm({...profileForm, fullname: e.target.value})} 
									required 
								/>
								<input 
									id="profile-email" 
									name="email" 
									type="email" 
									placeholder="Email" 
									value={profileForm.email} 
									onChange={e => setProfileForm({...profileForm, email: e.target.value})} 
									required 
								/>
								<input 
									id="profile-department" 
									name="department" 
									placeholder="Department" 
									value={profileForm.department} 
									onChange={e => setProfileForm({...profileForm, department: e.target.value})} 
									required 
								/>
								<input 
									id="profile-semester" 
									name="semester" 
									placeholder="Semester" 
									value={profileForm.semester} 
									onChange={e => setProfileForm({...profileForm, semester: e.target.value})} 
									required 
								/>
								<input 
									id="profile-batch" 
									name="batch" 
									placeholder="Batch" 
									value={profileForm.batch} 
									onChange={e => setProfileForm({...profileForm, batch: e.target.value})} 
									required 
								/>
								<input 
									id="profile-rollNumber" 
									name="rollNumber" 
									placeholder="Roll Number" 
									value={profileForm.rollNumber} 
									onChange={e => setProfileForm({...profileForm, rollNumber: e.target.value})} 
									required 
								/>
								<div className="form-buttons">
									<button type="submit">Update Profile</button>
									<button type="button" onClick={() => setShowProfileEdit(false)} className="cancel-btn">
										Cancel
									</button>
								</div>
							</form>
						)}
						
						{/* Password Change Form */}
						{showPasswordChange && (
							<form onSubmit={changePassword} className="form password-form">
								<h4>Change Password</h4>
								<input 
									id="password-current" 
									name="currentPassword" 
									type="password" 
									placeholder="Current Password" 
									value={passwordForm.currentPassword} 
									onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} 
									required 
								/>
								<input 
									id="password-new" 
									name="newPassword" 
									type="password" 
									placeholder="New Password" 
									value={passwordForm.newPassword} 
									onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
									required 
								/>
								<input 
									id="password-confirm" 
									name="confirmPassword" 
									type="password" 
									placeholder="Confirm New Password" 
									value={passwordForm.confirmPassword} 
									onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
									required 
								/>
								<div className="form-buttons">
									<button type="submit">Change Password</button>
									<button type="button" onClick={() => setShowPasswordChange(false)} className="cancel-btn">
										Cancel
									</button>
								</div>
							</form>
						)}
							</div>
						)}
					</div>
				)}
				
				{/* Messages */}
				{error && <div className="error">{error}</div>}
				{success && <div className="success">{success}</div>}
			</div>
			
			<div className="card">
				<h3>Quick Actions</h3>
				<ul className="menu">
					<li><Link to="/timetable">Setup / Edit Timetable</Link></li>
					<li><Link to="/daily">Today's Attendance</Link></li>
					<li><Link to="/attendances">View All Attendances</Link></li>
				</ul>
			</div>
		</div>
	);
} 