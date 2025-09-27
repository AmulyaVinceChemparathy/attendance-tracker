import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

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
			{editingClass && (
				<EditDialog 
					class={editingClass} 
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

function EditDialog({ class: classData, onSubmit, onCancel }) {
	const [attended, setAttended] = useState(classData.attendance.attended);
	const [reasonCategory, setReasonCategory] = useState(classData.attendance.reason_category || 'health');
	const [reasonText, setReasonText] = useState(classData.attendance.reason_text || '');

	return (
		<div className="dialog" style={{ 
			position: 'fixed', 
			top: '50%', 
			left: '50%', 
			transform: 'translate(-50%, -50%)', 
			background: 'white', 
			padding: '20px', 
			borderRadius: '8px', 
			boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
			zIndex: 1000,
			minWidth: '300px'
		}}>
			<h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Edit Attendance</h3>
			<div style={{ marginBottom: '15px' }}>
				<strong>{classData.subject}</strong> • {classData.teacher}
			</div>
			
			<div style={{ marginBottom: '15px' }}>
				<label style={{ display: 'block', marginBottom: '5px' }}>Status:</label>
				<div style={{ display: 'flex', gap: '10px' }}>
					<label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
						<input 
							type="radio" 
							checked={attended} 
							onChange={() => setAttended(true)} 
						/>
						Present
					</label>
					<label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
						<input 
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
					<label style={{ display: 'block', marginBottom: '5px' }}>Reason Details (optional):</label>
					<input 
						placeholder="Additional details..." 
						value={reasonText} 
						onChange={e => setReasonText(e.target.value)}
						style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
					/>
				</div>
			)}

			<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
				<button 
					onClick={onCancel}
					style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }}
				>
					Cancel
				</button>
				<button 
					onClick={() => onSubmit(attended, reasonCategory, reasonText)}
					style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#007bff', color: 'white' }}
				>
					Save Changes
				</button>
			</div>
		</div>
	);
} 