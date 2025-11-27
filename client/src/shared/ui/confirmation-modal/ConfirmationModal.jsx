import React from 'react';
import Modal from 'react-modal';
import './ConfirmationModal.css';

Modal.setAppElement('#root');

export const ConfirmationModal = ({ isOpen, message, onConfirm, onCancel }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onCancel}
      className="confirmation-modal"
      overlayClassName="confirmation-modal-overlay"
    >
      <div className="confirmation-modal-content">
        <p>{message}</p>
        <div className="confirmation-modal-buttons">
          <button className="confirm-btn" onClick={onConfirm}>
            <strong>Confirm</strong>
          </button>
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
