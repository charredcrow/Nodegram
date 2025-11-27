import React, { useState, useEffect } from 'react';
import {
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaPlus,
  FaFileExport,
  FaFileImport,
} from 'react-icons/fa';
import { useNotification } from '../../app/providers/NotificationProvider';
import './WorkspaceCalendar.css';

export const WorkspaceCalendar = ({ onClose, events: initialEvents, nodes, onCalendarChange }) => {
  const { showNotification } = useNotification();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [localEvents, setLocalEvents] = useState(initialEvents || []);
  const [filterText, setFilterText] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    color: '#1b40a0',
  });
  const [closing, setClosing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayEvents, setShowDayEvents] = useState(false);

  // States for month/year selection
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(currentMonth);
  const [pickerYear, setPickerYear] = useState(currentYear);

  // Update local state when initialEvents changes
  useEffect(() => {
    setLocalEvents(initialEvents || []);
  }, [initialEvents]);

  // When localEvents changes, call callback to update state in Workspace
  useEffect(() => {
    if (onCalendarChange) {
      onCalendarChange(localEvents);
    }
  }, [localEvents, onCalendarChange]);

  // Date handling functions
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 7 so week starts on Monday
    return day === 0 ? 6 : day - 1;
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const generateCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const weeks = [];
    let week = [];

    // Add empty cells before first day of month
    for (let i = 0; i < firstDay; i++) {
      week.push(null);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    // Add empty cells in last week if needed
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      weeks.push(week);
    }

    return weeks;
  };

  const weeks = generateCalendarGrid();
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Filter events from localEvents (user-editable)
  const filteredEvents = localEvents.filter((ev) => {
    const evDate = new Date(ev.date);
    const matchesMonth = evDate.getFullYear() === currentYear && evDate.getMonth() === currentMonth;
    const matchesFilter =
      ev.title.toLowerCase().includes(filterText.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(filterText.toLowerCase()));
    return matchesMonth && matchesFilter;
  });

  // Additional events from nodes (readOnly) – for typeB blocks
  const additionalEvents = (nodes || [])
    .filter((node) => {
      if (node.type !== 'typeB') return false;
      if (!node.title || !node.content || !node.content.event_startTime) return false;
      return true;
    })
    .map((node) => {
      const startDate = new Date(node.content.event_startTime);
      const endDate = node.content.event_endTime ? new Date(node.content.event_endTime) : null;
      return {
        id: node.id,
        title: node.title,
        date: startDate.toISOString(),
        endDate: endDate ? endDate.toISOString() : null,
        description: node.description || '',
        readOnly: true,
        color: '#2383ed', // Fixed color for additional events
      };
    })
    .filter((ev) => {
      const evStart = new Date(ev.date);
      const evEnd = ev.endDate ? new Date(ev.endDate) : evStart;
      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
      const inMonth = evStart <= monthEnd && evEnd >= monthStart;
      const matchesFilter =
        ev.title.toLowerCase().includes(filterText.toLowerCase()) ||
        (ev.description && ev.description.toLowerCase().includes(filterText.toLowerCase()));
      return inMonth && matchesFilter;
    });

  // Combine both event arrays
  const combinedEvents = [...filteredEvents, ...additionalEvents];

  // Add/edit events (on day click)
  const openAddEventForm = (day) => {
    try {
      const pad = (num) => (num < 10 ? `0${num}` : num);
      const now = new Date();
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const dateStr = day ? `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}T${timeStr}` : '';
      setFormData({ title: '', description: '', date: dateStr, color: '#2383ed' });
      setEditingEvent(null);
      setShowEventForm(true);
    } catch (error) {
      showNotification('Failed to open event', 'error', 3000);
    }
  };

  const openEditEventForm = (ev) => {
    try {
      const eventDate = new Date(ev.date);
      const pad = (num) => (num < 10 ? `0${num}` : num);
      const timeStr = `${pad(eventDate.getHours())}:${pad(eventDate.getMinutes())}`;
      const dateStr = ev.date.split('T')[0] + 'T' + timeStr;
      setFormData({
        title: ev.title,
        description: ev.description,
        date: dateStr,
        color: ev.color || '#2383ed',
      });
      setEditingEvent(ev);
      setShowEventForm(true);
    } catch (error) {
      showNotification('Failed to edit', 'error', 3000);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        const updated = localEvents.map((ev) =>
          ev.id === editingEvent.id ? { ...ev, ...formData } : ev
        );
        setLocalEvents(updated);
        showNotification('Event updated successfully', 'success', 3000);
      } else {
        const newEvent = { ...formData, id: Date.now().toString() };
        setLocalEvents((prev) => [...prev, newEvent]);
        showNotification('Event added successfully', 'success', 3000);
      }
      setShowEventForm(false);
    } catch (error) {
      showNotification('Failed to save event', 'error', 3000);
    }
  };

  // Delete events (only for editable)
  const handleDeleteEvent = (eventId) => {
    try {
      setLocalEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      showNotification('Event deleted successfully', 'success', 3000);
    } catch (error) {
      showNotification('Failed to delete event', 'error', 3000);
    }
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('workspace-calendar-overlay')) {
      handleClose();
    }
  };

  const handleFormOverlayClick = (e) => {
    if (e.target.classList.contains('event-form-overlay')) {
      setShowEventForm(false);
    }
  };

  // Month/year selection functionality (on header click)
  const openMonthPicker = () => {
    setPickerMonth(currentMonth);
    setPickerYear(currentYear);
    setShowMonthPicker(true);
  };

  const applyMonthPicker = () => {
    setCurrentMonth(pickerMonth);
    setCurrentYear(pickerYear);
    setShowMonthPicker(false);
    showNotification(`Calendar updated to ${monthNames[pickerMonth]} ${pickerYear}`, 'info', 2000);
  };

  const handleDayClick = (day) => {
    if (day) {
      setSelectedDay(day);
      setShowDayEvents(true);
    }
  };

  const getDayEvents = (day) => {
    if (!day) return [];
    return combinedEvents
      .filter((ev) => {
        const evDate = new Date(ev.date);
        const evEndDate = ev.endDate ? new Date(ev.endDate) : null;

        // Check if day falls within event date range
        const isStartDay =
          evDate.getDate() === day &&
          evDate.getMonth() === currentMonth &&
          evDate.getFullYear() === currentYear;

        const isEndDay =
          evEndDate &&
          evEndDate.getDate() === day &&
          evEndDate.getMonth() === currentMonth &&
          evEndDate.getFullYear() === currentYear;

        // Check if event passes through current day
        const isInRange =
          evEndDate &&
          evDate <= new Date(currentYear, currentMonth, day) &&
          evEndDate >= new Date(currentYear, currentMonth, day);

        return isStartDay || isEndDay || isInRange;
      })
      .map((ev) => {
        const evDate = new Date(ev.date);
        const evEndDate = ev.endDate ? new Date(ev.endDate) : null;
        const isStartDay =
          evDate.getDate() === day &&
          evDate.getMonth() === currentMonth &&
          evDate.getFullYear() === currentYear;
        const isEndDay =
          evEndDate &&
          evEndDate.getDate() === day &&
          evEndDate.getMonth() === currentMonth &&
          evEndDate.getFullYear() === currentYear;

        return {
          ...ev,
          isStartDay,
          isEndDay,
        };
      });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatEventTitle = (event, isStartDay) => {
    if (event.readOnly) {
      return (
        <>
          {event.title}
          <span className="event-type">
            {isStartDay ? 'Starts' : event.isEndDay ? 'Ends' : 'Ongoing'}
          </span>
        </>
      );
    }
    return event.title;
  };

  // Function to convert hex to rgba
  function hexToRgba(hex, alpha = 1) {
    let c = hex.replace('#', '');
    if (c.length === 3)
      c = c
        .split('')
        .map((x) => x + x)
        .join('');
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
  }

  const defaultEventColor = formData.color || '#1b40a0';

  return (
    <div
      className={`workspace-calendar-overlay ${closing ? 'closing' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="workspace-calendar-container">
        <div className="calendar-header">
          <button className="close-button" onClick={handleClose}>
            <FaTimes />
          </button>
          <div className="month-title" onClick={openMonthPicker}>
            {monthNames[currentMonth]} {currentYear}
          </div>
          <div className="month-navigation">
            <button className="nav-button" onClick={prevMonth}>
              <FaArrowLeft />
            </button>
            <button className="today-button" onClick={goToToday}>
              Today
            </button>
            <button className="nav-button" onClick={nextMonth}>
              <FaArrowRight />
            </button>
          </div>
        </div>

        {showMonthPicker && (
          <div className="picker-overlay" onClick={() => setShowMonthPicker(false)}>
            <div className="month-picker-overlay" onClick={() => setShowMonthPicker(false)}>
              <div className="month-picker" onClick={(e) => e.stopPropagation()}>
                <div className="month-picker-header">
                  <span>Select Month and Year</span>
                  <button
                    className="close-month-picker-btn"
                    onClick={() => setShowMonthPicker(false)}
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="month-picker-body">
                  <div className="month-options">
                    {monthNames.map((name, index) => (
                      <button
                        key={index}
                        className={`month-option ${pickerMonth === index ? 'selected' : ''}`}
                        onClick={() => setPickerMonth(index)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <div className="year-option">
                    <input
                      type="number"
                      value={pickerYear}
                      onChange={(e) => setPickerYear(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="month-picker-footer">
                  <button className="apply-btn" onClick={applyMonthPicker}>
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="calendar-controls">
          <input
            type="text"
            placeholder="Search events..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="search-input"
          />
          {/* <div className="control-buttons">
            <button className="control-button" onClick={() => openAddEventForm()}>
              <FaPlus /> Add Event
            </button>
          </div> */}
        </div>

        <div className="calendar-body">
          <div className="day-names">
            {dayNames.map((day, index) => (
              <div key={index} className="day-name">
                {day}
              </div>
            ))}
          </div>
          <div className="weeks">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="week">
                {week.map((day, dayIndex) => {
                  const isToday =
                    day &&
                    currentYear === today.getFullYear() &&
                    currentMonth === today.getMonth() &&
                    day === today.getDate();
                  const dayEvents = getDayEvents(day);
                  return (
                    <div
                      key={dayIndex}
                      className={`day${day ? '' : ' empty'}${dayEvents.length > 0 ? ' has-events' : ''}${isToday ? ' today' : ''}`}
                      onClick={() => handleDayClick(day)}
                    >
                      {day && <span className="day-number">{day}</span>}
                      {dayEvents.length > 0 && (
                        <div className="day-events-indicators">
                          {dayEvents.length <= 3 ? (
                            Array.from({ length: dayEvents.length }).map((_, index) => (
                              <div key={index} className="event-dot" />
                            ))
                          ) : (
                            <div className="event-line" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {showDayEvents && selectedDay && (
          <div className="day-events-modal-overlay" onClick={() => setShowDayEvents(false)}>
            <div className="day-events-modal" onClick={(e) => e.stopPropagation()}>
              <div className="day-events-modal-header">
                <h3>
                  {monthNames[currentMonth]} {selectedDay}, {currentYear}
                </h3>
                <button className="close-modal" onClick={() => setShowDayEvents(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="day-events-list">
                {getDayEvents(selectedDay).length === 0 ? (
                  <div className="no-events">No events for this day</div>
                ) : (
                  getDayEvents(selectedDay)
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((ev) => (
                      <div
                        key={ev.id}
                        className="day-event-item"
                        style={{
                          borderLeft: `4px solid ${ev.readOnly ? '#2383ed' : ev.color || defaultEventColor}`,
                          background: hexToRgba(
                            ev.readOnly ? '#2383ed' : ev.color || defaultEventColor,
                            0.1
                          ),
                        }}
                      >
                        <div className="event-time">
                          {formatTime(ev.isStartDay ? ev.date : ev.endDate)}
                        </div>
                        <div className="event-details">
                          <div className="event-title">{formatEventTitle(ev, ev.isStartDay)}</div>
                          {ev.description && (
                            <div className="event-description">{ev.description}</div>
                          )}
                        </div>
                        {!ev.readOnly && (
                          <div className="event-actions">
                            <button onClick={() => openEditEventForm(ev)}>
                              <strong>Edit</strong>
                            </button>
                            <button onClick={() => handleDeleteEvent(ev.id)}>
                              <strong>Delete</strong>
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
              <div className="day-events-modal-footer">
                <button
                  className="add-event-btn"
                  onClick={() => {
                    openAddEventForm(selectedDay);
                  }}
                >
                  <FaPlus /> <strong>Add Event</strong>
                </button>
              </div>
            </div>
          </div>
        )}

        {showEventForm && (
          <div className="event-form-overlay" onClick={handleFormOverlayClick}>
            <div className="event-form-container" onClick={(e) => e.stopPropagation()}>
              <div className="event-form-header">
                <span>{editingEvent ? 'Edit Event' : 'Add Event'}</span>
                <button className="close-form-btn" onClick={() => setShowEventForm(false)}>
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <label>
                  <div className="form-header-add-event">
                    <input
                      className="color-picker-add-event"
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleFormChange}
                    />
                  </div>
                  <input
                    type="text"
                    name="title"
                    placeholder="Title"
                    value={formData.title}
                    onChange={handleFormChange}
                    required
                  />
                </label>
                <label>
                  <textarea
                    name="description"
                    placeholder="Description"
                    value={formData.description}
                    onChange={handleFormChange}
                  />
                </label>
                <label>
                  <input
                    type="datetime-local"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                  />
                </label>
                <button type="submit">
                  <strong>Save</strong>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
