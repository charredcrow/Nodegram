import React, { useState, useEffect, useRef } from 'react';
import './ImageNodeRenderer.css';

const ImageNodeRenderer = ({ nodeData, nodeWidth, currentWid, widModeShared, onHeightChange }) => {
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [imageHeight, setImageHeight] = useState(200); // Default height
  const imageRef = useRef(null);

  // Mobile detection for debugging
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    'ontouchstart' in window;

  useEffect(() => {
    // Проверяем наличие URL изображения в content
    const imageUrl = nodeData?.content?.imageUrl;

    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
      // Если есть URL, используем его
      setImages([{ id: 'url-image', original_name: 'Image from URL', url: imageUrl }]);
      setImageUrls({ 0: imageUrl });
    } else {
      // Если нет URL, очищаем изображения
      setImages([]);
      setImageUrls({});
    }
  }, [nodeData]);

  // Функция для вычисления высоты изображения (точное соотношение сторон без жёстких ограничений)
  const calculateImageHeight = (imgElement) => {
    if (!imgElement) return 200;
    const maxWidth = Number(nodeWidth) || 0;
    const naturalWidth = imgElement.naturalWidth || 0;
    const naturalHeight = imgElement.naturalHeight || 0;
    if (maxWidth <= 0 || naturalWidth <= 0 || naturalHeight <= 0) return 200;
    const aspectRatio = naturalHeight / naturalWidth;
    let calculatedHeight = maxWidth * aspectRatio;
    // Добавляем буфер для предотвращения обрезки из‑за субпиксельного округления в SVG/foreignObject
    // Увеличиваем буфер для вертикальных изображений, так как они более подвержены обрезке
    const isLandscape = naturalWidth >= naturalHeight;
    const buffer = isLandscape ? 5 : 10; // Больший буфер для вертикальных изображений
    return Math.max(1, Math.ceil(calculatedHeight) + buffer);
  };

  // Функция для обновления высоты и уведомления родительского компонента
  const updateHeight = (newHeight) => {
    if (newHeight !== imageHeight) {
      setImageHeight(newHeight);
      if (onHeightChange) {
        onHeightChange(newHeight);
      }
    }
  };

  const handleImageLoad = (index) => {
    // Image loaded successfully
    if (imageRef.current) {
      const newHeight = calculateImageHeight(imageRef.current);
      updateHeight(newHeight);
    }
  };

  const handleImageError = (index) => {
    // Устанавливаем стандартную высоту при ошибке
    updateHeight(200);
  };

  const currentImage = images[0]; // Всегда берем первое изображение
  const currentImageUrl = imageUrls[0];
  const isLoading = !currentImageUrl; // Упрощаем логику - загружается только если нет URL

  // Обновляем высоту при изменении изображения или ширины
  useEffect(() => {
    if (imageRef.current && currentImageUrl) {
      const newHeight = calculateImageHeight(imageRef.current);
      updateHeight(newHeight);
    }
  }, [currentImageUrl, nodeWidth]);

  // Показываем placeholder если нет изображений
  if (!images.length) {
    const placeholderHeight = 80;
    updateHeight(placeholderHeight);
    return (
      <div className="image-node-placeholder">
        <div className="placeholder-skeleton"></div>
      </div>
    );
  }

  // Если есть изображения, но текущее еще загружается
  if (isLoading) {
    const skeletonHeight = 200;
    updateHeight(skeletonHeight);
    return (
      <div className="image-node-container">
        <div className="image-wrapper">
          <div className="image-skeleton">
            <div className="skeleton-content"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="image-node-container">
      <div className="image-wrapper">
        <img
          ref={imageRef}
          src={currentImageUrl}
          alt={currentImage?.original_name || 'Image'}
          className="node-image"
          onLoad={() => {
            handleImageLoad(0);
          }}
          onError={(e) => {
            handleImageError(0);
          }}
          style={
            isMobile
              ? {
                  position: 'static',
                  transform: 'none',
                  transformOrigin: '0 0',
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block',
                }
              : undefined
          }
        />
      </div>
    </div>
  );
};

export default ImageNodeRenderer;
