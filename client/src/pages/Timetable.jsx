import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import CalendarGrid from '../components/CalendarGrid.jsx';

export default function Timetable() {
	const [classes, setClasses] = useState([]);
	const [form, setForm] = useState({ dayOfWeek:0, startTime:'08:00', endTime:'09:00', subject:'', teacher:'', location:'' });
	const [error, setError] = useState('');

	async function load() {
		const r = await api('/schedule');
		setClasses(r.classes);
	}
	useEffect(() => { load(); }, []);

	async function save(e) {
		e?.preventDefault();
		setError('');
		try {
			await api('/schedule', { method: 'POST', body: form });
			setForm({ dayOfWeek:0, startTime:'08:00', endTime:'09:00', subject:'', teacher:'', location:'' });
			await load();
		} catch (e) { setError(e.message); }
	}

	function onSelectSlot(slot) {
		setForm({ ...form, ...slot });
	}

	async function remove(id) {
		await api(`/schedule/${id}`, { method: 'DELETE' });
		await load();
	}

	return (
		<div className="timetable">
			<div className="panel">
				<h2>Timetable</h2>
				<form onSubmit={save} className="form">
					<select value={form.dayOfWeek} onChange={e=>setForm({...form, dayOfWeek:Number(e.target.value)})}>
						{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,i)=>(<option key={i} value={i}>{d}</option>))}
					</select>
					<div className="row">
						<input value={form.startTime} onChange={e=>setForm({...form, startTime:e.target.value})} type="time" />
						<input value={form.endTime} onChange={e=>setForm({...form, endTime:e.target.value})} type="time" />
					</div>
					<input placeholder="Subject" value={form.subject} onChange={e=>setForm({...form, subject:e.target.value})} required />
					<input placeholder="Teacher" value={form.teacher} onChange={e=>setForm({...form, teacher:e.target.value})} required />
					<input placeholder="Location (optional)" value={form.location} onChange={e=>setForm({...form, location:e.target.value})} />
					<button type="submit">Add / Save</button>
					{error && <div className="error">{error}</div>}
				</form>
				<ul className="list">
					{classes.map(c => (
						<li key={c.id}>
							<span>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][c.day_of_week]} {c.start_time}-{c.end_time} • {c.subject} ({c.teacher})</span>
							<button onClick={()=>remove(c.id)}>Delete</button>
						</li>
					))}
				</ul>
			</div>
			<div className="calendar-wrap">
				<CalendarGrid items={classes} onSelectSlot={onSelectSlot} />
			</div>
		</div>
	);
} 