import React from 'react';
import styles from './Button.module.css';

const Button = ({ children, onClick, className = '', ...props }) => {
  return (
    <button className={`${styles.button} ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

export default Button;
