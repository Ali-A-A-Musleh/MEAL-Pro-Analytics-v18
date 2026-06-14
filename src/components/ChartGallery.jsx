import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bar, Doughnut, Line, Pie, Radar, PolarArea } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import SafeIcon from './SafeIcon';
import DynamicIcon from './DynamicIcon';

// Chart components configuration for individual cards
const chartMap = {
  bar: Bar,
  horizontalBar: Bar,
  stackedBar: Bar,
  stackedHorizontalBar: Bar,
  line: Line,
  spline: Line,
  steppedLine: Line,
  area: Line,
  smoothArea: Line,
  scatter: Line,
  combo: Bar,
  pie: Pie,
  doughnut: Doughnut,
  semiDoughnut: Doughnut,
  radar: Radar,
  polarArea: PolarArea
};

// Native helper to wrap long labels inside Chart.js
const wrapLabel = (label, maxLength = 15) => {
  if (typeof label !== 'string') return label;
  if (label.length <= maxLength) return label;
  const words = label.split(' ');
  const lines = [];
  let currentLine = '';
  words.forEach(w => {
    if ((currentLine + w).length > maxLength) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = w + ' ';
    } else {
      currentLine += w + ' ';
    }
  });
  if (currentLine) lines.push(currentLine.trim());
  return lines;
};

// Safe helper to truncate axis/labels text in outputs
const truncateText = (str, max = 45) => {
  if (!str) return '';
  const cleaned = String(str);
  return cleaned.length > max ? cleaned.slice(0, max - 3) + '...' : cleaned;
};

