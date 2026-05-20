import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Bar, Doughnut, Line, Pie, Radar } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import SafeIcon from './components/SafeIcon';
import { parseExcelFile } from './utils/excelParser';
import { buildChartOptions, chartComponents, colorPalettes, getCategoryIcon, iconMappings, searchIcons } from './utils/chartConfigs';
import { useResizeObserver } from './hooks/useResizeObserver';

// Import sub-components
import DataManagement from './components/Sidebar/sections/DataManagement';
import StatisticalOperations from './components/Sidebar/sections/StatisticalOperations';
import AxisLayout from './components/Sidebar/sections/AxisLayout';
import VisualCustomization from './components/Sidebar/sections/VisualCustomization';
import IconFiltering from './components/Sidebar/sections/IconFiltering';
import AdvancedFilters from './components/Sidebar/sections/AdvancedFilters';
import ChartHeader from './components/ChartArea/ChartHeader';
import MetricsGrid from './components/ChartArea/MetricsGrid';
import DynamicIcon from './components/DynamicIcon';

const colorClasses = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600'
};

const chartMap = {
  bar: Bar,
  line: Line,
  area: Line,
  pie: Pie,
  doughnut: Doughnut,
  radar: Radar
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
  chartHeight: 580,
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
  showAxisTicks: true
};

