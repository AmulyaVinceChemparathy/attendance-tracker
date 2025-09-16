import React, { useEffect, useState } from 'react';

const hours = Array.from({ length: 24 }, (_, i) => i); // 0:00 - 23:00 (24 hours)
const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function normalizeItem(raw) {
	return {
		dayOfWeek: raw.dayOfWeek ?? raw.day_of_week,
		startTime: raw.startTime ?? raw.start_time,
		endTime: raw.endTime ?? raw.end_time,
		subject: raw.subject,
		teacher: raw.teacher,
		location: raw.location,
		id: raw.id
	};
}

function startOfWeekSunday(date) {
	const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const day = d.getDay(); // 0-6 (Sun-Sat)
	const diff = -day; // move back to Sunday
	d.setDate(d.getDate() + diff);
	return d;
}

function getWeekDates(reference = new Date()) {
	const start = startOfWeekSunday(reference);
	return Array.from({ length: 7 }, (_, i) => {
		const d = new Date(start);
		d.setDate(start.getDate() + i);
		return d;
	});
}

function formatDayWithDate(date) {
	const dayShort = days[date.getDay()];
	const dayOfMonth = date.getDate();
	const monthShort = date.toLocaleString(undefined, { month: 'short' });
	return `${dayShort} ${dayOfMonth} ${monthShort}`;
}

function getEventHeight(event) {
	const startHour = parseInt(event.startTime.split(':')[0]);
	const endHour = parseInt(event.endTime.split(':')[0]);
	return endHour - startHour;
}

export default function CalendarGrid({ items = [], onSelectSlot, onEdit, onDelete }) {
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
	const [now, setNow] = useState(new Date());

	useEffect(() => {
		const t = setInterval(() => setNow(new Date()), 60000);
		return () => clearInterval(t);
	}, []);

	const normalized = Array.isArray(items) ? items.map(normalizeItem) : [];
	const weekDates = getWeekDates(now);
	const todayIndex = new Date(now).getDay();
	const minutesSinceStartOfDay = now.getHours() * 60 + now.getMinutes();
	const nowTopPx = (minutesSinceStartOfDay / 60) * 40; // 40px per hour

	const handleSlotClick = (day, startTime, endTime, event) => {
		if (event) {
			setSelectedEvent(event);
		} else if (onSelectSlot) {
			onSelectSlot({ dayOfWeek: day, startTime, endTime });
		}
	};

	const handleSlotMouseDown = (e, event) => {
		if (event) {
			const rect = e.currentTarget.getBoundingClientRect();
			setPopupPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
		}
	};

	const closePopup = () => setSelectedEvent(null);

	return (
		<div className="calendar">
			<div className="calendar-header">
				<div className="time-col" />
				{weekDates.map((d, i) => (
					<div className={`day-col ${i === todayIndex ? 'is-today' : ''}`} key={i}>{formatDayWithDate(d)}</div>
				))}
			</div>
			<div className="calendar-body">
				<div className="time-col">
					{hours.map(h => {
						const timeString = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
						return <div className="time-cell" key={h}>{timeString}</div>;
					})}
				</div>
				{days.map((_, day) => (
					<div className="day-col" key={day}>
						{day === todayIndex && (
							<div className="now-line" style={{ top: `${nowTopPx}px` }} />
						)}
						{hours.map(h => {
							const startTime = `${String(h).padStart(2,'0')}:00`;
							const endTime = `${String((h + 1) % 24).padStart(2,'0')}:00`;
							// Find events that start at this hour or span this hour
							const event = normalized.find(item => {
								if (item.dayOfWeek !== day) return false;
								const eventStart = item.startTime;
								const eventEnd = item.endTime;
								
								// Check if event starts at this hour
								if (eventStart === startTime) return true;
								
								// Check if event spans this hour (starts before and ends after)
								const eventStartHour = parseInt(eventStart.split(':')[0]);
								const eventEndHour = parseInt(eventEnd.split(':')[0]);
								return eventStartHour < h && eventEndHour > h;
							});
							
							// Only show the event in the slot where it starts
							const isEventStart = event && event.startTime === startTime;
							
							return (
								<div 
									key={h}
									className={`slot ${event ? 'has-event' : ''}`}
									onClick={() => handleSlotClick(day, startTime, endTime, event)}
									onMouseDown={(e) => handleSlotMouseDown(e, event)}
								>
									{isEventStart && (
										<div className="event" style={{ 
											height: `calc(${getEventHeight(event)} * 40px - 4px)`,
											zIndex: 10
										}}>
											<div className="event-title">{event.subject}</div>
											<div className="event-sub">{event.startTime} - {event.endTime}</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				))}
			</div>

			{selectedEvent && (
				<>
					<div className="popup-overlay" onClick={closePopup}></div>
					<div 
						className="event-popup"
						style={{ left: `${popupPosition.x}px`, top: `${popupPosition.y}px` }}
					>
						<div className="popup-header">
							<h3>{selectedEvent.subject}</h3>
							<button className="close-btn" onClick={closePopup}>×</button>
						</div>
						<div className="popup-content">
							<div className="popup-item"><strong>Teacher:</strong> {selectedEvent.teacher}</div>
							<div className="popup-item"><strong>Location:</strong> {selectedEvent.location}</div>
							<div className="popup-item"><strong>Time:</strong> {selectedEvent.startTime} - {selectedEvent.endTime}</div>
							<div className="popup-item"><strong>Day:</strong> {days[selectedEvent.dayOfWeek]}</div>
						</div>
						{(onEdit || onDelete) && (
							<div className="popup-actions">
								{onEdit && (
									<button 
										className="edit-btn" 
										onClick={() => {
											onEdit(selectedEvent);
											closePopup();
										}}
									>
										Edit
									</button>
								)}
								{onDelete && (
									<button 
										className="delete-btn" 
										onClick={() => {
											onDelete(selectedEvent);
											closePopup();
										}}
									>
										Delete
									</button>
								)}
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
} 