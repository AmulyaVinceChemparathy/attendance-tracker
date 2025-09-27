import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

const REASONS = ['health','program','travel','public_holiday','no_class','strike','other'];

export default function Daily() {
	const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
	const [classes, setClasses] = useState([]);
	const [error, setError] = useState('');
	const [editingClass, setEditingClass] = useState(null);

	async function load(d = date) {
		const r = await api(`/attendance/daily?date=${d}`);
		setClasses(r.classes);
	}
	useEffect(() => { load(); }, []);

	async function mark(c, attended, reason_category, reason_text) {
		setError('');
		try {
			await api('/attendance', { method: 'POST', body: { date, classId: c.id, attended, reasonCategory: reason_category, reasonText: reason_text } });
			await load(date);
		} catch (e) { setError(e.message); }
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
				<h2>Today's Attendance</h2>
				<div className="row">
					<label>Date: <input type="date" value={date} onChange={e=>{setDate(e.target.value); load(e.target.value);}} /></label>
				</div>
				{classes.length === 0 && <div>No classes for this day.</div>}
				{classes.map(c => (
					<div className="attendance-item" key={c.id}>
						<div className="title">{c.subject} • {c.teacher} • {c.start_time}-{c.end_time}</div>
						{c.attendance ? (
							<div className="status">
								<span>Marked: {c.attendance.attended ? 'Yes' : `No (${c.attendance.reason_category || 'n/a'})`}</span>
								<button 
									onClick={() => setEditingClass(c)} 
									style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '12px' }}
								>
									Edit
								</button>
							</div>
						) : (
							<div className="actions">
								<button onClick={()=>mark(c, true)}>Yes</button>
								<NoDialog onSubmit={(cat, txt)=>mark(c, false, cat, txt)} />
							</div>
						)}
					</div>
				))}
				{error && <div className="error">{error}</div>}
			</div>

			{editingClass && (
				<EditDialog 
					classData={editingClass}
					onSubmit={(attended, reasonCategory, reasonText) => {
						mark(editingClass, attended, reasonCategory, reasonText);
						setEditingClass(null);
					}}
					onCancel={() => setEditingClass(null)}
				/>
			)}
		</div>
	);
}

function NoDialog({ onSubmit }) {
	const [show, setShow] = useState(false);
	const [reason, setReason] = useState('');
	const [text, setText] = useState('');

	return (
		<>
			<button onClick={() => setShow(true)}>No</button>
			{show && (
				<>
					<div className="popup-overlay" onClick={() => setShow(false)}></div>
					<div className="event-popup">
						<h3>Reason for Absence</h3>
						<select value={reason} onChange={e => setReason(e.target.value)}>
							<option value="">Select reason</option>
							{REASONS.map(r => <option key={r} value={r}>{r}</option>)}
						</select>
						<input placeholder="Additional details (optional)" value={text} onChange={e => setText(e.target.value)} />
						<div className="popup-actions">
							<button onClick={() => setShow(false)}>Cancel</button>
							<button onClick={() => { onSubmit(reason, text); setShow(false); }}>Submit</button>
						</div>
					</div>
				</>
			)}
		</>
	);
}

function EditDialog({ classData, onSubmit, onCancel }) {
	const [attended, setAttended] = useState(classData.attendance?.attended ?? true);
	const [reason, setReason] = useState(classData.attendance?.reason_category ?? '');
	const [text, setText] = useState(classData.attendance?.reason_text ?? '');

	return (
		<>
			<div className="popup-overlay" onClick={onCancel}></div>
			<div className="event-popup">
				<h3>Edit Attendance</h3>
				<div>
					<label>
						<input type="radio" checked={attended} onChange={() => setAttended(true)} />
						Present
					</label>
					<label>
						<input type="radio" checked={!attended} onChange={() => setAttended(false)} />
						Absent
					</label>
				</div>
				{!attended && (
					<>
						<select value={reason} onChange={e => setReason(e.target.value)}>
							<option value="">Select reason</option>
							{REASONS.map(r => <option key={r} value={r}>{r}</option>)}
						</select>
						<input placeholder="Additional details (optional)" value={text} onChange={e => setText(e.target.value)} />
					</>
				)}
				<div className="popup-actions">
					<button onClick={onCancel}>Cancel</button>
					<button onClick={() => onSubmit(attended, reason, text)}>Save</button>
				</div>
			</div>
		</>
	);
}

