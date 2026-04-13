import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import CalendarGrid from '../components/CalendarGrid.jsx';
import MonthlyCalendar from '../components/MonthlyCalendar.jsx';
import { useAuth } from '../state/AuthContext.jsx';

export default function Timetable() {
	const { userRole, roleReady } = useAuth();
	const isTeacher = roleReady && userRole === 'teacher';

	const [classes, setClasses] = useState([]);
	const [form, setForm] = useState({ dayOfWeek:0, startTime:'08:00', endTime:'09:00', subject:'', teacher:'', location:'' });
	const [error, setError] = useState('');
	const [showCalendar, setShowCalendar] = useState(false);
	const [editingClass, setEditingClass] = useState(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

	const [slotAttendance, setSlotAttendance] = useState(null);
	const [lookupClasses, setLookupClasses] = useState([]);
	const [lookupMatched, setLookupMatched] = useState(true);
	const [slotPickClassId, setSlotPickClassId] = useState('');
	const [slotStudents, setSlotStudents] = useState([]);
	const [slotAbsentIds, setSlotAbsentIds] = useState(() => new Set());
	const [slotDate, setSlotDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [slotErr, setSlotErr] = useState('');
	const [slotLoading, setSlotLoading] = useState(false);

	function openSlotAttendance(ev) {
		setSlotAttendance({ subject: ev.subject || '' });
		setSlotPickClassId('');
		setSlotStudents([]);
		setSlotAbsentIds(new Set());
		setSlotDate(new Date().toISOString().slice(0, 10));
		setSlotErr('');
		setLookupClasses([]);
		setLookupMatched(true);
	}

	useEffect(() => {
		if (!slotAttendance) return;
		let cancelled = false;
		(async () => {
			setSlotLoading(true);
			setSlotErr('');
			try {
				const q = encodeURIComponent(slotAttendance.subject || '');
				const r = await api(`/teacher/classes/lookup?subject=${q}`);
				if (cancelled) return;
				const list = r.classes || [];
				setLookupClasses(list);
				setLookupMatched(r.matched !== false);
				if (list.length === 1) setSlotPickClassId(String(list[0].id));
			} catch (e) {
				if (!cancelled) setSlotErr(e.message);
			} finally {
				if (!cancelled) setSlotLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [slotAttendance]);

	useEffect(() => {
		if (!slotPickClassId) {
			setSlotStudents([]);
			return;
		}
		let cancelled = false;
		(async () => {
			try {
				const r = await api(`/teacher/classes/${slotPickClassId}/students`);
				if (!cancelled) setSlotStudents(r.students || []);
			} catch (e) {
				if (!cancelled) setSlotErr(e.message);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [slotPickClassId]);

	async function saveSlotAttendance() {
		if (!slotPickClassId) return;
		setSlotErr('');
		try {
			await api(`/teacher/classes/${slotPickClassId}/attendance/daily`, {
				method: 'POST',
				body: { date: slotDate, absentStudentIds: Array.from(slotAbsentIds) },
			});
			setSlotAttendance(null);
		} catch (e) {
			setSlotErr(e.message);
		}
	}

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
			<div className="timetable-layout">
				{/* Monthly Calendar Sidebar */}
				<div className="monthly-calendar-sidebar">
					<MonthlyCalendar classes={classes} />
				</div>

				{/* Main Timetable Panel */}
				<div className="timetable-main">
					<div className="panel">
						<h2>{editingClass ? 'Edit Class' : isTeacher ? 'Your timetable' : 'Edit Timetable'}</h2>
						{isTeacher && !editingClass && (
							<p className="muted" style={{ marginTop: 0 }}>
								This is your weekly schedule. Click a class to update daily attendance for a matching subject/class.
							</p>
						)}
						{!showCalendar && (
							<form onSubmit={save} className="form">
								<select 
									id="class-dayOfWeek" 
									name="dayOfWeek" 
									value={form.dayOfWeek} 
									onChange={e=>setForm({...form, dayOfWeek:Number(e.target.value)})}
								>
									{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,i)=>(<option key={i} value={i}>{d}</option>))}
								</select>
								<div className="row">
									<input 
										id="class-startTime" 
										name="startTime" 
										value={form.startTime} 
										onChange={e=>setForm({...form, startTime:e.target.value})} 
										type="time" 
									/>
									<input 
										id="class-endTime" 
										name="endTime" 
										value={form.endTime} 
										onChange={e=>setForm({...form, endTime:e.target.value})} 
										type="time" 
									/>
								</div>
								<input 
									id="class-subject" 
									name="subject" 
									placeholder="Subject" 
									value={form.subject} 
									onChange={e=>setForm({...form, subject:e.target.value})} 
									required 
								/>
								<input 
									id="class-teacher" 
									name="teacher" 
									placeholder="Teacher" 
									value={form.teacher} 
									onChange={e=>setForm({...form, teacher:e.target.value})} 
									required 
								/>
								<input 
									id="class-location" 
									name="location" 
									placeholder="Location (optional)" 
									value={form.location} 
									onChange={e=>setForm({...form, location:e.target.value})} 
								/>
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
										onTakeAttendance={isTeacher ? openSlotAttendance : undefined}
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

			{slotAttendance && (
				<>
					<div className="popup-overlay" onClick={() => setSlotAttendance(null)} />
					<div className="confirmation-dialog" style={{ maxWidth: 440 }}>
						<h3>Update daily attendance</h3>
						<p>
							Slot subject: <strong>{slotAttendance.subject || '—'}</strong>
						</p>
						{!lookupMatched && lookupClasses.length > 0 && (
							<p className="muted" style={{ fontSize: '0.9rem' }}>
								No strong match to your subjects — choose the class below.
							</p>
						)}
						{slotLoading && <p>Loading classes…</p>}
						{!slotLoading && lookupClasses.length === 0 && (
							<p className="muted">No classes found. Add subjects and classes under Subject in the menu.</p>
						)}
						{slotErr && <div className="error">{slotErr}</div>}
						<label className="form" style={{ display: 'block', marginBottom: 12 }}>
							<span>Class</span>
							<select
								value={slotPickClassId}
								onChange={(e) => {
									setSlotPickClassId(e.target.value);
									setSlotAbsentIds(new Set());
								}}
								style={{ width: '100%', marginTop: 4 }}
							>
								<option value="">Select class</option>
								{lookupClasses.map((c) => (
									<option key={c.id} value={c.id}>
										{c.class_code} — {c.subject_code} ({c.subject_name})
									</option>
								))}
							</select>
						</label>
						<label className="form" style={{ display: 'block', marginBottom: 12 }}>
							<span>Date</span>
							<input
								type="date"
								value={slotDate}
								onChange={(e) => setSlotDate(e.target.value)}
								style={{ width: '100%', marginTop: 4 }}
							/>
						</label>
						{slotPickClassId && slotStudents.length === 0 && !slotLoading && (
							<p className="muted">No students in this class yet.</p>
						)}
						{slotStudents.map((st) => (
							<label key={st.user_id} style={{ display: 'block', marginBottom: 6 }}>
								<input
									type="checkbox"
									checked={slotAbsentIds.has(st.user_id)}
									onChange={(e) => {
										const next = new Set(slotAbsentIds);
										if (e.target.checked) next.add(st.user_id);
										else next.delete(st.user_id);
										setSlotAbsentIds(next);
									}}
								/>{' '}
								Absent: {st.fullname} ({st.student_id})
							</label>
						))}
						<div className="dialog-buttons" style={{ marginTop: 16 }}>
							<button type="button" onClick={() => setSlotAttendance(null)} className="cancel-btn">
								Cancel
							</button>
							<button
								type="button"
								onClick={saveSlotAttendance}
								className="edit-btn"
								disabled={!slotPickClassId}
							>
								Save attendance
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	);
} 