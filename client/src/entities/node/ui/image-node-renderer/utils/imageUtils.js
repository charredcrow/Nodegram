/**
 * Проверяет, является ли файл изображением по расширению
 * @param {string} fileName - имя файла
 * @returns {boolean} - true если файл является изображением
 */
export const isImageFile = (fileName) => {
  if (!fileName) return false;

  const extension = fileName.split('.').pop()?.toLowerCase();
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'];

  return imageExtensions.includes(extension);
};

/**
 * Фильтрует массив файлов, оставляя только изображения
 * @param {Array} files - массив файлов
 * @returns {Array} - массив только изображений
 */
export const filterImageFiles = (files) => {
  if (!Array.isArray(files)) return [];

  return files.filter((file) => isImageFile(file.name));
};

/**
 * Генерирует URL для загрузки изображения
 * @param {Object} imageFile - объект файла изображения
 * @returns {string} - URL для загрузки
 */
export const getImageUrl = (imageFile) => {
  if (!imageFile?.id || !imageFile?.nodeId) return '';

  return `/api/download-file/${imageFile.id}/${imageFile.nodeId}`;
};
