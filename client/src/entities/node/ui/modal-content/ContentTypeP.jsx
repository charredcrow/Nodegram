import React, { useState, useRef, useEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useNotification } from '../../../../app/providers/NotificationProvider';
import './ContentTypeP.css';

const ContentTypeP = ({ data, onUpdate, nodesData, currentWid, widModeShared }) => {
  const { showNotification } = useNotification();
  const [description, setDescription] = useState(data?.node?.description || '');
  const [isFocused, setIsFocused] = useState(false);
  const [headerWidth, setHeaderWidth] = useState(data?.node?.content?.headerWidth || 340);
  const [imageUrl, setImageUrl] = useState(data?.node?.content?.imageUrl || '');
  const inputRef = useRef(null);
  const quillRef = useRef(null);
  const quillInstance = useRef(null);

  // Функция для обновления размеров в content
  const updateSizes = (newHeaderWidth) => {
    if (data && data.node) {
      onUpdate({
        ...data,
        node: {
          ...data.node,
          content: {
            ...data.node.content,
            headerWidth: newHeaderWidth,
          },
        },
      });
    }
  };

  // Обработчик изменения ширины заголовка
  const handleHeaderWidthChange = (e) => {
    const newWidth = parseInt(e.target.value);
    setHeaderWidth(newWidth);
    updateSizes(newWidth);
  };

  // Функция сброса размеров
  const handleResetSizes = () => {
    const defaultHeaderWidth = 340;
    setHeaderWidth(defaultHeaderWidth);
    updateSizes(defaultHeaderWidth);
    showNotification('Width reset to default', 'info', 2000);
  };

  // Синхронизация imageUrl с данными
  useEffect(() => {
    if (data?.node?.content?.imageUrl !== imageUrl) {
      setImageUrl(data?.node?.content?.imageUrl || '');
    }
  }, [data?.node?.content?.imageUrl]);

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

  const handleImageUrlChange = (e) => {
    const url = e.target.value.trim();
    setImageUrl(url);
    if (data && data.node) {
      onUpdate({
        ...data,
        node: {
          ...data.node,
          content: {
            ...data.node.content,
            imageUrl: url,
          },
        },
      });
    }
  };

  const handleImageUrlBlur = () => {
    // Валидация URL при потере фокуса
    if (imageUrl && !isValidImageUrl(imageUrl)) {
      showNotification('Please enter a valid image URL', 'warning', 3000);
    }
  };

  const isValidImageUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      // Если это не валидный URL, проверяем, может быть это data URL или относительный путь
      return url.startsWith('data:image/') || url.startsWith('/') || url.startsWith('./');
    }
  };

  if (!data || !data.node) {
    showNotification('Invalid data provided', 'error', 3000);
    return null;
  }

  return (
    <div className="сontentType_container">
      <div className="сontentType_inputContainer">
        {/* Image URL input */}
        <div className="contentTypeP_imageUrlSection">
          <label htmlFor="imageUrl" className="contentTypeP_label">
            Image URL
          </label>
          <input
            id="imageUrl"
            type="text"
            value={imageUrl}
            onChange={handleImageUrlChange}
            onBlur={handleImageUrlBlur}
            placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
            className="contentTypeP_imageUrlInput"
          />
          {imageUrl && (
            <div className="contentTypeP_imagePreview">
              <img
                src={imageUrl}
                alt="Preview"
                onError={(e) => {
                  e.target.style.display = 'none';
                  showNotification('Failed to load image from URL', 'error', 3000);
                }}
                onLoad={() => {
                  showNotification('Image loaded successfully', 'success', 2000);
                }}
              />
            </div>
          )}
        </div>

        {/* Size controls */}
        <div className="contentTypeP_sizeControls">
          <div className="contentTypeP_sizeHeader">
            <h4>Customize Node Sizes</h4>
            <button className="contentTypeP_resetButton" onClick={handleResetSizes}>
              Reset to Default
            </button>
          </div>

          <div className="contentTypeP_sliderGroup">
            <div className="contentTypeP_sliderItem">
              <label htmlFor="headerWidth">Header Width: {headerWidth}px</label>
              <input
                id="headerWidth"
                type="range"
                min="160"
                max="800"
                value={headerWidth}
                onChange={handleHeaderWidthChange}
                className="contentTypeP_slider"
              />
            </div>

            <div className="contentTypeP_sliderItem">
              <div className="contentTypeP_heightInfo">
                Height will automatically adjust based on image proportions and selected width
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentTypeP;
