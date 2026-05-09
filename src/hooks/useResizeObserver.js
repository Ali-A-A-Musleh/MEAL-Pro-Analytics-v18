import { useEffect, useRef } from 'react';

export const useResizeObserver = (onResize) => {
  const ref = useRef(null);
  const onResizeRef = useRef(onResize);

  useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      window.requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) {
          return;
        }
        for (const entry of entries) {
          onResizeRef.current?.(entry.contentRect);
        }
      });
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return ref;
};
