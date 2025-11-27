import React, { useState, useEffect } from 'react';
import './ContentTypeO.css';
import { MdArrowUpward, MdArrowDownward, MdDelete, MdSearch } from 'react-icons/md';

const ContentTypeO = ({ data, onUpdate }) => {
  const safeEntries = Array.isArray(data?.node?.content?.entries) ? data.node.content.entries : [];
  const [entries, setEntries] = useState(safeEntries);
  const [newEntry, setNewEntry] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (Array.isArray(data?.node?.content?.entries)) {
      setEntries(data.node.content.entries);
    } else {
      setEntries([]);
    }
  }, [data]);

  const updateNodeContent = (updatedEntries) => {
    if (data && data.node) {
      onUpdate({
        ...data,
        node: {
          ...data.node,
          content: {
            ...data.node.content,
            entries: updatedEntries,
          },
        },
      });
    }
  };

  const addEntry = (e) => {
    e.preventDefault();
    if (!newEntry.trim()) return;

    const defaultColor = '#e6551b'; // Orange by default

    const newEntryObj = {
      id: Date.now(),
      text: newEntry,
      date: new Date().toISOString(),
      color: defaultColor,
    };

    const updatedEntries = [newEntryObj, ...entries];
    setEntries(updatedEntries);
    updateNodeContent(updatedEntries);
    setNewEntry('');
  };

  const deleteEntry = (id) => {
    const updatedEntries = entries.filter((entry) => entry.id !== id);
    setEntries(updatedEntries);
    updateNodeContent(updatedEntries);
  };

  const moveEntry = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === entries.length - 1)
    )
      return;

    const updatedEntries = [...entries];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updatedEntries[index], updatedEntries[newIndex]] = [
      updatedEntries[newIndex],
      updatedEntries[index],
    ];

    setEntries(updatedEntries);
    updateNodeContent(updatedEntries);
  };

  const changeEntryColor = (id, color) => {
    const updatedEntries = entries.map((entry) => (entry.id === id ? { ...entry, color } : entry));
    setEntries(updatedEntries);
    updateNodeContent(updatedEntries);
  };

  const filteredEntries = entries.filter((entry) =>
    entry.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="chronology-container">
      <div className="header-form-grid">
        <div className="chronology-header">
          <div className="search-container">
            <MdSearch size={20} />
            <input
              type="text"
              className="search-input"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <form className="add-entry-form" onSubmit={addEntry}>
          <input
            type="text"
            className="add-entry-input"
            placeholder="Add new entry..."
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
          />
          <button type="submit" className="add-button">
            Add Entry
          </button>
        </form>
      </div>

      <div className="chronology-list">
        {filteredEntries.length === 0 ? (
          <div className="no-entries">
            {searchTerm ? 'No matching entries found' : 'No entries yet'}
          </div>
        ) : (
          filteredEntries.map((entry, index) => (
            <div key={entry.id} className="chronology-item">
              <div className="item-content">
                <div className="item-text">
                  <input
                    type="color"
                    value={entry.color || '#e6551b'}
                    onChange={(e) => changeEntryColor(entry.id, e.target.value)}
                    className="color-picker"
                    title="Change entry color"
                  />
                  {entry.text}
                </div>
                <div className="item-date">{new Date(entry.date).toLocaleString()}</div>
              </div>
              <div className="item-controls">
                <button
                  className="control-button_typeO"
                  onClick={() => moveEntry(index, 'up')}
                  disabled={index === 0}
                  title="Move up"
                >
                  <MdArrowUpward />
                </button>
                <button
                  className="control-button_typeO"
                  onClick={() => moveEntry(index, 'down')}
                  disabled={index === entries.length - 1}
                  title="Move down"
                >
                  <MdArrowDownward />
                </button>
                <button
                  className="control-button_typeO"
                  onClick={() => deleteEntry(entry.id)}
                  title="Delete entry"
                >
                  <MdDelete />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContentTypeO;
