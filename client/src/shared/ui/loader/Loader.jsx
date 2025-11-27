import React from 'react';
import './Loader.css';

export const Loader = ({ size = 40, vh = 100 }) => {
  return (
    <div className="loader-container" style={{ height: `${vh}vh` }}>
      <div className="spinner_ng" style={{ fontSize: `${size}px` }}></div>
    </div>
  );
};
