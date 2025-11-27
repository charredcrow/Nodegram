import React, { useState, useEffect, useMemo } from 'react';
import './PageLoader.css';

export const PageLoader = ({ size = 60, vh = 100 }) => {
  const [isThemeReady, setIsThemeReady] = useState(true);

  useEffect(() => {
    const scrollToTopRobust = () => {
      try {
        window.scrollTo(0, 0);
        if (typeof window.scrollTo === 'function') {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
        const el = document.scrollingElement || document.documentElement || document.body;
        if (el) el.scrollTop = 0;
        if (document?.body) document.body.scrollTop = 0;
      } catch {}
    };

    scrollToTopRobust();
    requestAnimationFrame(scrollToTopRobust);
    const id = setTimeout(scrollToTopRobust, 50);
    const id2 = setTimeout(scrollToTopRobust, 200);
    return () => {
      clearTimeout(id);
      clearTimeout(id2);
    };
  }, []);

  useEffect(() => {
    const checkThemeReady = () => {
      setIsThemeReady(true);
    };

    checkThemeReady();

    const observer = new MutationObserver(checkThemeReady);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!isThemeReady) {
    return null;
  }

  const containerHeight = useMemo(() => {
    try {
      if (typeof window !== 'undefined' && window.CSS && CSS.supports('height', '100dvh')) {
        return '100dvh';
      }
    } catch {}
    return `${vh}vh`;
  }, [vh]);

  return (
    <div className="page-loader-container" style={{ height: containerHeight }}>
      <div className="page-loader-icon" style={{ width: `${size}px`, height: `${size}px` }}>
        <img src="/assets/images/nodegram-icon-dark.svg" alt="Nodegram" className="nodegram-icon" />
      </div>
    </div>
  );
};
