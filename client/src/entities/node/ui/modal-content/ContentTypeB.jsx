import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../../../../app/providers/NotificationProvider';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { Calendar, Clock, X, CheckCircle2, Timer } from 'lucide-react';
import './ContentTypeB.css';

const ContentTypeB = ({ data, onUpdate }) => {
  const { showNotification } = useNotification();
  const quillRef = useRef(null);
  const quillInstance = useRef(null);

  // Initialize date and time from timestamp
  const initializeDateTime = (timestamp) => {
    if (!timestamp) return { date: '', time: '' };
    const date = new Date(timestamp);
    return {
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().slice(0, 5),
    };
  };

  const initialStartData = initializeDateTime(data?.node?.content?.event_startTime);
  const initialEndData = initializeDateTime(data?.node?.content?.event_endTime);

  const [startDate, setStartDate] = useState(initialStartData.date);
  const [startTime, setStartTime] = useState(initialStartData.time);
  const [endDate, setEndDate] = useState(initialEndData.date);
  const [endTime, setEndTime] = useState(initialEndData.time);

  const [savedStartTimestamp, setSavedStartTimestamp] = useState(
    data?.node?.content?.event_startTime || ''
  );
  const [savedEndTimestamp, setSavedEndTimestamp] = useState(
    data?.node?.content?.event_endTime || ''
  );

  const [countdown, setCountdown] = useState(null);

  const [formEvent, setFormEvent] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  // Calculate countdown
  const calculateCountdown = () => {
    if (!savedStartTimestamp) return null;
    const now = Date.now();
    if (now < savedStartTimestamp) {
      return { type: 'start', time: Math.ceil((savedStartTimestamp - now) / 1000) };
    } else if (savedEndTimestamp && now < savedEndTimestamp) {
      return { type: 'end', time: Math.ceil((savedEndTimestamp - now) / 1000) };
    }
    return null;
  };

  // Initialize Quill editor
  useEffect(() => {
    if (!quillRef.current || quillInstance.current) return;

    quillInstance.current = new Quill(quillRef.current, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ color: [] }, { background: [] }],
          ['link'],
          ['clean'],
          [{ align: [] }],
        ],
      },
    });

    quillInstance.current.on('text-change', () => {
      const htmlContent = quillInstance.current.root.innerHTML;
      onUpdate({
        ...data,
        node: {
          ...data.node,
          content: {
            ...data.node.content,
            html_editor: htmlContent,
            event_startTime: savedStartTimestamp,
            event_endTime: savedEndTimestamp,
          },
        },
      });
    });
  }, [data, onUpdate, savedStartTimestamp, savedEndTimestamp]);

  // Sync input fields with timestamps
  useEffect(() => {
    if (savedStartTimestamp) {
      const startDate = new Date(savedStartTimestamp);
      setStartDate(startDate.toISOString().split('T')[0]);
      setStartTime(startDate.toTimeString().slice(0, 5));
    }
    if (savedEndTimestamp) {
      const endDate = new Date(savedEndTimestamp);
      setEndDate(endDate.toISOString().split('T')[0]);
      setEndTime(endDate.toTimeString().slice(0, 5));
    }
  }, [savedStartTimestamp, savedEndTimestamp]);

  // Initialize countdown on mount
  useEffect(() => {
    if (savedStartTimestamp) {
      setCountdown(calculateCountdown());
    }
  }, [savedStartTimestamp, savedEndTimestamp]);

  // Update countdown every second
  useEffect(() => {
    if (!savedStartTimestamp) return;

    const interval = setInterval(() => {
      setCountdown(calculateCountdown());
    }, 1000);

    return () => clearInterval(interval);
  }, [savedStartTimestamp, savedEndTimestamp]);

  const handleFormSave = () => {
    let startTimestamp = '';
    let endTimestamp = '';
    const { startDate, startTime, endDate, endTime } = formEvent;

    if (!startDate && !startTime && !endDate && !endTime) {
      showNotification('Please set event date and time', 'error');
      return;
    }

    if (startDate && !startTime) {
      showNotification('Please select start time', 'error');
      return;
    }

    if (endDate && !startDate) {
      showNotification('Please set start date before end date', 'error');
      return;
    }

    if (endDate && !endTime) {
      showNotification('Please select end time', 'error');
      return;
    }

    if (startDate && startTime) {
      const [hours, minutes] = startTime.split(':');
      const startDateTime = new Date(startDate);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      startTimestamp = startDateTime.getTime();
    }

    if (endDate && endTime) {
      const [hours, minutes] = endTime.split(':');
      const endDateTime = new Date(endDate);
      endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      endTimestamp = endDateTime.getTime();

      if (startTimestamp && endTimestamp <= startTimestamp) {
        showNotification('End time must be later than start time', 'error');
        return;
      }
    }

    if (!startTimestamp && !endTimestamp) {
      showNotification('Please set at least start date and time', 'error');
      return;
    }

    setSavedStartTimestamp(startTimestamp);
    setSavedEndTimestamp(endTimestamp);

    onUpdate({
      ...data,
      node: {
        ...data.node,
        content: {
          ...data.node.content,
          event_startTime: startTimestamp,
          event_endTime: endTimestamp,
          html_editor: quillInstance.current?.root.innerHTML || '',
        },
      },
    });

    showNotification('Event saved successfully', 'success');
    setFormEvent({
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
    });
  };

  const resetEvent = () => {
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setSavedStartTimestamp('');
    setSavedEndTimestamp('');
    setFormEvent({
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
    });
    onUpdate({
      ...data,
      node: {
        ...data.node,
        content: {
          ...data.node.content,
          event_startTime: '',
          event_endTime: '',
          html_editor: quillInstance.current?.root.innerHTML || '',
        },
      },
    });
    setCountdown(null);
  };

  const formatEventDateTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCountdown = (seconds) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const eventActive = () => {
    return savedStartTimestamp !== '';
  };

  const getStatusBadge = () => {
    if (!countdown) return { label: 'Completed', variant: 'secondary' };
    if (countdown.type === 'start') return { label: 'Upcoming', variant: 'default' };
    if (countdown.type === 'end') return { label: 'In Progress', variant: 'secondary' };
    return { label: 'Completed', variant: 'secondary' };
  };

  if (!data || !data.node) {
    return <div>Error: Invalid data</div>;
  }

  return (
    <div className="сontentType_inputContainer" style={{ width: '100%' }}>
      {!eventActive() ? (
        <div className="ContentTypeB_modernCard">
          <div className="ContentTypeB_modernCardHeader">
            <div className="ContentTypeB_modernCardIcon">
              <Calendar size={20} />
            </div>
            <h2 className="ContentTypeB_modernCardTitle">Create New Event</h2>
          </div>
          <p className="ContentTypeB_modernCardDescription">
            Set the start and end date for your event
          </p>

          <div className="ContentTypeB_modernFormGroup">
            <label htmlFor="start-datetime" className="ContentTypeB_modernLabel">
              <Clock size={16} className="ContentTypeB_modernLabelIcon" />
              Start Date & Time
            </label>
            <div className="ContentTypeB_modernInputWrapper">
              <Calendar size={20} className="ContentTypeB_modernInputIcon" />
              <input
                id="start-datetime"
                type="datetime-local"
                className="ContentTypeB_modernInput"
                value={
                  formEvent.startDate && formEvent.startTime
                    ? `${formEvent.startDate}T${formEvent.startTime}`
                    : ''
                }
                onChange={(e) => {
                  const val = e.target.value;
                  const [date, time] = val.split('T');
                  setFormEvent((ev) => ({ ...ev, startDate: date || '', startTime: time || '' }));
                }}
              />
            </div>
          </div>

          {formEvent.startDate && formEvent.startTime && (
            <div className="ContentTypeB_modernFormGroup">
              <label htmlFor="end-datetime" className="ContentTypeB_modernLabel">
                <Clock size={16} className="ContentTypeB_modernLabelIcon" />
                End Date & Time <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>(Optional)</span>
              </label>
              <div className="ContentTypeB_modernInputWrapper">
                <Calendar size={20} className="ContentTypeB_modernInputIcon" />
                <input
                  id="end-datetime"
                  type="datetime-local"
                  className="ContentTypeB_modernInput"
                  value={
                    formEvent.endDate && formEvent.endTime
                      ? `${formEvent.endDate}T${formEvent.endTime}`
                      : ''
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    const [date, time] = val.split('T');
                    setFormEvent((ev) => ({ ...ev, endDate: date || '', endTime: time || '' }));
                  }}
                  min={`${formEvent.startDate}T${formEvent.startTime}`}
                />
              </div>
            </div>
          )}

          <div className="ContentTypeB_modernSeparator"></div>

          <div className="ContentTypeB_modernActions">
            <button
              className="ContentTypeB_modernButton ContentTypeB_modernButtonPrimary"
              onClick={handleFormSave}
            >
              <CheckCircle2 size={16} />
              Save Event
            </button>
          </div>
        </div>
      ) : (
        <div className="ContentTypeB_modernEventCard">
          <div className="ContentTypeB_modernEventHeader">
            <div className="ContentTypeB_modernEventHeaderLeft">
              <div className="ContentTypeB_modernEventIconWrapper">
                <Calendar size={24} className="ContentTypeB_modernEventIcon" />
              </div>
              <div className="ContentTypeB_modernEventInfo">
                <h2 className="ContentTypeB_modernEventTitle">Event Scheduled</h2>
                <p className="ContentTypeB_modernEventSubtitle">
                  {formatEventDateTime(savedStartTimestamp)}
                </p>
              </div>
            </div>
            <span
              className={`ContentTypeB_modernBadge ${
                getStatusBadge().variant === 'default'
                  ? 'ContentTypeB_modernBadgeDefault'
                  : 'ContentTypeB_modernBadgeSecondary'
              }`}
            >
              {getStatusBadge().label}
            </span>
          </div>

          <div className="ContentTypeB_modernTimeGrid">
            <div className="ContentTypeB_modernTimeCard">
              <div className="ContentTypeB_modernTimeLabel">
                <Clock size={14} />
                Start Time
              </div>
              <div className="ContentTypeB_modernTimeValue">
                {formatEventDateTime(savedStartTimestamp)}
              </div>
            </div>

            {savedEndTimestamp && (
              <div className="ContentTypeB_modernTimeCard">
                <div className="ContentTypeB_modernTimeLabel">
                  <Clock size={14} />
                  End Time
                </div>
                <div className="ContentTypeB_modernTimeValue">
                  {formatEventDateTime(savedEndTimestamp)}
                </div>
              </div>
            )}
          </div>

          {countdown && countdown.type && (
            <div className="ContentTypeB_modernCountdown">
              <div className="ContentTypeB_modernCountdownContent">
                <div className="ContentTypeB_modernCountdownIcon">
                  <Timer size={20} />
                </div>
                <div className="ContentTypeB_modernCountdownText">
                  <div className="ContentTypeB_modernCountdownLabel">
                    {countdown.type === 'start' ? 'Event starts in' : 'Event ends in'}
                  </div>
                  <div className="ContentTypeB_modernCountdownValue">
                    {formatCountdown(countdown.time)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="ContentTypeB_modernSeparator"></div>

          <div className="ContentTypeB_modernActions">
            <button
              className="ContentTypeB_modernButton ContentTypeB_modernButtonDestructive"
              onClick={resetEvent}
            >
              <X size={16} />
              Delete Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentTypeB;
