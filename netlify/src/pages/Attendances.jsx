import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

const REASONS = ['health','program','travel','public_holiday','no_class','strike','other'];

export default function Attendances() {
	const [attendance, setAttendance] = useState([]);
	const [stats, setStats] = useState([]);
	const [loading, setLoading] = useState(true);
	const [dateRange, setDateRange] = useState({ from: '', to: '' });
	const [editingRecord, setEditingRecord] = useState(null);
	const [selectedMonth, setSelectedMonth] = useState(null);
	const [selectedSubject, setSelectedSubject] = useState(null);
	const [viewMode, setViewMode] = useState('months'); // 'months', 'subjects', 'details'

	async function loadAttendance() {
		try {
			const params = new URLSearchParams();
			if (dateRange.from) params.append('from', dateRange.from);
			if (dateRange.to) params.append('to', dateRange.to);
			
			const r = await api(`/attendance?${params.toString()}`);
			setAttendance(r.attendance);
		} catch (e) {
			console.error('Failed to load attendance:', e);
		}
	}

	async function loadStats() {
		try {
			const r = await api('/attendance/stats');
			setStats(r.stats);
		} catch (e) {
			console.error('Failed to load stats:', e);
		}
	}

	useEffect(() => {
		Promise.all([loadAttendance(), loadStats()]).finally(() => setLoading(false));
	}, [dateRange]);

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getMonthsFromAttendance() {
		const months = new Map();
		attendance.forEach(record => {
			const date = new Date(record.date);
			const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
			
			if (!months.has(monthKey)) {
				months.set(monthKey, {
					key: monthKey,
					name: monthName,
					records: []
				});
			}
			months.get(monthKey).records.push(record);
		});
		return Array.from(months.values()).sort((a, b) => b.key.localeCompare(a.key));
	}

	function getSubjectsFromMonth(monthRecords) {
		const subjects = new Map();
		monthRecords.forEach(record => {
			if (!subjects.has(record.subject)) {
				subjects.set(record.subject, {
					subject: record.subject,
					teacher: record.teacher,
					records: []
				});
			}
			subjects.get(record.subject).records.push(record);
		});
		return Array.from(subjects.values());
	}

	function getSubjectStats(subjectRecords) {
		const total = subjectRecords.length;
		const present = subjectRecords.filter(r => r.attended).length;
		const percentage = total > 0 ? (present / total) * 100 : 0;
		return { total, present, percentage };
	}

	function getStatusColor(attended) {
		return attended ? 'status-present' : 'status-absent';
	}

	function getReasonBadge(reason) {
		if (!reason) return null;
		const colors = {
			health: 'bg-red-100 text-red-800',
			program: 'bg-blue-100 text-blue-800',
			travel: 'bg-yellow-100 text-yellow-800',
			public_holiday: 'bg-purple-100 text-purple-800',
			no_class: 'bg-gray-100 text-gray-800',
			strike: 'bg-orange-100 text-orange-800',
			other: 'bg-indigo-100 text-indigo-800'
		};
		return (
			<span className={`px-2 py-1 rounded text-xs font-medium ${colors[reason] || colors.other}`}>
				{reason.replace('_', ' ')}
			</span>
		);
	}

	function handleMonthClick(month) {
		setSelectedMonth(month);
		setViewMode('subjects');
	}

	function handleSubjectClick(subject) {
		setSelectedSubject(subject);
		setViewMode('details');
	}

	function handleBackToMonths() {
		setSelectedMonth(null);
		setSelectedSubject(null);
		setViewMode('months');
	}

	function handleBackToSubjects() {
		setSelectedSubject(null);
		setViewMode('subjects');
	}

	async function updateAttendance(recordId, attended, reasonCategory, reasonText, applyToAllSubject) {
		try {
			await api(`/attendance/${recordId}`, {
				method: 'PUT',
				body: { attended, reasonCategory, reasonText, applyToAllSubject }
			});
			await loadAttendance();
			setEditingRecord(null);
		} catch (error) {
			console.error('Failed to update attendance:', error);
		}
	}

	if (loading) {
		return (
			<div>
				<div className="header">
					<h1>Attendance Tracker</h1>
					<nav>
						<a href="/">Home</a>
						<a href="/timetable">Timetable</a>
						<a href="/daily">Daily</a>
						<a href="/attendances">Attendances</a>
					</nav>
				</div>
				<div className="card">
					<div className="loading">Loading attendance data...</div>
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className="header">
				<h1>Attendance Tracker</h1>
				<nav>
					<a href="/">Home</a>
					<a href="/timetable">Timetable</a>
					<a href="/daily">Daily</a>
					<a href="/attendances">Attendances</a>
				</nav>
			</div>

			<div className="card">
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
					<h2>Attendance Records</h2>
					{viewMode !== 'months' && (
						<button 
							onClick={viewMode === 'subjects' ? handleBackToMonths : handleBackToSubjects}
							style={{ 
								background: 'var(--primary-gradient)', 
								color: 'white', 
								border: 'none', 
								padding: '8px 16px', 
								borderRadius: 'var(--border-radius-sm)',
								cursor: 'pointer',
								fontWeight: '600'
							}}
						>
							← Back
						</button>
					)}
				</div>
				
				{/* Date Range Filter */}
				<div className="form row" style={{ marginBottom: '20px' }}>
					<input 
						type="date" 
						placeholder="From Date" 
						value={dateRange.from} 
						onChange={e => setDateRange({...dateRange, from: e.target.value})}
					/>
					<input 
						type="date" 
						placeholder="To Date" 
						value={dateRange.to} 
						onChange={e => setDateRange({...dateRange, to: e.target.value})}
					/>
					<button 
						onClick={() => setDateRange({ from: '', to: '' })}
						style={{ 
							background: '#e2e8f0', 
							color: '#4a5568', 
							border: 'none', 
							padding: '8px 16px', 
							borderRadius: 'var(--border-radius-sm)',
							cursor: 'pointer'
						}}
					>
						Clear Filter
					</button>
				</div>

				{/* Main Content Based on View Mode */}
				{viewMode === 'months' && (
					<div>
						<h3 style={{ marginBottom: '12px', color: '#4a5568', fontSize: '1.2rem' }}>
							Monthly Attendance Overview
						</h3>
						{getMonthsFromAttendance().length === 0 ? (
							<div style={{ 
								textAlign: 'center', 
								padding: '40px', 
								color: '#718096',
								fontStyle: 'italic'
							}}>
								No attendance records found for the selected date range.
							</div>
						) : (
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
								{getMonthsFromAttendance().map(month => (
									<div 
										key={month.key}
										onClick={() => handleMonthClick(month)}
										style={{ 
											background: 'var(--glass-bg)', 
											border: '1px solid var(--glass-border)', 
											borderRadius: 'var(--border-radius)', 
											padding: '20px', 
											cursor: 'pointer',
											transition: 'all 0.3s ease',
											boxShadow: 'var(--shadow-sm)'
										}}
										onMouseOver={(e) => {
											e.target.style.transform = 'translateY(-4px)';
											e.target.style.boxShadow = 'var(--shadow-md)';
										}}
										onMouseOut={(e) => {
											e.target.style.transform = 'translateY(0)';
											e.target.style.boxShadow = 'var(--shadow-sm)';
										}}
									>
										<div style={{ fontWeight: '700', color: '#2d3748', marginBottom: '8px', fontSize: '1.2rem' }}>
											{month.name}
										</div>
										<div style={{ fontSize: '14px', color: '#718096', marginBottom: '12px' }}>
											{month.records.length} attendance records
										</div>
										<div style={{ 
											textAlign: 'right', 
											fontSize: '20px', 
											color: '#667eea',
											fontWeight: '600'
										}}>→</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{viewMode === 'subjects' && selectedMonth && (
					<div>
						<h3 style={{ marginBottom: '12px', color: '#4a5568', fontSize: '1.2rem' }}>
							Subjects for {selectedMonth.name}
						</h3>
						{getSubjectsFromMonth(selectedMonth.records).length === 0 ? (
							<div style={{ 
								textAlign: 'center', 
								padding: '40px', 
								color: '#718096',
								fontStyle: 'italic'
							}}>
								No subjects found for this month.
							</div>
						) : (
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
								{getSubjectsFromMonth(selectedMonth.records).map(subject => {
									const stats = getSubjectStats(subject.records);
									const isSafe = stats.percentage >= 75;
									return (
										<div 
											key={subject.subject}
											onClick={() => handleSubjectClick(subject)}
											style={{ 
												background: 'var(--glass-bg)', 
												border: '1px solid var(--glass-border)', 
												borderRadius: 'var(--border-radius)', 
												padding: '20px', 
												cursor: 'pointer',
												transition: 'all 0.3s ease',
												boxShadow: 'var(--shadow-sm)',
												borderLeft: `4px solid ${isSafe ? '#48bb78' : '#e53e3e'}`
											}}
											onMouseOver={(e) => {
												e.target.style.transform = 'translateY(-4px)';
												e.target.style.boxShadow = 'var(--shadow-md)';
											}}
											onMouseOut={(e) => {
												e.target.style.transform = 'translateY(0)';
												e.target.style.boxShadow = 'var(--shadow-sm)';
											}}
										>
											<div style={{ fontWeight: '700', color: '#2d3748', marginBottom: '8px', fontSize: '1.1rem' }}>
												{subject.subject}
											</div>
											<div style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
												{subject.teacher}
											</div>
											<div style={{ fontSize: '14px', color: '#718096', marginBottom: '12px' }}>
												Present: {stats.present} / Total: {stats.total}
											</div>
											<div style={{ 
												fontSize: '16px', 
												fontWeight: '600',
												color: isSafe ? '#38a169' : '#e53e3e',
												marginBottom: '8px'
											}}>
												{Math.round(stats.percentage)}% attendance
											</div>
											<div style={{ 
												textAlign: 'right', 
												fontSize: '20px', 
												color: '#667eea',
												fontWeight: '600'
											}}>→</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}

				{viewMode === 'details' && selectedSubject && (
					<div>
						<h3 style={{ marginBottom: '12px', color: '#4a5568', fontSize: '1.2rem' }}>
							{selectedSubject.subject} - {selectedMonth.name}
						</h3>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
							{selectedSubject.records.map(record => (
								<div key={record.id} style={{ 
									background: 'var(--glass-bg)', 
									border: '1px solid var(--glass-border)', 
									borderRadius: 'var(--border-radius)', 
									padding: '16px', 
									display: 'flex', 
									justifyContent: 'space-between', 
									alignItems: 'center',
									boxShadow: 'var(--shadow-sm)'
								}}>
									<div style={{ flex: 1 }}>
										<div style={{ 
											display: 'flex', 
											alignItems: 'center', 
											gap: '12px', 
											marginBottom: '4px' 
										}}>
											<span style={{ fontWeight: '600', color: '#4a5568' }}>
												{record.subject}
											</span>
											<span style={{ fontSize: '14px', color: '#718096' }}>
												{record.teacher}
											</span>
										</div>
										<div style={{ fontSize: '14px', color: '#718096' }}>
											{formatDate(record.date)} • {record.start_time}-{record.end_time}
										</div>
									</div>
									
									<div style={{ 
										display: 'flex', 
										alignItems: 'center', 
										gap: '12px' 
									}}>
										<span className={getStatusColor(record.attended)} style={{ 
											padding: '4px 12px', 
											borderRadius: 'var(--border-radius-sm)', 
											fontSize: '12px', 
											fontWeight: '600',
											background: record.attended ? '#d4edda' : '#f8d7da',
											color: record.attended ? '#155724' : '#721c24'
										}}>
											{record.attended ? 'Present' : 'Absent'}
										</span>
										
										{!record.attended && record.reason_category && (
											<div style={{ 
												display: 'flex', 
												flexDirection: 'column', 
												alignItems: 'flex-end', 
												gap: '4px' 
											}}>
												{getReasonBadge(record.reason_category)}
												{record.reason_text && (
													<span style={{ fontSize: '12px', color: '#718096', fontStyle: 'italic' }}>
														"{record.reason_text}"
													</span>
												)}
											</div>
										)}
										
										<button 
											onClick={() => setEditingRecord(record)}
											style={{ 
												background: 'var(--primary-gradient)', 
												color: 'white', 
												border: 'none', 
												padding: '6px 12px', 
												borderRadius: 'var(--border-radius-sm)', 
												cursor: 'pointer',
												fontSize: '12px',
												fontWeight: '600',
												transition: 'all 0.3s ease'
											}}
											onMouseOver={(e) => {
												e.target.style.transform = 'translateY(-2px)';
												e.target.style.boxShadow = 'var(--shadow-sm)';
											}}
											onMouseOut={(e) => {
												e.target.style.transform = 'translateY(0)';
												e.target.style.boxShadow = 'none';
											}}
										>
											Edit
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
			
			{/* Edit Dialog */}
			{editingRecord && (
				<EditDialog 
					record={editingRecord} 
					onSubmit={(attended, reasonCategory, reasonText, applyToAllSubject) => {
						updateAttendance(editingRecord.id, attended, reasonCategory, reasonText, applyToAllSubject);
					}} 
					onCancel={() => setEditingRecord(null)} 
				/>
			)}
		</div>
	);
}

function EditDialog({ record, onSubmit, onCancel }) {
	const [attended, setAttended] = useState(record.attended);
	const [reasonCategory, setReasonCategory] = useState(record.reason_category || '');
	const [reasonText, setReasonText] = useState(record.reason_text || '');
	const [applyToAllSubject, setApplyToAllSubject] = useState(false);

	return (
		<>
			<div className="popup-overlay" onClick={onCancel}></div>
			<div className="event-popup">
				<h3>Edit Attendance Record</h3>
				<div style={{ marginBottom: '16px' }}>
					<label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
						<input 
							type="radio" 
							checked={attended} 
							onChange={() => setAttended(true)} 
						/>
						Present
					</label>
					<label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<input 
							type="radio" 
							checked={!attended} 
							onChange={() => setAttended(false)} 
						/>
						Absent
					</label>
				</div>
				
				{!attended && (
					<>
						<select 
							value={reasonCategory} 
							onChange={e => setReasonCategory(e.target.value)}
							style={{ marginBottom: '12px' }}
						>
							<option value="">Select reason</option>
							{REASONS.map(r => (
								<option key={r} value={r}>{r.replace('_', ' ')}</option>
							))}
						</select>
						<input 
							placeholder="Additional details (optional)" 
							value={reasonText} 
							onChange={e => setReasonText(e.target.value)}
							style={{ marginBottom: '12px' }}
						/>
						<label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
							<input 
								type="checkbox" 
								checked={applyToAllSubject} 
								onChange={e => setApplyToAllSubject(e.target.checked)} 
							/>
							Apply to all {record.subject} classes
						</label>
					</>
				)}
				
				<div className="popup-actions">
					<button onClick={onCancel}>Cancel</button>
					<button onClick={() => onSubmit(attended, reasonCategory, reasonText, applyToAllSubject)}>
						Save
					</button>
				</div>
			</div>
		</>
	);
}

