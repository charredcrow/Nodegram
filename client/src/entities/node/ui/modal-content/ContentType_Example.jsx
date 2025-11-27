import React, { useState, useRef } from 'react';

const ContentTypeB = ({ data, onUpdate }) => {
  const [description, setDescription] = useState(data?.node?.description || '');
  const [isFocused, setIsFocused] = useState(false); // Состояние для управления фокусом
  const inputRef = useRef(null); // Ссылка на input

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    if (data && data.node) {
      onUpdate({ ...data, node: { ...data.node, description: e.target.value } });
    }
  };

  if (!data || !data.node) {
    return <div>Error: Invalid data</div>;
  }

  return (
    <div>
      <div className="сontentType_inputContainer">
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
      </div>
    </div>
  );
};

export default ContentTypeB;
