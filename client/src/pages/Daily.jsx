import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const REASONS = ['health','program','travel','public_holiday','other'];

export default function Daily() {
	const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
	const [classes, setClasses] = useState([]);
	const [error, setError] = useState('');

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
						<div className="status">Marked: {c.attendance.attended ? 'Yes' : `No (${c.attendance.reason_category || 'n/a'})`}</div>
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
	);
}

function NoDialog({ onSubmit }) {
	const [open, setOpen] = useState(false);
	const [cat, setCat] = useState('health');
	const [txt, setTxt] = useState('');
	if (!open) return <button onClick={()=>setOpen(true)}>No</button>;
	return (
		<div className="dialog">
			<select value={cat} onChange={e=>setCat(e.target.value)}>
				{REASONS.map(r => <option key={r} value={r}>{r}</option>)}
			</select>
			<input placeholder="Reason (optional)" value={txt} onChange={e=>setTxt(e.target.value)} />
			<button onClick={()=>{onSubmit(cat, txt); setOpen(false); setCat('health'); setTxt('');}}>Submit</button>
			<button onClick={()=>setOpen(false)}>Cancel</button>
		</div>
	);
} 