const App = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [fileName, setFileName] = useState('');
  const [appError, setAppError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [config, setConfig] = useState(defaultConfig);
  const [visuals, setVisuals] = useState(defaultVisuals);
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
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

  const resetApp = () => {
    setFilters([]);
    setAdvancedFilters({});
    setCustomIcons({});
    setConfig(defaultConfig);
    setVisuals(defaultVisuals);
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
    chartRef.current?.resize?.();
  });

  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !chartContainerRef.current) return;

      const containerRect = chartContainerRef.current.getBoundingClientRect();
      const newHeight = Math.max(200, Math.min(1500, e.clientY - containerRect.top));

      setVisuals(prev => ({
        ...prev,
        chartHeight: Math.round(newHeight)
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResizing]);

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

      const cols = Object.keys(rows[0]);
      const numericColumn = cols.find((col) => typeof rows[0][col] === 'number') || cols[0];

      setData(rows);
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

  const loadFile = async (file) => {
    if (!file) return;

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
    }
  };

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
    const labels = [...new Set(data.map((row) => String(row[config.xAxis] ?? 'Undefined')))].sort();
    setFilters((prev) => labels.map((label) => {
      const existing = prev.find((item) => item.label === label);
      return {
        label,
        visible: existing ? existing.visible : true
      };
    }));
  }, [data, config.xAxis]);

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
    if (!data.length || !config.xAxis || !config.yAxis) return null;

    const allLabels = [...new Set(data.map((row) => String(row[config.xAxis] ?? 'Undefined')))].sort();
    const visibleLabels = filters.length > 0
      ? allLabels.filter((label) => filters.some((item) => item.label === label && item.visible))
      : allLabels;

    const visibleSet = new Set(visibleLabels);
    const groups = {};
    let filteredCount = 0;

    data.forEach((row) => {
      // Apply advanced filters first
      const isExcluded = Object.entries(advancedFilters).some(([col, filter]) => {
        const val = String(row[col] ?? '');
        return filter.excluded?.includes(val);
      });
      if (isExcluded) return;
      filteredCount++;

      const x = String(row[config.xAxis] ?? 'Undefined');
      if (filters.length > 0 && !visibleSet.has(x)) return;
      const groupKey = config.groupBy ? String(row[config.groupBy] ?? 'Total') : 'Primary';
      const value = parseFloat(row[config.yAxis]);

      groups[groupKey] ??= {};
      groups[groupKey][x] ??= [];

      if (!Number.isNaN(value)) {
        groups[groupKey][x].push(value);
      } else if (['count', 'unique'].includes(config.aggFunc)) {
        groups[groupKey][x].push(row[config.yAxis]);
      }
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
        fill: config.chartType === 'radar' ? (visuals.fill !== false) : config.chartType === 'area',
        tension: visuals.tension,
        borderRadius: config.chartType === 'bar' ? Math.floor(visuals.tension * 40) : 0,
        pointBackgroundColor: borderColor,
        pointRadius: config.chartType === 'bar' ? 0 : 4
      };
    });

    return { labels: labels, originalLabels: visibleLabels, datasets, rawTotal, filteredCount };
  }, [data, config, visuals, filters, advancedFilters, legendAliases]);

  const chartData = useMemo(() => {
    if (!aggregatedResults) return { labels: [], datasets: [] };
    return {
      labels: aggregatedResults.labels,
      datasets: aggregatedResults.datasets
    };
  }, [aggregatedResults]);

  const isHorizontal = useMemo(() => {
    if (!['bar', 'line', 'area'].includes(config.chartType)) return false;
    return visuals.chartOrientation === 'h';
  }, [config.chartType, visuals.chartOrientation]);

  const rawTotal = aggregatedResults?.rawTotal ?? 0;

  const chartOptions = useMemo(() => {
    const opts = buildChartOptions(config, visuals, rawTotal, chartData?.labels, filters);

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

    return opts;
  }, [config, visuals, rawTotal, chartData?.labels, filters, aggregatedResults, toggleFilterVisibility]);

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
        if ((!config.showTrendline && !config.showRawPath) || ['pie', 'doughnut'].includes(config.chartType)) return;

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
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#f43f5e'; // Pinkish-red for raw path
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(0,0,0,0.05)';

          points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.px, p.py);
            else ctx.lineTo(p.px, p.py);
          });

          ctx.stroke();
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

  // Plugin to catch chart area and category positions for alignment
  const alignmentPlugin = useMemo(() => ({
    id: 'alignment',
    afterLayout: (chart) => {
      setChartArea(chart.chartArea);
      const scale = isHorizontal ? chart.scales.y : chart.scales.x;
      if (scale && chart.data.labels) {
        const positions = chart.data.labels.map((_, i) => scale.getPixelForValue(i));
        setCategoryPositions(positions);
      }
    }
  }), [isHorizontal]);

  const chartPlugins = useMemo(() => [shadowPlugin, trendlinePlugin, alignmentPlugin], [shadowPlugin, trendlinePlugin, alignmentPlugin]);

  // Native Chart.js legend is now used (configured in chartOptions).
  // Rename functionality is available in the sidebar IconFiltering panel.

  const exportPNG = async () => {
    if (!chartContainerRef.current) return;

    try {
      let imageUrl;

      if (visuals.showIcons) {
        const el = chartContainerRef.current;
        const canvas = await html2canvas(el, {
          backgroundColor: '#ffffff',
          scale: 3,
          useCORS: true,
          allowTaint: false,
          imageTimeout: 15000,
          width: el.offsetWidth,
          height: el.offsetHeight,
          windowWidth: document.documentElement.offsetWidth,
          windowHeight: document.documentElement.offsetHeight,
          logging: false,
          onclone: (clonedDoc) => {
            const icons = clonedDoc.querySelectorAll('svg');
            icons.forEach(svg => {
              svg.style.visibility = 'visible';
            });
            const container = clonedDoc.querySelector('.resize-container');
            if (container) {
              container.style.height = 'auto';
              container.style.minHeight = 'none';
              container.style.maxHeight = 'none';
            }
          }
        });
        imageUrl = canvas.toDataURL('image/png', 1.0);
      } else {
        if (chartRef.current && chartRef.current.canvas) {
          imageUrl = chartRef.current.canvas.toDataURL('image/png', 1.0);
        } else {
          throw new Error('Chart not available');
        }
      }

      const link = document.createElement('a');
      link.download = `MEAL-Analytics-${Date.now()}.png`;
      link.href = imageUrl;
      link.click();
    } catch (error) {
      console.error('Export PNG failed:', error);
      handleError('Failed to export PNG. Please try again.');
    }
  };

  const ChartComponent = chartMap[config.chartType] || Bar;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div
        className={`sidebar-backdrop fixed inset-0 bg-black/50 z-[9999] lg:hidden ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar-mobile fixed lg:relative z-[10000] h-full w-80 glass-panel border-l border-slate-200 shadow-2xl flex flex-col overflow-y-auto lg:translate-x-0 ${sidebarOpen ? 'open' : ''}`}>
        <div className="p-4 lg:p-6 border-b border-slate-100 flex items-center gap-3 bg-white">
          <div className="bg-white p-1 rounded-xl shadow-md border border-slate-100">
            <img src="/LOGO.jpg" alt="MEAL Center" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">MEAL Studio</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">V21</p>
          </div>
        </div>

        <div className="p-4 lg:p-6 space-y-6 lg:space-y-8 flex-1">
          {appError && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 error-shake">
              <SafeIcon name="AlertTriangle" size={18} className="text-red-500" />
              <p className="text-[11px] font-bold text-red-600 leading-relaxed">{appError}</p>
            </div>
          )}

          <DataManagement
            fileName={fileName}
            sheetNames={sheetNames}
            selectedSheet={selectedSheet}
            onUpload={loadFile}
            onSelectSheet={(sheet) => loadSheet(workbook, sheet, fileName)}
          />

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

          {data.length > 0 && (
            <div className="space-y-6 lg:space-y-8">
              <AxisLayout
                columns={columns}
                config={config}
                onSetConfig={setConfig}
                visuals={visuals}
                onSetVisuals={setVisuals}
              />

              <StatisticalOperations
                aggFunc={config.aggFunc}
                showPercentage={config.showPercentage}
                config={config}
                onSetConfig={setConfig}
                onSetAggFunc={(func) => setConfig((p) => ({ ...p, aggFunc: func }))}
                onTogglePercentage={() => setConfig((p) => ({ ...p, showPercentage: !p.showPercentage }))}
              />

              <AdvancedFilters
                data={data}
                columns={columns}
                advancedFilters={advancedFilters}
                onToggleValue={toggleAdvancedFilterValue}
              />

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
                        className="w-full p-3 mt-1 rounded-2xl border border-slate-200 bg-white text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-100"
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
                      className="w-full p-3 mt-1 rounded-2xl border border-slate-200 bg-white text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-100"
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

              <div className="pt-6 border-t border-slate-100 space-y-3">
                <button
                  type="button"
                  onClick={exportPNG}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-200"
                >
                  <SafeIcon name="Image" size={14} /> Export High-Res Image
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col gap-4 lg:gap-6 p-2 sm:p-4 lg:p-8 relative overflow-x-hidden">
        <ChartHeader
          chartType={config.chartType}
          onSetChartType={(type) => setConfig((p) => ({ ...p, chartType: type }))}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

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
            className="resize-container w-full max-w-[1200px] mx-auto flex rounded-[2.5rem] lg:rounded-[3.5rem] p-3 lg:p-6 flex-col items-center justify-center relative shadow-[0_32px_64px_-12px_rgba(15,23,42,0.12)] transition-all duration-500 overflow-visible"
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
              <div className="w-full h-full flex flex-col relative p-2 sm:p-4 lg:p-6" key={fileName}>
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


                    <div className={`chart-wrapper flex-1 flex relative ${isHorizontal ? 'flex-row-reverse' : 'flex-col'} overflow-visible min-h-0`}>
                      <div className="chart-container relative flex-1 min-w-0 min-h-0 overflow-visible">
                        <ChartComponent
                          key={`${config.chartType}-${config.showTrendline}-${config.showRawPath}-${visuals.shadow}-${visuals.showIcons}-${config.iconMode}-${config.globalIcon}-${isHorizontal}-${filters.map(f => f.visible).join('')}`}
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

                                return (
                                  <div className="absolute pointer-events-auto flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                      left: isHorizontal ? `-${visuals.iconOffset}px` : relPos,
                                      top: isHorizontal ? relPos : (chartArea.height + visuals.iconOffset)
                                    }}>
                                    <motion.button
                                      whileHover={{ scale: 1.15, rotate: 5 }}
                                      className="backdrop-blur-md flex items-center justify-center transition-all"
                                      style={{
                                        width: Math.max(20, visuals.iconContainerSize * (visuals.chartHeight / 580)),
                                        height: Math.max(20, visuals.iconContainerSize * (visuals.chartHeight / 580)),
                                        backgroundColor: `rgba(255, 255, 255, ${visuals.iconContainerOpacity})`,
                                        border: visuals.iconContainerOpacity > 0 ? `1px solid rgba(255, 255, 255, ${visuals.iconContainerOpacity * 0.4})` : 'none',
                                        borderRadius: `${visuals.borderRadius}px`,
                                        boxShadow: visuals.iconContainerOpacity > 0 ? `0 10px 25px -5px rgba(15, 23, 42, ${visuals.iconContainerOpacity * 0.08})` : 'none',
                                        backdropFilter: `blur(${12 * visuals.iconContainerOpacity}px)`
                                      }}
                                      onClick={() => { setSelectedLabelForIcon('_global_'); setSelectedIconName(config.globalIcon || 'Circle'); setShowIconModal(true); }}>
                                      <DynamicIcon name={config.globalIcon || 'Circle'} size={Math.max(10, visuals.iconSize * (visuals.chartHeight / 580))} style={{ color: visuals.iconColor, opacity: visuals.iconOpacity }} />
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

                                return (
                                  <div key={index} className="absolute pointer-events-auto flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                      left: isHorizontalChart ? `-${visuals.iconOffset}px` : relPos,
                                      top: isHorizontalChart ? relPos : (chartArea.height + visuals.iconOffset)
                                    }}>
                                    <motion.button
                                      whileHover={{ scale: 1.15, rotate: 5 }}
                                      className="backdrop-blur-md flex items-center justify-center transition-all"
                                      style={{
                                        width: Math.max(20, visuals.iconContainerSize * (visuals.chartHeight / 580)),
                                        height: Math.max(20, visuals.iconContainerSize * (visuals.chartHeight / 580)),
                                        backgroundColor: `rgba(255, 255, 255, ${visuals.iconContainerOpacity})`,
                                        border: visuals.iconContainerOpacity > 0 ? `1px solid rgba(255, 255, 255, ${visuals.iconContainerOpacity * 0.4})` : 'none',
                                        borderRadius: `${visuals.borderRadius}px`,
                                        boxShadow: visuals.iconContainerOpacity > 0 ? `0 10px 25px -5px rgba(15, 23, 42, ${visuals.iconContainerOpacity * 0.08})` : 'none',
                                        backdropFilter: `blur(${12 * visuals.iconContainerOpacity}px)`
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
                                      <DynamicIcon name={iconName} size={Math.max(10, visuals.iconSize * (visuals.chartHeight / 580))} style={{ color: visuals.iconColor, opacity: visuals.iconOpacity }} />
                                    </motion.button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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

            {/* Resize Handle with improved visual - Hidden during export */}
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
    </div>
  );
};

export default App;
