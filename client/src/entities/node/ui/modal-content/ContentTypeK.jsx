import React, { useState, useRef } from 'react';

const ContentTypeK = ({ data, onUpdate, nodesData }) => {
  const [description, setDescription] = useState(data?.node?.description || '');
  const [isFocused, setIsFocused] = useState(false); // Состояние для управления фокусом
  const inputRef = useRef(null); // Ссылка на input

  // Инициализация состояния для timeline
  const initialTimelineItems = Array.isArray(data?.node?.content?.timeline?.items)
    ? data.node.content.timeline.items
    : [];
  const [timelineItems, setTimelineItems] = useState(initialTimelineItems);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Состояния для редактирования
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Функция для генерации уникального числового ID
  const generateUniqueId = () => {
    const existingIds = timelineItems.map((item) => item.id);
    let newId = 1;
    while (existingIds.includes(newId)) {
      newId++;
    }
    return newId;
  };

  // const handleDescriptionChange = (e) => {
  //   setDescription(e.target.value);
  //   if (data && data.node) {
  //     onUpdate({ ...data, node: { ...data.node, description: e.target.value } });
  //   }
  // };

  // Обновление содержимого узла
  const updateNodeContent = (items) => {
    if (data && data.node) {
      const updatedContent = {
        ...data.node.content,
        timeline: {
          items: items,
          lastUpdated: new Date().toISOString(),
        },
      };

      // Удаляем дублирующиеся данные, если они есть
      if (updatedContent.items) {
        delete updatedContent.items;
      }

      onUpdate({
        ...data,
        node: {
          ...data.node,
          content: updatedContent,
        },
      });
    }
  };

  // Обработчик добавления новой цели
  const handleAddItem = () => {
    if (!newItemTitle.trim()) return;

    const newItem = {
      id: generateUniqueId(), // Используем новую функцию генерации ID
      title: newItemTitle,
      description: newItemDescription,
      completed: false,
      timestamp: new Date().toISOString(),
    };

    const updatedItems = [...timelineItems, newItem];
    setTimelineItems(updatedItems);
    updateNodeContent(updatedItems);

    // Очистка полей
    setNewItemTitle('');
    setNewItemDescription('');
    setIsAddingNew(false);
  };

  // Обработчик удаления цели
  const handleDeleteItem = (itemId) => {
    const updatedItems = timelineItems.filter((item) => item.id !== itemId);
    setTimelineItems(updatedItems);
    updateNodeContent(updatedItems);
  };

  // Обработчик переключения состояния цели
  const handleToggleComplete = (itemId) => {
    const currentIndex = timelineItems.findIndex((i) => i.id === itemId);
    const selectedItem = timelineItems[currentIndex];
    const newCompleted = !selectedItem.completed;

    const updatedItems = timelineItems.map((item, index) => {
      // Если это выбранный элемент
      if (item.id === itemId) {
        return { ...item, completed: newCompleted };
      }

      // Если элемент находится после выбранного
      if (index > currentIndex) {
        // Если выбранный элемент становится невыполненным
        if (!newCompleted) {
          return { ...item, completed: false };
        }
      }

      // Если элемент находится перед выбранным
      if (index < currentIndex) {
        // Если выбранный элемент становится выполненным
        if (newCompleted) {
          return { ...item, completed: true };
        }
      }

      return item;
    });

    setTimelineItems(updatedItems);
    updateNodeContent(updatedItems);
  };

  // Обработчик начала редактирования
  const handleStartEdit = (item) => {
    setEditingItem(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description);
  };

  // Обработчик сохранения редактирования
  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;

    const updatedItems = timelineItems.map((item) => {
      if (item.id === editingItem) {
        return {
          ...item,
          title: editTitle,
          description: editDescription,
          timestamp: new Date().toISOString(),
        };
      }
      return item;
    });

    setTimelineItems(updatedItems);
    updateNodeContent(updatedItems);
    setEditingItem(null);
  };

  // Обработчик отмены редактирования
  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  // Обработчик перемещения элемента вверх
  const handleMoveUp = (itemId) => {
    const currentIndex = timelineItems.findIndex((item) => item.id === itemId);
    if (currentIndex > 0) {
      const updatedItems = [...timelineItems];

      // Сохраняем completed и id для обоих элементов
      const currentCompleted = updatedItems[currentIndex].completed;
      const currentId = updatedItems[currentIndex].id;
      const prevCompleted = updatedItems[currentIndex - 1].completed;
      const prevId = updatedItems[currentIndex - 1].id;

      // Меняем местами только title, description и timestamp
      [updatedItems[currentIndex], updatedItems[currentIndex - 1]] = [
        {
          ...updatedItems[currentIndex - 1],
          completed: currentCompleted,
          id: currentId,
        },
        {
          ...updatedItems[currentIndex],
          completed: prevCompleted,
          id: prevId,
        },
      ];

      setTimelineItems(updatedItems);
      updateNodeContent(updatedItems);
    }
  };

  // Обработчик перемещения элемента вниз
  const handleMoveDown = (itemId) => {
    const currentIndex = timelineItems.findIndex((item) => item.id === itemId);
    if (currentIndex < timelineItems.length - 1) {
      const updatedItems = [...timelineItems];

      // Сохраняем completed и id для обоих элементов
      const currentCompleted = updatedItems[currentIndex].completed;
      const currentId = updatedItems[currentIndex].id;
      const nextCompleted = updatedItems[currentIndex + 1].completed;
      const nextId = updatedItems[currentIndex + 1].id;

      // Меняем местами только title, description и timestamp
      [updatedItems[currentIndex], updatedItems[currentIndex + 1]] = [
        {
          ...updatedItems[currentIndex + 1],
          completed: currentCompleted,
          id: currentId,
        },
        {
          ...updatedItems[currentIndex],
          completed: nextCompleted,
          id: nextId,
        },
      ];

      setTimelineItems(updatedItems);
      updateNodeContent(updatedItems);
    }
  };

  if (!data || !data.node) {
    return <div>Error: Invalid data</div>;
  }

  return (
    <div className="сontentType_container">
      {/* <div className="сontentType_inputContainer">
        <div className="сontentType_descriptionContainer">
          <input
            type="text"
            value={description}
            onChange={handleDescriptionChange}
            className="сontentType_description"
            placeholder="Node description"
            ref={inputRef} // Используем useRef
            onFocus={() => setIsFocused(true)} // Скрываем кнопку при фокусе
            onBlur={() => setIsFocused(false)} // Показываем кнопку при потере фокуса
          />
          {!isFocused && (
            <button
              className="сontentType_editButton"
              onClick={() => inputRef.current?.focus()} // Устанавливаем фокус на input
            >
              edit
            </button>
          )}
        </div>
      </div> */}

      <div className="сontentType_timelineContainer">
        {timelineItems.length > 3 && (
          <div className="timeline_progress">
            <div className="timeline_progressBar">
              <div
                className="timeline_progressFill"
                style={{
                  width: `${(timelineItems.filter((item) => item.completed).length / timelineItems.length) * 100}%`,
                }}
              />
            </div>
            <div className="timeline_progressText">
              {timelineItems.filter((item) => item.completed).length} of {timelineItems.length}{' '}
              completed
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="timeline_list">
          {timelineItems.map((item, index) => (
            <div key={item.id} className={`timeline_item ${item.completed ? 'completed' : ''}`}>
              <div className="timeline_node" onClick={() => handleToggleComplete(item.id)}>
                <div className="timeline_circle"></div>
                {index < timelineItems.length - 1 && <div className="timeline_line"></div>}
              </div>
              <div className="timeline_content">
                {editingItem === item.id ? (
                  <div className="timeline_editForm">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title"
                      className="timeline_input"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description"
                      className="timeline_textarea"
                    />
                    <div className="timeline_formButtons">
                      <button className="timeline_saveButton" onClick={handleSaveEdit}>
                        Save
                      </button>
                      <button className="timeline_cancelButton" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="timeline_title">{item.title}</h3>
                    <p className="timeline_description">{item.description}</p>
                    <div className="timeline_buttons">
                      <button
                        className="timeline_actionButton"
                        onClick={() => handleStartEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="timeline_actionButton"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        Delete
                      </button>
                      <button
                        className="timeline_actionButton"
                        onClick={() => handleMoveUp(item.id)}
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        className="timeline_actionButton"
                        onClick={() => handleMoveDown(item.id)}
                        disabled={index === timelineItems.length - 1}
                      >
                        ↓
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Кнопка добавления новой цели */}
        {!isAddingNew ? (
          <button className="timeline_addButton" onClick={() => setIsAddingNew(true)}>
            New Line
          </button>
        ) : (
          <div className="timeline_newItemForm">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Title"
              className="timeline_input"
            />
            <textarea
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder="Description"
              className="timeline_textarea"
            />
            <div className="timeline_formButtons">
              <button className="timeline_saveButton" onClick={handleAddItem}>
                Save
              </button>
              <button
                className="timeline_cancelButton"
                onClick={() => {
                  setIsAddingNew(false);
                  setNewItemTitle('');
                  setNewItemDescription('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentTypeK;
