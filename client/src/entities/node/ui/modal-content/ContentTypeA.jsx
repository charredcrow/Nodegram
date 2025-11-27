import React, { useState, useRef, useEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useNotification } from '../../../../app/providers/NotificationProvider';

const ContentTypeA = ({ data, onUpdate }) => {
  const { showNotification } = useNotification();
  const [description, setDescription] = useState(data?.node?.description || '');
  const [isFocused, setIsFocused] = useState(false); // Состояние для управления фокусом
  const inputRef = useRef(null); // Ссылка на input
  const quillRef = useRef(null); // Ссылка на контейнер для Quill
  const quillInstance = useRef(null); // Ссылка на экземпляр Quill
  const descriptionRef = useRef(data?.node?.description || ''); // Добавляем ref для description

  // Обновляем ref при изменении description
  useEffect(() => {
    descriptionRef.current = description;
  }, [description]);

  // Синхронизируем description с внешними изменениями
  useEffect(() => {
    if (data?.node?.description) {
      setDescription(data.node.description);
      descriptionRef.current = data.node.description;
    }
  }, [data?.node?.description]);

  useEffect(() => {
    if (!quillRef.current || quillInstance.current) return;

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

    // Устанавливаем начальное значение редактора
    quillInstance.current.root.innerHTML = data?.node?.content?.html_editor || '';

    // Слушаем изменения содержимого редактора
    quillInstance.current.on('text-change', () => {
      const htmlContent = quillInstance.current.root.innerHTML;
      onUpdate({
        node: {
          description: descriptionRef.current, // Используем ref вместо состояния
          content: {
            html_editor: htmlContent,
          },
        },
      });
    });

    // Находим toolbar
    let toolbar = quillRef.current.parentElement.querySelector('.ql-toolbar.ql-snow');

    // Если не найден в родительском элементе, ищем в document
    if (!toolbar) {
      toolbar = document.querySelector('.ql-toolbar.ql-snow');
    }

    // Скрываем toolbar по умолчанию
    if (toolbar) {
      toolbar.style.display = 'none';
      toolbar.style.opacity = '0';
      toolbar.style.transition = 'opacity 0.2s ease';
    }

    // Обработчики фокуса через quillInstance
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

    // Также добавляем обработчики на DOM элементы как резервный вариант
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
    const newDescription = e.target.value;
    setDescription(newDescription);
    descriptionRef.current = newDescription; // Обновляем ref
    onUpdate({
      node: {
        description: newDescription,
        content: {
          html_editor: quillInstance.current?.root.innerHTML || '',
        },
      },
    });
  };

  if (!data || !data.node) {
    showNotification('Something went wrong', 'error', 3000);
    return null;
  }

  return (
    <div className="сontentType_container">
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
      <div ref={quillRef} />
    </div>
  );
};

export default ContentTypeA;
