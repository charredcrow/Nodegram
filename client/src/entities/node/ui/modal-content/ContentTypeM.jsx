import React, { useState, useRef, useEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import './ContentTypeM.css';
import { ConfirmationModal } from '../../../../shared/ui';
import { FaBars, FaEdit, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';

// Example data structure
const initialData = [
  {
    id: 'cat-1',
    title: 'Introduction',
    children: [
      {
        id: 'subcat-1-1',
        title: 'Welcome',
        content: '<p>Welcome to the documentation!</p>',
      },
    ],
    content: '<p>Intro section</p>',
  },
];

function generateId(prefix = 'id') {
  return prefix + '-' + Math.random().toString(36).substr(2, 9);
}

const ContentTypeM = ({ data, onUpdate }) => {
  const [docData, setDocData] = useState(data?.node?.content?.doc_json || initialData);
  const [activeId, setActiveId] = useState(docData[0]?.id || '');
  const [menuOpen, setMenuOpen] = useState(false); // for mobile menu
  const [editingId, setEditingId] = useState(null); // id of the section being edited
  const [editTitleId, setEditTitleId] = useState(null); // id for inline title editing
  const [editTitleValue, setEditTitleValue] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false); // modal state
  const [pendingDeleteId, setPendingDeleteId] = useState(null); // id to delete
  const sectionRefs = useRef({});
  const quillRefs = useRef({}); // refs for Quill containers
  const quillInstances = useRef({}); // refs for Quill instances

  // Save changes to parent component
  useEffect(() => {
    if (data && data.node) {
      onUpdate({
        ...data,
        node: {
          ...data.node,
          content: {
            ...data.node.content,
            doc_json: docData,
          },
        },
      });
    }
  }, [docData]);

  // Smooth scroll to section
  const scrollToSection = (id) => {
    setActiveId(id);
    setMenuOpen(false); // close menu on mobile
    setTimeout(() => {
      sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Click on section — show editor
  const handleSectionClick = (id) => {
    setEditingId(id);
    setTimeout(() => {
      if (quillRefs.current[id] && !quillInstances.current[id]) {
        quillInstances.current[id] = new Quill(quillRefs.current[id], {
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
        // Set current content
        const section = findSectionById(docData, id);
        if (section) {
          quillInstances.current[id].root.innerHTML = section.content || '';
        }
        // Listen for changes
        quillInstances.current[id].on('text-change', () => {
          const htmlContent = quillInstances.current[id].root.innerHTML;
          updateSectionContent(id, htmlContent);
        });
        // Focus
        quillInstances.current[id].focus();
      }
    }, 0);
  };

  // Click outside editor — hide editor
  useEffect(() => {
    if (!editingId) return;
    const handleClick = (e) => {
      // If click is outside current editor and Quill toolbar
      const toolbar = document.querySelector('.ql-toolbar.ql-snow');
      if (
        quillRefs.current[editingId] &&
        !quillRefs.current[editingId].contains(e.target) &&
        !(toolbar && toolbar.contains(e.target))
      ) {
        // Remove editor instance and clean up DOM
        if (quillInstances.current[editingId]) {
          // Remove all event listeners and instance
          if (typeof quillInstances.current[editingId].off === 'function') {
            quillInstances.current[editingId].off('text-change');
          }
          if (typeof quillInstances.current[editingId].destroy === 'function') {
            quillInstances.current[editingId].destroy();
          }
          quillInstances.current[editingId] = null;
        }
        setEditingId(null);
        // Remove all Quill toolbars from DOM just in case
        document.querySelectorAll('.ql-toolbar.ql-snow').forEach((el) => el.remove());
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [editingId]);

  // Find section by id
  const findSectionById = (items, id) => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findSectionById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Update section content
  const updateSectionContent = (id, html) => {
    const update = (items) =>
      items.map((item) => {
        if (item.id === id) return { ...item, content: html };
        if (item.children) return { ...item, children: update(item.children) };
        return item;
      });
    setDocData((prev) => update(prev));
  };

  // Add category
  const handleAddCategory = () => {
    const newId = generateId('cat');
    const newTitle = 'New Category';
    setDocData((prev) => [...prev, { id: newId, title: newTitle, content: '', children: [] }]);
    setEditTitleId(newId);
    setEditTitleValue(newTitle);
  };
  // Add subcategory
  const handleAddSubcategory = (catId) => {
    const newId = generateId('subcat');
    const newTitle = 'New Subcategory';
    setDocData((prev) =>
      prev.map((cat) =>
        cat.id === catId
          ? {
              ...cat,
              children: [...(cat.children || []), { id: newId, title: newTitle, content: '' }],
            }
          : cat
      )
    );
    setEditTitleId(newId);
    setEditTitleValue(newTitle);
  };
  // Edit title
  const handleEditTitle = (id, currentTitle) => {
    setEditTitleId(id);
    setEditTitleValue(currentTitle);
  };
  // Save new title
  const handleSaveTitle = (id) => {
    const update = (items) =>
      items.map((item) => {
        if (item.id === id) return { ...item, title: editTitleValue };
        if (item.children) return { ...item, children: update(item.children) };
        return item;
      });
    setDocData((prev) => update(prev));
    setEditTitleId(null);
    setEditTitleValue('');
  };
  // Delete category or subcategory (open modal)
  const handleDelete = (id) => {
    setPendingDeleteId(id);
    setIsConfirmOpen(true);
  };
  // Confirm delete
  const handleConfirmDelete = () => {
    const remove = (items) =>
      items.filter((item) => {
        if (item.id === pendingDeleteId) return false;
        if (item.children) item.children = remove(item.children);
        return true;
      });
    setDocData((prev) => remove(prev));
    if (activeId === pendingDeleteId) setActiveId(docData[0]?.id || '');
    setIsConfirmOpen(false);
    setPendingDeleteId(null);
  };
  // Cancel delete
  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setPendingDeleteId(null);
  };

  // Render menu
  const renderMenu = (items, parentIsCategory = true) => (
    <ul className={parentIsCategory ? 'doc-menu-list' : 'doc-menu-sublist'}>
      {items.map((item) => (
        <li key={item.id}>
          <div
            className={`doc-menu-item${!parentIsCategory ? ' doc-menu-item-sub' : ''}${activeId === item.id ? ' active' : ''}`}
            onClick={() => scrollToSection(item.id)}
          >
            {editTitleId === item.id ? (
              <input
                className="doc-menu-edit-input"
                value={editTitleValue}
                placeholder="Enter title"
                autoFocus
                onChange={(e) => setEditTitleValue(e.target.value)}
                onBlur={() => handleSaveTitle(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle(item.id);
                }}
                style={{ width: '70%' }}
              />
            ) : (
              <span title={item.title}>
                {item.title.length > 20 ? item.title.slice(0, 20) + '…' : item.title}
              </span>
            )}
            <span className="doc-menu-actions">
              <button
                className="doc-menu-action-btn"
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditTitle(item.id, item.title);
                }}
              >
                <FaEdit />
              </button>
              <button
                className="doc-menu-action-btn"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
              >
                <FaTrash />
              </button>
              {parentIsCategory && (
                <button
                  className="doc-menu-action-btn"
                  title="Add subcategory"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddSubcategory(item.id);
                  }}
                >
                  <FaPlus />
                </button>
              )}
            </span>
          </div>
          {item.children && item.children.length > 0 && renderMenu(item.children, false)}
        </li>
      ))}
    </ul>
  );

  // Render documentation sections
  const renderSections = (items, parentIsCategory = true) => (
    <>
      {items.map((item, index) => {
        const sectionClass = parentIsCategory
          ? `doc-section doc-section-category${index === items.length - 1 ? ' last-category' : ''}`
          : 'doc-section doc-section-subcategory';
        return (
          <div
            key={item.id}
            ref={(el) => (sectionRefs.current[item.id] = el)}
            className={sectionClass}
          >
            <div className="doc-section-header">
              <h2 className="doc-section-title">{item.title}</h2>
              {(!item.content || item.content.replace(/<[^>]*>/g, '').trim() === '') && (
                <button
                  className="doc-menu-action-btn doc-section-edit-btn"
                  title="Edit content"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSectionClick(item.id);
                  }}
                >
                  ✎
                </button>
              )}
            </div>
            {editingId === item.id ? (
              <div ref={(el) => (quillRefs.current[item.id] = el)} className="doc-quill-editor" />
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: item.content || '' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSectionClick(item.id);
                }}
                className="doc-section-content"
              />
            )}
            {item.children && item.children.length > 0 && renderSections(item.children, false)}
          </div>
        );
      })}
    </>
  );

  return (
    <div className="doc-container">
      {/* Mobile hamburger */}
      <button className="doc-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        <div className="menu-icon-wrapper">
          <FaBars className={`menu-icon ${menuOpen ? 'hidden' : 'visible'}`} />
          <FaTimes className={`menu-icon ${menuOpen ? 'visible' : 'hidden'}`} />
        </div>
      </button>
      <nav className={`doc-menu${menuOpen ? ' open' : ''}`}>
        {renderMenu(docData)}
        <button className="doc-menu-action-btn-add-category" onClick={handleAddCategory}>
          <FaPlus /> <strong>Category</strong>
        </button>
      </nav>
      <main className="doc-main">{renderSections(docData)}</main>
      <ConfirmationModal
        isOpen={isConfirmOpen}
        message="Are you sure you want to delete this item?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default ContentTypeM;
