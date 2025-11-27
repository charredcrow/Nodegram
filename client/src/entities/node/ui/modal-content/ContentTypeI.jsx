import React, { useState, useRef, useEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useNotification } from '../../../../app/providers/NotificationProvider';

const ContentTypeI = ({ data, onUpdate, nodesData, currentWid, widModeShared }) => {
  const { showNotification } = useNotification();
  const [description, setDescription] = useState(data?.node?.description || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const quillRef = useRef(null);
  const quillInstance = useRef(null);
  const dataRef = useRef(data);

  // Всегда держим актуальную ссылку на последние props data,
  // чтобы текстовые изменения не перезаписывали обновлённые selectedFiles
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!quillRef.current || quillInstance.current) return;

    try {
      quillInstance.current = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Start typing your content here...',
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

      quillInstance.current.root.innerHTML = data?.node?.content?.html_editor || '';

      quillInstance.current.on('text-change', () => {
        const htmlContent = quillInstance.current.root.innerHTML;
        const latestData = dataRef.current;
        if (latestData && latestData.node) {
          onUpdate({
            ...latestData,
            node: {
              ...latestData.node,
              content: {
                ...latestData.node.content,
                html_editor: htmlContent,
              },
            },
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
    } catch (error) {
      showNotification('Failed to initialize editor', 'error', 3000);
    }
  }, [data, onUpdate, showNotification]);

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    if (data && data.node) {
      onUpdate({ ...data, node: { ...data.node, description: e.target.value } });
    }
  };

  if (!data || !data.node) {
    showNotification('Invalid data provided', 'error', 3000);
    return null;
  }

  return (
    <div className="сontentType_container">
      <div ref={quillRef} />
      <br />
      <div className="сontentType_inputContainer"></div>
    </div>
  );
};

export default ContentTypeI;
