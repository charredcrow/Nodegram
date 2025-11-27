import React, { useState, useEffect, useRef } from 'react';
import './CategorySelector.css';
import { FaTimes } from 'react-icons/fa';

const CategorySelector = ({ isOpen, onClose, onSelect, categories = [] }) => {
  const [newCategory, setNewCategory] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSelect = (category) => {
    onSelect(category);
    onClose();
  };

  const handleAddNew = () => {
    if (newCategory.trim()) {
      onSelect(newCategory.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="category-selector-overlay">
      <div className="category-selector-modal" ref={modalRef}>
        <div className="category-selector-header">
          <h3>Choose category</h3>
          <button className="category-selector-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="category-selector-content">
          {!isAddingNew ? (
            <>
              <div className="category-selector-list">
                {categories.map((category, index) => (
                  <div
                    key={index}
                    className="category-selector-item"
                    onClick={() => handleSelect(category)}
                  >
                    {category}
                  </div>
                ))}
              </div>
              <button className="category-selector-add-new" onClick={() => setIsAddingNew(true)}>
                + New category
              </button>
            </>
          ) : (
            <div className="category-selector-add-form">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name"
                className="category-selector-input"
              />
              <div className="category-selector-actions">
                <button className="category-selector-cancel" onClick={() => setIsAddingNew(false)}>
                  Cancel
                </button>
                <button
                  className="category-selector-save"
                  onClick={handleAddNew}
                  disabled={!newCategory.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategorySelector;
