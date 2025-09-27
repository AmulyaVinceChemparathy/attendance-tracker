import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import CalendarGrid from '../components/CalendarGrid';
import MonthlyCalendar from '../components/MonthlyCalendar';

export default function Timetable() {
	const [classes, setClasses] = useState([]);
	const [form, setForm] = useState({ dayOfWeek:0, startTime:'08:00', endTime:'09:00', subject:'', teacher:'', location:'' });
	const [error, setError] = useState('');
	const [showCalendar, setShowCalendar] = useState(false);
	const [editingClass, setEditingClass] = useState(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

	async function load() {
		const r = await api('/schedule');
		setClasses(r.classes);
		// Show calendar if there are classes
		setShowCalendar(r.classes.length > 0);
	}
	useEffect(() => { load(); }, []);

	async function save(e) {
		e?.preventDefault();
		setError('');
		try {
			if (editingClass) {
				// Update existing class
				await api(`/schedule/${editingClass.id}`, { method: 'PUT', body: form });
				setEditingClass(null);
			} else {
				// Create new class
				await api('/schedule', { method: 'POST', body: form });
			}
			setForm({ dayOfWeek:0, startTime:'08:00', endTime:'09:00', subject:'', teacher:'', location:'' });
			await load();
			// Show calendar after adding/updating a class
			setShowCalendar(true);
		} catch (e) { setError(e.message); }
	}

	function onSelectSlot(slot) {
		setForm({ ...form, ...slot });
	}

	function startEdit(classData) {
		setEditingClass(classData);
		setForm({
			dayOfWeek: classData.dayOfWeek ?? classData.day_of_week,
			startTime: classData.startTime ?? classData.start_time,
			endTime: classData.endTime ?? classData.end_time,
			subject: classData.subject,
			teacher: classData.teacher,
			location: classData.location || ''
		});
		setShowCalendar(false);
	}

	function cancelEdit() {
		setEditingClass(null);
		setForm({ dayOfWeek:0, startTime:'08:00', endTime:'09:00', subject:'', teacher:'', location:'' });
	}

	async function remove(id) {
		await api(`/schedule/${id}`, { method: 'DELETE' });
		await load();
		// Hide calendar if no classes left
		if (classes.length <= 1) {
			setShowCalendar(false);
		}
		setShowDeleteConfirm(null);
	}

	function confirmDelete(classData) {
		setShowDeleteConfirm(classData);
	}

	return (
		<div className="timetable">
			<div className="header">
				<h1>Attendance Tracker</h1>
				<nav>
					<a href="/">Home</a>
					<a href="/timetable">Timetable</a>
					<a href="/daily">Daily</a>
					<a href="/attendances">Attendances</a>
				</nav>
			</div>

			<div className="timetable-layout">
				{/* Monthly Calendar Sidebar */}
				<div className="monthly-calendar-sidebar">
					<MonthlyCalendar classes={classes} />
				</div>

				{/* Main Timetable Panel */}
				<div className="timetable-main">
					<div className="panel">
						<h2>{editingClass ? 'Edit Class' : 'Edit Timetable'}</h2>
						{!showCalendar && (
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
								<div className="form-buttons">
									<button type="submit">{editingClass ? 'Update Class' : 'Add Class'}</button>
									{editingClass && (
										<button type="button" onClick={cancelEdit} className="cancel-btn">Cancel</button>
									)}
								</div>
								{error && <div className="error">{error}</div>}
							</form>
						)}
						
						{showCalendar && (
							<>
								<div className="calendar-wrap">
									<CalendarGrid 
										items={classes} 
										onSelectSlot={onSelectSlot}
										onEdit={startEdit}
										onDelete={confirmDelete}
									/>
								</div>
								<div className="timetable-controls">
									<button onClick={() => setShowCalendar(false)} className="edit-btn">Add New Class</button>
								</div>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Delete Confirmation Dialog */}
			{showDeleteConfirm && (
				<>
					<div className="popup-overlay" onClick={() => setShowDeleteConfirm(null)}></div>
					<div className="confirmation-dialog">
						<h3>Delete Class</h3>
						<p>Are you sure you want to delete "{showDeleteConfirm.subject}"?</p>
						<p>This action cannot be undone.</p>
						<div className="dialog-buttons">
							<button onClick={() => setShowDeleteConfirm(null)} className="cancel-btn">Cancel</button>
							<button onClick={() => remove(showDeleteConfirm.id)} className="delete-btn">Delete</button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

