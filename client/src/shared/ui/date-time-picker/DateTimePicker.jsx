import React, { useState, useEffect, useRef } from 'react';
import './DateTimePicker.css';

const DateTimePicker = ({ value, onChange, className, useCurrentDateTime = true }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (value) {
      const dateTime = new Date(value);
      setDate(dateTime.toISOString().split('T')[0]);
      setTime(dateTime.toTimeString().slice(0, 5));
    } else if (useCurrentDateTime) {
      // Устанавливаем текущую дату и время по умолчанию только если useCurrentDateTime = true
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);

      setDate(currentDate);
      setTime(currentTime);

      // Вызываем onChange с текущей датой и временем
      const dateTime = new Date(`${currentDate}T${currentTime}`);
      onChange(dateTime.toISOString());
    } else {
      // Если useCurrentDateTime = false и нет значения, очищаем поля
      setDate('');
      setTime('');
    }
  }, [value, onChange, useCurrentDateTime]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    if (newDate && time) {
      updateDateTime(newDate, time);
    } else {
      onChange(''); // Если дата или время пустые, отправляем пустое значение
    }
    setIsOpen(false);
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTime(newTime);
    if (date && newTime) {
      updateDateTime(date, newTime);
    } else {
      onChange(''); // Если дата или время пустые, отправляем пустое значение
    }
    setIsOpen(false);
  };

  const updateDateTime = (newDate, newTime) => {
    if (newDate && newTime) {
      const dateTime = new Date(`${newDate}T${newTime}`);
      onChange(dateTime.toISOString());
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'Select date';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return 'Select time';
    return timeStr;
  };

  const handleDateDivClick = () => {
    if (!isMobile) {
      setIsOpen(true);
      if (dateInputRef.current) {
        dateInputRef.current.showPicker();
      }
    }
  };

  const handleTimeDivClick = () => {
    if (!isMobile) {
      setIsOpen(true);
      if (timeInputRef.current) {
        timeInputRef.current.showPicker();
      }
    }
  };

  return (
    <div className={`dtp_datetimepicker ${className || ''}`} ref={containerRef}>
      <div className="dtp_input_wrapper">
        <input
          ref={dateInputRef}
          type="date"
          className={`dtp_input ${isMobile ? 'dtp_mobile_input' : 'dtp_hidden_input'}`}
          value={date}
          onChange={handleDateChange}
          placeholder="DD/MM/YYYY"
        />
        {!isMobile && (
          <div className="dtp_custom_input" onClick={handleDateDivClick}>
            {formatDisplayDate(date)}
          </div>
        )}
      </div>
      <div className="dtp_input_wrapper">
        <input
          ref={timeInputRef}
          type="time"
          className={`dtp_input ${isMobile ? 'dtp_mobile_input' : 'dtp_hidden_input'}`}
          value={time}
          onChange={handleTimeChange}
          placeholder="--:--"
        />
        {!isMobile && (
          <div className="dtp_custom_input" onClick={handleTimeDivClick}>
            {formatDisplayTime(time)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DateTimePicker;
