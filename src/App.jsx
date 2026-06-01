import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bar, Doughnut, Line, Pie, Radar, PolarArea } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import SafeIcon from './components/SafeIcon';
import { parseExcelFile } from './utils/excelParser';
import { buildChartOptions, chartComponents, colorPalettes, getCategoryIcon, iconMappings, searchIcons } from './utils/chartConfigs';
import { useResizeObserver } from './hooks/useResizeObserver';

// Import sub-components
import DataManagement from './components/Sidebar/sections/DataManagement';
import StatisticalOperations from './components/Sidebar/sections/StatisticalOperations';
import SettingsUI from './components/Sidebar/sections/SettingsUI';
import VisualCustomization from './components/Sidebar/sections/VisualCustomization';
import IconFiltering from './components/Sidebar/sections/IconFiltering';
import AdvancedFilters from './components/Sidebar/sections/AdvancedFilters';
import ChartHeader from './components/ChartArea/ChartHeader';
import MetricsGrid from './components/ChartArea/MetricsGrid';
import ChartGallery from './components/ChartGallery';
import DynamicIcon from './components/DynamicIcon';
import HierarchicalSettings from './components/HierarchicalSettings';
import ChartEngine from './components/ChartEngine';
import {
  detectColumnType,
  flattenMultipleChoice,
  validateFlattenedData,
  getUniqueChoices
} from './utils/smartDetector';
import {
  getDesignSettings,
  saveActiveSelection,
  saveChartConfig,
  saveChartVisuals
} from './services/SettingsService';
import { setDesignSettings } from './services/SettingsService';

const colorClasses = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600'
};

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

const defaultConfig = {
  xAxis: '',
  yAxis: '',
  groupBy: '',
  aggFunc: 'sum',
  chartType: 'bar',
  showPercentage: false,
  chartTitle: 'Interactive Report',
  xAxisLabel: '',
  yAxisLabel: '',
  showTrendline: false,
  showRawPath: false,
  numberFormat: 'raw',
  iconMode: 'per-category',
  globalIcon: 'Circle'
};

const defaultVisuals = {
  colorMode: 'single',
  primaryColor: '#6366f1',
  secondaryColor: '#f43f5e',
  tertiaryColor: '#10b981',
  quaternaryColor: '#f59e0b',
  labelColorMap: {},
  borderWidth: 2,
  opacity: 0.8,
  tension: 0.4,
  shadow: false,
  fill: true,
  grid: true,
  showIcons: true,
  borderRadius: 16,
  showDataLabels: true,
  showAxisLabels: true,
  showXAxisLabel: true,
  showYAxisLabel: true,
  showLegend: true,
  glassBlur: 24,
  glassOpacity: 0.7,
  labelMaxLength: 20,
  chartHeight: 600,
  iconSize: 16,
  iconContainerSize: 42,
  iconContainerOpacity: 0.95,
  iconColor: '#64748b',
  iconOpacity: 1.0,
  iconOffset: 0,

  legendFontSize: 12,
  xAxisFontSize: 11,
  yAxisFontSize: 11,
  dataLabelPosition: 'outside',
  dataLabelColor: '#475569',
  dataLabelFontSize: 11,
  xAxisTitleFontSize: 12,
  yAxisTitleFontSize: 12,
  legendPosition: 'top',
  legendWidth: 50,
  chartOrientation: 'v',
  showAxisTicks: true,
  tooltipMode: 'hover'
};

