import React from 'react';

const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00
const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function CalendarGrid({ items = [], onSelectSlot }) {
	return (
		<div className="calendar">
			<div className="calendar-header">
				<div className="time-col" />
				{days.map((d, i) => <div className="day-col" key={i}>{d}</div>)}
			</div>
			<div className="calendar-body">
				<div className="time-col">
					{hours.map(h => <div className="time-cell" key={h}>{String(h).padStart(2,'0')}:00</div>)}
				</div>
				{days.map((_, day) => (
					<div className="day-col" key={day}>
						{hours.map(h => (
							<div
								key={h}
								className="slot"
								onClick={() => onSelectSlot && onSelectSlot({ dayOfWeek: day, startTime: `${String(h).padStart(2,'0')}:00`, endTime: `${String(h+1).padStart(2,'0')}:00` })}
							/>
						))}
						{items.filter(it => it.day_of_week === day).map(it => (
							<div className="event" key={it.id} style={eventStyle(it)}>
								<div className="event-title">{it.subject}</div>
								<div className="event-sub">{it.teacher} • {it.start_time}-{it.end_time}</div>
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

function eventStyle(it) {
	const startH = parseInt(it.start_time.split(':')[0], 10);
	const endH = parseInt(it.end_time.split(':')[0], 10);
	const top = (startH - 8) * 40; // 40px per hour
	const height = Math.max((endH - startH) * 40 - 4, 24);
	return { top, height };
} 