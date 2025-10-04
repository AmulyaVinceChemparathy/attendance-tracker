import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

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
			no_class: 'bg-orange-100 text-orange-800',
			strike: 'bg-red-200 text-red-900',
			other: 'bg-gray-100 text-gray-800'
		};
		return (
			<span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[reason] || colors.other}`}>
				{reason === 'public_holiday' ? 'Public Holiday' : 
				 reason === 'no_class' ? 'No Class' :
				 reason === 'strike' ? 'Strike' : reason}
			</span>
		);
	}

	function calculateAttendanceRequirement(stat) {
		if (!stat.total || stat.total === 0) return null;
		
		const currentRate = stat.attendanceRate || 0;
		const targetRate = 0.75; // 75%
		const currentPresent = stat.present || 0;
		const total = stat.total;
		
		// Calculate how many more can be absent to maintain 75%
		const minRequiredPresent = Math.ceil(total * targetRate);
		const canSkip = total - minRequiredPresent;
		const alreadyAbsent = total - currentPresent;
		const remainingSkips = canSkip - alreadyAbsent;
		
		return {
			currentRate,
			targetRate,
			minRequiredPresent,
			canSkip,
			alreadyAbsent,
			remainingSkips,
			isAtRisk: currentRate < targetRate,
			needsToAttend: Math.max(0, minRequiredPresent - currentPresent)
		};
	}

	function getRequirementStatus(requirement) {
		if (!requirement) return null;
		
		const { currentRate, remainingSkips, isAtRisk, needsToAttend } = requirement;
		
		if (currentRate >= 0.75) {
			return {
				status: 'safe',
				color: '#38a169',
				bgColor: 'rgba(56, 161, 105, 0.1)',
				message: `Safe! You can skip ${remainingSkips} more classes`
			};
		} else if (remainingSkips >= 0) {
			return {
				status: 'warning',
				color: '#d69e2e',
				bgColor: 'rgba(214, 158, 46, 0.1)',
				message: `Warning! You can skip ${remainingSkips} more classes`
			};
		} else {
			return {
				status: 'danger',
				color: '#e53e3e',
				bgColor: 'rgba(229, 62, 62, 0.1)',
				message: `Critical! You must attend ${needsToAttend} more classes to reach 75%`
			};
		}
	}

	async function updateAttendance(recordId, attended, reasonCategory, reasonText, applyToAllSubject = false) {
		try {
			if (applyToAllSubject) {
				// Get the subject from the current record
				const currentRecord = attendance.find(r => r.id === recordId);
				if (currentRecord) {
					// Update all records for this subject
					await api('/attendance/bulk-update', { 
						method: 'PUT', 
						body: { 
							subject: currentRecord.subject,
							attended, 
							reasonCategory, 
							reasonText 
						} 
					});
				}
			} else {
				// Update only this record
				await api('/attendance', { 
					method: 'PUT', 
					body: { 
						id: recordId, 
						attended, 
						reasonCategory, 
						reasonText 
					} 
				});
			}
			await loadAttendance();
			await loadStats();
			setEditingRecord(null);
		} catch (e) {
			console.error('Failed to update attendance:', e);
		}
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

	if (loading) {
		return (
			<div className="card">
				<div className="loading">Loading attendance records...</div>
			</div>
		);
	}

	return (
		<div>
			<div className="card">
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
				<h2>Attendance Records</h2>
					{viewMode !== 'months' && (
						<button 
							onClick={viewMode === 'subjects' ? handleBackToMonths : handleBackToSubjects}
							style={{
								padding: '8px 16px',
								background: '#667eea',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor: 'pointer'
							}}
						>
							← Back
						</button>
					)}
				</div>
				
				{/* Date Range Filter */}
				<div className="form row" style={{ marginBottom: '20px' }}>
					<input
						id="attendance-from-date"
						name="fromDate"
						type="date"
						placeholder="From Date"
						value={dateRange.from}
						onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
					/>
					<input
						id="attendance-to-date"
						name="toDate"
						type="date"
						placeholder="To Date"
						value={dateRange.to}
						onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
					/>
					<button onClick={() => setDateRange({ from: '', to: '' })}>Clear Filter</button>
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
								background: 'rgba(255, 255, 255, 0.5)',
								borderRadius: '12px'
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
									background: 'rgba(255, 255, 255, 0.9)',
									padding: '20px',
									borderRadius: '16px',
											border: '2px solid rgba(102, 126, 234, 0.2)',
									boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
											cursor: 'pointer',
											transition: 'all 0.3s ease',
									position: 'relative',
									overflow: 'hidden'
										}}
										onMouseOver={(e) => {
											e.target.style.transform = 'translateY(-2px)';
											e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
										}}
										onMouseOut={(e) => {
											e.target.style.transform = 'translateY(0)';
											e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
										}}
									>
										<div style={{ fontWeight: '700', color: '#2d3748', marginBottom: '8px', fontSize: '1.2rem' }}>
											{month.name}
										</div>
										<div style={{ fontSize: '14px', color: '#718096', marginBottom: '12px' }}>
											{month.records.length} attendance records
										</div>
									<div style={{
										position: 'absolute',
											top: '20px', 
											right: '20px',
											fontSize: '24px',
											color: '#667eea'
										}}>
											→
										</div>
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
								background: 'rgba(255, 255, 255, 0.5)',
								borderRadius: '12px'
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
												background: 'rgba(255, 255, 255, 0.9)',
												padding: '20px',
												borderRadius: '16px',
												border: `2px solid ${isSafe ? 'rgba(56, 161, 105, 0.3)' : 'rgba(229, 62, 62, 0.3)'}`,
												boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
												cursor: 'pointer',
												transition: 'all 0.3s ease',
												position: 'relative',
												overflow: 'hidden'
											}}
											onMouseOver={(e) => {
												e.target.style.transform = 'translateY(-2px)';
												e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
											}}
											onMouseOut={(e) => {
												e.target.style.transform = 'translateY(0)';
												e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
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
												position: 'absolute', 
												top: '20px', 
												right: '20px',
												fontSize: '24px',
												color: '#667eea'
											}}>
												→
											</div>
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
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									padding: '16px 20px',
									background: 'rgba(255, 255, 255, 0.8)',
									borderRadius: '12px',
									border: '1px solid rgba(255, 255, 255, 0.2)',
									transition: 'all 0.3s ease'
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
											padding: '6px 12px',
											borderRadius: '8px',
											fontWeight: '500',
											fontSize: '14px',
											background: record.attended ? 'rgba(56, 161, 105, 0.1)' : 'rgba(229, 62, 62, 0.1)',
											color: record.attended ? '#38a169' : '#e53e3e'
										}}>
											{record.attended ? 'Present' : 'Absent'}
										</span>
										
										{!record.attended && record.reason_category && (
											<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
												padding: '6px 12px',
												background: '#667eea',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												fontSize: '12px',
												cursor: 'pointer',
												transition: 'background 0.2s'
											}}
											onMouseOver={(e) => e.target.style.background = '#5a67d8'}
											onMouseOut={(e) => e.target.style.background = '#667eea'}
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
	const [reasonCategory, setReasonCategory] = useState(record.reason_category || 'health');
	const [reasonText, setReasonText] = useState(record.reason_text || '');
	const [applyToAllSubject, setApplyToAllSubject] = useState(false);

	return (
		<div style={{ 
			position: 'fixed', 
			top: '50%', 
			left: '50%', 
			transform: 'translate(-50%, -50%)', 
			background: 'white', 
			padding: '20px', 
			borderRadius: '8px', 
			boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
			zIndex: 1000,
			minWidth: '300px',
			maxWidth: '500px'
		}}>
			<h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Edit Attendance</h3>
			<div style={{ marginBottom: '15px' }}>
				<strong>{record.subject}</strong> • {record.teacher}
			</div>
			<div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
				{new Date(record.date).toLocaleDateString('en-US', {
					weekday: 'short',
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				})} • {record.start_time}-{record.end_time}
			</div>
			
			<div style={{ marginBottom: '15px' }}>
				<label style={{ display: 'block', marginBottom: '5px' }}>Status:</label>
				<div style={{ display: 'flex', gap: '10px' }}>
					<label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
						<input 
							id="attendance-edit-present" 
							name="attended" 
							type="radio" 
							checked={attended} 
							onChange={() => setAttended(true)} 
						/>
						Present
					</label>
					<label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
						<input 
							id="attendance-edit-absent" 
							name="attended" 
							type="radio" 
							checked={!attended} 
							onChange={() => setAttended(false)} 
						/>
						Absent
					</label>
				</div>
			</div>

			{!attended && (
				<div style={{ marginBottom: '15px' }}>
					<label style={{ display: 'block', marginBottom: '5px' }}>Reason Category:</label>
					<select 
						id="attendance-edit-reason-category" 
						name="reasonCategory" 
						value={reasonCategory} 
						onChange={e => setReasonCategory(e.target.value)}
						style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
					>
						{REASONS.map(r => (
							<option key={r} value={r}>
								{r === 'public_holiday' ? 'Public Holiday' : 
								 r === 'no_class' ? 'No Class' :
								 r === 'strike' ? 'Strike' : r}
							</option>
						))}
					</select>
				</div>
			)}

			{!attended && (
				<div style={{ marginBottom: '15px' }}>
					<label style={{ display: 'block', marginBottom: '5px' }}>Additional Details:</label>
					<input 
						id="attendance-edit-reason-text" 
						name="reasonText" 
						placeholder="Additional details..." 
						value={reasonText} 
						onChange={e => setReasonText(e.target.value)}
						style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
					/>
				</div>
			)}

			<div style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
				<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
					<input 
						id="attendance-edit-apply-all" 
						name="applyToAllSubject" 
						type="checkbox" 
						checked={applyToAllSubject} 
						onChange={e => setApplyToAllSubject(e.target.checked)}
					/>
					<span style={{ fontSize: '14px', fontWeight: '500' }}>
						Apply this change to ALL {record.subject} classes
					</span>
				</label>
				<div style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '24px' }}>
					⚠️ This will update all attendance records for this subject across all dates
				</div>
			</div>

			<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
				<button 
					onClick={onCancel}
					style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }}
				>
					Cancel
				</button>
				<button 
					onClick={() => onSubmit(attended, reasonCategory, reasonText, applyToAllSubject)}
					style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#007bff', color: 'white' }}
				>
					Save Changes
				</button>
			</div>
		</div>
	);
}
