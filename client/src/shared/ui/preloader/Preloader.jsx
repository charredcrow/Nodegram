import React from 'react';
import './Preloader.css';

const Preloader = ({ message }) => {
  return (
    <div className="preloader-overlay">
      <div className="preloader">
        <div className="preloader-message-container">
          <div className="spinner"></div>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
