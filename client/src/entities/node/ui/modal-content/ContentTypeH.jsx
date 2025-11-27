import React, { useState, useRef, useEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const ContentTypeH = ({ data, onUpdate }) => {
  const [description, setDescription] = useState(data?.node?.description || '');
  const [isFocused, setIsFocused] = useState(false); // Состояние для управления фокусом
  const inputRef = useRef(null); // Ссылка на input
  const quillRef = useRef(null); // Ссылка на контейнер для Quill
  const quillInstance = useRef(null); // Ссылка на экземпляр Quill

  useEffect(() => {
    if (!quillRef.current || quillInstance.current) return; // Если редактор уже инициализирован, выходим

    // Инициализация Quill редактора
    quillInstance.current = new Quill(quillRef.current, {
      theme: 'snow',
      placeholder: 'Start typing your content here...',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'], // Форматирование текста
          [{ list: 'ordered' }, { list: 'bullet' }], // Списки
          [{ header: [1, 2, 3, 4, 5, 6, false] }], // Заголовки
          [{ color: [] }, { background: [] }],
          ['link'], // Ссылки и изображения
          ['clean'], // Очистить форматирование
          [{ align: [] }],
        ],
      },
    });

    // Установка начального значения редактора
    quillInstance.current.root.innerHTML = data?.node?.content?.html_editor || '';

    // Слушаем изменения содержимого редактора
    quillInstance.current.on('text-change', () => {
      const htmlContent = quillInstance.current.root.innerHTML;
      if (data && data.node) {
        onUpdate({
          ...data,
          node: { ...data.node, content: { ...data.node.content, html_editor: htmlContent } },
        });
      }
    });

    // Toolbar show/hide logic
    let toolbar = quillRef.current.parentElement.querySelector('.ql-toolbar.ql-snow');
    if (!toolbar) {
      toolbar = document.querySelector('.ql-toolbar.ql-snow');
    }
    if (toolbar) {
      toolbar.style.display = 'none';
      toolbar.style.opacity = '0';
      toolbar.style.transition = 'opacity 0.2s ease';
    }
    quillInstance.current.on('focus', () => {
      if (toolbar) {
        toolbar.style.display = 'block';
        setTimeout(() => {
          toolbar.style.opacity = '1';
        }, 10);
      }
    });
    quillInstance.current.on('blur', () => {
      if (toolbar) {
        toolbar.style.opacity = '0';
        setTimeout(() => {
          toolbar.style.display = 'none';
        }, 200);
      }
    });
    // Fallback for click/blur on editor
    const editor = quillRef.current.querySelector('.ql-editor');
    if (editor) {
      editor.addEventListener('click', () => {
        if (toolbar) {
          toolbar.style.display = 'block';
          toolbar.style.opacity = '1';
        }
      });
      editor.addEventListener('blur', (event) => {
        // Проверяем, не был ли клик на toolbar
        if (event.relatedTarget && event.relatedTarget.closest('.ql-toolbar')) {
          return; // Не скрываем toolbar если клик был на нём
        }
        if (toolbar) {
          toolbar.style.opacity = '0';
          setTimeout(() => {
            toolbar.style.display = 'none';
          }, 200);
        }
      });
    }

    // Добавляем обработчик на toolbar, чтобы он не скрывался при клике на него
    if (toolbar) {
      toolbar.addEventListener('click', (event) => {
        event.stopPropagation(); // Предотвращаем всплытие события
      });
    }
  }, [data, onUpdate]);

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
    <div className="сontentType_container">
      <div className="сontentType_inputContainer">
        {/* <div className="сontentType_descriptionContainer">
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
        </div> */}
      </div>
      <div ref={quillRef} />
    </div>
  );
};

export default ContentTypeH;
