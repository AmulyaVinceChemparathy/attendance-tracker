import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function Attendances() {
	const [attendance, setAttendance] = useState([]);
	const [stats, setStats] = useState([]);
	const [loading, setLoading] = useState(true);
	const [dateRange, setDateRange] = useState({ from: '', to: '' });

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

	function getStatusColor(attended) {
		return attended ? 'status-present' : 'status-absent';
	}

	function getReasonBadge(reason) {
		if (!reason) return null;
		const colors = {
			health: 'bg-red-100 text-red-800',
			program: 'bg-blue-100 text-blue-800',
			travel: 'bg-yellow-100 text-yellow-800',
			other: 'bg-gray-100 text-gray-800'
		};
		return (
			<span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[reason] || colors.other}`}>
				{reason}
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
				<h2>Attendance Records</h2>
				
				{/* Date Range Filter */}
				<div className="form row" style={{ marginBottom: '20px' }}>
					<input
						type="date"
						placeholder="From Date"
						value={dateRange.from}
						onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
					/>
					<input
						type="date"
						placeholder="To Date"
						value={dateRange.to}
						onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
					/>
					<button onClick={() => setDateRange({ from: '', to: '' })}>Clear Filter</button>
				</div>

				{/* Statistics with 75% Requirement */}
				<div style={{ marginBottom: '24px' }}>
					<h3 style={{ marginBottom: '12px', color: '#4a5568', fontSize: '1.2rem' }}>
						Summary (75% Minimum Required)
					</h3>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
						{stats.map(stat => {
							const requirement = calculateAttendanceRequirement(stat);
							const status = getRequirementStatus(requirement);
							
							return (
								<div key={stat.class_id} style={{
									background: 'rgba(255, 255, 255, 0.9)',
									padding: '20px',
									borderRadius: '16px',
									border: `2px solid ${status ? status.color : 'rgba(255, 255, 255, 0.2)'}`,
									boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
									position: 'relative',
									overflow: 'hidden'
								}}>
									{/* Status indicator bar */}
									<div style={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										height: '4px',
										background: status ? status.color : '#e2e8f0'
									}} />
									
									<div style={{ fontWeight: '700', color: '#2d3748', marginBottom: '8px', fontSize: '1.1rem' }}>
										{stat.subject}
									</div>
									
									<div style={{ fontSize: '14px', color: '#718096', marginBottom: '12px' }}>
										Present: {stat.present || 0} / Total: {stat.total || 0}
									</div>
									
									{requirement && (
										<div style={{ marginBottom: '12px' }}>
											<div style={{ 
												fontSize: '16px', 
												fontWeight: '600',
												color: status ? status.color : '#4a5568',
												marginBottom: '4px'
											}}>
												{Math.round(requirement.currentRate * 100)}% attendance
											</div>
											
											{/* Progress bar */}
											<div style={{
												width: '100%',
												height: '8px',
												background: '#e2e8f0',
												borderRadius: '4px',
												overflow: 'hidden',
												marginBottom: '8px'
											}}>
												<div style={{
													width: `${Math.min(100, requirement.currentRate * 100)}%`,
													height: '100%',
													background: status ? status.color : '#667eea',
													borderRadius: '4px',
													transition: 'width 0.3s ease'
												}} />
											</div>
											
											{/* 75% target line */}
											<div style={{
												position: 'relative',
												height: '8px',
												marginTop: '-8px'
											}}>
												<div style={{
													position: 'absolute',
													left: '75%',
													top: '-2px',
													width: '2px',
													height: '12px',
													background: '#e53e3e',
													borderRadius: '1px'
												}} />
												<span style={{
													position: 'absolute',
													left: '75%',
													top: '12px',
													fontSize: '10px',
													color: '#e53e3e',
													fontWeight: '600',
													transform: 'translateX(-50%)'
												}}>
													75%
												</span>
											</div>
										</div>
									)}
									
									{/* Requirement status message */}
									{status && (
										<div style={{
											padding: '12px',
											borderRadius: '8px',
											background: status.bgColor,
											border: `1px solid ${status.color}`,
											color: status.color,
											fontSize: '13px',
											fontWeight: '500',
											textAlign: 'center'
										}}>
											{status.message}
										</div>
									)}
									
									{/* Additional details */}
									{requirement && (
										<div style={{
											marginTop: '12px',
											padding: '12px',
											background: 'rgba(102, 126, 234, 0.05)',
											borderRadius: '8px',
											fontSize: '12px',
											color: '#4a5568'
										}}>
											<div style={{ marginBottom: '4px' }}>
												<strong>Target:</strong> {requirement.minRequiredPresent} out of {stat.total} classes
											</div>
											<div>
												<strong>Current:</strong> {stat.present || 0} out of {stat.total} classes
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Attendance Records */}
				<div>
					<h3 style={{ marginBottom: '12px', color: '#4a5568', fontSize: '1.2rem' }}>
						Records ({attendance.length})
					</h3>
					
					{attendance.length === 0 ? (
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
						<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
							{attendance.map(record => (
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
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
