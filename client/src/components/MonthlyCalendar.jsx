import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

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
  const [publicHolidays, setPublicHolidays] = useState(new Set());

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

  const loadPublicHolidays = async () => {
    try {
      // Get the first and last day of the current month without timezone conversion
      const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(getDaysInMonth(year, month)).padStart(2, '0')}`;
      
      const response = await api(`/attendance?from=${firstDay}&to=${lastDay}`);
      const holidayDates = new Set();
      
      response.attendance.forEach(record => {
        if (record.reason_category === 'public_holiday') {
          holidayDates.add(record.date);
        }
      });
      
      setPublicHolidays(holidayDates);
    } catch (error) {
      console.error('Failed to load public holidays:', error);
    }
  };

  useEffect(() => {
    loadPublicHolidays();
  }, [year, month]);

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

  const isPublicHoliday = (day) => {
    // Format date as YYYY-MM-DD without timezone conversion
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return publicHolidays.has(dateStr);
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
          const isHoliday = isPublicHoliday(day);
          
          return (
            <div
              key={day}
              className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''} ${hasClass ? 'has-classes' : ''} ${isHoliday ? 'public-holiday' : ''}`}
              onClick={() => setSelectedDate(new Date(year, month, day))}
            >
              <span className="day-number">{day}</span>
              {isHoliday ? (
                <div className="holiday-indicator">
                  <span className="holiday-text">H</span>
                </div>
              ) : hasClass ? (
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
          {isPublicHoliday(selectedDate.getDate()) ? (
            <div className="holiday-info">
              <div className="holiday-badge">Public Holiday</div>
              <p className="holiday-message">No classes scheduled due to public holiday</p>
            </div>
          ) : getClassesForDate(selectedDate.getDate()).length > 0 ? (
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
