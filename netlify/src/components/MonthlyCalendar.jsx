import React, { useState, useEffect } from 'react';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function getClassesForDay(classes, dayOfWeek) {
  return classes.filter(cls => cls.dayOfWeek === dayOfWeek);
}

export default function MonthlyCalendar({ classes = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const normalized = Array.isArray(classes) ? classes.map(normalizeItem) : [];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  const isSelected = (day) => {
    return day === selectedDate.getDate() && 
           month === selectedDate.getMonth() && 
           year === selectedDate.getFullYear();
  };

  const hasClasses = (day) => {
    const dayOfWeek = new Date(year, month, day).getDay();
    return getClassesForDay(normalized, dayOfWeek).length > 0;
  };

  const getTotalHours = (day) => {
    const dayOfWeek = new Date(year, month, day).getDay();
    const dayClasses = getClassesForDay(normalized, dayOfWeek);
    return dayClasses.reduce((total, cls) => {
      const startHour = parseInt(cls.startTime.split(':')[0]);
      const endHour = parseInt(cls.endTime.split(':')[0]);
      return total + (endHour - startHour);
    }, 0);
  };

  const getClassesForDate = (day) => {
    const dayOfWeek = new Date(year, month, day).getDay();
    return getClassesForDay(normalized, dayOfWeek);
  };

  // Create array of days for the month
  const monthDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    monthDays.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    monthDays.push(day);
  }

  return (
    <div className="monthly-calendar">
      <div className="calendar-header">
        <button onClick={goToPreviousMonth} className="nav-btn">‹</button>
        <h3>{months[month]} {year}</h3>
        <button onClick={goToNextMonth} className="nav-btn">›</button>
      </div>
      
      <div className="calendar-nav">
        <button onClick={goToToday} className="today-btn">Today</button>
      </div>

      <div className="calendar-grid">
        {/* Day headers */}
        {days.map(day => (
          <div key={day} className="day-header">{day}</div>
        ))}
        
        {/* Calendar days */}
        {monthDays.map((day, index) => {
          if (day === null) {
            return <div key={index} className="empty-day"></div>;
          }
          
          const dayClasses = getClassesForDate(day);
          const hasClass = hasClasses(day);
          const totalHours = getTotalHours(day);
          
          return (
            <div
              key={day}
              className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''} ${hasClass ? 'has-classes' : ''}`}
              onClick={() => setSelectedDate(new Date(year, month, day))}
            >
              <span className="day-number">{day}</span>
              {hasClass ? (
                <div className="class-indicator">
                  <span className="class-count">{totalHours}h</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Selected date info */}
      {selectedDate && (
        <div className="selected-date-info">
          <h4>{selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</h4>
          {getClassesForDate(selectedDate.getDate()).length > 0 ? (
            <div className="day-classes">
              {getClassesForDate(selectedDate.getDate()).map((cls, index) => (
                <div key={index} className="class-item">
                  <div className="class-time">{cls.startTime} - {cls.endTime}</div>
                  <div className="class-subject">{cls.subject}</div>
                  <div className="class-teacher">{cls.teacher}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-classes">No classes scheduled</p>
          )}
        </div>
      )}
    </div>
  );
}


