import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../../../../app/providers/NotificationProvider';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { VscNewFile } from 'react-icons/vsc';
import './ContentTypeB.css';

const ContentTypeB = ({ data, onUpdate }) => {
  const { showNotification } = useNotification();
  const quillRef = useRef(null);
  const quillInstance = useRef(null);

  // Функция для инициализации даты и времени из timestamp
  const initializeDateTime = (timestamp) => {
    if (!timestamp) return { date: '', time: '' };
    const date = new Date(timestamp);
    return {
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().slice(0, 5),
    };
  };

  // Инициализация начальных значений из сохраненных данных
  const initialStartData = initializeDateTime(data?.node?.content?.event_startTime);
  const initialEndData = initializeDateTime(data?.node?.content?.event_endTime);

  // Состояния для хранения даты и времени начала
  const [startDate, setStartDate] = useState(initialStartData.date);
  const [startTime, setStartTime] = useState(initialStartData.time);

  // Состояния для хранения даты и времени окончания
  const [endDate, setEndDate] = useState(initialEndData.date);
  const [endTime, setEndTime] = useState(initialEndData.time);

  // Состояния для хранения timestamp'ов
  const [savedStartTimestamp, setSavedStartTimestamp] = useState(
    data?.node?.content?.event_startTime || ''
  );
  const [savedEndTimestamp, setSavedEndTimestamp] = useState(
    data?.node?.content?.event_endTime || ''
  );

  const [countdown, setCountdown] = useState(null);

  // Состояние для формы создания события
  const [formEvent, setFormEvent] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  // Функция для вычисления countdown
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

  // Инициализация Quill редактора
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

  // Синхронизация полей ввода с timestamp'ами
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

  // Инициализация countdown при монтировании
  useEffect(() => {
    if (savedStartTimestamp) {
      setCountdown(calculateCountdown());
    }
  }, [savedStartTimestamp, savedEndTimestamp]);

  // Обновление countdown каждую секунду
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const eventActive = () => {
    return savedStartTimestamp !== '';
  };

  if (!data || !data.node) {
    return <div>Error: Invalid data</div>;
  }

  return (
    <div className="сontentType_container">
      <div className="сontentType_inputContainer">
        <div className="ContentTypeB_week-navigation">
          {!eventActive() && (
            <div className="ContentTypeB_eventContainer">
              <div className="ContentTypeB_dateTimeRow">
                <div className="ContentTypeB_datePicker">
                  <label>
                    <strong>Start date & time:</strong>
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      formEvent.startDate && formEvent.startTime
                        ? `${formEvent.startDate}T${formEvent.startTime}`
                        : ''
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      const [date, time] = val.split('T');
                      setFormEvent((ev) => ({ ...ev, startDate: date, startTime: time }));
                    }}
                  />
                </div>
              </div>
              {formEvent.startDate && formEvent.startTime && (
                <div className="ContentTypeB_dateTimeRow">
                  <div className="ContentTypeB_datePicker">
                    <label>
                      <strong>End date & time:</strong>
                    </label>
                    <input
                      type="datetime-local"
                      value={
                        formEvent.endDate && formEvent.endTime
                          ? `${formEvent.endDate}T${formEvent.endTime}`
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const [date, time] = val.split('T');
                        setFormEvent((ev) => ({ ...ev, endDate: date, endTime: time }));
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="ContentTypeB_modalActions">
                <button className="ContentTypeB_saveButton" onClick={handleFormSave}>
                  <strong>Save</strong>
                </button>
                <button className="ContentTypeB_resetButton" onClick={resetEvent}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {eventActive() && (
            <div className="ContentTypeB_activeEventInfo">
              <div className="ContentTypeB_eventTime">
                <div className="ContentTypeB_eventTimeHeader">
                  <h3>Event Details</h3>
                  <span className="ContentTypeB_eventStatus">
                    {countdown?.type === 'start'
                      ? 'Upcoming'
                      : countdown?.type === 'end'
                        ? 'In Progress'
                        : 'Completed'}
                  </span>
                </div>
                <div className="ContentTypeB_eventTimeContent">
                  <div className="ContentTypeB_eventTimeItem">
                    <span className="ContentTypeB_eventTimeLabel">Start</span>
                    <span className="ContentTypeB_eventTimeValue">
                      {formatEventDateTime(savedStartTimestamp)}
                    </span>
                  </div>
                  {savedEndTimestamp && (
                    <div className="ContentTypeB_eventTimeItem">
                      <span className="ContentTypeB_eventTimeLabel">End</span>
                      <span className="ContentTypeB_eventTimeValue">
                        {formatEventDateTime(savedEndTimestamp)}
                      </span>
                    </div>
                  )}
                </div>
                {countdown && countdown.type && (
                  <div className="ContentTypeB_countdownContainer">
                    <span className="ContentTypeB_countdownLabel">
                      {countdown.type === 'start' ? 'Starts in:' : 'Ends in:'}
                    </span>
                    <span className="ContentTypeB_countdownValue">
                      {(() => {
                        const totalSeconds = countdown.time;
                        const days = Math.floor(totalSeconds / (24 * 3600));
                        const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                        const remainingSeconds = totalSeconds % 60;

                        if (days > 0) {
                          return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
                        } else if (hours > 0) {
                          return `${hours}h ${minutes}m ${remainingSeconds}s`;
                        } else if (minutes > 0) {
                          return `${minutes}m ${remainingSeconds}s`;
                        } else {
                          return `${remainingSeconds}s`;
                        }
                      })()}
                    </span>
                  </div>
                )}
                <div className="ContentTypeB_resetButtonContainer">
                  <button className="ContentTypeB_resetButton" onClick={resetEvent}>
                    Delete Event
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentTypeB;
