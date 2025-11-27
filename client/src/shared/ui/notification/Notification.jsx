import React, { useEffect } from 'react';
import './Notification.css';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';
import { IoWarningOutline, IoInformationCircleOutline, IoCloseOutline } from 'react-icons/io5';
import { BiErrorCircle } from 'react-icons/bi';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return <IoMdCheckmarkCircleOutline className="notification__icon" />;
    case 'warning':
      return <IoWarningOutline className="notification__icon" />;
    case 'error':
      return <BiErrorCircle className="notification__icon" />;
    default:
      return <IoInformationCircleOutline className="notification__icon" />;
  }
};

export const Notification = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`notification notification--${type}`}>
      <div className="notification__content">
        {getNotificationIcon(type)}
        <p className="notification__message">{message}</p>
        <button className="notification__close" onClick={onClose}>
          <IoCloseOutline />
        </button>
      </div>
    </div>
  );
};
