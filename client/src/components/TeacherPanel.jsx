import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function TeacherPanel({ mode = 'full' }) {
	const [daily, setDaily] = useState({ date: new Date().toISOString().slice(0, 10), status: 'present', note: '' });
	const [subjects, setSubjects] = useState([]);
	const [subjectForm, setSubjectForm] = useState({ subjectId: '', subjectName: '' });
	const [classFormBySubject, setClassFormBySubject] = useState({});
	const [classesBySubject, setClassesBySubject] = useState({});
	const [selectedClass, setSelectedClass] = useState(null);
	const [students, setStudents] = useState([]);
	const [addStudentId, setAddStudentId] = useState('');
	const [selectedStudent, setSelectedStudent] = useState(null);
	const [record, setRecord] = useState({ examsMarkScored: '', assignmentSubmitted: false, assignmentMarkGiven: '', notes: '' });
	const [attendancePopup, setAttendancePopup] = useState(false);
	const [absentIds, setAbsentIds] = useState(new Set());
	const [msg, setMsg] = useState('');

	const showDaily = mode === 'full' || mode === 'daily';
	const showSubjects = mode === 'full' || mode === 'subjects';

	useEffect(() => {
		if (showDaily) loadDaily();
		if (showSubjects) loadSubjects();
	}, [mode]);

	async function loadDaily() {
		const r = await api('/teacher/daily-status');
		setDaily(r.dailyStatus);
	}
	async function saveDaily(e) {
		e.preventDefault();
		await api('/teacher/daily-status', { method: 'POST', body: daily });
		setMsg('Daily status updated');
	}
	async function loadSubjects() {
		const r = await api('/teacher/subjects');
		setSubjects(r.subjects || []);
	}
	async function createSubject(e) {
		e.preventDefault();
		await api('/teacher/subjects', { method: 'POST', body: subjectForm });
		setSubjectForm({ subjectId: '', subjectName: '' });
		await loadSubjects();
		setMsg('Subject created');
	}
	async function loadClasses(subjectId) {
		const r = await api(`/teacher/subjects/${subjectId}/classes`);
		setClassesBySubject((p) => ({ ...p, [subjectId]: r.classes || [] }));
	}
	async function createClass(subjectId, e) {
		e.preventDefault();
		const classId = (classFormBySubject[subjectId] || '').trim();
		if (!classId) return;
		await api(`/teacher/subjects/${subjectId}/classes`, { method: 'POST', body: { classId } });
		setClassFormBySubject((p) => ({ ...p, [subjectId]: '' }));
		await loadClasses(subjectId);
		setMsg('Class created');
	}
	async function openClass(c) {
		setSelectedClass(c);
		const r = await api(`/teacher/classes/${c.id}/students`);
		setStudents(r.students || []);
	}
	async function addStudentToClass(e) {
		e.preventDefault();
		if (!selectedClass) return;
		await api(`/teacher/classes/${selectedClass.id}/students`, { method: 'POST', body: { studentId: addStudentId } });
		setAddStudentId('');
		await openClass(selectedClass);
		setMsg('Student added');
	}
	async function openStudent(s) {
		setSelectedStudent(s);
		const r = await api(`/teacher/classes/${selectedClass.id}/students/${s.user_id}/record`);
		setRecord({
			examsMarkScored: r.record.exams_mark_scored ?? '',
			assignmentSubmitted: !!r.record.assignment_submitted,
			assignmentMarkGiven: r.record.assignment_mark_given ?? '',
			notes: r.record.notes || '',
		});
	}
	async function saveRecord(e) {
		e.preventDefault();
		if (!selectedClass || !selectedStudent) return;
		await api(`/teacher/classes/${selectedClass.id}/students/${selectedStudent.user_id}/record`, {
			method: 'PUT',
			body: record,
		});
		setMsg('Record updated');
	}
	async function saveDailyAttendance() {
		if (!selectedClass) return;
		await api(`/teacher/classes/${selectedClass.id}/attendance/daily`, {
			method: 'POST',
			body: { date: new Date().toISOString().slice(0, 10), absentStudentIds: Array.from(absentIds) },
		});
		setAttendancePopup(false);
		setAbsentIds(new Set());
		await openClass(selectedClass);
		setMsg('Attendance updated');
	}

	return (
		<div className="card teacher-panel">
			{mode === 'full' && <h3>Teacher Panel</h3>}
			{mode === 'daily' && <h2>Daily</h2>}
			{showDaily && (
			<form onSubmit={saveDaily} className="form">
				<label>Today status</label>
				<select value={daily.status} onChange={(e) => setDaily({ ...daily, status: e.target.value })}>
					<option value="present">Present</option>
					<option value="absent">Absent</option>
				</select>
				<input placeholder="Note (optional)" value={daily.note || ''} onChange={(e) => setDaily({ ...daily, note: e.target.value })} />
				<button type="submit">Save Daily Status</button>
			</form>
			)}

			{showSubjects && (
			<>
			{mode === 'full' && <><hr /><h4>Subjects</h4></>}
			{mode === 'subjects' && <h2>Subjects</h2>}
			<form onSubmit={createSubject} className="form">
				<input placeholder="Subject ID" value={subjectForm.subjectId} onChange={(e) => setSubjectForm({ ...subjectForm, subjectId: e.target.value })} required />
				<input placeholder="Subject Name" value={subjectForm.subjectName} onChange={(e) => setSubjectForm({ ...subjectForm, subjectName: e.target.value })} required />
				<button type="submit">Create Subject</button>
			</form>

			{subjects.map((s) => (
				<div key={s.id} className="teacher-subject-card">
					<div><strong>{s.subject_code}</strong> - {s.subject_name}</div>
					<button type="button" className="teacher-action-btn" onClick={() => loadClasses(s.id)}>
						Load classes
					</button>
					<form onSubmit={(e) => createClass(s.id, e)} className="form">
						<input
							placeholder="Class ID"
							value={classFormBySubject[s.id] || ''}
							onChange={(e) => setClassFormBySubject((p) => ({ ...p, [s.id]: e.target.value }))}
							required
						/>
						<button type="submit">Add Class</button>
					</form>
					<ul className="menu teacher-menu">
						{(classesBySubject[s.id] || []).map((c) => (
							<li key={c.id}>
								<button type="button" className="teacher-action-btn" onClick={() => openClass(c)}>
									Class {c.class_code}
								</button>
							</li>
						))}
					</ul>
				</div>
			))}

			{selectedClass && (
				<div className="teacher-class-detail">
					<h4>Class {selectedClass.class_code}</h4>
					<form onSubmit={addStudentToClass} className="form">
						<input placeholder="Student ID" value={addStudentId} onChange={(e) => setAddStudentId(e.target.value)} required />
						<button type="submit">Add Student</button>
					</form>
					<button type="button" className="teacher-action-btn" onClick={() => setAttendancePopup(true)}>
						Update daily attendance
					</button>
					<ul className="menu teacher-menu">
						{students.map((st) => (
							<li key={st.user_id}>
								<button type="button" className="teacher-action-btn" onClick={() => openStudent(st)}>
									{st.fullname} ({st.student_id}) — {st.attendance_percentage}%
								</button>
							</li>
						))}
					</ul>
				</div>
			)}

			{selectedStudent && (
				<form onSubmit={saveRecord} className="form" style={{ marginTop: 10 }}>
					<h4>{selectedStudent.fullname} - Record</h4>
					<input
						placeholder="Exams mark scored"
						value={record.examsMarkScored}
						onChange={(e) => setRecord({ ...record, examsMarkScored: e.target.value })}
					/>
					<label>
						<input
							type="checkbox"
							checked={record.assignmentSubmitted}
							onChange={(e) => setRecord({ ...record, assignmentSubmitted: e.target.checked })}
						/>
						Assignment submitted
					</label>
					<input
						placeholder="Assignment mark given"
						value={record.assignmentMarkGiven}
						onChange={(e) => setRecord({ ...record, assignmentMarkGiven: e.target.value })}
					/>
					<input placeholder="Notes" value={record.notes} onChange={(e) => setRecord({ ...record, notes: e.target.value })} />
					<button type="submit">Save Record</button>
				</form>
			)}

			{attendancePopup && (
				<div className="card" style={{ marginTop: 10 }}>
					<h4>Mark Absent Students (others marked present)</h4>
					{students.map((st) => (
						<label key={st.user_id} style={{ display: 'block' }}>
							<input
								type="checkbox"
								checked={absentIds.has(st.user_id)}
								onChange={(e) => {
									const next = new Set(absentIds);
									if (e.target.checked) next.add(st.user_id); else next.delete(st.user_id);
									setAbsentIds(next);
								}}
							/>
							{st.fullname} ({st.student_id})
						</label>
					))}
					<div className="teacher-popup-actions">
						<button type="button" className="teacher-action-btn" onClick={saveDailyAttendance}>
							Save attendance
						</button>
						<button type="button" className="teacher-action-btn teacher-action-btn--secondary" onClick={() => setAttendancePopup(false)}>
							Close
						</button>
					</div>
				</div>
			)}
			</>
			)}
			{msg && <div className="success">{msg}</div>}
		</div>
	);
}

