import config from '../shared/config/api';

export const disableInspect = (): void => {
  if (!config.disableInspect) return;

  // Disable context menu
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Disable DevTools via F12
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
      e.preventDefault();
    }
  });

  // Disable DevTools via Ctrl+Shift+I
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
    }
  });

  // Disable DevTools via Ctrl+Shift+J
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
    }
  });

  // Disable DevTools via Ctrl+Shift+C
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
    }
  });

  // Disable DevTools via Ctrl+U (view source)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
    }
  });

  // Additional protection against opening DevTools
  let devtools = function () {};
  devtools.toString = function () {
    disableInspect();
    return '';
  };

  // Check for DevTools opening
  setInterval(() => {
    // Removed console.log for production
    // In development, you can use a logging service here
    void devtools;
  }, 1000);
};
