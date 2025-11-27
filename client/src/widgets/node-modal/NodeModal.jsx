import React, { useState, useRef } from 'react';
import './NodeModal.css';
import { IoIosArrowBack } from 'react-icons/io';
import { VscColorMode } from 'react-icons/vsc';
import { ModalContentRouter } from '../../entities/node/ui/modal-content';
import { useNotification } from '../../app/providers/NotificationProvider';

const NodeModal = ({
  isOpen,
  nodeData,
  nodesData,
  links,
  onClose,
  updateNodeData,
  currentWid,
  openNodeModal,
  widModeShared,
}) => {
  if (!isOpen || !nodeData) return null;
  const { showNotification } = useNotification();
  const [title, setTitle] = useState(nodeData?.node?.title || '');
  const [contentData, setContentData] = useState(nodeData);
  const [isFocused, setIsFocused] = useState(false);
  const colorInputRef = useRef(null);
  const titleInputRef = useRef(null);

  const handleOverlayClick = (e) => {
    const targetClassName = e.target.className;
    if (typeof targetClassName === 'string' && targetClassName.includes('nodemodal-overlay')) {
      handleClose();
    }
  };

  const handleClose = () => {
    if (title.trim() === '') {
      showNotification('Title cannot be empty', 'warning', 3000);
      return;
    }
    const finalData = {
      ...contentData,
      node: {
        ...contentData.node,
        title: title,
        nodeColor: contentData.nodeColor,
      },
    };
    updateNodeData(finalData);
    onClose();
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setContentData((prevData) => ({
      ...prevData,
      nodeColor: newColor,
    }));
  };

  const handleDataUpdate = (updatedData) => {
    setContentData((prevData) => ({
      ...prevData,
      node: {
        ...prevData.node,
        ...updatedData.node,
      },
    }));
  };

  return (
    <div className="nodemodal-overlay" onClick={handleOverlayClick}>
      <div className="nodemodal-content">
        <div
          className="nodemodal-header"
          style={{ backgroundColor: contentData.nodeColor || 'defaultColor' }}
        >
          <button className="nodemodal-close-button" onClick={handleClose}>
            <IoIosArrowBack />
          </button>
          <div className="nodemodal-title-container">
            <input
              className="nodemodal-title"
              value={title}
              onChange={handleTitleChange}
              placeholder="Enter title*"
              ref={titleInputRef}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {!isFocused && (
              <>
                <button
                  className="nodemodal-edit-button"
                  onClick={() => titleInputRef.current?.focus()}
                >
                  edit
                </button>
                <div className="nodemodal-color-wrapper">
                  <input
                    type="color"
                    ref={colorInputRef}
                    value={contentData.nodeColor || '#2383ed'}
                    onChange={handleColorChange}
                    className="nodemodal-color-picker"
                    title="Change node color"
                  />
                </div>
              </>
            )}
          </div>
        </div>
        <div className="nodemodal-body">
          <ModalContentRouter
            type={contentData.node.type}
            data={contentData}
            nodesData={nodesData}
            links={links}
            onUpdate={handleDataUpdate}
            currentWid={currentWid}
            openNodeModal={openNodeModal}
            widModeShared={widModeShared}
          />
        </div>
      </div>
    </div>
  );
};

export { NodeModal };