const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex;
  const num = parseInt(hex.slice(1), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const App = () => {
  const [data, setData] = useState([]);
  const [columnTypes, setColumnTypes] = useState({});
  const [suggestedTypes, setSuggestedTypes] = useState({});
  const [selectedMultipleChoices, setSelectedMultipleChoices] = useState({});
  const [columns, setColumns] = useState([]);
  const [fileName, setFileName] = useState('');
  const [appError, setAppError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [config, setConfig] = useState(defaultConfig);
  const [visuals, setVisuals] = useState(defaultVisuals);
  const [showGallery, setShowGallery] = useState(() => {
    try {
      return new window.URLSearchParams(window.location.search).get('gallery') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [pinnedIndices, setPinnedIndices] = useState([]);
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDesign, setSelectedDesign] = useState('');
  const [chartFadeKey, setChartFadeKey] = useState(Date.now());
  const [isBusy, setIsBusy] = useState(false);
  const [expandedLayer, setExpandedLayer] = useState(1);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [customIcons, setCustomIcons] = useState({});
  const [filters, setFilters] = useState([]); // This controls X-axis visibility specifically
  const [advancedFilters, setAdvancedFilters] = useState({}); // New: { [column]: { excluded: [...] } }
  const [activeIconTarget, setActiveIconTarget] = useState('');
  const [isEditingIcons, setIsEditingIcons] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);
  const [selectedLabelForIcon, setSelectedLabelForIcon] = useState('');
  const [selectedIconName, setSelectedIconName] = useState('');
  const [iconLibrary, setIconLibrary] = useState('standard');
  const [showIconSuggestions, setShowIconSuggestions] = useState(false);
  const [legendAliases, setLegendAliases] = useState({});
  const [editingLabel, setEditingLabel] = useState(null);
  const [editingLegend, setEditingLegend] = useState(null);
  const [columnAliases, setColumnAliases] = useState({});
  const [editingCol, setEditingCol] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingType, setEditingType] = useState('text');

  const [recentIcons, setRecentIcons] = useState(() => {
    try {
      const stored = localStorage.getItem('meal_recent_icons');
      return stored ? JSON.parse(stored) : ['Circle', 'DollarSign', 'Heart', 'AlertTriangle', 'TrendingUp'];
    } catch {
      return ['Circle', 'DollarSign', 'Heart', 'AlertTriangle', 'TrendingUp'];
    }
  });
  const [modalIsDragging, setModalIsDragging] = useState(false);
  const [iconUploadError, setIconUploadError] = useState('');

  const addRecentIcon = (icon) => {
    if (!icon || icon.startsWith('data:')) return;
    setRecentIcons(prev => {
      const filtered = prev.filter(i => i !== icon);
      const next = [icon, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('meal_recent_icons', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Flatten the multiple choice selections in the background using useMemo
  const { flattenedData, uniqueChoicesMap } = useMemo(() => {
    if (!data || data.length === 0) return { flattenedData: [], uniqueChoicesMap: {} };
    
    // Auto-flatten columns of type 'select_multiple'
    const selectMultipleCols = Object.keys(columnTypes).filter(col => columnTypes[col] === 'select_multiple');
    const { flattenedRows, uniqueChoicesMap } = flattenMultipleChoice(data, columnTypes);

    // Apply Zod schema validation to confirm flattening integrity
    try {
      const zodValidation = validateFlattenedData(flattenedRows, selectMultipleCols, uniqueChoicesMap);
      if (zodValidation.success) {
        console.log('[Smart Detector/Zod] Flattened dataset succeeded Zod integrity validation.');
      } else {
        console.warn('[Smart Detector/Zod] Zod integrity validation issues detected:', zodValidation.error);
      }
    } catch (err) {
      console.error('[Smart Detector/Zod] Failed while performing validation:', err);
    }

    return { flattenedData: flattenedRows, uniqueChoicesMap };
  }, [data, columnTypes]);

  const handleToggleMultipleChoice = useCallback((column, choice) => {
    setSelectedMultipleChoices(prev => {
      const current = prev[column] || [];
      const updated = current.includes(choice)
        ? current.filter(c => c !== choice)
        : [...current, choice];
      return { ...prev, [column]: updated };
    });
  }, []);

  const handleSelectAllMultipleChoices = useCallback((column) => {
    setSelectedMultipleChoices(prev => {
      const choices = uniqueChoicesMap[column] || [];
      return { ...prev, [column]: [...choices] };
    });
  }, [uniqueChoicesMap]);

  const handleSelectNoneMultipleChoices = useCallback((column) => {
    setSelectedMultipleChoices(prev => {
      return { ...prev, [column]: [] };
    });
  }, []);

  const handleChangeColumnType = useCallback((column, newType) => {
    setColumnTypes(prev => {
      const updated = { ...prev, [column]: newType };
      return updated;
    });

    // Remove from suggestions since it has been resolved manually
    setSuggestedTypes(prev => {
      const updated = { ...prev };
      delete updated[column];
      return updated;
    });

    // If overridden to select_multiple, initialize choices list if not present
    if (newType === 'select_multiple') {
      setSelectedMultipleChoices(prev => {
        if (!prev[column] || prev[column].length === 0) {
          const choices = getUniqueChoices(data, column);
          return { ...prev, [column]: choices };
        }
        return prev;
      });
    } else {
      // Clear choices if we switched away from multiple, ensuring clean state resets
      setSelectedMultipleChoices(prev => {
        const updated = { ...prev };
        delete updated[column];
        return updated;
      });
    }
  }, [data]);

  const handleOpenQuestionSettings = useCallback((col) => {
    setEditingCol(col);
    setEditingTitle(columnAliases[col] || col);
    setEditingType(columnTypes[col] || 'text');
  }, [columnAliases, columnTypes]);

  const handleSaveQuestionSettings = useCallback(() => {
    if (!editingCol) return;
    handleChangeColumnType(editingCol, editingType);
    setColumnAliases(prev => ({
      ...prev,
      [editingCol]: editingTitle.trim() || editingCol
    }));
    setEditingCol(null);
  }, [editingCol, editingType, editingTitle, handleChangeColumnType]);

  // When activeIconTarget is set (from IconFiltering right-click or + button), open the modal
  useEffect(() => {
    if (activeIconTarget !== '') {
      setSelectedLabelForIcon(activeIconTarget);
      setSelectedIconName(getCategoryIconWithPreference(activeIconTarget));
      setShowIconModal(true);
      setIsEditingIcons(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIconTarget]);

  const handleApplyDesignSettings = useCallback((designSettings) => {
    if (!designSettings || !Object.keys(designSettings).length) return;

    setConfig((prev) => {
      const next = { ...prev };
      Object.entries(designSettings).forEach(([key, { value }]) => {
        if (key in next) next[key] = value;
      });
      return next;
    });

    setVisuals((prev) => {
      const next = { ...prev };
      Object.entries(designSettings).forEach(([key, { value }]) => {
        if (key in next) next[key] = value;
      });
      return next;
    });
  }, []);

  useEffect(() => {
    // Do not restore active selections, file name, or previous visual/config settings on reload.
    // This keeps the page fresh after a browser refresh.
    try {
      const storedIcons = localStorage.getItem('meal_custom_icons');
      if (storedIcons) setCustomIcons(JSON.parse(storedIcons));
    } catch (e) { console.error('Failed to load custom icons:', e); }

    try {
      const storedLegend = localStorage.getItem('meal_legend_aliases');
      if (storedLegend) setLegendAliases(JSON.parse(storedLegend));
    } catch (e) { console.error('Failed to load legend aliases:', e); }

    try {
      const storedCols = localStorage.getItem('meal_column_aliases');
      if (storedCols) setColumnAliases(JSON.parse(storedCols));
    } catch (e) { console.error('Failed to load column aliases:', e); }

    try {
      const storedData = localStorage.getItem('meal_data');
      if (storedData) setData(JSON.parse(storedData));
    } catch (e) { console.error('Failed to load data:', e); }

    try {
      const storedColumns = localStorage.getItem('meal_columns');
      if (storedColumns) setColumns(JSON.parse(storedColumns));
    } catch (e) { console.error('Failed to load columns:', e); }

    try {
      const storedTypes = localStorage.getItem('meal_column_types');
      if (storedTypes) setColumnTypes(JSON.parse(storedTypes));
    } catch (e) { console.error('Failed to load column types:', e); }

    try {
      const storedChoices = localStorage.getItem('meal_selected_multiple_choices');
      if (storedChoices) setSelectedMultipleChoices(JSON.parse(storedChoices));
    } catch (e) { console.error('Failed to load multiple choices:', e); }
  }, []);

  useEffect(() => {
    const saveStorageState = () => {
      try {
        if (customIcons && Object.keys(customIcons).length > 0) {
          localStorage.setItem('meal_custom_icons', JSON.stringify(customIcons));
        } else {
          localStorage.removeItem('meal_custom_icons');
        }
      } catch (e) { console.error(e); }

      try {
        if (legendAliases && Object.keys(legendAliases).length > 0) {
          localStorage.setItem('meal_legend_aliases', JSON.stringify(legendAliases));
        } else {
          localStorage.removeItem('meal_legend_aliases');
        }
      } catch (e) { console.error(e); }

      try {
        if (columnAliases && Object.keys(columnAliases).length > 0) {
          localStorage.setItem('meal_column_aliases', JSON.stringify(columnAliases));
        } else {
          localStorage.removeItem('meal_column_aliases');
        }
      } catch (e) { console.error(e); }

      try {
        if (data && data.length > 0) {
          localStorage.setItem('meal_data', JSON.stringify(data));
        } else {
          localStorage.removeItem('meal_data');
        }
      } catch (e) { console.error(e); }

      try {
        if (columns && columns.length > 0) {
          localStorage.setItem('meal_columns', JSON.stringify(columns));
        } else {
          localStorage.removeItem('meal_columns');
        }
      } catch (e) { console.error(e); }

      try {
        if (columnTypes && Object.keys(columnTypes).length > 0) {
          localStorage.setItem('meal_column_types', JSON.stringify(columnTypes));
        } else {
          localStorage.removeItem('meal_column_types');
        }
      } catch (e) { console.error(e); }

      try {
        if (fileName) {
          localStorage.setItem('meal_file_name', fileName);
        } else {
          localStorage.removeItem('meal_file_name');
        }
      } catch (e) { console.error(e); }

      try {
        if (selectedMultipleChoices && Object.keys(selectedMultipleChoices).length > 0) {
          localStorage.setItem('meal_selected_multiple_choices', JSON.stringify(selectedMultipleChoices));
        } else {
          localStorage.removeItem('meal_selected_multiple_choices');
        }
      } catch (e) { console.error(e); }
    };

    if (storageSaveTimeoutRef.current) {
      clearTimeout(storageSaveTimeoutRef.current);
    }
    storageSaveTimeoutRef.current = window.setTimeout(saveStorageState, 400);

    return () => {
      if (storageSaveTimeoutRef.current) {
        clearTimeout(storageSaveTimeoutRef.current);
        saveStorageState();
      }
    };
  }, [customIcons, legendAliases, columnAliases, data, columns, columnTypes, fileName, selectedMultipleChoices]);

  // Live Reactive synchronization across separate tabs / windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (!e.newValue) {
        // Handle removals
        if (e.key === 'meal_custom_icons') setCustomIcons({});
        else if (e.key === 'meal_legend_aliases') setLegendAliases({});
        else if (e.key === 'meal_column_aliases') setColumnAliases({});
        else if (e.key === 'meal_data') setData([]);
        else if (e.key === 'meal_columns') setColumns([]);
        else if (e.key === 'meal_column_types') setColumnTypes({});
        else if (e.key === 'meal_file_name') setFileName('');
        else if (e.key === 'meal_selected_multiple_choices') setSelectedMultipleChoices({});
        return;
      }

      try {
        if (e.key === 'meal_chart_visuals') {
          const val = JSON.parse(e.newValue);
          if (val) setVisuals(val);
        } else if (e.key === 'meal_chart_config') {
          const val = JSON.parse(e.newValue);
          if (val) setConfig(val);
        } else if (e.key === 'meal_custom_icons') {
          const val = JSON.parse(e.newValue);
          if (val) setCustomIcons(val);
        } else if (e.key === 'meal_legend_aliases') {
          const val = JSON.parse(e.newValue);
          if (val) setLegendAliases(val);
        } else if (e.key === 'meal_column_aliases') {
          const val = JSON.parse(e.newValue);
          if (val) setColumnAliases(val);
        } else if (e.key === 'meal_data') {
          const val = JSON.parse(e.newValue);
          if (val) setData(val);
        } else if (e.key === 'meal_columns') {
          const val = JSON.parse(e.newValue);
          if (val) setColumns(val);
        } else if (e.key === 'meal_column_types') {
          const val = JSON.parse(e.newValue);
          if (val) setColumnTypes(val);
        } else if (e.key === 'meal_file_name') {
          setFileName(e.newValue);
        } else if (e.key === 'meal_selected_multiple_choices') {
          const val = JSON.parse(e.newValue);
          if (val) setSelectedMultipleChoices(val);
        } else if (e.key === 'meal_recent_icons') {
          const val = JSON.parse(e.newValue);
          if (val) setRecentIcons(val);
        }
      } catch (err) {
        console.error('Failed to sync storage event:', err);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const mergedConfigVisuals = useMemo(() => ({ ...config, ...visuals }), [config, visuals]);

  const saveStateTimeoutRef = useRef(null);
  const storageSaveTimeoutRef = useRef(null);
  const selectionTimeoutRef = useRef(null);
  const latestSelectionRef = useRef({ selectedProject: '', selectedDesign: '' });

  useEffect(() => {
    latestSelectionRef.current = { selectedProject, selectedDesign };
  }, [selectedProject, selectedDesign]);

  useEffect(() => {
    const saveSelection = () => saveActiveSelection(latestSelectionRef.current);
    const handleBeforeUnload = () => saveSelection();

    if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
    selectionTimeoutRef.current = window.setTimeout(saveSelection, 300);

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
        saveSelection();
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [selectedProject, selectedDesign]);

  useEffect(() => {
    const saveState = () => {
      saveChartConfig(config);
      saveChartVisuals(visuals);
      if (selectedProject && selectedDesign) {
        setDesignSettings(selectedProject, selectedDesign, mergedConfigVisuals);
      }
    };

    if (saveStateTimeoutRef.current) clearTimeout(saveStateTimeoutRef.current);
    saveStateTimeoutRef.current = window.setTimeout(saveState, 300);

    return () => {
      if (saveStateTimeoutRef.current) {
        clearTimeout(saveStateTimeoutRef.current);
        saveState();
      }
    };
  }, [config, visuals, selectedProject, selectedDesign, mergedConfigVisuals]);

  useEffect(() => {
    setPinnedIndices([]);
  }, [data]);

  const resetApp = () => {
    setFilters([]);
    setAdvancedFilters({});
    setCustomIcons({});
    setConfig(defaultConfig);
    setVisuals(defaultVisuals);
    setPinnedIndices([]);
    setAppError('');
  };

  const clearFile = () => {
    setData([]);
    setColumns([]);
    setFileName('');
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet('');
    resetApp();
  };

  const chartRef = useRef(null);
  const stageRef = useRef(null);
  const chartContainerRef = useResizeObserver(() => {
    if (chartRef.current) {
      chartRef.current.resize();
      chartRef.current.update('none');
    }
  });

  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !chartContainerRef.current) return;

      const containerRect = chartContainerRef.current.getBoundingClientRect();
      const newHeight = Math.max(260, Math.min(1500, e.clientY - containerRect.top));

      setVisuals((prev) => ({
        ...prev,
        chartHeight: Math.round(newHeight),
      }));

      // Force synchronous layout, clean slate and high-fidelity redraw of Chart.js
      // This immediately scales columns, gridlines, percentages and interactive icons without any lag or pixelation.
      if (chartRef.current) {
        chartRef.current.resize();
        chartRef.current.update('none');
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, chartContainerRef]);

  const handleError = useCallback((message) => {
    setAppError(message);
    window.setTimeout(() => setAppError(''), 5000);
  }, []);

  const processData = useCallback(
    (rows, name = 'Data Source') => {
      if (!Array.isArray(rows) || rows.length === 0) {
        handleError('The uploaded file is empty or contains unsupported data.');
        return;
      }

      const rawCols = Object.keys(rows[0]);

      const isBooleanLikeValue = (value) => {
        if (value === undefined || value === null || value === '') return true;
        const normalized = String(value).trim().toLowerCase();
        return normalized === '0' || normalized === '1' || normalized === 'true' || normalized === 'false';
      };

      // 1. Identify Kobo-style multi-select groups (QuestionName/OptionName)
      const koboGroups = {};
      rawCols.forEach(col => {
        if (col.includes('/')) {
          const parts = col.split('/');
          const questionName = parts[0].trim();
          if (questionName) {
            koboGroups[questionName] = koboGroups[questionName] || [];
            koboGroups[questionName].push(col);
          }
        }
      });

      // 2. Pre-check raw columns for binary candidate status in a single pass.
      const binaryCandidateCols = rawCols.filter(col => !col.includes('/'));
      const binaryValidity = Object.fromEntries(binaryCandidateCols.map(col => [col, true]));
      const binaryHasData = Object.fromEntries(binaryCandidateCols.map(col => [col, false]));

      for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        const row = rows[rowIndex];
        for (let colIndex = 0; colIndex < binaryCandidateCols.length; colIndex += 1) {
          const col = binaryCandidateCols[colIndex];
          if (!binaryValidity[col]) continue;

          const val = row[col];
          if (val !== undefined && val !== null && val !== '') {
            binaryHasData[col] = true;
            if (!isBooleanLikeValue(val)) {
              binaryValidity[col] = false;
            }
          }
        }
      }

      const binaryGroups = [];
      let tempGroup = [];
      rawCols.forEach(col => {
        if (col.includes('/')) {
          if (tempGroup.length >= 2) {
            binaryGroups.push([...tempGroup]);
          }
          tempGroup = [];
        } else {
          if (binaryValidity[col] && binaryHasData[col]) {
            tempGroup.push(col);
          } else {
            if (tempGroup.length >= 2) {
              binaryGroups.push([...tempGroup]);
            }
            tempGroup = [];
          }
        }
      });
      if (tempGroup.length >= 2) {
        binaryGroups.push([...tempGroup]);
      }

      // Map binary parent column names to their children
      const binaryGroupsMap = {};
      const binaryChildToParent = {};
      binaryGroups.forEach(groupList => {
        const parentName = `Group: ${groupList.join(', ')}`;
        binaryGroupsMap[parentName] = groupList;
        groupList.forEach((child) => {
          binaryChildToParent[child] = parentName;
        });
      });

      // Group and build final columns list (excluding child columns)
      const cols = [];
      const binaryChildrenSet = new Set(Object.keys(binaryChildToParent));

      rawCols.forEach(col => {
        if (col.includes('/')) {
          const parts = col.split('/');
          const questionName = parts[0].trim();
          if (questionName && !cols.includes(questionName)) {
            cols.push(questionName);
          }
        } else if (binaryChildrenSet.has(col)) {
          const parentName = binaryChildToParent[col];
          if (parentName && !cols.includes(parentName)) {
            cols.push(parentName);
          }
        } else {
          cols.push(col);
        }
      });

      // Synthesize parent fields on rows so options represent standard text
      // if type remains 'text' instead of 'select_multiple'
      const synthesizedRows = rows.map(row => {
        const newRow = { ...row };

        // Process Kobo groups
        Object.entries(koboGroups).forEach(([parentCol, children]) => {
          const activeOptions = [];
          children.forEach(childCol => {
            const parts = childCol.split('/');
            const optionName = parts.slice(1).join('/');
            const val = row[childCol];
            const isSelected = val == 1 || val === '1' || val === true || String(val).toLowerCase() === 'true' || String(val).trim() === optionName;
            if (isSelected) {
              activeOptions.push(optionName);
            }
          });
          newRow[parentCol] = activeOptions.join(', ');
        });

        // Process Binary groups
        Object.entries(binaryGroupsMap).forEach(([parentCol, children]) => {
          const activeOptions = [];
          children.forEach(childCol => {
            const optionName = childCol.trim();
            const val = row[childCol];
            const isSelected = val == 1 || val === '1' || val === true || String(val).toLowerCase() === 'true' || String(val).trim() === optionName;
            
            // Map the child's value at parentCol/childCol so getUniqueChoices and flattenMultipleChoice can find it
            newRow[`${parentCol}/${optionName}`] = val;

            if (isSelected) {
              activeOptions.push(optionName);
            }
          });
          newRow[parentCol] = activeOptions.join(', ');
        });

        return newRow;
      });

      // Smart Column Detector
      const detectedTypes = {};
      const suggestions = {};
      cols.forEach(col => {
        if (koboGroups[col] || binaryGroupsMap[col]) {
          // Any Kobo or Binary grouped columns are automatically set and recommended as 'select_multiple'
          detectedTypes[col] = 'select_multiple';
          suggestions[col] = 'select_multiple';
        } else {
          const columnData = synthesizedRows.map(r => r[col]);
          const detected = detectColumnType(columnData);
          if (detected === 'select_multiple') {
            suggestions[col] = 'select_multiple';
            // Default to 'text' instead of applying select_multiple automatically
            detectedTypes[col] = 'text';
          } else {
            detectedTypes[col] = detected;
          }
        }
      });

      setColumnTypes(detectedTypes);
      setSuggestedTypes(suggestions);

      // Auto-initialize selectedMultipleChoices with all choices pre-selected
      const initialChoices = {};
      Object.entries(detectedTypes).forEach(([col, type]) => {
        if (type === 'select_multiple') {
          initialChoices[col] = getUniqueChoices(synthesizedRows, col);
        }
      });
      setSelectedMultipleChoices(initialChoices);

      setData(synthesizedRows);
      setColumns(cols);
      setFileName(name);
      // Don't auto-select axes — user must choose columns manually
      setConfig((prev) => ({ ...prev, xAxis: '', yAxis: '', groupBy: '' }));
    },
    [handleError]
  );

  const loadSheet = useCallback(
    (loadedWorkbook, sheetName, name) => {
      if (!loadedWorkbook || !sheetName) return;
      const sheet = loadedWorkbook.Sheets[sheetName];
      if (!sheet) {
        handleError('Selected sheet could not be found.');
        return;
      }

      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (!Array.isArray(rows) || rows.length === 0) {
        handleError('The selected sheet is empty or invalid.');
        return;
      }

      processData(rows, `${name} — ${sheetName}`);
      setSelectedSheet(sheetName);
    },
    [handleError, processData]
  );

  const loadFile = useCallback(async (file) => {
    if (!file) return;
    setIsBusy(true);

    try {
      const parsed = await parseExcelFile(file);
      setWorkbook(parsed.workbook);
      setSheetNames(parsed.sheetNames);
      setFileName(file.name);

      if (parsed.sheetNames.length > 0) {
        setSelectedSheet(parsed.sheetNames[0]);
        loadSheet(parsed.workbook, parsed.sheetNames[0], file.name);
      }
    } catch (error) {
      handleError(error?.message || 'Failed to load the file.');
    } finally {
      setIsBusy(false);
    }
  }, [handleError, loadSheet]);

  const availableIconNames = useMemo(
    () => iconMappings.map((item) => item.icon),
    []
  );

  const getCategoryIconWithPreference = useCallback(
    (label) => {
      const alias = legendAliases[label] || label;
      const normalizedAlias = String(alias).toLowerCase();
      const normalizedLabel = String(label).toLowerCase();
      if (customIcons[normalizedAlias]) return customIcons[normalizedAlias];
      if (customIcons[normalizedLabel]) return customIcons[normalizedLabel];
      return getCategoryIcon(alias);
    },
    [customIcons, legendAliases]
  );

  const iconOptions = useMemo(
    () => iconMappings.map((item) => ({ icon: item.icon, label: item.label })),
    []
  );

  useEffect(() => {
    if (!data.length || !config.xAxis) {
      setFilters([]);
      return;
    }
    const isMultiple = columnTypes[config.xAxis] === 'select_multiple';
    const labels = isMultiple
      ? (selectedMultipleChoices[config.xAxis] || uniqueChoicesMap[config.xAxis] || [])
      : [...new Set(data.map((row) => String(row[config.xAxis] ?? 'Undefined')))].sort();

    setFilters((prev) => labels.map((label) => {
      const existing = prev.find((item) => item.label === label);
      return {
        label,
        visible: existing ? existing.visible : true
      };
    }));
  }, [data, config.xAxis, columnTypes, selectedMultipleChoices, uniqueChoicesMap]);

  const toggleFilterVisibility = useCallback((label) => {
    setFilters((prev) => prev.map((item) => item.label === label ? { ...item, visible: !item.visible } : item));
  }, []);

  const toggleAdvancedFilterValue = useCallback((column, value, clear = false) => {
    setAdvancedFilters((prev) => {
      if (clear) {
        const next = { ...prev };
        delete next[column];
        return next;
      }
      const colFilter = prev[column] || { excluded: [] };
      const isExcluded = colFilter.excluded.includes(value);
      const newExcluded = isExcluded
        ? colFilter.excluded.filter((v) => v !== value)
        : [...colFilter.excluded, value];
      return { ...prev, [column]: { excluded: newExcluded } };
    });
  }, []);

  const handleUploadIconImage = useCallback((file, label) => {
    if (!file || label === undefined || label === null) return;

    const isSvg = file.type.includes('svg') || file.name.toLowerCase().endsWith('.svg');
    if (!isSvg) {
      setIconUploadError('Invalid file type. Only SVG files are supported.');
      return;
    }

    if (file.size > 50 * 1024) {
      setIconUploadError('File is too large. Custom SVG icons must be under 50KB.');
      return;
    }

    setIconUploadError('');
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      if (typeof base64 === 'string') {
        setSelectedIconName(base64);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const filteredIconSuggestions = useMemo(() => {
    return searchIcons(selectedIconName, iconLibrary);
  }, [selectedIconName, iconLibrary]);

  const aggregatedResults = useMemo(() => {
    if (!flattenedData || !flattenedData.length || !config.xAxis || !config.yAxis) return null;

    const isXMultiple = columnTypes[config.xAxis] === 'select_multiple';
    const isGroupMultiple = config.groupBy && columnTypes[config.groupBy] === 'select_multiple';

    const allLabels = isXMultiple
      ? (selectedMultipleChoices[config.xAxis] || uniqueChoicesMap[config.xAxis] || [])
      : [...new Set(flattenedData.map((row) => String(row[config.xAxis] ?? 'Undefined')))].sort();

    const visibleLabels = filters.length > 0
      ? allLabels.filter((label) => filters.some((item) => item.label === label && item.visible))
      : allLabels;

    const visibleSet = new Set(visibleLabels);
    const groups = {};
    let filteredCount = 0;

    flattenedData.forEach((row) => {
      // Apply advanced filters first
      const isExcluded = Object.entries(advancedFilters).some(([col, filter]) => {
        const val = String(row[col] ?? '');
        return filter.excluded?.includes(val);
      });
      if (isExcluded) return;

      // Filter based on select_multiple choices. If a row has records, it must match 
      // at least one chosen multiple choice option of any active select_multiple column
      let matchesAllSelectMultipleFilters = true;
      Object.entries(selectedMultipleChoices).forEach(([col, activeChoices]) => {
        if ((col === config.xAxis || col === config.groupBy) && columnTypes[col] === 'select_multiple' && activeChoices) {
          const allColChoices = uniqueChoicesMap[col] || [];
          if (allColChoices.length > 0) {
            const hasMatch = activeChoices.some(choice => row[`${col}__${choice}`] === 1);
            if (!hasMatch) {
              matchesAllSelectMultipleFilters = false;
            }
          }
        }
      });
      if (!matchesAllSelectMultipleFilters) return;

      filteredCount++;

      // X Options
      const activeXSel = selectedMultipleChoices[config.xAxis];
      const targetChoices = isXMultiple
        ? (activeXSel !== undefined ? activeXSel : (uniqueChoicesMap[config.xAxis] || [])).filter(choice => row[`${config.xAxis}__${choice}`] === 1)
        : [String(row[config.xAxis] ?? 'Undefined')];

      // Group Options
      const activeGroupSel = selectedMultipleChoices[config.groupBy];
      const targetGroups = isGroupMultiple
        ? (activeGroupSel !== undefined ? activeGroupSel : (uniqueChoicesMap[config.groupBy] || [])).filter(choice => row[`${config.groupBy}__${choice}`] === 1)
        : [config.groupBy ? String(row[config.groupBy] ?? 'Total') : 'Primary'];

      targetGroups.forEach((groupKey) => {
        targetChoices.forEach((x) => {
          if (filters.length > 0 && !visibleSet.has(x)) return;
          const value = parseFloat(row[config.yAxis]);

          groups[groupKey] ??= {};
          groups[groupKey][x] ??= [];

          if (!Number.isNaN(value)) {
            groups[groupKey][x].push(value);
          } else if (['count', 'unique'].includes(config.aggFunc)) {
            groups[groupKey][x].push(row[config.yAxis]);
          }
        });
      });
    });

    const labels = visibleLabels.map(l => legendAliases[l] || l);

    const rawDatasets = Object.keys(groups).map((groupName) => {
      const chartData = visibleLabels.map((originalLabel) => {
        const values = groups[groupName][originalLabel] || [];
        if (values.length === 0) return 0;

        switch (config.aggFunc) {
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
          default:
            return values.reduce((sum, item) => sum + (typeof item === 'number' ? item : 0), 0);
        }
      });
      return { groupName, chartData };
    });

    const rawTotal = rawDatasets.reduce(
      (sum, dataset) => sum + dataset.chartData.reduce((inner, value) => inner + Number(value || 0), 0),
      0
    );

    const datasets = rawDatasets.map((dataset, datasetIndex) => {
      const palette = [
        visuals.primaryColor,
        visuals.secondaryColor,
        visuals.tertiaryColor,
        visuals.quaternaryColor,
        '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'
      ];

      let baseColor;
      if (visuals.colorMode === 'single') {
        baseColor = visuals.primaryColor;
      } else if (visuals.colorMode === 'dual') {
        baseColor = datasetIndex % 2 === 0 ? visuals.primaryColor : visuals.secondaryColor;
      } else {
        baseColor = palette[datasetIndex % palette.length];
      }

      const alpha = Math.round(visuals.opacity * 255).toString(16).padStart(2, '0');
      const displayData = config.showPercentage
        ? dataset.chartData.map((value) => (rawTotal === 0 ? 0 : (Number(value) / rawTotal) * 100))
        : dataset.chartData;

      const resolveColor = (labelIndex) => {
        const originalLabel = visibleLabels[labelIndex];
        const aliasLabel = labels[labelIndex];
        const overrideColor = visuals.labelColorMap[aliasLabel] || visuals.labelColorMap[originalLabel];
        if (overrideColor) return overrideColor;

        if (!config.groupBy) {
          if (visuals.colorMode === 'dual') {
            return labelIndex % 2 === 0 ? visuals.primaryColor : visuals.secondaryColor;
          }
          if (visuals.colorMode === 'multi') {
            return palette[labelIndex % palette.length];
          }
        }

        return baseColor;
      };

      const backgroundColor = dataset.chartData.map((_, index) => {
        const color = resolveColor(index);
        return config.groupBy ? `${baseColor}${alpha}` : `${color}${alpha}`;
      });
      const borderColor = dataset.chartData.map((_, index) => {
        const color = resolveColor(index);
        return config.groupBy ? baseColor : color;
      });

      return {
        groupName: dataset.groupName,
        label: config.groupBy ? (legendAliases[dataset.groupName] || dataset.groupName) : config.xAxis,
        data: displayData,
        rawData: dataset.chartData,
        originalLabels: visibleLabels,
        backgroundColor,
        borderColor,
        borderWidth: visuals.borderWidth,
        fill: config.chartType === 'radar' ? (visuals.fill !== false) : ['area', 'smoothArea'].includes(config.chartType),
        tension: ['spline', 'smoothArea'].includes(config.chartType) ? Math.max(0.35, visuals.tension || 0.4) : visuals.tension,
        borderRadius: ['bar', 'horizontalBar', 'stackedBar', 'stackedHorizontalBar'].includes(config.chartType) ? Math.floor(visuals.tension * 40) : 0,
        pointBackgroundColor: borderColor,
        pointRadius: config.chartType === 'scatter' ? (visuals.scatterPointRadius ?? 8) : (['bar', 'horizontalBar', 'stackedBar', 'stackedHorizontalBar'].includes(config.chartType) ? 0 : 4),
        stepped: config.chartType === 'steppedLine',
        showLine: config.chartType !== 'scatter',
        rotation: config.chartType === 'semiDoughnut' ? -90 : undefined,
        circumference: config.chartType === 'semiDoughnut' ? 180 : undefined,
        cutout: ['doughnut', 'semiDoughnut'].includes(config.chartType) ? `${visuals.cutout ?? 50}%` : undefined
      };
    });

    const finalDatasets = [];
    datasets.forEach((dataset, datasetIndex) => {
      if (config.chartType === 'combo' && !config.groupBy) {
        finalDatasets.push({
          ...dataset,
          type: 'bar',
          label: `${dataset.label} (Volume)`,
        });
        finalDatasets.push({
          ...dataset,
          type: 'line',
          label: `${dataset.label} (Trend)`,
          borderColor: visuals.secondaryColor || '#f43f5e',
          backgroundColor: `${visuals.secondaryColor || '#f43f5e'}1A`,
          fill: false,
          pointRadius: 6,
          borderWidth: visuals.comboLineWidth ?? 3,
          pointBackgroundColor: visuals.secondaryColor || '#f43f5e',
          tension: visuals.tension
        });
      } else if (config.chartType === 'combo' && config.groupBy) {
        finalDatasets.push({
          ...dataset,
          type: datasetIndex % 2 === 0 ? 'bar' : 'line',
          borderColor: datasetIndex % 2 === 0 ? dataset.borderColor : (visuals.secondaryColor || '#f43f5e'),
          pointRadius: datasetIndex % 2 === 0 ? 0 : 6,
          borderWidth: datasetIndex % 2 === 0 ? visuals.borderWidth : (visuals.comboLineWidth ?? 3),
          tension: visuals.tension
        });
      } else {
        finalDatasets.push(dataset);
      }
    });

    return { labels: labels, originalLabels: visibleLabels, datasets: finalDatasets, rawTotal, filteredCount };
  }, [flattenedData, config, visuals, filters, advancedFilters, legendAliases, columnTypes, selectedMultipleChoices, uniqueChoicesMap]);

  const chartData = useMemo(() => {
    if (!aggregatedResults) return { labels: [], datasets: [] };
    return {
      labels: aggregatedResults.labels,
      datasets: aggregatedResults.datasets
    };
  }, [aggregatedResults]);

  const isHorizontal = useMemo(() => {
    if (['horizontalBar', 'stackedHorizontalBar'].includes(config.chartType)) return true;
    if (!['bar', 'stackedBar', 'line', 'spline', 'steppedLine', 'area', 'smoothArea', 'scatter', 'combo'].includes(config.chartType)) return false;
    return visuals.chartOrientation === 'h';
  }, [config.chartType, visuals.chartOrientation]);

  const rawTotal = aggregatedResults?.rawTotal ?? 0;

  const hasEmptyMultipleSelection = useMemo(() => {
    const isXMultiple = columnTypes[config.xAxis] === 'select_multiple';
    const isYMultiple = columnTypes[config.yAxis] === 'select_multiple';
    const isGroupMultiple = config.groupBy && columnTypes[config.groupBy] === 'select_multiple';

    return (
      (isXMultiple && (!selectedMultipleChoices[config.xAxis] || selectedMultipleChoices[config.xAxis].length === 0)) ||
      (isYMultiple && (!selectedMultipleChoices[config.yAxis] || selectedMultipleChoices[config.yAxis].length === 0)) ||
      (isGroupMultiple && (!selectedMultipleChoices[config.groupBy] || selectedMultipleChoices[config.groupBy].length === 0))
    );
  }, [columnTypes, config.xAxis, config.yAxis, config.groupBy, selectedMultipleChoices]);

  const chartOptions = useMemo(() => {
    const opts = buildChartOptions(config, visuals, rawTotal, chartData?.labels, filters);

    // Override x and y axis titles with custom column/question aliases if available
    const isHorizontal = visuals.chartOrientation === 'h';
    const xOriginal = isHorizontal ? config.yAxis : config.xAxis;
    const yOriginal = isHorizontal ? config.xAxis : config.yAxis;

    if (opts.scales && opts.scales.x && opts.scales.x.title) {
      if (opts.scales.x.title.text === xOriginal) {
        opts.scales.x.title.text = columnAliases[xOriginal] || xOriginal;
      }
    }
    if (opts.scales && opts.scales.y && opts.scales.y.title) {
      if (opts.scales.y.title.text === yOriginal) {
        opts.scales.y.title.text = columnAliases[yOriginal] || yOriginal;
      }
    }

    // Native legend onClick: toggle visibility for both grouped and non-grouped modes
    opts.plugins.legend.onClick = (e, legendItem, legend) => {
      const nativeEvent = e.native;
      const originalLabel = aggregatedResults?.originalLabels?.[legendItem.index];

      setEditingLegend({
        label: legendItem.text,
        originalLabel: config.groupBy ? legendItem.text : originalLabel,
        x: nativeEvent.clientX,
        y: nativeEvent.clientY,
        index: legendItem.datasetIndex,
        isGroup: !!config.groupBy
      });
    };

    // Track click on elements to toggle tooltip pinning
    opts.onClick = (e, elements) => {
      if (visuals.tooltipMode === 'click' && elements && elements.length > 0) {
        const clickMeta = elements[0];
        const idx = clickMeta.index;
        if (idx !== undefined) {
          setPinnedIndices((prev) => 
            prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
          );
        }
      }
    };

    return opts;
  }, [config, visuals, rawTotal, chartData?.labels, filters, aggregatedResults, toggleFilterVisibility, columnAliases]);

  const shadowPlugin = useMemo(
    () => ({
      id: 'shadow',
      beforeDraw: (chart) => {
        if (!visuals.shadow) return;
        const ctx = chart.ctx;
        ctx.save();
        ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;
      },
      afterDraw: (chart) => {
        if (!visuals.shadow) return;
        chart.ctx.restore();
      }
    }),
    [visuals.shadow]
  );

  const trendlinePlugin = useMemo(
    () => ({
      id: 'trendline',
      afterDatasetsDraw: (chart) => {
        if ((!config.showTrendline && !config.showRawPath) || ['pie', 'doughnut', 'semiDoughnut', 'radar', 'polarArea'].includes(config.chartType)) return;

        const xScale = chart.scales?.x;
        const yScale = chart.scales?.y;
        if (!xScale || !yScale) return;

        const values = chart.data.labels.map((_, index) => {
          const sum = chart.data.datasets.reduce((s, dataset, dsIdx) => {
            if (!chart.isDatasetVisible(dsIdx)) return s;
            const rawValue = dataset.rawData?.[index] ?? dataset.data?.[index] ?? 0;
            return s + (Number(rawValue) || 0);
          }, 0);
          return sum;
        });

        const points = values
          .map((value, index) => {
            const numericValue = config.showPercentage ? (rawTotal === 0 ? 0 : (Number(value) / rawTotal) * 100) : Number(value);
            return {
              x: index,
              y: numericValue,
              px: isHorizontal ? xScale.getPixelForValue(numericValue) : xScale.getPixelForValue(index),
              py: isHorizontal ? yScale.getPixelForValue(index) : yScale.getPixelForValue(numericValue)
            };
          })
          .filter((p) => Number.isFinite(p.px) && Number.isFinite(p.py));

        if (points.length < 2) return;

        // Option 1: Draw raw path dashed line
        if (config.showRawPath) {
          const ctx = chart.ctx;
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([6, 3]);
          ctx.lineWidth = Math.max(2.5, visuals.borderWidth || 2.5);
          ctx.strokeStyle = '#f43f5e'; // Pinkish-red for raw path
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(0,0,0,0.05)';
          ctx.globalCompositeOperation = 'source-over';

          points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.px, p.py);
            else ctx.lineTo(p.px, p.py);
          });

          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        // Option 2: Draw linear regression straight line
        if (config.showTrendline) {
          const n = points.length;
          let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

          points.forEach((p, i) => {
            const xVal = i;
            const yVal = p.y;
            sumX += xVal;
            sumY += yVal;
            sumXY += xVal * yVal;
            sumXX += xVal * xVal;
          });

          const denom = (n * sumXX - sumX * sumX);
          if (Math.abs(denom) >= 0.0001) {
            const slope = (n * sumXY - sumX * sumY) / denom;
            const intercept = (sumY - slope * sumX) / n;

            const yStart = intercept;
            const yEnd = slope * (points.length - 1) + intercept;

            const px0 = isHorizontal ? xScale.getPixelForValue(yStart) : xScale.getPixelForValue(0);
            const py0 = isHorizontal ? yScale.getPixelForValue(0) : yScale.getPixelForValue(yStart);

            const pxN = isHorizontal ? xScale.getPixelForValue(yEnd) : xScale.getPixelForValue(points.length - 1);
            const pyN = isHorizontal ? yScale.getPixelForValue(points.length - 1) : yScale.getPixelForValue(yEnd);

            const ctx = chart.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([8, 4]);
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#10b981'; // Emerald green for linear regression
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(0,0,0,0.1)';

            ctx.moveTo(px0, py0);
            ctx.lineTo(pxN, pyN);

            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }),
    [config.showTrendline, config.showRawPath, config.chartType, config.showPercentage, isHorizontal, rawTotal]
  );

  const [chartArea, setChartArea] = useState(null);
  const [categoryPositions, setCategoryPositions] = useState([]);

  const getCategoryColor = (labelIndex) => {
    if (chartData?.datasets && chartData.datasets.length > 0) {
      const ds = chartData.datasets[0];
      if (ds.borderColor) {
        if (Array.isArray(ds.borderColor)) {
          return ds.borderColor[labelIndex] || ds.borderColor[0] || '#6366f1';
        }
        return ds.borderColor || '#6366f1';
      }
    }
    return '#6366f1';
  };

  // Plugin to catch chart area and category positions for alignment
  const alignmentPlugin = useMemo(() => ({
    id: 'alignment',
    afterLayout: (chart) => {
      const newArea = chart.chartArea;
      if (newArea) {
        setChartArea((prev) => {
          if (prev && 
              prev.left === newArea.left && 
              prev.top === newArea.top && 
              prev.right === newArea.right && 
              prev.bottom === newArea.bottom && 
              prev.width === newArea.width && 
              prev.height === newArea.height) {
            return prev;
          }
          return {
            left: newArea.left,
            top: newArea.top,
            right: newArea.right,
            bottom: newArea.bottom,
            width: newArea.width,
            height: newArea.height
          };
        });
      }

      const scale = isHorizontal ? chart.scales.y : chart.scales.x;
      if (scale && chart.data.labels) {
        const positions = chart.data.labels.map((_, i) => scale.getPixelForValue(i));
        setCategoryPositions((prev) => {
          if (prev && prev.length === positions.length && prev.every((v, i) => Math.abs(v - positions[i]) < 0.1)) {
            return prev;
          }
          return positions;
        });
      }
    }
  }), [isHorizontal]);

  // Custom high-fidelity Pinned Tooltips draw engine
  const pinnedTooltipsPlugin = useMemo(() => ({
    id: 'pinnedTooltips',
    afterDraw: (chart) => {
      const mode = visuals.tooltipMode || 'hover';
      if (mode === 'hover') return;

      const ctx = chart.ctx;
      const labelsCount = chart.data.labels?.length || 0;
      if (labelsCount === 0) return;

      const datasetsCount = chart.data.datasets.length;
      if (datasetsCount === 0) return;

      let indicesToDraw = [];

      if (mode === 'click') {
        indicesToDraw = pinnedIndices.filter((idx) => idx >= 0 && idx < labelsCount);
      } else if (mode === 'peak') {
        let maxVal = -1;
        let maxIndex = 0;
        for (let idx = 0; idx < labelsCount; idx++) {
          let sum = 0;
          for (let ds = 0; ds < datasetsCount; ds++) {
            if (chart.isDatasetVisible(ds)) {
              const dataVal = chart.data.datasets[ds].data?.[idx] ?? 0;
              sum += Math.abs(Number(dataVal)) || 0;
            }
          }
          if (sum > maxVal) {
            maxVal = sum;
            maxIndex = idx;
          }
        }
        if (maxVal >= 0) {
          indicesToDraw = [maxIndex];
        }
      } else if (mode === 'all') {
        for (let idx = 0; idx < labelsCount; idx++) {
          indicesToDraw.push(idx);
        }
      }

      const drawRoundedRect = (ctx, x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };

      const scalingRatio = Math.max(0.4, (visuals.chartHeight || 600) / 600);

      indicesToDraw.forEach((index) => {
        const elements = [];
        for (let ds = 0; ds < datasetsCount; ds++) {
          if (chart.isDatasetVisible(ds)) {
            const meta = chart.getDatasetMeta(ds);
            const el = meta.data[index];
            if (el) {
              elements.push(el);
            }
          }
        }

        if (elements.length === 0) return;

        let topEl = elements[0];
        let minY = topEl.y;
        elements.forEach((el) => {
          if (el.y < minY) {
            minY = el.y;
            topEl = el;
          }
        });

        const pos = typeof topEl.tooltipPosition === 'function' ? topEl.tooltipPosition() : { x: topEl.x, y: topEl.y };
        const targetX = pos.x;
        const targetY = pos.y;

        if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) return;

        const label = chart.data.labels[index] || '';
        let rawValueSum = 0;
        for (let ds = 0; ds < datasetsCount; ds++) {
          if (chart.isDatasetVisible(ds)) {
            const val = chart.data.datasets[ds].rawData?.[index] ?? chart.data.datasets[ds].data?.[index] ?? 0;
            rawValueSum += Number(val) || 0;
          }
        }

        const numberFormatter = (val) => {
          const num = Number(val);
          if (Number.isNaN(num)) return val;
          if (config.numberFormat === 'compact') {
            return new Intl.NumberFormat('en-US', {
              notation: 'compact',
              maximumFractionDigits: 1
            }).format(num);
          }
          return new Intl.NumberFormat('en-US').format(num);
        };

        const pct = rawTotal === 0 ? 0 : ((rawValueSum / rawTotal) * 100).toFixed(1);
        const valueStr = config.showPercentage
          ? `${pct}% (${numberFormatter(rawValueSum)})`
          : numberFormatter(rawValueSum);

        let shortLabel = String(label);
        if (shortLabel.length > 15) {
          shortLabel = shortLabel.slice(0, 12) + '...';
        }
        const tooltipText = `${shortLabel}: ${valueStr}`;

        ctx.save();
        ctx.font = `bold ${Math.round(10 * scalingRatio)}px Inter, system-ui, sans-serif`;
        const textWidth = ctx.measureText(tooltipText).width;

        const rectWidth = textWidth + 14 * scalingRatio;
        const rectHeight = 22 * scalingRatio;
        const rectX = targetX - rectWidth / 2;
        const rectY = targetY - rectHeight - 8 * scalingRatio;

        const leftBound = chart.chartArea ? chart.chartArea.left : 10;
        const rightBound = chart.chartArea ? chart.chartArea.right : chart.width - 10;
        const clampedRectX = Math.max(leftBound + 5, Math.min(rightBound - rectWidth - 5, rectX));

        ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
        ctx.shadowBlur = 8 * scalingRatio;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4 * scalingRatio;

        ctx.fillStyle = '#6366f1';

        drawRoundedRect(ctx, clampedRectX, rectY, rectWidth, rectHeight, 6 * scalingRatio);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1 * scalingRatio;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(targetX - 5 * scalingRatio, rectY + rectHeight);
        ctx.lineTo(targetX + 5 * scalingRatio, rectY + rectHeight);
        ctx.lineTo(targetX, rectY + rectHeight + 5 * scalingRatio);
        ctx.closePath();
        ctx.fillStyle = '#6366f1';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(targetX - 5 * scalingRatio, rectY + rectHeight);
        ctx.lineTo(targetX, rectY + rectHeight + 5 * scalingRatio);
        ctx.lineTo(targetX + 5 * scalingRatio, rectY + rectHeight);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tooltipText, clampedRectX + rectWidth / 2, rectY + rectHeight / 2);

        ctx.restore();
      });
    }
  }), [visuals.tooltipMode, pinnedIndices, config.numberFormat, config.showPercentage, rawTotal, visuals.chartHeight]);

  const chartPlugins = useMemo(() => [shadowPlugin, trendlinePlugin, alignmentPlugin, pinnedTooltipsPlugin], [shadowPlugin, trendlinePlugin, alignmentPlugin, pinnedTooltipsPlugin]);

  // Native Chart.js legend is now used (configured in chartOptions).
  // Rename functionality is available in the sidebar IconFiltering panel.

  const exportPNG = useCallback(async () => {
    setIsBusy(true);
    setIsExportingImage(true);

    const projClean = (selectedProject || 'MEAL').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const chartTypeClean = (config.chartType || 'Chart').trim();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${projClean}_${chartTypeClean}_${timestamp}.png`;

    // Mode 1: With Icons (html2canvas capture with safe styling & visible outlines of drawing panel)
    if (visuals.showIcons) {
      if (!stageRef.current) {
        setIsBusy(false);
        setIsExportingImage(false);
        return;
      }
      const el = stageRef.current;
      
      const originalPadding = el.style.padding;
      const originalBg = el.style.backgroundColor;
      const originalOverflow = el.style.overflow;

      try {
        el.style.padding = '40px';
        el.style.backgroundColor = '#ffffff';
        el.style.overflow = 'visible';

        const canvas = await html2canvas(el, {
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: false,
          imageTimeout: 15000,
          scale: 3, // Super-crisp 3x scaling for high-DPI outputs in reports/presentation
          logging: false,
          onclone: (clonedDoc) => {
            const icons = clonedDoc.querySelectorAll('svg');
            icons.forEach(svg => {
              svg.style.visibility = 'visible';
            });
            const container = clonedDoc.querySelector('.stage-area');
            if (container) {
              container.style.height = 'auto';
              container.style.minHeight = 'none';
              container.style.maxHeight = 'none';
              container.style.padding = '40px';
              container.style.backgroundColor = '#ffffff';
              container.style.overflow = 'visible'; // Ensure beautiful dynamic badge outlines are not trimmed
            }
          }
        });

        const imageUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = filename;
        link.href = imageUrl;
        link.click();
      } catch (error) {
        console.error('Export PNG failed:', error);
        handleError('Failed to export PNG. Please try again.');
      } finally {
        el.style.padding = originalPadding;
        el.style.backgroundColor = originalBg;
        el.style.overflow = originalOverflow;
        setIsBusy(false);
        setIsExportingImage(false);
      }
    } else {
      // Mode 2: Without Icons (Direct native Chart.js canvas export, instant & pixel-perfect)
      try {
        const chart = chartRef.current;
        if (!chart) {
          throw new Error('Chart reference is not available');
        }
        
        const imageUrl = chart.toBase64Image ? chart.toBase64Image() : (chart.canvas ? chart.canvas.toDataURL('image/png') : null);
        if (!imageUrl) {
          throw new Error('Could not generate image from chart canvas');
        }

        const link = document.createElement('a');
        link.download = filename;
        link.href = imageUrl;
        link.click();
      } catch (error) {
        console.error('Direct Canvas Export failed:', error);
        handleError('Failed to export PNG directly from canvas. Please try again.');
      } finally {
        setIsBusy(false);
        setIsExportingImage(false);
      }
    }
  }, [stageRef, chartRef, handleError, visuals.showIcons, selectedProject, config.chartType]);

  const exportChartDataExcel = useCallback(() => {
    if (!aggregatedResults || !aggregatedResults.labels || !aggregatedResults.labels.length) {
      handleError('No aggregated data available to export.');
      return;
    }

    try {
      const projClean = (selectedProject || 'MEAL').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${projClean}_chart_analytics_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;

      const header = [config.xAxis || 'Category'];
      aggregatedResults.datasets.forEach((ds) => {
        header.push(ds.groupName || config.yAxis || 'Value');
      });

      const rows = aggregatedResults.labels.map((label, idx) => {
        const rowObj = { [header[0]]: label };
        aggregatedResults.datasets.forEach((ds) => {
          rowObj[ds.groupName || config.yAxis || 'Value'] = ds.rawData[idx] ?? ds.data[idx] ?? 0;
        });
        return rowObj;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Chart Analytics');
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Code export Excel failed:', error);
      handleError('Failed to export data to Excel.');
    }
  }, [aggregatedResults, selectedProject, config.xAxis, config.yAxis, handleError]);

  const exportChartDataCSV = useCallback(() => {
    if (!aggregatedResults || !aggregatedResults.labels || !aggregatedResults.labels.length) {
      handleError('No aggregated data available to export.');
      return;
    }

    try {
      const projClean = (selectedProject || 'MEAL').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${projClean}_chart_analytics_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;

      const header = [config.xAxis || 'Category'];
      aggregatedResults.datasets.forEach((ds) => {
        header.push(ds.groupName || config.yAxis || 'Value');
      });

      const rows = aggregatedResults.labels.map((label, idx) => {
        const rowObj = { [header[0]]: label };
        aggregatedResults.datasets.forEach((ds) => {
          rowObj[ds.groupName || config.yAxis || 'Value'] = ds.rawData[idx] ?? ds.data[idx] ?? 0;
        });
        return rowObj;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Code export CSV failed:', error);
      handleError('Failed to export data to CSV.');
    }
  }, [aggregatedResults, selectedProject, config.xAxis, config.yAxis, handleError]);

  const exportFilteredDataExcel = useCallback(() => {
    if (!flattenedData || !flattenedData.length) {
      handleError('No data available to export.');
      return;
    }

    try {
      const projClean = (selectedProject || 'MEAL').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${projClean}_samples_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;

      const finalRows = flattenedData.filter((row) => {
        const isExcluded = Object.entries(advancedFilters).some(([col, filter]) => {
          const val = String(row[col] ?? '');
          return filter.excluded?.includes(val);
        });
        if (isExcluded) return false;

        let matchesAllSelectMultipleFilters = true;
        Object.entries(selectedMultipleChoices).forEach(([col, activeChoices]) => {
          if ((col === config.xAxis || col === config.groupBy) && columnTypes[col] === 'select_multiple' && activeChoices) {
            const allColChoices = uniqueChoicesMap[col] || [];
            if (allColChoices.length > 0) {
              const hasMatch = activeChoices.some(choice => row[`${col}__${choice}`] === 1);
              if (!hasMatch) {
                matchesAllSelectMultipleFilters = false;
              }
            }
          }
        });
        return matchesAllSelectMultipleFilters;
      });

      if (!finalRows.length) {
        handleError('No samples pass the current filters to export.');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(finalRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Outputs');
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Code export full samples failed:', error);
      handleError('Failed to export files to Excel.');
    }
  }, [flattenedData, advancedFilters, selectedMultipleChoices, config.xAxis, config.groupBy, columnTypes, uniqueChoicesMap, selectedProject, handleError]);

  const ChartComponent = chartMap[config.chartType] || Bar;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900">
      <div
        className={`sidebar-backdrop fixed inset-0 bg-black/50 z-[9999] lg:hidden ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      {isBusy && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-slate-950/30 backdrop-blur-sm pointer-events-auto">
          <div className="rounded-3xl bg-white/95 border border-slate-200 p-5 shadow-2xl text-slate-900 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em]">
            <span className="h-3 w-3 rounded-full bg-indigo-600 animate-pulse" />
            Processing… please wait
          </div>
        </div>
      )}

      <aside className={`sidebar-mobile fixed lg:relative z-[10000] h-full w-96 glass-panel border-l border-slate-200 shadow-2xl flex flex-col overflow-y-auto lg:translate-x-0 ${sidebarOpen ? 'open' : ''}`}>
        <div className="p-4 lg:p-6 border-b border-slate-100 flex items-center gap-3 bg-white">
          <div className="bg-white p-1 rounded-xl shadow-md border border-slate-100">
            <img src="/LOGO.png" alt="MEAL Center" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">MEAL Studio</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">V21</p>
          </div>
        </div>

        <div className="p-4 lg:p-6 space-y-4 flex-1">
          {appError && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 error-shake">
              <SafeIcon name="AlertTriangle" size={18} className="text-red-500" />
              <p className="text-[11px] font-bold text-red-600 leading-relaxed">{appError}</p>
            </div>
          )}

          {/* LAYER 1: DATA INGESTION & CONTEXT */}
          <div className={`layer-container border transition-all duration-300 rounded-[2.5rem] p-4 ${expandedLayer === 1 ? 'bg-indigo-50/5 border-indigo-200 shadow-sm' : 'bg-white border-slate-100'}`}>
            <button
              type="button"
              onClick={() => setExpandedLayer(expandedLayer === 1 ? null : 1)}
              className="w-full flex items-center justify-between text-left select-none outline-none"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl shrink-0 border transition-all ${expandedLayer === 1 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                  <SafeIcon name="Database" size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-indigo-600/80 bg-indigo-50/40 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Layer 01</span>
                    {fileName && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <span>Data & Project Scope</span>
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400">Manage data updates and dataset files</p>
                </div>
              </div>
              <div className={`p-1.5 text-slate-400 transition-transform duration-300 ${expandedLayer === 1 ? 'rotate-180 text-indigo-500' : ''}`}>
                <SafeIcon name="ChevronDown" size={16} />
              </div>
            </button>

            <AnimatePresence>
              {expandedLayer === 1 && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden space-y-4"
                >
                  <DataManagement
                    fileName={fileName}
                    sheetNames={sheetNames}
                    selectedSheet={selectedSheet}
                    onUpload={loadFile}
                    onSelectSheet={(sheet) => loadSheet(workbook, sheet, fileName)}
                  />

                  <div className="rounded-3xl bg-white p-4 border border-slate-100 shadow-sm">
                    <HierarchicalSettings
                      selectedProject={selectedProject}
                      selectedDesign={selectedDesign}
                      onChangeProject={setSelectedProject}
                      onChangeDesign={setSelectedDesign}
                    />
                  </div>

                  {fileName && (
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={resetApp}
                        className="py-3 bg-slate-50 text-slate-600 rounded-2xl text-[9px] font-black flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors border border-slate-200 uppercase tracking-widest shadow-sm hover:shadow-md"
                      >
                        <SafeIcon name="Undo2" size={14} /> Reset Settings
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={clearFile}
                        className="py-3 bg-red-50 text-red-600 rounded-2xl text-[9px] font-black flex items-center justify-center gap-2 hover:bg-red-100 transition-colors border border-red-200 uppercase tracking-widest shadow-sm hover:shadow-md hover:text-red-700"
                      >
                        <SafeIcon name="Trash2" size={14} /> Unload File
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LAYER 2: AXIS & QUESTION MAPPING */}
          <div className={`layer-container border transition-all duration-300 rounded-[2.5rem] p-4 ${expandedLayer === 2 ? 'bg-indigo-50/5 border-indigo-200 shadow-sm' : 'bg-white border-slate-100'} ${data.length === 0 ? 'opacity-60 cursor-not-allowed select-none bg-slate-50/10' : ''}`}>
            <button
              type="button"
              disabled={data.length === 0}
              onClick={() => {
                if (data.length > 0) {
                  setExpandedLayer(expandedLayer === 2 ? null : 2);
                }
              }}
              className="w-full flex items-center justify-between text-left select-none outline-none group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl shrink-0 border transition-all ${expandedLayer === 2 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                  {data.length === 0 ? <SafeIcon name="Lock" size={16} className="text-slate-400" /> : <SafeIcon name="Columns" size={16} />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-indigo-600/80 bg-indigo-50/40 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Layer 02</span>
                    {data.length > 0 && <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.2 rounded-full font-black">ACTIVE</span>}
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Axis & Mapped Questions
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400">Define axes and map source questions</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {data.length === 0 ? (
                  <span className="text-[8px] bg-slate-100 text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-full font-extrabold uppercase">LOCKED</span>
                ) : (
                  <div className={`p-1.5 text-slate-400 transition-transform duration-300 ${expandedLayer === 2 ? 'rotate-180 text-indigo-500' : ''}`}>
                    <SafeIcon name="ChevronDown" size={16} />
                  </div>
                )}
              </div>
            </button>
 
            {data.length === 0 && expandedLayer === 2 && (
              <div className="mt-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center space-y-2">
                <div className="mx-auto w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center border border-slate-200">
                  <SafeIcon name="LockKeyhole" size={18} />
                </div>
                <h4 className="text-[10px] font-black text-slate-700 uppercase">Analysis Features Muted</h4>
                <p className="text-[9px] font-bold text-slate-400 leading-normal">
                  Please drag and drop an Excel file or select an active worksheet first to unlock this layer.
                </p>
              </div>
            )}

            <AnimatePresence>
              {data.length > 0 && expandedLayer === 2 && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <SettingsUI
                    columns={columns}
                    columnTypes={columnTypes}
                    suggestedTypes={suggestedTypes}
                    onChangeColumnType={handleChangeColumnType}
                    config={config}
                    onSetConfig={setConfig}
                    visuals={visuals}
                    onSetVisuals={setVisuals}
                    uniqueChoicesMap={uniqueChoicesMap}
                    selectedMultipleChoices={selectedMultipleChoices}
                    onToggleMultipleChoice={handleToggleMultipleChoice}
                    onSelectAllMultipleChoices={handleSelectAllMultipleChoices}
                    onSelectNoneMultipleChoices={handleSelectNoneMultipleChoices}
                    columnAliases={columnAliases}
                    onOpenQuestionSettings={handleOpenQuestionSettings}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LAYER 3: STATISTICAL RULES & FILTERS */}
          <div className={`layer-container border transition-all duration-300 rounded-[2.5rem] p-4 ${expandedLayer === 3 ? 'bg-indigo-50/5 border-indigo-200 shadow-sm' : 'bg-white border-slate-100'} ${data.length === 0 ? 'opacity-60 cursor-not-allowed select-none bg-slate-50/10' : ''}`}>
            <button
              type="button"
              disabled={data.length === 0}
              onClick={() => {
                if (data.length > 0) {
                  setExpandedLayer(expandedLayer === 3 ? null : 3);
                }
              }}
              className="w-full flex items-center justify-between text-left select-none outline-none group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl shrink-0 border transition-all ${expandedLayer === 3 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                  {data.length === 0 ? <SafeIcon name="Lock" size={16} className="text-slate-400" /> : <SafeIcon name="Cpu" size={16} />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-indigo-600/80 bg-indigo-50/40 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Layer 03</span>
                    {data.length > 0 && <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.2 rounded-full font-black">FORMULAS DETECTED</span>}
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Analytical Logic & Filters
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400">Statistical calculations and advanced queries</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {data.length === 0 ? (
                  <span className="text-[8px] bg-slate-100 text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-full font-extrabold uppercase">LOCKED</span>
                ) : (
                  <div className={`p-1.5 text-slate-400 transition-transform duration-300 ${expandedLayer === 3 ? 'rotate-180 text-indigo-500' : ''}`}>
                    <SafeIcon name="ChevronDown" size={16} />
                  </div>
                )}
              </div>
            </button>

            <AnimatePresence>
              {data.length > 0 && expandedLayer === 3 && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden space-y-6"
                >
                  <StatisticalOperations
                    aggFunc={config.aggFunc}
                    showPercentage={config.showPercentage}
                    config={config}
                    onSetConfig={setConfig}
                    onSetAggFunc={(func) => setConfig((p) => ({ ...p, aggFunc: func }))}
                    onTogglePercentage={() => setConfig((p) => ({ ...p, showPercentage: !p.showPercentage }))}
                    columnTypes={columnTypes}
                  />

                  <AdvancedFilters
                    data={data}
                    columns={columns}
                    advancedFilters={advancedFilters}
                    onToggleValue={toggleAdvancedFilterValue}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LAYER 4: VISUAL CANVAS & RENDERING */}
          <div className={`layer-container border transition-all duration-300 rounded-[2.5rem] p-4 ${expandedLayer === 4 ? 'bg-indigo-50/5 border-indigo-200 shadow-sm' : 'bg-white border-slate-100'} ${data.length === 0 ? 'opacity-60 cursor-not-allowed select-none bg-slate-50/10' : ''}`}>
            <button
              type="button"
              disabled={data.length === 0}
              onClick={() => {
                if (data.length > 0) {
                  setExpandedLayer(expandedLayer === 4 ? null : 4);
                }
              }}
              className="w-full flex items-center justify-between text-left select-none outline-none group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl shrink-0 border transition-all ${expandedLayer === 4 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                  {data.length === 0 ? <SafeIcon name="Lock" size={16} className="text-slate-400" /> : <SafeIcon name="Paintbrush" size={16} />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-indigo-600/80 bg-indigo-50/40 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Layer 04</span>
                    {data.length > 0 && <span className="text-[8px] bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded-full font-black">STYLES</span>}
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Visual Canvas & Icons
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 font-sans">Design dynamic branding, visuals and icons</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {data.length === 0 ? (
                  <span className="text-[8px] bg-slate-100 text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-full font-extrabold uppercase">LOCKED</span>
                ) : (
                  <div className={`p-1.5 text-slate-400 transition-transform duration-300 ${expandedLayer === 4 ? 'rotate-180 text-indigo-500' : ''}`}>
                    <SafeIcon name="ChevronDown" size={16} />
                  </div>
                )}
              </div>
            </button>

            <AnimatePresence>
              {data.length > 0 && expandedLayer === 4 && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden space-y-6"
                >
                  <section className="space-y-4 bg-white p-4 lg:p-5 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <SafeIcon name="Type" size={12} /> Full Title Control
                    </h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Chart Title', field: 'chartTitle' },
                        { label: 'X Axis Label', field: 'xAxisLabel' },
                        { label: 'Y Axis Label', field: 'yAxisLabel' }
                      ].map(({ label, field }) => (
                        <div key={field}>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{label}</label>
                          <input
                            type="text"
                            value={config[field]}
                            onChange={(e) => setConfig((p) => ({ ...p, [field]: e.target.value }))}
                            className="w-full p-3 mt-1 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-slate-800"
                            placeholder={`Enter ${label.toLowerCase()}`}
                          />
                        </div>
                      ))}
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-2">
                          <SafeIcon name="Scissors" size={12} /> Label Character Limit
                        </label>
                        <input
                          type="number"
                          min="5" max="100"
                          value={visuals.labelMaxLength || 20}
                          onChange={(e) => setVisuals((p) => ({ ...p, labelMaxLength: parseInt(e.target.value) || 20 }))}
                          className="w-full p-3 mt-1 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-slate-850"
                        />
                      </div>
                    </div>
                  </section>

                  <VisualCustomization
                    visuals={visuals}
                    config={config}
                    aggregatedResults={aggregatedResults}
                    onSetVisuals={setVisuals}
                    onSetConfig={setConfig}
                    pinnedIndices={pinnedIndices}
                    onClearPinnedIndices={() => setPinnedIndices([])}
                    onPickGlobalIcon={() => {
                      setSelectedLabelForIcon('_global_');
                      setSelectedIconName(config.globalIcon || '');
                      setShowIconModal(true);
                    }}
                  />

                  <IconFiltering
                    filters={filters}
                    customIcons={customIcons}
                    activeIconTarget={activeIconTarget}
                    isEditingIcons={isEditingIcons}
                    selectedIconName={selectedIconName}
                    filteredIconSuggestions={filteredIconSuggestions}
                    visuals={visuals}
                    legendAliases={legendAliases}
                    onSaveAlias={(original, newValue) => {
                      setLegendAliases(prev => ({ ...prev, [original]: newValue }));
                    }}
                    onToggleFilter={toggleFilterVisibility}
                    onShowAll={() => setFilters((p) => p.map((f) => ({ ...f, visible: true })))}
                    onHideAll={() => setFilters((p) => p.map((f) => ({ ...f, visible: false })))}
                    onSetActiveIconTarget={(target) => {
                      setActiveIconTarget(target);
                      setSelectedIconName('');
                    }}
                    onSetIsEditingIcons={setIsEditingIcons}
                    onSetSelectedIconName={setSelectedIconName}
                    iconLibrary={iconLibrary}
                    onSetIconLibrary={setIconLibrary}
                    onUploadIcon={handleUploadIconImage}
                    onSaveIcon={(label) => {
                      if (selectedIconName) {
                        setCustomIcons((p) => ({ ...p, [String(label).toLowerCase()]: selectedIconName }));
                      }
                      setActiveIconTarget('');
                      setSelectedIconName('');
                    }}
                    onResetIcon={(label) => {
                      setCustomIcons((p) => {
                        const next = { ...p };
                        delete next[String(label).toLowerCase()];
                        return next;
                      });
                    }}
                    onSetVisuals={setVisuals}
                    getCategoryIconWithPreference={getCategoryIconWithPreference}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PERSISTENT HIGH-RES EXPORT SECTION AT THE BOTTOM OF SIDEBAR */}
          {data.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2 px-1 mb-1">
                <SafeIcon name="DownloadCloud" size={13} className="text-slate-400" />
                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Export Center</span>
              </div>
              
              <button
                type="button"
                onClick={exportPNG}
                disabled={isBusy || isExportingImage}
                className="w-full py-3.5 bg-slate-900 leading-none text-white rounded-2xl text-[11px] font-black flex items-center justify-center gap-2.5 hover:bg-black transition-all shadow-xl shadow-slate-200/80 hover:shadow-2xl hover:scale-[1.01] active:scale-95 duration-200"
              >
                <SafeIcon name="Image" size={14} className="text-white shrink-0 animate-pulse" />
                <span className="uppercase tracking-widest text-[9px] font-extrabold">Export High-Res Image</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={exportChartDataExcel}
                  disabled={isBusy}
                  className="py-3 bg-white border border-slate-100 text-slate-700 rounded-2xl text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-all shadow-sm hover:shadow active:scale-95 duration-200"
                >
                  <SafeIcon name="FileSpreadsheet" size={13} className="text-emerald-600 shrink-0" />
                  <span className="uppercase tracking-wider text-[8px] font-black">Excel Chart</span>
                </button>

                <button
                  type="button"
                  onClick={exportChartDataCSV}
                  disabled={isBusy}
                  className="py-3 bg-white border border-slate-100 text-slate-700 rounded-2xl text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-all shadow-sm hover:shadow active:scale-95 duration-200"
                >
                  <SafeIcon name="FileText" size={13} className="text-indigo-600 shrink-0" />
                  <span className="uppercase tracking-wider text-[8px] font-black">CSV Chart</span>
                </button>
              </div>

              <button
                type="button"
                onClick={exportFilteredDataExcel}
                disabled={isBusy}
                className="w-full py-3 bg-indigo-50/50 border border-indigo-100/50 text-indigo-700 rounded-2xl text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 duration-200"
              >
                <SafeIcon name="Database" size={13} className="text-indigo-600 shrink-0" />
                <span className="uppercase tracking-wider text-[8px] font-black">Export Filtered Data (Excel)</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      <ChartEngine
        selectedProject={selectedProject}
        selectedDesign={selectedDesign}
        onApplySettings={handleApplyDesignSettings}
        onFade={() => setChartFadeKey(Date.now())}
      />

      <main className="flex-1 flex flex-col gap-4 lg:gap-6 p-2 sm:p-4 lg:p-8 relative overflow-x-hidden">
        <ChartHeader
          chartType={config.chartType}
          onSetChartType={(type) => setConfig((p) => ({ ...p, chartType: type }))}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {data.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 lg:p-5 rounded-[2rem] border border-slate-100 shadow-sm relative z-30">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Automated Dashboard Mode</span>
                <span className="text-[12px] font-extrabold text-slate-700 mt-1 block">Live schema mapping and intelligence are ready</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setShowGallery(true)}
              className="px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black rounded-2xl shadow-xl shadow-indigo-100 hover:shadow-2xl transition-all duration-200 cursor-pointer flex items-center gap-2 hover:scale-[1.01] active:scale-95"
            >
              <SafeIcon name="Grid" size={14} className="animate-pulse" />
              <span className="uppercase tracking-widest text-[10px] font-extrabold">View All Charts</span>
            </button>
          </div>
        )}

        {data.length > 0 && (!config.xAxis || !config.yAxis) && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-xl w-full aspect-video bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-50 flex flex-col items-center justify-center text-center p-12 space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/20 to-transparent pointer-events-none" />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center border border-indigo-50 relative z-10"
              >
                <SafeIcon name="MousePointer2" size={40} className="text-indigo-500 fill-indigo-50" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-indigo-500 rounded-[2rem] -z-10"
                />
              </motion.div>
              <div className="space-y-4 relative z-10">
                <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none">Select Your Columns</h2>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                  Choose X and Y Axis columns from the sidebar to start visualizing your data.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className={`flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto no-scrollbar pb-10 ${data.length > 0 && (!config.xAxis || !config.yAxis) ? 'hidden' : ''}`}>
          <motion.div
            ref={chartContainerRef}
            className={`resize-container w-full flex rounded-[2.5rem] lg:rounded-[3.5rem] p-3 lg:p-6 flex-col items-center justify-center relative shadow-[0_32px_64px_-12px_rgba(15,23,42,0.12)] ${isResizing ? "" : "transition-all duration-300"} overflow-visible`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              background: `rgba(255,255,255,${visuals.glassOpacity})`,
              height: `${visuals.chartHeight}px`,
              minHeight: `${visuals.chartHeight}px`,
              backdropFilter: `blur(${visuals.glassBlur}px)`,
              border: '1px solid rgba(255,255,255,0.4)',
            }}
          >
            {data.length > 0 && config.xAxis && config.yAxis ? (
              <div className="w-full h-full flex flex-col relative p-2 sm:p-4 lg:p-6" key={`${fileName}-${chartFadeKey}`}>
                <div ref={stageRef} className="stage-area w-full h-full flex flex-col relative">

                  <div className="flex flex-col flex-1 h-full min-w-0">
                    {config.chartTitle && (
                      <motion.h2
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-black text-slate-800 text-center pt-4 pb-2 tracking-tight"
                        style={{
                          fontSize: `${Math.max(14, 24 * (visuals.chartHeight / 580))}px`,
                          order: -10
                        }}
                      >
                        {config.chartTitle}
                      </motion.h2>
                    )}

                    {/* Top/Bottom Custom Legend */}


                    {hasEmptyMultipleSelection ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-[2rem] text-center min-h-[300px] w-full mt-4">
                        <div className="p-3 bg-amber-50 text-amber-500 rounded-full mb-3 shrink-0 animate-bounce">
                          <SafeIcon name="AlertTriangle" size={24} />
                        </div>
                        <h3 className="text-sm font-black text-slate-700">Please choose at least one option to display</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          Please select at least one option from the multi-choice column settings in the sidebar to render the chart.
                        </p>
                      </div>
                    ) : (
                      <div className={`chart-wrapper flex-1 flex relative ${isHorizontal ? 'flex-row-reverse' : 'flex-col'} overflow-visible min-h-0`}>
                        <div className="chart-container relative flex-1 min-w-0 min-h-0 overflow-visible">
                          <ChartComponent
                            key={`${config.chartType}-${config.showTrendline}-${config.showRawPath}-${config.numberFormat}-${config.showPercentage}-${visuals.shadow}-${visuals.showIcons}-${config.iconMode}-${config.globalIcon}-${isHorizontal}-${filters.map(f => f.visible).join('')}-${visuals.tooltipMode || 'hover'}-${pinnedIndices.join(',')}-${visuals.dataLabelColor}-${visuals.dataLabelPosition}-${visuals.showDataLabels}-${visuals.showLegend}-${visuals.legendPosition}-${visuals.legendFontSize}-${visuals.legendSpacing}-${visuals.legendWidth}-${visuals.borderWidth}-${visuals.opacity}-${visuals.tension}-${visuals.fill}-${visuals.grid}-${visuals.showXAxisLabel}-${visuals.showYAxisLabel}-${visuals.xAxisFontSize}-${visuals.yAxisFontSize}-${visuals.xAxisTitleFontSize}-${visuals.yAxisTitleFontSize}-${visuals.cutout ?? 50}-${visuals.scatterPointRadius ?? 8}-${visuals.comboLineWidth ?? 3}`}
                            ref={chartRef}
                            data={chartData}
                            options={chartOptions}
                            plugins={chartPlugins}
                          />

                          {/* Category Icons Layer (Moved inside chart-container for perfect coordinate alignment!) */}
                          {visuals.showIcons && aggregatedResults && chartArea && (
                            <div className="absolute inset-0 pointer-events-none z-20">
                              <div className="absolute pointer-events-none" style={{ left: chartArea.left, top: chartArea.top, width: chartArea.width, height: chartArea.height }}>
                                {config.iconMode === 'centered' ? (() => {
                                  const middleIndex = Math.floor(chartData.labels.length / 2);
                                  const pos = categoryPositions[middleIndex];
                                  if (pos === undefined) return null;
                                  const relPos = isHorizontal ? pos - chartArea.top : pos - chartArea.left;
                                  const middleColor = getCategoryColor(middleIndex);
 
                                  return (
                                    <div className="absolute pointer-events-auto flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                                      style={{
                                        left: isHorizontal ? `-${visuals.iconOffset}px` : relPos,
                                        top: isHorizontal ? relPos : (chartArea.height + visuals.iconOffset)
                                      }}>
                                      <motion.button
                                        whileHover={{ scale: 1.15, rotate: 5 }}
                                        className="flex items-center justify-center transition-all"
                                        style={{
                                          width: Math.max(20, visuals.iconContainerSize * (visuals.chartHeight / 580)),
                                          height: Math.max(20, visuals.iconContainerSize * (visuals.chartHeight / 580)),
                                          backgroundColor: parseFloat(visuals.iconContainerOpacity ?? 1) > 0 ? `rgba(255, 255, 255, ${visuals.iconContainerOpacity})` : 'transparent',
                                          border: parseFloat(visuals.iconContainerOpacity ?? 1) > 0 ? `2px solid ${hexToRgba(middleColor, parseFloat(visuals.iconContainerOpacity))}` : 'none',
                                          borderRadius: '50%',
                                          boxShadow: parseFloat(visuals.iconContainerOpacity ?? 1) > 0 ? `0 4px 12px rgba(15, 23, 42, ${0.12 * parseFloat(visuals.iconContainerOpacity)})` : 'none',
                                        }}
                                        onClick={() => { setSelectedLabelForIcon('_global_'); setSelectedIconName(config.globalIcon || 'Circle'); setShowIconModal(true); }}>
                                        <DynamicIcon name={config.globalIcon || 'Circle'} size={Math.max(10, visuals.iconSize * (visuals.chartHeight / 580))} style={{ color: middleColor, opacity: visuals.iconOpacity }} />
                                      </motion.button>
                                    </div>
                                  );
                                })() : categoryPositions.length > 0 && chartData.labels.map((label, index) => {
                                  const isHorizontalChart = isHorizontal;
                                  const pos = categoryPositions[index];
                                  if (pos === undefined) return null;
                                  const relPos = isHorizontalChart ? pos - chartArea.top : pos - chartArea.left;
 
                                  const originalLabel = aggregatedResults.originalLabels?.[index] || label;
                                  const iconName = config.iconMode === 'unified'
                                    ? (config.globalIcon || 'Circle')
                                    : getCategoryIconWithPreference(originalLabel);
                                  const catColor = getCategoryColor(index);
 
                                  return (
                                    <div key={index} className="absolute pointer-events-auto flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                                      style={{
                                        left: isHorizontalChart ? `-${visuals.iconOffset}px` : relPos,
                                        top: isHorizontalChart ? relPos : (chartArea.height + visuals.iconOffset)
                                      }}>
                                      <motion.button
                                        whileHover={{ scale: 1.15, rotate: 5 }}
                                        className="flex items-center justify-center transition-all"
                                        style={{
                                          width: Math.max(20, visuals.iconContainerSize * (visuals.chartHeight / 580)),
                                          height: Math.max(20, visuals.iconContainerSize * (visuals.chartHeight / 580)),
                                          backgroundColor: parseFloat(visuals.iconContainerOpacity ?? 1) > 0 ? `rgba(255, 255, 255, ${visuals.iconContainerOpacity})` : 'transparent',
                                          border: parseFloat(visuals.iconContainerOpacity ?? 1) > 0 ? `2px solid ${hexToRgba(catColor, parseFloat(visuals.iconContainerOpacity))}` : 'none',
                                          borderRadius: '55px',
                                          boxShadow: parseFloat(visuals.iconContainerOpacity ?? 1) > 0 ? `0 4px 12px rgba(15, 23, 42, ${0.12 * parseFloat(visuals.iconContainerOpacity)})` : 'none',
                                        }}
                                        onClick={() => {
                                          if (config.iconMode === 'unified') {
                                            setSelectedLabelForIcon('_global_');
                                            setSelectedIconName(config.globalIcon || 'Circle');
                                          } else {
                                            setSelectedLabelForIcon(originalLabel);
                                            setSelectedIconName(iconName);
                                          }
                                          setShowIconModal(true);
                                        }}>
                                        <DynamicIcon name={iconName} size={Math.max(10, visuals.iconSize * (visuals.chartHeight / 580))} style={{ color: catColor, opacity: visuals.iconOpacity }} />
                                      </motion.button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side Custom Legend */}


                </div>
              </div>
            ) : (
              <div className="text-center space-y-6 lg:space-y-8 px-4 flex flex-col items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-200 blur-[80px] rounded-full opacity-30 animate-pulse" />
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl relative z-10 border border-slate-50">
                    <SafeIcon name="Layers3" size={64} className="text-indigo-500" />
                  </div>
                </div>
                <div className="max-w-xs">
                  <h3 className="text-xl lg:text-3xl font-black text-slate-800 tracking-tight">Data Intelligence Engine</h3>
                  <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-[0.2em] mt-3">Ready for ingestion. Upload CSV or Excel to begin visual synthesis.</p>
                </div>
              </div>
            )}

            {/* Resize handle - adjustable chart height only */}
            <div
              data-html2canvas-ignore="true"
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-6 cursor-row-resize flex items-center justify-center group z-30"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-400 transition-all group-hover:w-16 shadow-inner" />
            </div>
          </motion.div>

          {data.length > 0 && (
            <div className="animate-in slide-in-from-bottom-6 duration-1000">
              <MetricsGrid metrics={[
                { label: 'Ingested Samples', value: aggregatedResults ? `${aggregatedResults.filteredCount.toLocaleString()} / ${data.length.toLocaleString()}` : data.length.toLocaleString(), icon: 'Table2', color: 'indigo' },
                { label: 'Analysis Vector', value: config.yAxis, icon: 'Target', color: 'emerald' },
                { label: 'Compute Engine', value: config.aggFunc.toUpperCase(), icon: 'Cpu', color: 'amber' },
                { label: 'Summation Aggregate', value: config.showPercentage ? '100%' : (aggregatedResults?.rawTotal || 0).toLocaleString(), icon: 'BarChart3', color: 'rose' }
              ]} />
            </div>
          )}
        </div>

        <footer className="mt-auto py-8 text-center border-t border-slate-100 bg-white/50">
          <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Developed by <span className="font-extrabold text-indigo-900 border-b-2 border-indigo-200 pb-0.5">MEAL Center</span>
          </p>
        </footer>
      </main>

      {editingLegend && (
        <div
          className="fixed z-[10000] p-4 bg-white rounded-2xl shadow-2xl border border-slate-200"
          style={{ left: Math.min(editingLegend.x, window.innerWidth - 280), top: Math.min(editingLegend.y, window.innerHeight - 200) }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black uppercase text-indigo-600">Quick Edit</span>
            <button onClick={() => setEditingLegend(null)} className="text-slate-400 hover:text-slate-700">
              <SafeIcon name="X" size={14} />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase">Rename Label</label>
              <input
                type="text"
                value={legendAliases[editingLegend.originalLabel] || editingLegend.originalLabel}
                onChange={(e) => {
                  setLegendAliases(prev => ({ ...prev, [editingLegend.originalLabel]: e.target.value }));
                }}
                className="w-full p-2 mt-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>
            <button
              onClick={() => {
                if (editingLegend.isGroup) {
                  const chart = chartRef.current;
                  chart.setDatasetVisibility(editingLegend.index, !chart.isDatasetVisible(editingLegend.index));
                  chart.update();
                } else {
                  if (editingLegend.originalLabel) {
                    toggleFilterVisibility(editingLegend.originalLabel);
                  }
                }
                setEditingLegend(null);
              }}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-black uppercase flex justify-center items-center gap-2 transition-all active:scale-95"
            >
              <SafeIcon name="EyeOff" size={14} /> Toggle Filter
            </button>
          </div>
        </div>
      )}

      {showIconModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`bg-white p-6 lg:p-8 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25)] max-w-xl w-full border border-slate-50 relative overflow-hidden transition-all duration-300 ${modalIsDragging ? 'ring-4 ring-indigo-500/20 border-indigo-200' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setModalIsDragging(true);
            }}
            onDragLeave={() => setModalIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setModalIsDragging(false);
              const file = e.dataTransfer?.files?.[0];
              if (file) {
                handleUploadIconImage(file, selectedLabelForIcon === '_global_' ? '_global_' : selectedLabelForIcon);
              }
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="space-y-1">
                <span className="text-[9px] text-indigo-600 font-black uppercase tracking-[0.2em] block">
                  Design Annotations
                </span>
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight uppercase">
                  {selectedLabelForIcon === '_global_' ? 'Global Synthesis Symbol' : `Icon for "${legendAliases?.[selectedLabelForIcon] || selectedLabelForIcon}"`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowIconModal(false);
                  setSelectedIconName('');
                  setActiveIconTarget('');
                  setIconUploadError('');
                }}
                className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95 border border-slate-100 shadow-sm"
              >
                <SafeIcon name="X" size={16} />
              </button>
            </div>

            {/* Error alerts if uploaded file fails validation */}
            {iconUploadError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 bg-red-50 border border-red-100 p-3.5 rounded-2xl flex items-start gap-2.5 error-shake"
              >
                <SafeIcon name="AlertTriangle" size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-red-600 leading-normal">{iconUploadError}</p>
              </motion.div>
            )}

            {/* Interactive Preview Canvas Orb & Recent Icons */}
            <div className="grid grid-cols-3 gap-4 mb-6 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
              {/* Dynamic Live Icon Preview */}
              <div className="col-span-1 flex flex-col items-center justify-center border-r border-slate-200/60 pr-2">
                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-2 block">
                  Live View
                </span>
                <div className="w-16 h-16 bg-white border border-slate-200/50 rounded-2xl flex items-center justify-center shadow-md relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 opacity-50" />
                  {selectedIconName ? (
                    <motion.div
                      key={selectedIconName}
                      initial={{ scale: 0.6, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      <DynamicIcon
                        name={selectedIconName}
                        size={32}
                        style={{ color: visuals.iconColor || '#4f46e5' }}
                      />
                    </motion.div>
                  ) : (
                    <SafeIcon name="HelpCircle" size={24} className="text-slate-300" />
                  )}
                  {/* Subtle pulsing ring overlay */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/10 pointer-events-none animate-pulse" />
                </div>
              </div>

              {/* Quick Session History Selector */}
              <div className="col-span-2 flex flex-col justify-center pl-2">
                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-2 block">
                  Recently Used Keys
                </span>
                <div className="flex gap-2 items-center flex-wrap">
                  {recentIcons.map((recName, i) => (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      key={`${recName}-${i}`}
                      onClick={() => {
                        setSelectedIconName(recName);
                        setIconUploadError('');
                      }}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${selectedIconName === recName ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50/20'}`}
                      title={recName}
                    >
                      <DynamicIcon name={recName} size={16} />
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="space-y-4">
              <div className="relative group">
                <SafeIcon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                <input
                  type="text"
                  placeholder="Query library tags (e.g. Health, Cash, hum:Food)..."
                  className="w-full pl-12 pr-28 py-3.5 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all text-xs font-bold text-slate-700"
                  value={selectedIconName.startsWith('data:') ? '' : selectedIconName}
                  onChange={(e) => {
                    setSelectedIconName(e.target.value);
                    setIconUploadError('');
                  }}
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex bg-white p-0.5 rounded-lg shadow-sm border border-slate-200/55">
                  <button
                    onClick={() => setIconLibrary('standard')}
                    className={`px-3 py-1 rounded-md text-[8px] font-black uppercase transition-all ${iconLibrary === 'standard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Lucide
                  </button>
                  <button
                    onClick={() => setIconLibrary('humanitarian')}
                    className={`px-3 py-1 rounded-md text-[8px] font-black uppercase transition-all ${iconLibrary === 'humanitarian' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    OCHA
                  </button>
                </div>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[220px] overflow-y-auto pr-1 sidebar-scroll p-1 border border-slate-100 rounded-2xl bg-slate-50/20">
                {filteredIconSuggestions.length > 0 ? (
                  filteredIconSuggestions.map((item) => (
                    <button
                      key={item.icon}
                      type="button"
                      className={`flex flex-col items-center justify-center rounded-xl border transition-all p-2 hover:shadow-md active:scale-95 ${selectedIconName === item.icon ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm' : 'border-slate-100 bg-white text-slate-400 hover:border-indigo-200 hover:text-indigo-600'}`}
                      onClick={() => {
                        setSelectedIconName(item.icon);
                        setIconUploadError('');
                      }}
                    >
                      <DynamicIcon name={item.icon} size={20} />
                      <span className="mt-1.5 text-[6.5px] font-black uppercase tracking-tighter truncate w-full text-center">
                        {item.icon.split(':').pop().replace(/-/g, ' ')}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                    <SafeIcon name="SearchX" size={24} className="mx-auto text-slate-300 mb-1 opacity-50" />
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">No matching iconography found</p>
                  </div>
                )}
              </div>

              {/* Action Buttons & Dropzone */}
              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <label className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-[10px] uppercase border transition-all active:scale-95 ${modalIsDragging ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                  <SafeIcon name="UploadCloud" size={14} className={modalIsDragging ? 'animate-bounce' : ''} />
                  <span>{modalIsDragging ? 'Drop SVG Here' : 'Upload SVG'}</span>
                  <input
                    type="file"
                    accept="image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadIconImage(file, selectedLabelForIcon === '_global_' ? '_global_' : selectedLabelForIcon);
                      }
                    }}
                  />
                </label>
                <button
                  onClick={() => {
                    if (selectedIconName) {
                      if (selectedLabelForIcon === '_global_') {
                        setConfig(prev => ({ ...prev, globalIcon: selectedIconName }));
                      } else {
                        setCustomIcons(prev => ({ ...prev, [selectedLabelForIcon.toLowerCase()]: selectedIconName }));
                      }
                      addRecentIcon(selectedIconName);
                    }
                    setShowIconModal(false);
                    setSelectedIconName('');
                    setActiveIconTarget('');
                    setIconUploadError('');
                  }}
                  disabled={!selectedIconName}
                  className={`flex-[1.5] py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] ${selectedIconName ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sleek Global Question Settings Modal overlay */}
      <AnimatePresence>
        {editingCol !== null && (
          <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingCol(null)}
              className="absolute inset-0 bg-slate-900"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-sm w-full p-5 lg:p-6 space-y-5 relative z-10"
            >
              <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/30">
                  <SafeIcon name="Settings" size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Question Settings
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400">
                    Configure question labels & formats
                  </p>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="space-y-4">
                {/* Question Label Edit Text */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wide">
                    Question Title
                  </label>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    placeholder="Enter question display title..."
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-slate-800 font-sans"
                  />
                </div>

                {/* Column Type Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wide">
                    Question Data Type
                  </label>
                  <div className="relative">
                    <select
                      value={editingType}
                      onChange={(e) => setEditingType(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all appearance-none cursor-pointer text-slate-800 font-sans"
                    >
                      <option value="text">Plain Text / Category</option>
                      <option value="number">Numeric</option>
                      <option value="select_multiple">Multiple Choice (Select Multiple)</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <SafeIcon name="ChevronDown" size={12} />
                    </div>
                  </div>
                </div>

                <div className="text-[9px] font-bold text-slate-400 leading-relaxed bg-indigo-50/20 p-3 rounded-2xl border border-indigo-100/10">
                  Original Variable Identifier: <code className="font-mono text-[9px] text-slate-600 select-all">{editingCol}</code>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setEditingCol(null)}
                  className="flex-1 py-2.5 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black hover:bg-slate-100 transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestionSettings}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black shadow-md shadow-indigo-100 hover:shadow-lg transition-all uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGallery && (
          <ChartGallery
            visible={showGallery}
            onClose={() => setShowGallery(false)}
            data={data}
            columns={columns}
            columnTypes={columnTypes}
            uniqueChoicesMap={uniqueChoicesMap}
            selectedProject={selectedProject}
            legendAliases={legendAliases}
            columnAliases={columnAliases}
            visuals={visuals}
            globalGroupBy={config.groupBy}
            getCategoryIconWithPreference={getCategoryIconWithPreference}
            customIcons={customIcons}
            onApplyToMainView={(cardConfig) => {
              setConfig(prev => ({
                ...prev,
                xAxis: cardConfig.xAxis,
                yAxis: cardConfig.yAxis,
                groupBy: cardConfig.groupBy,
                aggFunc: cardConfig.aggFunc,
                chartType: cardConfig.chartType,
                chartTitle: cardConfig.cardTitle,
                showPercentage: cardConfig.showPercentage,
                iconMode: cardConfig.iconMode,
                globalIcon: cardConfig.globalIcon,
                showTrendline: cardConfig.showTrendline,
                showRawPath: cardConfig.showRawPath,
              }));
              setVisuals(prev => ({
                ...prev,
                primaryColor: cardConfig.primaryColor,
                secondaryColor: cardConfig.secondaryColor,
                tertiaryColor: cardConfig.tertiaryColor,
                quaternaryColor: cardConfig.quaternaryColor,
                showDataLabels: cardConfig.showDataLabels,
                showLegend: cardConfig.showLegend,
                grid: cardConfig.gridLines,
                showIcons: cardConfig.showIcons,
                borderWidth: cardConfig.borderWidth,
                opacity: cardConfig.opacity,
                tension: cardConfig.tension,
                shadow: cardConfig.shadow,
                fill: cardConfig.fill,
                cutout: cardConfig.cutout,
                scatterPointRadius: cardConfig.scatterPointRadius,
                comboLineWidth: cardConfig.comboLineWidth,
                iconSize: cardConfig.iconSize,
                iconContainerSize: cardConfig.iconContainerSize,
                iconContainerOpacity: cardConfig.iconContainerOpacity,
                iconOpacity: cardConfig.iconOpacity,
                iconOffset: cardConfig.iconOffset,
                legendFontSize: cardConfig.legendFontSize,
                legendSpacing: cardConfig.legendSpacing,
                legendWidth: cardConfig.legendWidth,
                legendPosition: cardConfig.legendPosition,
                dataLabelColor: cardConfig.dataLabelColor,
                dataLabelPosition: cardConfig.dataLabelPosition,
                dataLabelFontSize: cardConfig.dataLabelFontSize,
                xAxisFontSize: cardConfig.xAxisFontSize,
                xAxisTitleFontSize: cardConfig.xAxisTitleFontSize,
                yAxisFontSize: cardConfig.yAxisFontSize,
                yAxisTitleFontSize: cardConfig.yAxisTitleFontSize,
                chartOrientation: cardConfig.chartOrientation,
                showAxisTicks: cardConfig.showAxisTicks,
                showXAxisLabel: cardConfig.showXAxisLabel,
                showYAxisLabel: cardConfig.showYAxisLabel,
                tooltipMode: cardConfig.tooltipMode,
              }));
              setShowGallery(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
