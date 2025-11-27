import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import './WorkspaceToolbar.css';
import { BsNodePlus } from 'react-icons/bs';
import { PiSelectionPlusLight, PiCursorThin } from 'react-icons/pi';
import { IoIosArrowBack } from 'react-icons/io';
import { AiOutlineNodeIndex, AiOutlineDelete } from 'react-icons/ai';
import { VscDiffAdded } from 'react-icons/vsc';
import { MdFullscreen, MdFullscreenExit } from 'react-icons/md';
import { BiExpand } from 'react-icons/bi';
import { CiCalendar } from 'react-icons/ci';
import { useNotification } from '../../app/providers/NotificationProvider';

Modal.setAppElement('#root'); // Set root element of your application

export const WorkspaceToolbar = ({
  onModeChange,
  mode,
  onTypeSelect,
  typeWidths,
  typeColors,
  typeNodeName,
  nodesData = [],
  nodeDescription,
  triggerScaleFit,
  selectedNodes,
  onDeleteSelectedNodes,
  nodeIcons,
  triggerCalendar,
}) => {
  const [activeMode, setActiveMode] = useState(mode || 'select');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showNotification } = useNotification();

  useEffect(() => {
    if (mode !== activeMode) {
      setActiveMode(mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleModeChange = (newMode) => {
    setActiveMode(newMode);
    // Small delay to allow coordinates to commit after drag before mode change
    if (onModeChange) {
      requestAnimationFrame(() => onModeChange(newMode));
    }
  };

  const handleAddNodeClick = () => {
    handleModeChange('addNode');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveMode('select');
    if (onModeChange) {
      onModeChange('select');
    }
  };

  const handleSelect = async (type) => {
    try {
      // Limits disabled - unlimited usage
      const uniqueId = Math.random().toString(36).substr(2, 9);
      const uniqueType = `${type}_${uniqueId}`;
      return uniqueType;
    } catch (error) {
      showNotification('Something went wrong', 'error', 5000);
      return;
    }
  };

  const filteredTypes = Object.entries(typeNodeName).filter(([type, name]) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteSelected = () => {
    if (onDeleteSelectedNodes && selectedNodes?.length > 1) {
      onDeleteSelectedNodes();
    }
  };

  function handleMode(activeMode) {
    switch (activeMode) {
      case 'addNode':
        return 'New Node';
      case 'select':
        return 'View';
      case 'create':
        return 'Create connections';
      case 'selectMove':
        return 'Select and Move Nodes';

      case 'delete':
        return 'Delete';

      default:
        return 'View';
    }
  }
  return (
    <>
      <div className="toolbar">
        {/* Calendar button */}
        <button className="tool-button" onClick={triggerCalendar} title="Calendar">
          <CiCalendar />
        </button>

        <button
          className={`tool-button ${activeMode === 'addNode' ? 'active' : ''}`}
          onClick={handleAddNodeClick}
          title="New Node"
        >
          <VscDiffAdded />
        </button>
        <button
          className={`tool-button ${activeMode === 'select' ? 'active' : ''}`}
          onClick={() => handleModeChange('select')}
          title="View"
        >
          <PiCursorThin />
        </button>
        <button
          className={`tool-button ${activeMode === 'create' ? 'active' : ''}`}
          onClick={() => handleModeChange('create')}
          title="Create connections"
        >
          <AiOutlineNodeIndex />
        </button>
        <button
          className={`tool-button ${activeMode === 'selectMove' ? 'active' : ''}`}
          onClick={() => handleModeChange('selectMove')}
          title="Select and Move Nodes"
        >
          <PiSelectionPlusLight />
        </button>
        {activeMode === 'selectMove' && selectedNodes?.length > 1 && (
          <button
            className="tool-button delete-selected"
            onClick={handleDeleteSelected}
            title="Delete Selected Nodes"
          >
            <AiOutlineDelete />
          </button>
        )}
        <button className="tool-button fs18" onClick={triggerScaleFit} title="Fit to Screen">
          <BiExpand />
        </button>
        <button
          className={`tool-button ${activeMode === 'delete' ? 'active' : ''}`}
          onClick={() => handleModeChange('delete')}
          title="Delete"
        >
          <AiOutlineDelete />
        </button>

        {/* Modal window with react-modal */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          contentLabel="Add Node"
          className="modal-content"
          overlayClassName="modal-overlay"
          shouldCloseOnOverlayClick={true}
          shouldCloseOnEsc={true}
        >
          <div className="modal-search">
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="modal-body">
            {filteredTypes.map(([type, name]) => (
              <div
                className={`modal-item-container ${
                  searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())
                    ? 'hidden'
                    : ''
                }`}
                key={type}
                onClick={async () => {
                  const uniqueType = await handleSelect(type);
                  if (uniqueType) {
                    onTypeSelect(uniqueType);
                  }
                }}
              >
                <div className="modal-item" />
                <span
                  className="modal-item-icon"
                  style={{
                    backgroundColor: typeColors[type],
                    width: `34px`,
                    height: `34px`,
                  }}
                  title={name}
                >
                  {nodeIcons[type] &&
                    React.createElement(nodeIcons[type], {
                      style: {
                        color: '#fff',
                        width: '22px',
                        height: '22px',
                      },
                    })}
                </span>
                <p>
                  <span className="modal-item-name">{name}</span>
                  <br />
                  <small className="modal-item-description">{nodeDescription[type]}</small>
                </p>
              </div>
            ))}
          </div>
        </Modal>
      </div>
      <span className="display-mode">{handleMode(activeMode)}</span>
    </>
  );
};