const sanitizeFileName = (value, fallback = 'chart') => {
  const raw = String(value || fallback);
  const cleaned = raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .replace(/[_\s-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || fallback;
};

const computeTickLimit = (labelCount) => {
  const count = Math.max(1, labelCount || 1);
  return Math.max(4, Math.min(12, Math.ceil(count / 2)));
};

const disposeCanvas = (canvas) => {
  if (!canvas) return;
  try {
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  } catch (e) {
    // ignore canvas cleanup failures
  }
  canvas.width = 0;
  canvas.height = 0;
  if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
};

const createBufferCanvas = (sourceCanvas) => {
  const buffer = document.createElement('canvas');
  buffer.width = sourceCanvas.width;
  buffer.height = sourceCanvas.height;
  const bufferCtx = buffer.getContext('2d', { willReadFrequently: true });
  if (bufferCtx) {
    bufferCtx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height);
  }
  return buffer;
};

const yieldToUI = () => new Promise((resolve) => window.setTimeout(resolve, 0));

// Simple utility to convert hex to rgba
const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex;
  const num = parseInt(hex.slice(1).replace('#', ''), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Independent Lazy-loading observer hook with recycling to clear memory
const useLazyLoad = () => {
  const [isIntersecting, setIntersecting] = useState(false);
  const observerRef = useRef(null);

  const refCallback = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (node) {
      if (typeof window.IntersectionObserver === 'undefined') {
        setIntersecting(true);
        return;
      }

      const observer = new window.IntersectionObserver(([entry]) => {
        setIntersecting(entry.isIntersecting);
      }, { rootMargin: '600px' });

      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  return [refCallback, isIntersecting];
};

const getHighResScale = () => 5;

const captureCardCanvas = async (cardElement, withIcons = true, exportOpts = {}) => {
  await yieldToUI();
  const hasIconLayer = Boolean(cardElement.querySelector('[data-gallery-icon-layer]'));
  const chartCanvas = cardElement.querySelector('canvas');
  
  const hScale = Number(exportOpts.scale || 5);
  const isTransparent = Boolean(exportOpts.transparent);
  const hasCustomOverlay = exportOpts.customTitle || exportOpts.timestamp || exportOpts.watermark || isTransparent || (exportOpts.aspectRatio && exportOpts.aspectRatio !== 'free');

  if (!withIcons && !hasIconLayer && !hasCustomOverlay && chartCanvas instanceof HTMLCanvasElement && hScale === 1) {
    return createBufferCanvas(chartCanvas);
  }

  const originalPadding = cardElement.style.padding;
  const originalBg = cardElement.style.backgroundColor;
  const originalWidth = cardElement.style.width;
  const originalHeight = cardElement.style.height;
  const originalMaxW = cardElement.style.maxWidth;
  const originalMaxH = cardElement.style.maxHeight;
  const originalFlex = cardElement.style.flex;
  const originalBorderRadius = cardElement.style.borderRadius;
  const originalBoxShadow = cardElement.style.boxShadow;
  const originalBorder = cardElement.style.border;
  const originalBorderWidth = cardElement.style.borderWidth;
  const originalBorderColor = cardElement.style.borderColor;

  try {
    cardElement.style.padding = '44px';
    cardElement.style.backgroundColor = isTransparent ? 'transparent' : '#ffffff';
    cardElement.style.borderRadius = '0px';
    cardElement.style.boxShadow = 'none';
    cardElement.style.border = 'none';
    cardElement.style.borderWidth = '0px';
    cardElement.style.borderColor = 'transparent';

    // Apply high-resolution target dimensions to allow rich font rendering and prevent crowding
    const widthVal = 1200; 
    cardElement.style.flex = 'none';
    cardElement.style.maxWidth = 'none';
    cardElement.style.maxHeight = 'none';
    cardElement.style.width = `${widthVal}px`;

    if (exportOpts.aspectRatio && exportOpts.aspectRatio !== 'free') {
      if (exportOpts.aspectRatio === '16_9') {
        cardElement.style.height = `${widthVal * (9 / 16)}px`; // 675px
      } else if (exportOpts.aspectRatio === '4_3') {
        cardElement.style.height = `${widthVal * (3 / 4)}px`; // 900px
      } else if (exportOpts.aspectRatio === '1_1') {
        cardElement.style.height = `${widthVal}px`; // 1200px
      }
    } else {
      cardElement.style.height = '750px'; // Generous tall spacing for long labels
    }

    await yieldToUI();
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 450)); // Generous repaint frame check for high DPI canvas update

    const resultCanvas = await html2canvas(cardElement, {
      scale: hScale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: isTransparent ? null : '#ffffff',
      imageTimeout: 15500,
      logging: false,
      onclone: (clonedDoc) => {
        disableClonedAnimations(clonedDoc);
        replaceClonedSvgs(clonedDoc);

        const iconLayer = clonedDoc.querySelector('[data-gallery-icon-layer]');
        if (iconLayer && !withIcons) {
          iconLayer.style.display = 'none';
        }

        const clonedCard = clonedDoc.querySelector('[data-gallery-card-content]') || clonedDoc.querySelector('[data-gallery-card]');
        if (clonedCard) {
          clonedCard.style.padding = '44px';
          clonedCard.style.backgroundColor = isTransparent ? 'transparent' : '#ffffff';
          clonedCard.style.borderRadius = '0px';
          clonedCard.style.boxShadow = 'none';
          clonedCard.style.border = 'none';
          clonedCard.style.borderWidth = '0px';
          clonedCard.style.borderColor = 'transparent';

          // Apply Custom Aspect Ratios inside cloning area
          clonedCard.style.width = `${widthVal}px`;
          if (exportOpts.aspectRatio && exportOpts.aspectRatio !== 'free') {
            if (exportOpts.aspectRatio === '16_9') {
              clonedCard.style.height = `${widthVal * (9 / 16)}px`;
            } else if (exportOpts.aspectRatio === '4_3') {
              clonedCard.style.height = `${widthVal * (3 / 4)}px`;
            } else if (exportOpts.aspectRatio === '1_1') {
              clonedCard.style.height = `${widthVal}px`;
            }
          } else {
            clonedCard.style.height = '750px';
          }

          // Apply Custom Title Overlay
          if (exportOpts.customTitle && exportOpts.customTitle.trim() !== '') {
            const headerDiv = clonedDoc.createElement('div');
            headerDiv.style.width = '100%';
            headerDiv.style.textAlign = 'center';
            headerDiv.style.marginBottom = '20px';
            headerDiv.style.fontFamily = '"Inter", sans-serif';
            headerDiv.style.paddingBottom = '10px';
            headerDiv.style.borderBottom = '1px solid ' + (isTransparent ? 'rgba(255,255,255,0.1)' : '#f1f5f9');
            
            const titleNode = clonedDoc.createElement('h1');
            titleNode.innerText = exportOpts.customTitle;
            titleNode.style.fontSize = '24px';
            titleNode.style.fontWeight = '900';
            titleNode.style.color = isTransparent ? '#f8fafc' : '#0f172a';
            titleNode.style.margin = '0';
            headerDiv.appendChild(titleNode);
            
            clonedCard.insertBefore(headerDiv, clonedCard.firstChild);
          }

          // Apply Footer with Watermark or Timestamp
          if (exportOpts.watermark || exportOpts.timestamp) {
            const footerDiv = clonedDoc.createElement('div');
            footerDiv.style.width = '100%';
            footerDiv.style.textAlign = 'center';
            footerDiv.style.marginTop = '24px';
            footerDiv.style.paddingTop = '12px';
            footerDiv.style.borderTop = '1px solid ' + (isTransparent ? 'rgba(255,255,255,0.1)' : '#f1f5f9');
            footerDiv.style.fontFamily = '"Inter", sans-serif';
            footerDiv.style.display = 'flex';
            footerDiv.style.flexDirection = 'column';
            footerDiv.style.gap = '4px';

            if (exportOpts.watermark) {
              const watermarkNode = clonedDoc.createElement('div');
              watermarkNode.innerText = 'Exported with High-Res Scheme Engine';
              watermarkNode.style.fontSize = '10px';
              watermarkNode.style.fontWeight = '850';
              watermarkNode.style.letterSpacing = '0.05em';
              watermarkNode.style.textTransform = 'uppercase';
              watermarkNode.style.color = isTransparent ? '#94a3b8' : '#64748b';
              footerDiv.appendChild(watermarkNode);
            }

            if (exportOpts.timestamp) {
              const stampNode = clonedDoc.createElement('div');
              stampNode.innerText = new Date().toLocaleString();
              stampNode.style.fontSize = '9px';
              stampNode.style.fontWeight = '600';
              stampNode.style.color = isTransparent ? '#64748b' : '#94a3b8';
              footerDiv.appendChild(stampNode);
            }

            clonedCard.appendChild(footerDiv);
          }
        }
      },
      ignoreElements: (el) => el.getAttribute('data-html2canvas-ignore') === 'true',
    });

    return resultCanvas;
  } finally {
    cardElement.style.padding = originalPadding;
    cardElement.style.backgroundColor = originalBg;
    cardElement.style.borderRadius = originalBorderRadius;
    cardElement.style.boxShadow = originalBoxShadow;
    cardElement.style.width = originalWidth;
    cardElement.style.height = originalHeight;
    cardElement.style.maxWidth = originalMaxW;
    cardElement.style.maxHeight = originalMaxH;
    cardElement.style.flex = originalFlex;
    cardElement.style.border = originalBorder;
    cardElement.style.borderWidth = originalBorderWidth;
    cardElement.style.borderColor = originalBorderColor;
  }
};

const disableClonedAnimations = (clonedDoc) => {
  const allElements = clonedDoc.querySelectorAll('*');
  allElements.forEach((el) => {
    if (el && el.style) {
      el.style.transition = 'none';
      el.style.animation = 'none';
      el.style.webkitTransition = 'none';
      el.style.webkitAnimation = 'none';
    }
  });

  // Inject a stylesheet into the cloned document to forcibly disable transitions/animations
  try {
    const style = clonedDoc.createElement('style');
    style.setAttribute('data-export-freeze', 'true');
    style.innerHTML = `* { transition: none !important; animation: none !important; -webkit-transition: none !important; -webkit-animation: none !important; }`;
    (clonedDoc.head || clonedDoc.body || clonedDoc.documentElement).appendChild(style);
  } catch (e) {
    // ignore injection failures
  }
};

const replaceClonedSvgs = (clonedDoc) => {
  const svgs = clonedDoc.querySelectorAll('svg');
  svgs.forEach((svg) => {
    try {
      let width = 16;
      let height = 16;

      if (svg.id) {
        const realSvg = document.getElementById(svg.id);
        if (realSvg) {
          const rect = realSvg.getBoundingClientRect();
          width = rect.width || realSvg.clientWidth || 16;
          height = rect.height || realSvg.clientHeight || 16;
        }
      }

      if (width === 16 && height === 16) {
        const parent = svg.parentNode;
        if (parent && parent instanceof window.HTMLElement) {
          const pW = parseFloat(parent.style.width);
          const pH = parseFloat(parent.style.height);
          if (pW) width = pW;
          if (pH) height = pH;
        }
      }

      const attrW = svg.getAttribute('width');
      const attrH = svg.getAttribute('height');
      if (attrW) {
        const parsed = parseFloat(attrW);
        if (parsed) width = parsed;
      }
      if (attrH) {
        const parsed = parseFloat(attrH);
        if (parsed) height = parsed;
      }

      svg.setAttribute('width', String(width));
      svg.setAttribute('height', String(height));

      // Resolve computed stroke/color inheritances such as 'currentColor' to absolute colors
      let computedStroke = '#4f46e5'; // standard indigo fallback
      let computedFill = 'none';

      // Find real matching element in live document if present to read computed styles
      let realEl = null;
      if (svg.id) {
        realEl = document.getElementById(svg.id);
      } else {
        // Try locating element based on parent query or similar structure
        const clsList = Array.from(svg.classList).join('.');
        if (clsList) {
          realEl = document.querySelector('svg.' + clsList);
        }
      }

      const sourceEl = realEl || svg;
      try {
        const style = window.getComputedStyle(sourceEl);
        if (style) {
          computedStroke = style.stroke && style.stroke !== 'none' ? style.stroke : (style.color || '#4f46e5');
          computedFill = style.fill;
        }
      } catch (err) {
        // Fallback
      }

      if (svg.getAttribute('stroke') === 'currentColor' || !svg.getAttribute('stroke')) {
        svg.setAttribute('stroke', computedStroke);
      }
      if (svg.getAttribute('fill') === 'currentColor') {
        svg.setAttribute('fill', computedFill !== 'currentColor' ? computedFill : computedStroke);
      }

      // Add inline safety rules to prevent invisible icons
      svg.style.stroke = computedStroke;
      if (computedFill && computedFill !== 'none' && computedFill !== 'currentColor') {
        svg.style.fill = computedFill;
      }

      const xml = new XMLSerializer().serializeToString(svg);
      const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
      const img = document.createElement('img');
      img.src = dataUrl;
      img.width = width;
      img.height = height;
      img.style.cssText = svg.style.cssText;
      img.className = svg.className.baseVal || svg.className || '';
      svg.parentNode.replaceChild(img, svg);
    } catch (e) {
      svg.style.visibility = 'visible';
    }
  });
};

// GALLERY COMPONENT HOOKING UP RAW EXCEL SCHEMA SCAN
const ChartGallery = ({
  visible,
  onClose,
  data,
  columns,
  columnTypes,
  uniqueChoicesMap,
  selectedProject,
  legendAliases,
  columnAliases,
  visuals,
  globalGroupBy,
  getCategoryIconWithPreference,
  customIcons,
  onApplyToMainView,
  config = {},
  // Custom export states passed from App.jsx with safe fallbacks
  exportScale = 5,
  setExportScale = () => {},
  exportTransparent = false,
  setExportTransparent = () => {},
  exportAspectRatio = 'free',
  setExportAspectRatio = () => {},
  exportWatermark = true,
  setExportWatermark = () => {},
  exportCustomTitle = '',
  setExportCustomTitle = () => {},
  exportTimestamp = false,
  setExportTimestamp = () => {},
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCols, setSelectedCols] = useState(new Set(columns));
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [chartTypeFilter, setChartTypeFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportSettings, setShowExportSettings] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(12);

  const loadMoreRef = useRef(null);

  // Reset visible limit on search query or filter change to ensure we render instantly
  useEffect(() => {
    setVisibleLimit(12);
  }, [searchQuery, chartTypeFilter, showSelectedOnly]);

  // Sync selected columns when columns list changes
  useEffect(() => {
    setSelectedCols(new Set(columns));
  }, [columns]);

  // Handle ESC click to exit the gallery
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  // Full Browse / Open in new tab handler
  const handleOpenInNewTab = () => {
    const url = new window.URL(window.location.href);
    url.searchParams.set('gallery', 'true');
    window.open(url.toString(), '_blank');
  };

  // Export selected charts as a ZIP of high-resolution PNG images
  const handleExportFullReport = async () => {
    const selectedList = columns.filter(col => selectedCols.has(col));
    if (selectedList.length === 0) {
      alert('Please select at least one chart to export.');
      return;
    }

    setIsProcessing(true);
    setIsExporting(true);

    try {
      await new Promise((r) => setTimeout(r, 600));
      await yieldToUI();
      await document.fonts.ready;

      const cards = Array.from(document.querySelectorAll('[data-gallery-card]')).filter(card => {
        const col = card.getAttribute('data-col-name');
        return selectedCols.has(col);
      });

      if (cards.length === 0) {
        throw new Error('No selected gallery cards found for export.');
      }

      const cardIcons = cards.map(card => Boolean(card.querySelector('[data-gallery-icon-layer]')));
      const anyIcons = cardIcons.some(Boolean);
      const allIcons = cardIcons.every(Boolean);
      const mode = allIcons ? 'with-icons' : anyIcons ? 'mixed-icons' : 'no-icons';
      setProcessingMsg(`Initializing ${mode.replace('-', ' ')} image export and rendering selected charts...`);

      if (cards.length === 0) {
        throw new Error('No selected gallery cards found for export.');
      }

      const zip = new JSZip();
      const nameCounts = {};

      for (let index = 0; index < cards.length; index += 1) {
        const cardElement = cards[index];
        const rawTitle = cardElement.getAttribute('data-card-title') || cardElement.getAttribute('data-col-name') || `Chart ${index + 1}`;
        const safeTitleBase = sanitizeFileName(rawTitle, `Chart_${index + 1}`);
        const duplicateCount = nameCounts[safeTitleBase] || 0;
        nameCounts[safeTitleBase] = duplicateCount + 1;
        const safeTitle = duplicateCount > 0 ? `${safeTitleBase}_${duplicateCount + 1}` : safeTitleBase;

        const cardHasIcons = Boolean(cardElement.querySelector('[data-gallery-icon-layer]'));
        setProcessingMsg(`Rendering chart ${index + 1} of ${cards.length} (${cardHasIcons ? 'with icons' : 'no icons'})...`);
        await yieldToUI();

        const exportOpts = {
          scale: exportScale,
          transparent: exportTransparent,
          aspectRatio: exportAspectRatio,
          watermark: exportWatermark,
          customTitle: exportCustomTitle,
          timestamp: exportTimestamp
        };

        let canvas = null;
        try {
          const contentElement = cardElement.querySelector('[data-gallery-card-content]');
          canvas = await captureCardCanvas(contentElement || cardElement, cardHasIcons, exportOpts);
          const imgData = canvas.toDataURL('image/png');
          const imageBase64 = imgData.split(',')[1];
          zip.file(`${safeTitle}.png`, imageBase64, { base64: true });
        } finally {
          if (canvas) {
            disposeCanvas(canvas);
            canvas = null;
          }
        }
      }

      const zipName = `MEAL_Charts_${sanitizeFileName(selectedProject || 'Gallery')}_${mode}_${Date.now()}.zip`;
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = zipName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('ZIP export failed', error);
      alert('Failed to export charts to ZIP.');
    } finally {
      setIsProcessing(false);
      setIsExporting(false);
      setProcessingMsg('');
    }
  };

  // Pre-calculate smart default chart types of all columns for fast type category filtering
  const colConfigs = useMemo(() => {
    const configs = {};
    const firstTextOrSelectMultiple = columns.find(c => columnTypes[c] === 'text' || columnTypes[c] === 'select_multiple');

    columns.forEach(col => {
      const colType = columnTypes[col] || 'text';
      const currentGroupBy = globalGroupBy || '';
      
      const xCol = colType === 'number'
        ? (firstTextOrSelectMultiple || col)
        : col;
      
      const xType = columnTypes[xCol] || 'text';
      const containsDate = /date|year|month|period|day/i.test(String(xCol).toLowerCase());
      
      let computedType = 'bar';
      if (xType === 'select_multiple') {
        computedType = currentGroupBy ? 'stackedHorizontalBar' : 'horizontalBar';
      } else if (containsDate) {
        computedType = 'line';
      } else if (xType === 'text') {
        const choices = uniqueChoicesMap[xCol] || [];
        if (choices.length > 8) {
          computedType = currentGroupBy ? 'stackedHorizontalBar' : 'horizontalBar';
        } else {
          computedType = currentGroupBy ? 'stackedBar' : 'bar';
        }
      }
      configs[col] = computedType;
    });
    return configs;
  }, [columns, columnTypes, globalGroupBy, uniqueChoicesMap]);

  // Filter columns list by search query, selection status, and chart type filters
  const searchableCols = useMemo(() => {
    let filtered = columns;

    // Search query filter
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      filtered = filtered.filter(col => 
        col.toLowerCase().includes(qLower) || 
        (columnAliases[col] || '').toLowerCase().includes(qLower)
      );
    }

    // Selected only filter
    if (showSelectedOnly) {
      filtered = filtered.filter(col => selectedCols.has(col));
    }

    // Chart Type category filter
    if (chartTypeFilter !== 'all') {
      filtered = filtered.filter(col => {
        const type = colConfigs[col] || 'bar';
        if (chartTypeFilter === 'bar') {
          return ['bar', 'horizontalBar', 'stackedBar', 'stackedHorizontalBar', 'combo'].includes(type);
        }
        if (chartTypeFilter === 'line') {
          return ['line', 'spline', 'steppedLine', 'area', 'smoothArea', 'scatter'].includes(type);
        }
        if (chartTypeFilter === 'pie') {
          return ['pie', 'doughnut', 'semiDoughnut'].includes(type);
        }
        if (chartTypeFilter === 'radar') {
          return ['radar', 'polarArea'].includes(type);
        }
        return true;
      });
    }

    return filtered;
  }, [columns, searchQuery, columnAliases, showSelectedOnly, selectedCols, chartTypeFilter, colConfigs]);

  // Automatic Infinite Scroll Observer
  useEffect(() => {
    if (!loadMoreRef.current || isExporting) return;
    
    const observer = new window.IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisibleLimit(prev => prev + 12);
      }
    }, { rootMargin: '300px' });
    
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [searchQuery, chartTypeFilter, showSelectedOnly, isExporting, visibleLimit, searchableCols.length]);

  const toggleSelectAll = () => {
    // Check if all currently visible columns are already selected
    const allVisibleSelected = searchableCols.every(col => selectedCols.has(col));
    
    if (allVisibleSelected) {
      // Deselect all visible
      setSelectedCols(prev => {
        const next = new Set(prev);
        searchableCols.forEach(col => next.delete(col));
        return next;
      });
    } else {
      // Select all visible
      setSelectedCols(prev => {
        const next = new Set(prev);
        searchableCols.forEach(col => next.add(col));
        return next;
      });
    }
  };

  const toggleSelectCol = (col) => {
    setSelectedCols(prev => {
      const next = new Set(prev);
      if (next.has(col)) {
        next.delete(col);
      } else {
        next.add(col);
      }
      return next;
    });
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-y-0 right-0 left-0 lg:left-[370px] z-[9999] overflow-y-auto bg-slate-900/80 backdrop-blur-xl p-4 sm:p-6 md:p-8 flex flex-col font-sans text-slate-800"
      >
        {/* TOP GLOW OVERLAY BACKGROUND */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* CONTAINER POPUP WINDOW */}
        <motion.div
          initial={{ y: '30%', scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: '30%', scale: 0.95 }}
          transition={{ type: 'spring', damping: 18, stiffness: 120 }}
          className="w-full max-w-7xl mx-auto flex flex-col bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(15,23,42,0.6)] border border-slate-100 overflow-hidden flex-1 max-h-[92vh] relative"
        >
          {/* HEADER NAV */}
          <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-50/50 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-55 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1 px-2.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                  Interactive Lab
                </div>
                {selectedProject && (
                  <span className="text-xs font-bold text-slate-400">/ {selectedProject}</span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-1">
                Automated Analytical Gallery
              </h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                Dynamic automated categorization engine, schema scanning, & group inheritance
              </p>
            </div>

            {/* HEADER INTERACTIVE BUTTONS */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto relative">
              {/* Report Export Button */}
              {columns.length > 0 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleExportFullReport}
                    disabled={isProcessing}
                    className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-[11px] font-black rounded-xl shadow-lg shadow-indigo-200/40 hover:shadow-xl active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 uppercase tracking-wider"
                  >
                    <SafeIcon name="FileSpreadsheet" size={14} className="shrink-0" />
                    <span>Export Report (ZIP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowExportSettings(!showExportSettings)}
                    title="Export Configurations"
                    className={`p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer shrink-0 ${
                      showExportSettings
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <SafeIcon name="Sliders" size={15} />
                  </button>
                </div>
              )}

              {/* Full Browse Tab Button */}
              <button
                type="button"
                onClick={handleOpenInNewTab}
                title="Full Screen Mode (Open in New Tab)"
                className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <SafeIcon name="ExternalLink" size={15} />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <SafeIcon name="X" size={16} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showExportSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-y-auto max-h-[280px] lg:max-h-none border-b border-slate-200 bg-indigo-50/30 shrink-0 no-scrollbar"
              >
                <div className="p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left font-sans border-t border-slate-200/50">
                  {/* Column 1: Resolution Scale */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <SafeIcon name="Sliders" size={13} className="text-indigo-600 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Resolution Scale</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold leading-normal">SUPPORT HIGH RESOLUTION SCHEMES</p>
                    <div className="grid grid-cols-2 gap-1.5 mt-2 bg-white/75 p-1 rounded-xl border border-slate-200/50 shadow-inner">
                      {[
                        { l: '1x Standard', v: 1 },
                        { l: '2x HD Visual', v: 2 },
                        { l: '4x Ultra 4K', v: 4 },
                        { l: '5x Print Qual', v: 5 }
                      ].map((opt) => (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => setExportScale(opt.v)}
                          className={`py-2 px-1 text-[9px] font-black rounded-lg transition-all cursor-pointer text-center ${
                            exportScale === opt.v
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-slate-500 hover:text-indigo-600 hover:bg-white'
                          }`}
                        >
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Aspect Ratio Presets */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <SafeIcon name="Maximize2" size={12} className="text-indigo-600" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Aspect Ratio Preset</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold leading-normal">CHALLENGE PROPORTIONAL ALIGNMENTS</p>
                    <div className="grid grid-cols-2 gap-1.5 mt-2 bg-white/75 p-1 rounded-xl border border-slate-200/50 shadow-inner">
                      {[
                        { l: 'Free Scale', v: 'free' },
                        { l: '16:9 Cinema', v: '16_9' },
                        { l: '4:3 Standard', v: '4_3' },
                        { l: '1:1 Square', v: '1_1' }
                      ].map((opt) => (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => setExportAspectRatio(opt.v)}
                          className={`py-2 px-1 text-[9px] font-black rounded-lg transition-all cursor-pointer text-center ${
                            exportAspectRatio === opt.v
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-slate-500 hover:text-indigo-600 hover:bg-white'
                          }`}
                        >
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Alpha & Branding */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <SafeIcon name="Eye" size={13} className="text-indigo-600" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Transparencies & Watermarks</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold leading-normal">CUSTOM BACKDROP INTEGRITY</p>
                    <div className="flex flex-col gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setExportTransparent(!exportTransparent)}
                        className={`p-2.5 rounded-xl border text-[9px] font-black flex items-center justify-between transition-all cursor-pointer ${
                          exportTransparent
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <SafeIcon name={exportTransparent ? 'EyeOff' : 'Eye'} size={12} />
                          Transparent Canvas
                        </span>
                        <span className="text-[7px] font-black uppercase opacity-80">{exportTransparent ? 'ACTIVE' : 'OFF'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportWatermark(!exportWatermark)}
                        className={`p-2.5 rounded-xl border text-[9px] font-black flex items-center justify-between transition-all cursor-pointer ${
                          exportWatermark
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <SafeIcon name="Stamp" size={12} />
                          Watermark Overlay
                        </span>
                        <span className="text-[7px] font-black uppercase opacity-80">{exportWatermark ? 'ACTIVE' : 'OFF'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Column 4: Custom Headers */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <SafeIcon name="Type" size={13} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Header Overlay Title</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExportTimestamp(!exportTimestamp)}
                        className={`text-[8px] font-extrabold flex items-center gap-1 uppercase tracking-widest px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          exportTimestamp ? 'border-indigo-600 text-white bg-indigo-600 shadow-md' : 'border-slate-300 text-slate-500 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <SafeIcon name="Clock" size={8} />
                        <span>Timestamp</span>
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold leading-normal">EMBED TIME & TITLE OVERLAYS</p>
                    <div className="mt-2.5">
                      <input
                        type="text"
                        value={exportCustomTitle}
                        onChange={(e) => setExportCustomTitle(e.target.value)}
                        placeholder="Enter custom title overlay"
                        className="w-full px-3 py-2 bg-white text-[10px] font-bold border border-slate-200 rounded-xl outline-none focus:border-indigo-600 transition-all text-slate-800 placeholder-slate-400 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SEARCH BOX, SELECTION, AND CHART TYPE FILTERS BAR */}
          <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/40 flex flex-col gap-3 shrink-0">
            {/* First Row: Search & Selection Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative max-w-sm w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <SafeIcon name="Search" size={14} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search mapped column records..."
                  className="pl-9 pr-4 py-2 w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:bg-white outline-none transition-all text-slate-700 placeholder-slate-400"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Select All / Deselect All Button */}
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-[10px] font-black transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <SafeIcon name={searchableCols.length > 0 && searchableCols.every(col => selectedCols.has(col)) ? 'MinusSquare' : 'CheckSquare'} size={12} />
                  <span>{searchableCols.length > 0 && searchableCols.every(col => selectedCols.has(col)) ? 'Deselect Visible' : 'Select Visible'}</span>
                </button>

                {/* Show Selected Only Filter Toggle */}
                <button
                  type="button"
                  onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                  className={`px-3 py-1.5 border rounded-xl text-[10px] font-black transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${showSelectedOnly ? 'bg-indigo-50 border-indigo-200 text-indigo-750' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-805'}`}
                >
                  <SafeIcon name="Filter" size={12} />
                  <span>Selected Only ({selectedCols.size})</span>
                </button>

                <div className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                  Selected <strong className="text-slate-800">{selectedCols.size}</strong> of {columns.length}
                </div>
              </div>
            </div>

            {/* Second Row: Chart Type Category Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
                {[
                  { id: 'all', label: 'All Layouts', icon: 'Grid' },
                  { id: 'bar', label: 'Columns/Bars', icon: 'BarChart' },
                  { id: 'line', label: 'Lines/Curves', icon: 'TrendingUp' },
                  { id: 'pie', label: 'Pies/Doughnuts', icon: 'PieChart' },
                  { id: 'radar', label: 'Radar/Polar', icon: 'Compass' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setChartTypeFilter(cat.id)}
                    className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer ${chartTypeFilter === cat.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <SafeIcon name={cat.icon} size={11} />
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <SafeIcon name="Scan" size={12} className="text-emerald-500" />
                  <span>Scanned: <strong className="text-slate-800 font-extrabold">{columns.length} Fields</strong></span>
                </span>
                {globalGroupBy && (
                  <span className="flex items-center gap-1.5 p-1 px-2 bg-indigo-50/60 border border-indigo-100 rounded-lg">
                    <SafeIcon name="Share2" size={10} className="text-indigo-600 animate-pulse" />
                    <span className="text-indigo-900">GroupBy: <strong className="font-extrabold">{columnAliases[globalGroupBy] || globalGroupBy}</strong></span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* GALLERY INTERACTIVE WORKSPACE */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-50/40 no-scrollbar relative min-h-0">
            {searchableCols.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 bg-slate-100 text-slate-400 rounded-full mb-3 animate-ping">
                  <SafeIcon name="HelpCircle" size={32} />
                </div>
                <h3 className="text-sm font-black text-slate-700">No analyzed headers matching filters</h3>
                <p className="text-xs text-slate-450 mt-1 max-w-xs">
                  Your uploaded file has columns, but none matches the current search query. Try broadening your keywords.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(isExporting ? columns.filter(c => selectedCols.has(c)) : searchableCols.slice(0, visibleLimit)).map((col) => (
                    <GalleryCard
                      key={col}
                      col={col}
                      data={data}
                      columns={columns}
                      columnTypes={columnTypes}
                      uniqueChoicesMap={uniqueChoicesMap}
                      legendAliases={legendAliases}
                      columnAliases={columnAliases}
                      visuals={visuals}
                      config={config}
                      globalGroupBy={globalGroupBy}
                      getCategoryIconWithPreference={getCategoryIconWithPreference}
                      customIcons={customIcons}
                      onApplyToMainView={onApplyToMainView}
                      isExporting={isExporting}
                      isSelected={selectedCols.has(col)}
                      onToggleSelect={() => toggleSelectCol(col)}
                      exportScale={exportScale}
                      exportTransparent={exportTransparent}
                      exportAspectRatio={exportAspectRatio}
                      exportWatermark={exportWatermark}
                      exportCustomTitle={exportCustomTitle}
                      exportTimestamp={exportTimestamp}
                    />
                  ))}
                </div>

                {/* PROGRESSIVE LOADING TRIGGER SATELLITE */}
                {!isExporting && searchableCols.length > visibleLimit && (
                  <div
                    ref={loadMoreRef}
                    className="mt-8 flex flex-col items-center justify-center gap-3 py-6 animate-fadeIn"
                    id="load-more-container"
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      Showing {visibleLimit} of {searchableCols.length} columns analysis
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setVisibleLimit((prev) => prev + 12)}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      <SafeIcon name="ChevronDown" size={14} />
                      Load More Columns
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* LOADING PROGRESS PROCESSOR MODAL */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center"
            >
              <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-slate-100 mx-4 flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <SafeIcon name="FilePdf" size={20} className="text-indigo-600 animate-bounce" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-800">Compiling Bulk Analytics...</h3>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{processingMsg || 'Processing...'}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

// Custom memoization comparator to bypass full sibling/typings re-computations unless actual props modify
const arePropsEqual = (p, n) => {
  return p.col === n.col &&
         p.isSelected === n.isSelected &&
         p.isExporting === n.isExporting &&
         p.data === n.data &&
         p.globalGroupBy === n.globalGroupBy &&
         p.exportScale === n.exportScale &&
         p.exportTransparent === n.exportTransparent &&
         p.exportAspectRatio === n.exportAspectRatio &&
         p.exportWatermark === n.exportWatermark &&
         p.exportCustomTitle === n.exportCustomTitle &&
         p.exportTimestamp === n.exportTimestamp &&
         p.visuals?.primaryColor === n.visuals?.primaryColor &&
         p.visuals?.secondaryColor === n.visuals?.secondaryColor &&
         p.visuals?.tertiaryColor === n.visuals?.tertiaryColor &&
         p.visuals?.quaternaryColor === n.visuals?.quaternaryColor &&
         p.visuals?.colorMode === n.visuals?.colorMode &&
         p.visuals?.chartType === n.visuals?.chartType &&
         p.visuals?.showIcons === n.visuals?.showIcons &&
         p.visuals?.globalIcon === n.visuals?.globalIcon &&
         p.visuals?.iconColor === n.visuals?.iconColor &&
         p.visuals?.iconMode === n.visuals?.iconMode &&
         p.visuals?.tooltipMode === n.visuals?.tooltipMode &&
         p.visuals?.numberFormat === n.visuals?.numberFormat;
};

// INDIVIDUAL CARD REPRESENTS THE ENTIRE SELF-CONTAINED CHART
const ActiveGalleryCard = memo(({
  col,
  elementRef,
  data,
  columns,
  columnTypes,
  uniqueChoicesMap,
  legendAliases,
  columnAliases,
  visuals,
  globalGroupBy,
  getCategoryIconWithPreference,
  customIcons,
  onApplyToMainView,
  isExporting,
  isSelected,
  onToggleSelect,
  config = {},
  // Custom export options
  exportScale = 5,
  exportTransparent = false,
  exportAspectRatio = 'free',
  exportWatermark = true,
  exportCustomTitle = '',
  exportTimestamp = false,
}) => {
  const shouldRender = true;
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const cardRef = useRef(null);
  const [isExportingCard, setIsExportingCard] = useState(false);
  const [activeTab, setActiveTab] = useState('data'); // 'data', 'styling', 'overlay'

  // Coordinate tracking for dynamic category icons inside the card
  const [chartArea, setChartArea] = useState(null);
  const [categoryPositions, setCategoryPositions] = useState([]);

  // Local user configuration overrides
  const [overrides, setOverrides] = useState({});

  // Parse details
  const colType = columnTypes[col] || 'text';

  // Helper for Smart Automatic Chart Type selection
  const getSmartChartType = useCallback((xAxisCol, yAxisCol, groupByCol) => {
    const xType = columnTypes[xAxisCol] || 'text';
    const containsDate = /date|year|month|period|day/i.test(String(xAxisCol).toLowerCase());
    
    if (xType === 'select_multiple') {
      return groupByCol ? 'stackedHorizontalBar' : 'horizontalBar';
    }
    
    if (containsDate) {
      return 'line';
    }
    
    if (xType === 'text') {
      const choices = uniqueChoicesMap[xAxisCol] || [];
      if (choices.length > 8) {
        return groupByCol ? 'stackedHorizontalBar' : 'horizontalBar';
      }
      return groupByCol ? 'stackedBar' : 'bar';
    }
    
    return 'bar';
  }, [columnTypes, uniqueChoicesMap]);

  // Merge parent visuals, parent config and local overrides to resolve layout
  const resolvedConfig = useMemo(() => {
    const currentX = overrides.xAxis !== undefined ? overrides.xAxis : (
      colType === 'number'
        ? (columns.find(c => columnTypes[c] === 'text' || columnTypes[c] === 'select_multiple') || col)
        : col
    );
    const firstNumCol = columns.find(c => columnTypes[c] === 'number') || columns[0] || col;
    const parentY = colType === 'number'
      ? col
      : (config.yAxis && columnTypes[config.yAxis] === 'number' ? config.yAxis : firstNumCol);
    const currentY = overrides.yAxis !== undefined ? overrides.yAxis : parentY;
    const currentGroupBy = overrides.groupBy !== undefined ? overrides.groupBy : (globalGroupBy || config.groupBy || '');
    const defaultAgg = colType === 'number' ? 'avg' : 'count';
    const currentAggFunc = overrides.aggFunc !== undefined ? overrides.aggFunc : (config.aggFunc || defaultAgg);
    
    const autoChartType = overrides.autoChartType !== undefined ? overrides.autoChartType : (overrides.chartType === undefined);
    const computedChartType = autoChartType ? getSmartChartType(currentX, currentY, currentGroupBy) : (overrides.chartType || 'bar');

    return {
      xAxis: currentX,
      yAxis: currentY,
      groupBy: currentGroupBy,
      aggFunc: currentAggFunc,
      autoChartType,
      chartType: computedChartType,

      colorMode: overrides.colorMode !== undefined ? overrides.colorMode : visuals.colorMode || 'single',

      // Visuals color setups - fall back to parent sidebar variables
      primaryColor: overrides.primaryColor !== undefined ? overrides.primaryColor : visuals.primaryColor,
      secondaryColor: overrides.secondaryColor !== undefined ? overrides.secondaryColor : visuals.secondaryColor,
      tertiaryColor: overrides.tertiaryColor !== undefined ? overrides.tertiaryColor : visuals.tertiaryColor,
      quaternaryColor: overrides.quaternaryColor !== undefined ? overrides.quaternaryColor : visuals.quaternaryColor,
      
      showDataLabels: overrides.showDataLabels !== undefined ? overrides.showDataLabels : visuals.showDataLabels,
      showLegend: overrides.showLegend !== undefined ? overrides.showLegend : visuals.showLegend,
      gridLines: overrides.gridLines !== undefined ? overrides.gridLines : visuals.grid,
      showPercentage: overrides.showPercentage !== undefined ? overrides.showPercentage : (config.showPercentage ?? false),
      numberFormat: overrides.numberFormat !== undefined ? overrides.numberFormat : (config.numberFormat || 'raw'),
      cardTitle: overrides.cardTitle !== undefined ? overrides.cardTitle : `${columnAliases[col] || col} Analysis`,

      // Overlay category icon settings
      showIcons: overrides.showIcons !== undefined ? overrides.showIcons : visuals.showIcons,
      iconMode: overrides.iconMode !== undefined ? overrides.iconMode : (config.iconMode || 'per-category'),
      globalIcon: overrides.globalIcon !== undefined ? overrides.globalIcon : (config.globalIcon || 'Circle'),

      // General sliders / configurations
      borderWidth: overrides.borderWidth !== undefined ? overrides.borderWidth : visuals.borderWidth,
      opacity: overrides.opacity !== undefined ? overrides.opacity : visuals.opacity,
      tension: overrides.tension !== undefined ? overrides.tension : visuals.tension,
      shadow: overrides.shadow !== undefined ? overrides.shadow : visuals.shadow,
      fill: overrides.fill !== undefined ? overrides.fill : visuals.fill,
      showTrendline: overrides.showTrendline !== undefined ? overrides.showTrendline : (config.showTrendline ?? false),
      showRawPath: overrides.showRawPath !== undefined ? overrides.showRawPath : (config.showRawPath ?? false),
      cutout: overrides.cutout !== undefined ? overrides.cutout : (visuals.cutout ?? 50),
      scatterPointRadius: overrides.scatterPointRadius !== undefined ? overrides.scatterPointRadius : (visuals.scatterPointRadius ?? 8),
      comboLineWidth: overrides.comboLineWidth !== undefined ? overrides.comboLineWidth : (visuals.comboLineWidth ?? 3),

      iconSize: overrides.iconSize !== undefined ? overrides.iconSize : (visuals.iconSize ?? 16),
      iconContainerSize: overrides.iconContainerSize !== undefined ? overrides.iconContainerSize : (visuals.iconContainerSize ?? 42),
      iconContainerOpacity: overrides.iconContainerOpacity !== undefined ? overrides.iconContainerOpacity : (visuals.iconContainerOpacity ?? 0.95),
      iconOpacity: overrides.iconOpacity !== undefined ? overrides.iconOpacity : (visuals.iconOpacity ?? 1.0),
      iconOffset: overrides.iconOffset !== undefined ? overrides.iconOffset : (visuals.iconOffset ?? 0),
      iconColor: overrides.iconColor !== undefined ? overrides.iconColor : visuals.iconColor,

      legendFontSize: overrides.legendFontSize !== undefined ? overrides.legendFontSize : (visuals.legendFontSize ?? 12),
      legendSpacing: overrides.legendSpacing !== undefined ? overrides.legendSpacing : (visuals.legendSpacing ?? 30),
      legendWidth: overrides.legendWidth !== undefined ? overrides.legendWidth : (visuals.legendWidth ?? 200),
      legendPosition: overrides.legendPosition !== undefined ? overrides.legendPosition : (visuals.legendPosition ?? 'top'),

      dataLabelColor: overrides.dataLabelColor !== undefined ? overrides.dataLabelColor : (visuals.dataLabelColor ?? '#475569'),
      dataLabelPosition: overrides.dataLabelPosition !== undefined ? overrides.dataLabelPosition : (visuals.dataLabelPosition ?? 'outside'),
      dataLabelFontSize: overrides.dataLabelFontSize !== undefined ? overrides.dataLabelFontSize : (visuals.dataLabelFontSize ?? 11),

      xAxisFontSize: overrides.xAxisFontSize !== undefined ? overrides.xAxisFontSize : (visuals.xAxisFontSize ?? 11),
      xAxisTitleFontSize: overrides.xAxisTitleFontSize !== undefined ? overrides.xAxisTitleFontSize : (visuals.xAxisTitleFontSize ?? 12),
      yAxisFontSize: overrides.yAxisFontSize !== undefined ? overrides.yAxisFontSize : (visuals.yAxisFontSize ?? 11),
      yAxisTitleFontSize: overrides.yAxisTitleFontSize !== undefined ? overrides.yAxisTitleFontSize : (visuals.yAxisTitleFontSize ?? 12),
      showAllXAxisLabels: overrides.showAllXAxisLabels !== undefined ? overrides.showAllXAxisLabels : false,
      chartOrientation: overrides.chartOrientation !== undefined ? overrides.chartOrientation : (visuals.chartOrientation ?? 'v'),
      showAxisTicks: overrides.showAxisTicks !== undefined ? overrides.showAxisTicks : (visuals.showAxisTicks ?? true),
      showXAxisLabel: overrides.showXAxisLabel !== undefined ? overrides.showXAxisLabel : (visuals.showXAxisLabel ?? true),
      showYAxisLabel: overrides.showYAxisLabel !== undefined ? overrides.showYAxisLabel : (visuals.showYAxisLabel ?? true),
      tooltipMode: overrides.tooltipMode !== undefined ? overrides.tooltipMode : (visuals.tooltipMode || 'hover'),
    };
  }, [overrides, col, colType, columns, columnTypes, globalGroupBy, config, visuals, columnAliases, getSmartChartType]);

  // Helper to change any override parameter easily
  const updateOverride = (key, val) => {
    setOverrides(prev => ({ ...prev, [key]: val }));
  };

  // Keep track of inherited groupBy updates if global changes after mounting
  useEffect(() => {
    if (overrides.groupBy === undefined) {
      // Inherit the global groupBy if they haven't explicitly set their own
      setCategoryPositions([]);
      setChartArea(null);
    }
  }, [globalGroupBy, overrides.groupBy]);

  // Alignment plugin to extract label coordinates for relative icon overlays
  const cardAlignmentPlugin = useMemo(() => ({
    id: `cardAlignment_${col}`,
    afterLayout: (chart) => {
      const newArea = chart.chartArea;
      if (newArea) {
        setChartArea({
          left: newArea.left,
          top: newArea.top,
          right: newArea.right,
          bottom: newArea.bottom,
          width: newArea.width,
          height: newArea.height
        });
      }

      const isHorizontal = ['horizontalBar', 'stackedHorizontalBar'].includes(resolvedConfig.chartType);
      const scale = isHorizontal ? chart.scales.y : chart.scales.x;
      if (scale && chart.data.labels) {
        const positions = chart.data.labels.map((_, i) => scale.getPixelForValue(i));
        setCategoryPositions((prev) => {
          if (prev && prev.length === positions.length && prev.every((v, i) => Math.abs(v - positions[i]) < 0.2)) {
            return prev;
          }
          return positions;
        });
      }
    }
  }), [resolvedConfig.chartType, col]);

  // Compute aggregated vectors for this card/drawing
  const cardAgg = useMemo(() => {
    if (!shouldRender) return null;
    
    const isXMultiple = columnTypes[resolvedConfig.xAxis] === 'select_multiple';
    const isGroupMultiple = resolvedConfig.groupBy && columnTypes[resolvedConfig.groupBy] === 'select_multiple';

    // Labels aggregation
    const allLabels = isXMultiple
      ? (uniqueChoicesMap[resolvedConfig.xAxis] || [])
      : [...new Set(data.map((row) => String(row[resolvedConfig.xAxis] ?? 'Undefined')))].sort();

    const visibleLabels = allLabels;
    const visibleSet = new Set(visibleLabels);

    const groups = {};
    let filteredCount = 0;

    data.forEach((row) => {
      filteredCount++;

      // X Choices extraction
      const targetChoices = isXMultiple
        ? (uniqueChoicesMap[resolvedConfig.xAxis] || []).filter(choice => row[`${resolvedConfig.xAxis}__${choice}`] === 1)
        : [String(row[resolvedConfig.xAxis] ?? 'Undefined')];

      // Segment/Group Choices extraction
      const targetGroups = isGroupMultiple
        ? (uniqueChoicesMap[resolvedConfig.groupBy] || []).filter(choice => row[`${resolvedConfig.groupBy}__${choice}`] === 1)
        : [resolvedConfig.groupBy ? String(row[resolvedConfig.groupBy] ?? 'Total') : 'Primary'];

      targetGroups.forEach((groupKey) => {
        targetChoices.forEach((x) => {
          if (!visibleSet.has(x)) return;
          const value = parseFloat(row[resolvedConfig.yAxis]);

          groups[groupKey] ??= {};
          groups[groupKey][x] ??= [];

          if (!Number.isNaN(value)) {
            groups[groupKey][x].push(value);
          } else if (['count', 'unique'].includes(resolvedConfig.aggFunc)) {
            groups[groupKey][x].push(row[resolvedConfig.yAxis]);
          }
        });
      });
    });

    const labels = visibleLabels.map(l => legendAliases[l] || l);

    const rawDatasets = Object.keys(groups).map((groupName) => {
      const chartValues = visibleLabels.map((originalLabel) => {
        const values = groups[groupName][originalLabel] || [];
        if (values.length === 0) return 0;

        switch (resolvedConfig.aggFunc) {
          case 'avg':
            return values.reduce((sum, item) => sum + (typeof item === 'number' ? item : 0), 0) / values.length;
          case 'count':
            return values.length;
          case 'unique':
            return new Set(values).size;
          case 'max':
            return Math.max(...values.filter((item) => typeof item === 'number')) || 0;
          case 'min':
            return Math.min(...values.filter((item) => typeof item === 'number')) || 0;
          default: // sum
            return values.reduce((sum, item) => sum + (typeof item === 'number' ? item : 0), 0);
        }
      });
      return { groupName, chartValues };
    });

    const rawTotal = rawDatasets.reduce(
      (sum, dataset) => sum + dataset.chartValues.reduce((inner, value) => inner + Number(value || 0), 0),
      0
    );

    return { labels, rawDatasets, rawTotal, filteredCount, originalLabels: visibleLabels };
  }, [shouldRender, data, resolvedConfig.xAxis, resolvedConfig.yAxis, resolvedConfig.groupBy, resolvedConfig.aggFunc, columnTypes, uniqueChoicesMap, legendAliases]);

  // Construct Chart.js datasets structures
  const chartJSData = useMemo(() => {
    if (!cardAgg) return { labels: [], datasets: [] };

    // Built-in harmonious gradients
    const palette = [
      resolvedConfig.primaryColor,
      resolvedConfig.secondaryColor,
      resolvedConfig.tertiaryColor,
      resolvedConfig.quaternaryColor,
      '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#14b8a6'
    ];

    const datasets = cardAgg.rawDatasets.map((dataset, datasetIndex) => {
      const alphaVal = Math.round(resolvedConfig.opacity * 255).toString(16).padStart(2, '0');
      const isLine = ['line', 'spline', 'steppedLine', 'area', 'smoothArea', 'scatter'].includes(resolvedConfig.chartType);
      const palette = [
        resolvedConfig.primaryColor,
        resolvedConfig.secondaryColor,
        resolvedConfig.tertiaryColor,
        resolvedConfig.quaternaryColor,
        '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#14b8a6'
      ];

      const datasetColor = resolvedConfig.colorMode === 'dual'
        ? (datasetIndex % 2 === 0 ? palette[0] : palette[1])
        : (resolvedConfig.colorMode === 'multi'
          ? palette[datasetIndex % palette.length]
          : palette[0]);

      const labelColors = cardAgg.labels.map((_, labelIndex) => {
        if (resolvedConfig.colorMode === 'dual') {
          return labelIndex % 2 === 0 ? palette[0] : palette[1];
        }
        if (resolvedConfig.colorMode === 'multi') {
          return palette[labelIndex % palette.length];
        }
        return palette[0];
      });

      const displayData = resolvedConfig.showPercentage && cardAgg.rawTotal > 0
        ? dataset.chartValues.map((value) => (Number(value) / cardAgg.rawTotal) * 100)
        : dataset.chartValues;

      const backgroundColor = dataset.chartValues.map((_, idx) => {
        const color = resolvedConfig.groupBy ? datasetColor : (labelColors[idx] || resolvedConfig.primaryColor);
        return isLine && !['area', 'smoothArea'].includes(resolvedConfig.chartType) ? 'transparent' : `${color}${alphaVal}`;
      });
      const borderColor = resolvedConfig.groupBy
        ? datasetColor
        : dataset.chartValues.map((_, idx) => labelColors[idx] || resolvedConfig.primaryColor);
      const pointBackgroundColor = datasetColor;

      return {
        label: resolvedConfig.groupBy ? (legendAliases[dataset.groupName] || dataset.groupName) : (columnAliases[resolvedConfig.yAxis] || resolvedConfig.yAxis),
        data: displayData,
        backgroundColor,
        borderColor,
        borderWidth: resolvedConfig.borderWidth,
        fill: ['area', 'smoothArea'].includes(resolvedConfig.chartType),
        tension: ['spline', 'smoothArea'].includes(resolvedConfig.chartType) ? resolvedConfig.tension : 0,
        borderRadius: ['bar', 'horizontalBar', 'stackedBar', 'stackedHorizontalBar'].includes(resolvedConfig.chartType) ? 6 : 0,
        pointBackgroundColor,
        pointRadius: resolvedConfig.chartType === 'scatter' ? resolvedConfig.scatterPointRadius : (isLine ? 4 : 0),
        stepped: resolvedConfig.chartType === 'steppedLine',
        showLine: resolvedConfig.chartType !== 'scatter',
        originalLabels: cardAgg.originalLabels,
      };
    });

    return {
      labels: cardAgg.labels,
      datasets,
    };
  }, [cardAgg, resolvedConfig, legendAliases, columnAliases]);

  // Options configuration matching fully-functional ChartJS schema
  const chartJSOptions = useMemo(() => {
    const isHorizontal = ['horizontalBar', 'stackedHorizontalBar'].includes(resolvedConfig.chartType);
    const isStacked = ['stackedBar', 'stackedHorizontalBar'].includes(resolvedConfig.chartType);

    const galleryNumberFormatter = (val) => {
      const num = Number(val);
      if (Number.isNaN(num)) return val;
      if (resolvedConfig.numberFormat === 'compact') {
        return new Intl.NumberFormat('en-US', {
          notation: 'compact',
          maximumFractionDigits: 1
        }).format(num);
      }
      return new Intl.NumberFormat('en-US').format(num);
    };

    // Dynamic hidden legend elements for specific formatting
    const legendVisible = resolvedConfig.showLegend;

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false, // Turn off transition animations globally inside the gallery for 10x snappier instantaneous load speeds!
      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 15,
          bottom: resolvedConfig.showIcons ? (resolvedConfig.iconOffset + resolvedConfig.iconContainerSize + 12) : 15
        }
      },
      plugins: {
        legend: {
          display: legendVisible,
          position: resolvedConfig.legendPosition,
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            font: { size: resolvedConfig.legendFontSize, weight: 'bold' },
            color: '#475569',
            usePointStyle: true,
            pointStyle: 'circle',
            generateLabels: (chart) => {
              const datasets = chart.data.datasets || [];
              const labels = chart.data.labels || [];
              const charLimit = 30;

              if (resolvedConfig.groupBy || datasets.length > 1) {
                return datasets.map((dataset, index) => {
                  const bgColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor;
                  const bColor = Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor;
                  let text = dataset.label || `Series ${index + 1}`;
                  if (text.length > charLimit) {
                    text = `${text.slice(0, Math.max(3, charLimit - 3))}...`;
                  }

                  return {
                    text,
                    fillStyle: bgColor,
                    strokeStyle: bColor || bgColor,
                    lineWidth: 1,
                    hidden: !chart.isDatasetVisible(index),
                    datasetIndex: index,
                    pointStyle: 'circle'
                  };
                });
              }

              if (datasets.length > 0) {
                const dataset = datasets[0];
                return labels.map((label, index) => {
                  const bgColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[index] : dataset.backgroundColor;
                  const bColor = Array.isArray(dataset.borderColor) ? dataset.borderColor[index] : dataset.borderColor;
                  let text = String(label);
                  if (text.length > charLimit) {
                    text = `${text.slice(0, Math.max(3, charLimit - 3))}...`;
                  }

                  return {
                    text,
                    fillStyle: bgColor,
                    strokeStyle: bColor || bgColor,
                    lineWidth: dataset.borderWidth || 1,
                    hidden: false,
                    index,
                    datasetIndex: 0,
                    pointStyle: 'circle'
                  };
                });
              }

              return [];
            }
          }
        },
        tooltip: {
          enabled: resolvedConfig.tooltipMode !== 'none',
          backgroundColor: '#0f172a',
          titleFont: { size: 10, weight: 'extrabold' },
          bodyFont: { size: 9 },
          padding: 8,
          borderRadius: 8,
        },
        datalabels: {
          display: resolvedConfig.showDataLabels,
          anchor: resolvedConfig.dataLabelPosition === 'outside' ? 'end' : 'center',
          align: isHorizontal ? 'right' : (resolvedConfig.dataLabelPosition === 'outside' ? 'end' : 'center'),
          color: resolvedConfig.dataLabelColor,
          font: { size: resolvedConfig.dataLabelFontSize, weight: 'semibold' },
          formatter: (value) => {
            if (typeof value === 'number') {
              return resolvedConfig.showPercentage ? `${Number(value).toFixed(1)}%` : galleryNumberFormatter(Math.round(value));
            }
            return value;
          }
        }
      },
      scales: ['pie', 'doughnut', 'semiDoughnut', 'radar', 'polarArea'].includes(resolvedConfig.chartType) ? {} : {
        x: {
          stacked: isStacked,
          grid: {
            display: resolvedConfig.gridLines,
            color: '#f1f5f9',
          },
          ticks: {
            display: resolvedConfig.showAxisTicks,
            font: { size: resolvedConfig.xAxisFontSize, weight: 'medium' },
            color: '#64748b',
            maxRotation: 90,
            minRotation: 30, // Force diagonal/vertical slant when packed tightly to prevent overlap completely
            autoSkip: true,
            maxTicksLimit: computeTickLimit(cardAgg?.labels?.length),
            callback: function(val) {
              const label = this.getLabelForValue(val);
              return wrapLabel(label, 15); // Wrap words beautifully at a comfortable character length
            }
          },
          title: {
            display: resolvedConfig.showXAxisLabel,
            text: truncateText(columnAliases[resolvedConfig.xAxis] || resolvedConfig.xAxis, 40), // Truncate long questions cleanly
            font: { size: resolvedConfig.xAxisTitleFontSize, weight: 'bold' },
            color: '#334155'
          }
        },
        y: {
          stacked: isStacked,
          grid: {
            display: resolvedConfig.gridLines,
            color: '#f1f5f9',
          },
          title: {
            display: resolvedConfig.showYAxisLabel,
            text: truncateText(`${resolvedConfig.aggFunc.toUpperCase()} of ${columnAliases[resolvedConfig.yAxis] || resolvedConfig.yAxis}`, 40), // Truncate to keep margins neat
            font: { size: resolvedConfig.yAxisTitleFontSize, weight: 'bold' },
            color: '#334155'
          },
          ticks: {
            display: resolvedConfig.showAxisTicks,
            font: { size: resolvedConfig.yAxisFontSize, weight: 'bold' },
            color: '#94a3b8',
            callback: (val) => resolvedConfig.showPercentage ? `${val}%` : galleryNumberFormatter(val)
          }
        }
      }
    };
  }, [resolvedConfig, isExportingCard, isExporting, columnAliases, cardAgg]);

  // Trigger individual capture at high scaling DPI cloning dynamically
  const exportCardImage = useCallback(async (withIcons = true) => {
    setIsExportingCard(true);
    await new Promise((r) => setTimeout(r, 50));
    let canvas = null;

    try {
      await document.fonts.ready;
      if (!cardRef.current) return;
      const el = cardRef.current;
      const exportOpts = {
        scale: exportScale,
        transparent: exportTransparent,
        aspectRatio: exportAspectRatio,
        watermark: exportWatermark,
        customTitle: exportCustomTitle,
        timestamp: exportTimestamp
      };
      canvas = await captureCardCanvas(el, withIcons, exportOpts);
      const imgData = canvas.toDataURL('image/png', 1.0);
      const suffix = withIcons ? '' : '_no-icons';
      const baseName = `${resolvedConfig.cardTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}${suffix}`;
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${baseName}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Card screenshot failed', e);
      alert('Could not export individual card.');
    } finally {
      if (canvas) {
        disposeCanvas(canvas);
      }
      setIsExportingCard(false);
    }
  }, [resolvedConfig.cardTitle, exportScale, exportTransparent, exportAspectRatio, exportWatermark, exportCustomTitle, exportTimestamp]);

  const handleExportCard = useCallback(async () => {
    if (!cardRef.current) return;
    const withIcons = Boolean(cardRef.current.querySelector('[data-gallery-icon-layer]'));
    await exportCardImage(withIcons);
  }, [exportCardImage]);

  const ChartComponent = chartMap[resolvedConfig.chartType] || Bar;

  // Retrieve category icons dynamically
  const getCardCategoryIcon = useCallback((originalLabel) => {
    if (getCategoryIconWithPreference) {
      return getCategoryIconWithPreference(originalLabel);
    }
    return 'Circle';
  }, [getCategoryIconWithPreference]);

  return (
    <div
      ref={(node) => {
        if (elementRef) {
          if (typeof elementRef === 'function') {
            elementRef(node);
          } else {
            elementRef.current = node;
          }
        }
        cardRef.current = node;
      }}
      data-gallery-card="true"
      data-col-name={col}
      data-card-title={resolvedConfig.cardTitle}
      className="bg-white rounded-3xl shadow-[0_12px_40px_rgba(15,23,42,0.03)] hover:shadow-[0_20px_50px_rgba(99,102,241,0.08)] transition-all duration-300 overflow-hidden flex flex-col relative min-h-[320px] md:h-[440px] text-slate-800"
    >
      {/* SHIMMER PLACEHOLDER FOR LAZY LOADING */}
      {!shouldRender ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 animate-pulse bg-slate-50/70 h-full">
          <div className="w-12 h-12 bg-slate-200 rounded-2xl mb-4" />
          <div className="h-4 w-3/4 bg-slate-200 rounded-lg mb-2" />
          <div className="h-3 w-1/2 bg-slate-200 rounded-lg" />
        </div>
      ) : (
        <>
          {/* CRISTAL HEADER CHIP */}
          <div className="p-4 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {/* Checkbox indicator */}
              <button
                type="button"
                data-html2canvas-ignore="true"
                onClick={onToggleSelect}
                className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 cursor-pointer ${isSelected ? 'bg-indigo-650 border-indigo-700 text-white shadow-sm' : 'bg-white border-slate-250 text-transparent hover:border-slate-350'}`}
              >
                <SafeIcon name="Check" size={12} className="stroke-[3]" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-[13px] font-extrabold text-slate-800 tracking-tight truncate" title={resolvedConfig.cardTitle}>
                  {resolvedConfig.cardTitle}
                </h2>
              </div>
            </div>

            {/* INTEGRATED ACTION GEARS AND GADGETS */}
            <div data-html2canvas-ignore="true" className="flex items-center gap-1 shrink-0">
              {/* Reset to Inherited sidebar fallback settings badge when overridden */}
              {Object.keys(overrides).length > 0 && (
                <button
                  type="button"
                  onClick={() => setOverrides({})}
                  className="p-2 py-1 text-[8.5px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 rounded-xl transition-all"
                  title="Reset customization and return to inherited sidebar settings"
                >
                  Reset Overrides
                </button>
              )}

              {/* Apply/Send to Main View Workspace Button */}
              <button
                type="button"
                onClick={() => {
                  if (onApplyToMainView) {
                    onApplyToMainView(resolvedConfig);
                  }
                }}
                className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl transition-all"
                title="Download and send this chart to the main page to begin detailed editing"
              >
                <SafeIcon name="ArrowDownLeft" size={12} />
              </button>

              {/* Settings Trigger */}
              <button
                type="button"
                onClick={() => setIsSettingOpen(!isSettingOpen)}
                className={`p-2 rounded-xl transition-all ${isSettingOpen ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'}`}
                title="Subchart settings and customization"
              >
                <SafeIcon name="Sliders" size={12} />
              </button>

              {/* Individual Export Button */}
              <button
                type="button"
                onClick={handleExportCard}
                className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                title="Export and download the chart as a high-resolution PNG"
              >
                <SafeIcon name="Download" size={12} />
              </button>
            </div>
          </div>

          {/* CARD WORKSPACE LAYER */}
          <div className="flex-1 flex flex-col p-4 relative min-h-0 min-w-0 overflow-hidden" ref={cardRef} data-gallery-card-content="true">
            {/* NO DATA STATE */}
            {!cardAgg || cardAgg.labels.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <SafeIcon name="Inbox" size={24} className="mb-2 text-slate-350" />
                <span className="text-[11px] font-bold">Unmappable configuration</span>
              </div>
            ) : (
              <div className="chart-container relative flex-1 min-w-0 min-h-0 overflow-visible">
                <ChartComponent
                  key={`${resolvedConfig.chartType}_${resolvedConfig.primaryColor}_${resolvedConfig.secondaryColor}_${resolvedConfig.tertiaryColor}_${resolvedConfig.quaternaryColor}_${resolvedConfig.gridLines}_${resolvedConfig.showLegend}_${resolvedConfig.showIcons}_${resolvedConfig.borderWidth}_${resolvedConfig.opacity}_${resolvedConfig.tension}_${resolvedConfig.cutout}_${resolvedConfig.legendPosition}_${resolvedConfig.xAxisFontSize}_${resolvedConfig.yAxisFontSize}_${resolvedConfig.xAxisTitleFontSize}_${resolvedConfig.yAxisTitleFontSize}_${resolvedConfig.showAxisTicks}_${resolvedConfig.showXAxisLabel}_${resolvedConfig.showYAxisLabel}_${resolvedConfig.tooltipMode}_${resolvedConfig.numberFormat}`}
                  data={chartJSData}
                  options={chartJSOptions}
                  plugins={[cardAlignmentPlugin]}
                />

                {/* Localized Category Icons Layer within the Gallery Card! */}
                {resolvedConfig.showIcons && cardAgg && chartArea && (() => {
                  const isExportActive = isExporting || isExportingCard;
                  const getDynamicCatColor = (idx) => {
                    if (chartJSData?.datasets && chartJSData.datasets.length > 0) {
                      const ds = chartJSData.datasets[0];
                      if (ds.backgroundColor) {
                        if (Array.isArray(ds.backgroundColor)) {
                          const col = ds.backgroundColor[idx] || ds.backgroundColor[0];
                          if (typeof col === 'string') {
                            return col.startsWith('#') && col.length === 9 ? col.slice(0, 7) : col;
                          }
                          return col || resolvedConfig.primaryColor;
                        }
                      }
                      if (ds.borderColor) {
                        if (Array.isArray(ds.borderColor)) {
                          const col = ds.borderColor[idx] || ds.borderColor[0];
                          if (typeof col === 'string') {
                            return col.startsWith('#') && col.length === 9 ? col.slice(0, 7) : col;
                          }
                          return col || resolvedConfig.primaryColor;
                        }
                      }
                      const fallback = ds.borderColor || ds.backgroundColor;
                      if (typeof fallback === 'string') {
                        return fallback.startsWith('#') && fallback.length === 9 ? fallback.slice(0, 7) : fallback;
                      }
                    }
                    return resolvedConfig.primaryColor;
                  };

                  return (
                    <div className="absolute inset-0 pointer-events-none z-20" data-gallery-icon-layer="true">
                      <div className="absolute pointer-events-none" style={{ left: chartArea.left, top: chartArea.top, width: chartArea.width, height: chartArea.height }}>
                        {resolvedConfig.iconMode === 'centered' ? (() => {
                          const middleIndex = Math.floor(chartJSData.labels.length / 2);
                          const pos = categoryPositions[middleIndex];
                          if (pos === undefined) return null;
                          const reflectsHorizontal = ['horizontalBar', 'stackedHorizontalBar'].includes(resolvedConfig.chartType);
                          const relPos = reflectsHorizontal ? pos - chartArea.top : pos - chartArea.left;
                          const middleColor = getDynamicCatColor(middleIndex);
                          const containerSize = isExportActive ? resolvedConfig.iconContainerSize : Math.max(16, resolvedConfig.iconContainerSize * (240 / 580));
                          const iconSize = isExportActive ? resolvedConfig.iconSize : Math.max(8, resolvedConfig.iconSize * (240 / 580));
                          
                          return (
                            <div className="absolute pointer-events-auto flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                              style={{
                                left: reflectsHorizontal ? `-${resolvedConfig.iconOffset}px` : relPos,
                                top: reflectsHorizontal ? relPos : (chartArea.height + resolvedConfig.iconOffset)
                              }}>
                              <div className="flex items-center justify-center"
                                style={{
                                  width: containerSize,
                                  height: containerSize,
                                  backgroundColor: hexToRgba('#ffffff', parseFloat(resolvedConfig.iconContainerOpacity ?? 0.95)),
                                  border: `1.5px solid ${hexToRgba(middleColor, parseFloat(resolvedConfig.iconContainerOpacity ?? 0.95))}`,
                                  borderRadius: '9999px',
                                  boxShadow: (isExportActive || parseFloat(resolvedConfig.iconContainerOpacity ?? 1) <= 0) ? 'none' : `0 2px 6px rgba(15, 23, 42, 0.1)`,
                                }}
                              >
                                <DynamicIcon name={resolvedConfig.globalIcon || 'Circle'} size={iconSize} style={{ color: resolvedConfig.iconColor || middleColor, opacity: resolvedConfig.iconOpacity }} />
                              </div>
                            </div>
                          );
                        })() : categoryPositions.length > 0 && chartJSData.labels.map((label, index) => {
                          const reflectsHorizontal = ['horizontalBar', 'stackedHorizontalBar'].includes(resolvedConfig.chartType);
                          const pos = categoryPositions[index];
                          if (pos === undefined) return null;
                          const relPos = reflectsHorizontal ? pos - chartArea.top : pos - chartArea.left;
                          const originalLabel = cardAgg.originalLabels?.[index] || label;
                          const iconName = resolvedConfig.iconMode === 'unified'
                            ? (resolvedConfig.globalIcon || 'Circle')
                            : getCardCategoryIcon(originalLabel);
                          
                          const catColor = getDynamicCatColor(index);
                          const containerSize = isExportActive ? resolvedConfig.iconContainerSize : Math.max(16, resolvedConfig.iconContainerSize * (240 / 580));
                          const iconSize = isExportActive ? resolvedConfig.iconSize : Math.max(8, resolvedConfig.iconSize * (240 / 580));

                          return (
                            <div key={index} className="absolute pointer-events-auto flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                              style={{
                                  left: reflectsHorizontal ? `-${resolvedConfig.iconOffset}px` : relPos,
                                  top: reflectsHorizontal ? relPos : (chartArea.height + resolvedConfig.iconOffset)
                              }}>
                               <div className="flex items-center justify-center animate-fadeIn"
                                style={{
                                  width: containerSize,
                                  height: containerSize,
                                  backgroundColor: hexToRgba('#ffffff', parseFloat(resolvedConfig.iconContainerOpacity ?? 0.95)),
                                  border: `1.5px solid ${hexToRgba(catColor, parseFloat(resolvedConfig.iconContainerOpacity ?? 0.95))}`,
                                  borderRadius: '9999px',
                                  boxShadow: (isExportActive || parseFloat(resolvedConfig.iconContainerOpacity ?? 1) <= 0) ? 'none' : `0 2px 6px rgba(15, 23, 42, 0.1)`,
                                }}
                              >
                                <DynamicIcon name={iconName} size={iconSize} style={{ color: resolvedConfig.iconColor || catColor, opacity: resolvedConfig.iconOpacity }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* METADATA ACCENTS */}
            <div className="mt-2.5 flex items-center justify-between text-[8px] font-black text-slate-450 uppercase tracking-widest shrink-0 border-t border-slate-100/60 pt-2 bg-white" data-html2canvas-ignore="true">
              <span>{resolvedConfig.chartType} Layout • {colType.toUpperCase()}</span>
              <span>Vector count: {cardAgg?.filteredCount || 0}</span>
            </div>

            {/* SLIDE-IN INNER CARD SPECIFIC SETTINGS DRAWER OVERLAY */}
            <AnimatePresence>
              {isSettingOpen && (
                <motion.div
                  initial={{ opacity: 0, x: '100%' }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: '100%' }}
                  transition={{ type: 'tween', duration: 0.35 }}
                  className="absolute inset-0 bg-slate-950/100 backdrop-blur-xl text-white p-4 overflow-y-auto z-50 flex flex-col gap-3 shadow-2xl border border-slate-800/70"
                  data-html2canvas-ignore="true"
                >
                  {/* DRAWER HEADER */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
                    <span className="text-[9.5px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                      <SafeIcon name="Sliders" size={10} /> Parameter Lab ({columnAliases[col] || col})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSettingOpen(false)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <SafeIcon name="X" size={14} />
                    </button>
                  </div>

                  {/* MODERN EDITING TABS */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-xl shrink-0">
                    {[
                      { id: 'data', label: 'Axes Data' },
                      { id: 'styling', label: 'Aesthetics' },
                      { id: 'overlay', label: 'Overlay' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-1.5 text-[9px] font-black rounded-lg transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* TAB ITEMS PANEL CODES */}
                  <div className="flex-1 space-y-4 text-xs pr-1">
                    
                    {/* 1. DATA & AXES TAB */}
                    {activeTab === 'data' && (
                      <div className="space-y-4 animate-fadeIn">
                        {/* Title Settings */}
                        <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Header Label</label>
                          <input
                            type="text"
                            value={resolvedConfig.cardTitle}
                            onChange={(e) => updateOverride('cardTitle', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] outline-none font-bold text-white focus:border-indigo-500"
                          />
                        </div>

                        {/* Interactive Axes Custom Selection */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">X Axis Column</label>
                            <select
                              value={resolvedConfig.xAxis}
                              onChange={(e) => {
                                updateOverride('xAxis', e.target.value);
                                setCategoryPositions([]);
                                setChartArea(null);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] outline-none font-bold text-white cursor-pointer"
                            >
                              {columns.map(c => (
                                <option key={c} value={c}>{columnAliases[c] || c}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Y Axis Column</label>
                            <select
                              value={resolvedConfig.yAxis}
                              onChange={(e) => updateOverride('yAxis', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] outline-none font-bold text-white cursor-pointer"
                            >
                              {columns.map(c => (
                                <option key={c} value={c}>{columnAliases[c] || c}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Segmentation & Aggregation Functions */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Segment (GroupBy)</label>
                            <select
                              value={resolvedConfig.groupBy}
                              onChange={(e) => {
                                updateOverride('groupBy', e.target.value);
                                setCategoryPositions([]);
                                setChartArea(null);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] outline-none font-bold text-white cursor-pointer"
                            >
                              <option value="">None (Single Dimensional)</option>
                              {columns.map(c => (
                                <option key={c} value={c}>{columnAliases[c] || c}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Aggregation Math</label>
                            <select
                              value={resolvedConfig.aggFunc}
                              onChange={(e) => updateOverride('aggFunc', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] outline-none font-bold text-white cursor-pointer"
                            >
                              <option value="sum">Summation Total</option>
                              <option value="avg">Mathematical Average</option>
                              <option value="count">Sample Count (Frequency)</option>
                              <option value="unique">Distinct/Unique Count</option>
                              <option value="min">Minimum Value</option>
                              <option value="max">Maximum Value</option>
                            </select>
                          </div>
                        </div>

                        {/* SMART AUTO DETECTOR SECTION */}
                        <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-800/60 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                              <SafeIcon name="Sparkles" size={10} className="text-amber-400" /> Smart auto-detect layout
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                updateOverride('autoChartType', !resolvedConfig.autoChartType);
                              }}
                              className={`w-8 h-4 rounded-full transition-all relative ${resolvedConfig.autoChartType ? 'bg-indigo-500' : 'bg-slate-700'}`}
                            >
                              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${resolvedConfig.autoChartType ? 'left-4.5' : 'left-0.5'}`} />
                            </button>
                          </div>
                          <span className="text-[8.5px] font-semibold text-slate-400 leading-normal">
                            We analyze axes schemas automatically and dynamically re-calculate the smartest visualization.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 2. STYLE & AESTHETIC PROPERTIES TAB */}
                    {activeTab === 'styling' && (
                      <div className="space-y-4 animate-fadeIn">
                        {/* Layout Overriding Select */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Visual Layout</label>
                            <select
                              disabled={resolvedConfig.autoChartType}
                              value={resolvedConfig.chartType}
                              onChange={(e) => {
                                updateOverride('autoChartType', false);
                                updateOverride('chartType', e.target.value);
                                setCategoryPositions([]);
                                setChartArea(null);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] outline-none font-bold text-white cursor-pointer disabled:opacity-50"
                            >
                              <option value="bar">Vertical Columns</option>
                              <option value="horizontalBar">Horizontal Bars</option>
                              <option value="stackedBar">Stacked Columns</option>
                              <option value="stackedHorizontalBar">Stacked Horizontals</option>
                              <option value="line">Trendline Line</option>
                              <option value="spline">Smoothed Spline</option>
                              <option value="area">Area Volume</option>
                              <option value="smoothArea">Smooth Gradient Area</option>
                              <option value="pie">Pie Chart</option>
                              <option value="doughnut">Doughnut</option>
                              <option value="semiDoughnut">Semi Doughnut</option>
                            </select>
                          </div>

                          {/* Specific Custom Accent Colors */}
                          <div className="flex flex-col gap-3">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Custom Swatches</label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] text-slate-400 uppercase tracking-wider block mb-1">Primary</label>
                                <input
                                  type="color"
                                  value={resolvedConfig.primaryColor}
                                  onChange={(e) => updateOverride('primaryColor', e.target.value)}
                                  className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-0"
                                  title="Primary swatches color"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] text-slate-400 uppercase tracking-wider block mb-1">Secondary</label>
                                <input
                                  type="color"
                                  value={resolvedConfig.secondaryColor}
                                  onChange={(e) => updateOverride('secondaryColor', e.target.value)}
                                  className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-0"
                                  title="Secondary swatches color"
                                />
                              </div>
                              {resolvedConfig.colorMode !== 'single' && (
                                <>
                                  <div>
                                    <label className="text-[8px] text-slate-400 uppercase tracking-wider block mb-1">Tertiary</label>
                                    <input
                                      type="color"
                                      value={resolvedConfig.tertiaryColor}
                                      onChange={(e) => updateOverride('tertiaryColor', e.target.value)}
                                      className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-0"
                                      title="Tertiary swatches color"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] text-slate-400 uppercase tracking-wider block mb-1">Quaternary</label>
                                    <input
                                      type="color"
                                      value={resolvedConfig.quaternaryColor}
                                      onChange={(e) => updateOverride('quaternaryColor', e.target.value)}
                                      className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-0"
                                      title="Quaternary swatches color"
                                    />
                                  </div>
                                </>
                              )}
                            </div>

                            <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Color Mode</label>
                              <div className="grid grid-cols-3 gap-2">
                                {['single', 'dual', 'multi'].map(mode => (
                                  <button
                                    key={mode}
                                    type="button"
                                    onClick={() => updateOverride('colorMode', mode)}
                                    className={`py-2 text-[10px] font-black rounded-xl transition-all ${resolvedConfig.colorMode === mode ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                                  >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive checkbox toggled options */}
                        <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-300">
                          <label htmlFor="chk-showDataLabels" className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                            <input
                              id="chk-showDataLabels"
                              name="showDataLabels"
                              type="checkbox"
                              checked={resolvedConfig.showDataLabels}
                              onChange={(e) => updateOverride('showDataLabels', e.target.checked)}
                              className="accent-indigo-500 rounded border-slate-800"
                            />
                            <span>Value labels</span>
                          </label>

                          <label htmlFor="chk-showLegend" className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                            <input
                              id="chk-showLegend"
                              name="showLegend"
                              type="checkbox"
                              checked={resolvedConfig.showLegend}
                              onChange={(e) => updateOverride('showLegend', e.target.checked)}
                              className="accent-indigo-500 rounded border-slate-800"
                            />
                            <span>Show Legend</span>
                          </label>

                          <label htmlFor="chk-gridLines" className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                            <input
                              id="chk-gridLines"
                              name="gridLines"
                              type="checkbox"
                              checked={resolvedConfig.gridLines}
                              onChange={(e) => updateOverride('gridLines', e.target.checked)}
                              className="accent-indigo-500 rounded border-slate-800"
                            />
                            <span>Grid lines</span>
                          </label>

                          <label htmlFor="chk-showAxisTicks" className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                            <input
                              id="chk-showAxisTicks"
                              name="showAxisTicks"
                              type="checkbox"
                              checked={resolvedConfig.showAxisTicks}
                              onChange={(e) => updateOverride('showAxisTicks', e.target.checked)}
                              className="accent-indigo-500 rounded border-slate-800"
                            />
                            <span>Axis ticks</span>
                          </label>

                          <label htmlFor="chk-showPercentage" className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                            <input
                              id="chk-showPercentage"
                              name="showPercentage"
                              type="checkbox"
                              checked={resolvedConfig.showPercentage}
                              onChange={(e) => updateOverride('showPercentage', e.target.checked)}
                              className="accent-indigo-500 rounded border-slate-800"
                            />
                            <span>Percentages</span>
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[9px] font-bold text-slate-300">
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Legend Position</label>
                            <select
                              value={resolvedConfig.legendPosition}
                              onChange={(e) => updateOverride('legendPosition', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] outline-none font-bold text-white cursor-pointer"
                            >
                              <option value="top">Top</option>
                              <option value="bottom">Bottom</option>
                              <option value="left">Left</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Data Label Position</label>
                            <select
                              value={resolvedConfig.dataLabelPosition}
                              onChange={(e) => updateOverride('dataLabelPosition', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] outline-none font-bold text-white cursor-pointer"
                            >
                              <option value="outside">Outside</option>
                              <option value="inside">Inside</option>
                              <option value="center">Center</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Chart Orientation</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => updateOverride('chartOrientation', 'v')}
                                className={`py-2 text-[10px] font-black rounded-xl transition-all ${resolvedConfig.chartOrientation === 'v' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                              >
                                Vertical
                              </button>
                              <button
                                type="button"
                                onClick={() => updateOverride('chartOrientation', 'h')}
                                className={`py-2 text-[10px] font-black rounded-xl transition-all ${resolvedConfig.chartOrientation === 'h' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                              >
                                Horizontal
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Axis labels</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => updateOverride('showXAxisLabel', !resolvedConfig.showXAxisLabel)}
                                className={`py-2 text-[10px] font-black rounded-xl transition-all ${resolvedConfig.showXAxisLabel ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                              >
                                X
                              </button>
                              <button
                                type="button"
                                onClick={() => updateOverride('showYAxisLabel', !resolvedConfig.showYAxisLabel)}
                                className={`py-2 text-[10px] font-black rounded-xl transition-all ${resolvedConfig.showYAxisLabel ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                              >
                                Y
                              </button>
                            </div>

                            <div className="mt-3 flex flex-col gap-2">
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateOverride('showAllXAxisLabels', !resolvedConfig.showAllXAxisLabels)}
                                  className={`py-2 px-3 text-[10px] font-black rounded-xl transition-all ${resolvedConfig.showAllXAxisLabels ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                                >
                                  {resolvedConfig.showAllXAxisLabels ? 'Compact labels' : 'Show all X labels'}
                                </button>
                                <span className="text-[8px] text-slate-400">{resolvedConfig.xAxisFontSize}px</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateOverride('xAxisFontSize', Math.max(6, resolvedConfig.xAxisFontSize - 1))}
                                  className="flex-1 py-2 text-[10px] font-black rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800"
                                >
                                  A-
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateOverride('xAxisFontSize', Math.min(18, resolvedConfig.xAxisFontSize + 1))}
                                  className="flex-1 py-2 text-[10px] font-black rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800"
                                >
                                  A+
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Sliders Area styling */}
                        <div className="space-y-3 pt-2 border-t border-slate-800">
                          <div>
                            <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                              <label htmlFor="range-opacity">Fill opacity</label>
                              <span>{Math.round(resolvedConfig.opacity * 100)}%</span>
                            </div>
                            <input
                              id="range-opacity"
                              name="opacity"
                              type="range"
                              min="0.1"
                              max="1.0"
                              step="0.05"
                              value={resolvedConfig.opacity}
                              onChange={(e) => updateOverride('opacity', parseFloat(e.target.value))}
                              className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                              <label htmlFor="range-tension">Line tension (curves)</label>
                              <span>{resolvedConfig.tension}</span>
                            </div>
                            <input
                              id="range-tension"
                              name="tension"
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={resolvedConfig.tension}
                              onChange={(e) => updateOverride('tension', parseFloat(e.target.value))}
                              className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                              <label htmlFor="range-borderWidth">Border column width</label>
                              <span>{resolvedConfig.borderWidth}px</span>
                            </div>
                            <input
                              id="range-borderWidth"
                              name="borderWidth"
                              type="range"
                              min="0"
                              max="6"
                              step="1"
                              value={resolvedConfig.borderWidth}
                              onChange={(e) => updateOverride('borderWidth', parseInt(e.target.value))}
                              className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                              <label htmlFor="range-legendSpacing">Legend spacing</label>
                              <span>{resolvedConfig.legendSpacing}px</span>
                            </div>
                            <input
                              id="range-legendSpacing"
                              name="legendSpacing"
                              type="range"
                              min="10"
                              max="80"
                              step="2"
                              value={resolvedConfig.legendSpacing}
                              onChange={(e) => updateOverride('legendSpacing', parseInt(e.target.value))}
                              className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. ICON & LABELS OVERLAY PROPERTIES TAB */}
                    {activeTab === 'overlay' && (
                      <div className="space-y-4 animate-fadeIn">
                        
                        {/* Dynamic category icon options mapping */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Data Overlays</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-bold text-slate-400 uppercase">Show</span>
                              <button
                                type="button"
                                onClick={() => updateOverride('showIcons', !resolvedConfig.showIcons)}
                                className={`w-8 h-4 rounded-full transition-all relative ${resolvedConfig.showIcons ? 'bg-indigo-500' : 'bg-slate-700'}`}
                              >
                                <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${resolvedConfig.showIcons ? 'left-4.5' : 'left-0.5'}`} />
                              </button>
                            </div>
                          </div>

                          {resolvedConfig.showIcons && (
                            <div className="space-y-3 pt-2 border-t border-slate-800 animate-fadeIn">
                              <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Layout position</label>
                                <select
                                  value={resolvedConfig.iconMode}
                                  onChange={(e) => updateOverride('iconMode', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] outline-none font-bold text-white cursor-pointer"
                                >
                                  <option value="per-category">Categorical Icons</option>
                                  <option value="unified">Unified</option>
                                  <option value="centered">Centered Indicator</option>
                                </select>
                              </div>

                              <div>
                                <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 block mb-1">
                                  <span>Element size</span>
                                  <span>{resolvedConfig.iconSize} px</span>
                                </div>
                                <input
                                  type="range"
                                  min="8"
                                  max="32"
                                  value={resolvedConfig.iconSize}
                                  onChange={(e) => updateOverride('iconSize', parseInt(e.target.value))}
                                  className="w-full accent-indigo-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                                />
                              </div>

                              <div>
                                <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 block mb-1">
                                  <span>Shell diameter</span>
                                  <span>{resolvedConfig.iconContainerSize} px</span>
                                </div>
                                <input
                                  type="range"
                                  min="10"
                                  max="70"
                                  value={resolvedConfig.iconContainerSize}
                                  onChange={(e) => updateOverride('iconContainerSize', parseInt(e.target.value))}
                                  className="w-full accent-indigo-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interactive Tooltips modes chooser */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
                          <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Interaction Schema</label>
                          <select
                            value={resolvedConfig.tooltipMode}
                            onChange={(e) => updateOverride('tooltipMode', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] outline-none font-bold text-white cursor-pointer"
                          >
                            <option value="hover">Hover Only</option>
                            <option value="click">Click to Pin</option>
                            <option value="peak">Highest Peak Pinned</option>
                            <option value="all">Display All Labels</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
});

// LIGHT STUB WRAPPER COMPONENT THAT INTERCEPTS RENDERING FOR GIGANTIC PERFORMANCE LEAPS
const GalleryCard = memo(({ col, ...props }) => {
  const [ref, inView] = useLazyLoad();
  const shouldRender = inView || props.isExporting;

  if (!shouldRender) {
    return (
      <div
        ref={ref}
        data-gallery-card="true"
        data-col-name={col}
        className="bg-white rounded-3xl shadow-[0_12px_40px_rgba(15,23,42,0.03)] hover:shadow-[0_20px_50px_rgba(99,102,241,0.08)] transition-all duration-300 overflow-hidden flex flex-col relative min-h-[320px] md:h-[440px] text-slate-800"
      >
        <div className="flex-1 flex flex-col items-center justify-center p-8 animate-pulse bg-slate-50/70 h-full w-full rounded-2xl">
          <div className="w-12 h-12 bg-slate-200 rounded-2xl mb-4 animate-bounce" />
          <div className="h-4 w-3/4 bg-slate-200 rounded-lg mb-2" />
          <div className="h-3 w-1/2 bg-slate-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return <ActiveGalleryCard elementRef={ref} col={col} {...props} />;
}, arePropsEqual);

export default memo(ChartGallery);
