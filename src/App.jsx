import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
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
  doughnut: Doughnut
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
  chartHeight: 580,
  iconSize: 16,
  iconColor: '#64748b',
  iconOpacity: 1.0,
  legendFontSize: 12,
  xAxisFontSize: 11,
  yAxisFontSize: 11,
  dataLabelPosition: 'outside',
  dataLabelColor: '#475569',
  dataLabelFontSize: 11,
  xAxisTitleFontSize: 12,
  yAxisTitleFontSize: 12
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
      const newHeight = Math.max(300, Math.min(1500, e.clientY - containerRect.top));
      
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
      setConfig((prev) => ({ ...prev, xAxis: cols[0] || '', yAxis: numericColumn || '', groupBy: '' }));
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
      const normalizedLabel = String(label).toLowerCase();
      if (customIcons[normalizedLabel]) {
        return customIcons[normalizedLabel];
      }
      return getCategoryIcon(label);
    },
    [customIcons]
  );

  const iconOptions = useMemo(
    () => iconMappings.map((item) => ({ icon: item.icon, label: item.label })),
    []
  );

  useEffect(() => {
    if (!data.length || !config.xAxis) return;
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
    
    const isSvg = file.type.includes('svg');
    if (!isSvg) {
      console.warn('Non-SVG icon uploaded. Color customization is only supported for SVG files.');
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      if (typeof base64 === 'string') {
        setCustomIcons((prev) => ({ ...prev, [String(label).toLowerCase()]: base64 }));
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

    const labels = visibleLabels;

    const rawDatasets = Object.keys(groups).map((groupName) => {
      const chartData = labels.map((label) => {
        const values = groups[groupName][label] || [];
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
        const label = labels[labelIndex];
        const overrideColor = visuals.labelColorMap[label];
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
        label: config.groupBy ? dataset.groupName : config.xAxis,
        data: displayData,
        rawData: dataset.chartData,
        backgroundColor,
        borderColor,
        borderWidth: visuals.borderWidth,
        fill: config.chartType === 'area',
        tension: visuals.tension,
        borderRadius: config.chartType === 'bar' ? visuals.borderRadius : 0,
        pointBackgroundColor: borderColor,
        pointRadius: config.chartType === 'bar' ? 0 : 4
      };
    });

    return { labels: visibleLabels, datasets, rawTotal, filteredCount };
  }, [data, config, visuals, filters, advancedFilters]);

  const chartData = useMemo(() => {
    if (!aggregatedResults) return { labels: [], datasets: [] };
    return {
      labels: aggregatedResults.labels,
      datasets: aggregatedResults.datasets
    };
  }, [aggregatedResults]);

  const rawTotal = aggregatedResults?.rawTotal ?? 0;

  const chartOptions = useMemo(
    () => buildChartOptions(config, visuals, rawTotal),
    [config, visuals, rawTotal]
  );

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
        if (!config.showTrendline || ['pie', 'doughnut'].includes(config.chartType)) return;

        const xScale = chart.scales?.x;
        const yScale = chart.scales?.y;
        if (!xScale || !yScale) return;

        const values = chart.data.labels.map((_, index) => {
          return chart.data.datasets.reduce((sum, dataset) => {
            const rawValue = dataset.rawData?.[index] ?? dataset.data?.[index] ?? 0;
            return sum + (Number(rawValue) || 0);
          }, 0);
        });

        const points = values
          .map((value, index) => ({
            x: xScale.getPixelForValue(index),
            y: yScale.getPixelForValue(config.showPercentage ? (rawTotal === 0 ? 0 : (value / rawTotal) * 100) : value)
          }))
          .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

        if (points.length < 2) return;

        const ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.stroke();
        ctx.restore();
      }
    }),
    [config.showTrendline, config.chartType, config.showPercentage, rawTotal]
  );

  const chartPlugins = useMemo(() => [shadowPlugin, trendlinePlugin], [shadowPlugin, trendlinePlugin]);

  const exportPNG = async () => {
    if (!chartContainerRef.current) return;

    try {
      let imageUrl;
      if (visuals.showIcons) {
        // Export with icons using html2canvas
        const canvas = await html2canvas(chartContainerRef.current, {
          backgroundColor: '#ffffff',
          scale: 3, // Fixed high resolution
          useCORS: true,
          allowTaint: false,
          imageTimeout: 15000,
          logging: false,
          onclone: (clonedDoc) => {
            // Helper to ensure icons are clean in export
            const icons = clonedDoc.querySelectorAll('svg');
            icons.forEach(svg => {
              svg.style.visibility = 'visible';
            });
          }
        });
        imageUrl = canvas.toDataURL('image/png', 1.0);
      } else {
        // Export raw chart using toDataURL for highest precision
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

  const exportSVG = async () => {
    if (!chartContainerRef.current) return;

    try {
      let canvas, imageUrl;
      if (visuals.showIcons) {
        // Export with icons using html2canvas
        canvas = await html2canvas(chartContainerRef.current, {
          backgroundColor: '#ffffff',
          scale: 3,
          useCORS: true,
          allowTaint: false,
          imageTimeout: 15000,
          logging: false
        });
        imageUrl = canvas.toDataURL('image/png', 1.0);
      } else {
        // Export raw chart using toDataURL for highest precision
        if (chartRef.current && chartRef.current.canvas) {
          canvas = chartRef.current.canvas;
          imageUrl = canvas.toDataURL('image/png', 1.0);
        } else {
          throw new Error('Chart not available');
        }
      }
      const svgString = `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">` +
        `<image href="${imageUrl}" width="${canvas.width}" height="${canvas.height}"/></svg>`;

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MEAL-Analytics-${Date.now()}.svg`;
      link.click();
    } catch (error) {
      console.error('Export SVG failed:', error);
      handleError('Failed to export SVG. Please try again.');
    }
  };

  const ChartComponent = chartMap[config.chartType] || Bar;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div
        className={`sidebar-backdrop fixed inset-0 bg-black/50 z-10 lg:hidden ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar-mobile fixed lg:relative z-20 h-full w-80 glass-panel border-l border-slate-200 shadow-2xl flex flex-col overflow-y-auto lg:translate-x-0 ${sidebarOpen ? 'open' : ''}`}>
        <div className="p-4 lg:p-6 border-b border-slate-100 flex items-center gap-3 bg-white">
          <div className="bg-white p-1 rounded-xl shadow-md border border-slate-100">
            <img src="/LOGO.jpg" alt="MEAL Center" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">MEAL Studio</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Professional Analytics</p>
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

          {data.length > 0 && (
            <div className="space-y-6 lg:space-y-8">
              <StatisticalOperations 
                aggFunc={config.aggFunc} 
                showPercentage={config.showPercentage} 
                onSetAggFunc={(func) => setConfig((p) => ({ ...p, aggFunc: func }))} 
                onTogglePercentage={() => setConfig((p) => ({ ...p, showPercentage: !p.showPercentage }))} 
              />

              <AxisLayout 
                columns={columns} 
                config={config} 
                onSetConfig={setConfig} 
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
                  <SafeIcon name="Image" size={14} /> Export PNG High-Res
                </button>
                <button
                  type="button"
                  onClick={exportSVG}
                  className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                >
                  <SafeIcon name="Code2" size={14} /> Export SVG
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col gap-4 lg:gap-6 p-4 lg:p-8 relative overflow-x-hidden">
        <ChartHeader 
          chartType={config.chartType} 
          onSetChartType={(type) => setConfig((p) => ({ ...p, chartType: type }))} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />

        <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto no-scrollbar pb-10">
          <motion.div
            ref={chartContainerRef}
            className="resize-container w-full flex rounded-[2.5rem] lg:rounded-[3.5rem] p-3 lg:p-6 flex-col items-center justify-center relative shadow-[0_32px_64px_-12px_rgba(15,23,42,0.12)] transition-all duration-500 overflow-visible"
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
            {data.length > 0 ? (
              <div className="w-full h-full flex flex-col relative" key={fileName}>
                <div ref={stageRef} className="stage-area w-full h-full flex flex-col relative">
                  <div className="chart-container relative w-full flex-1 min-h-0">
                    <ChartComponent
                      key={`${config.chartType}-${config.showTrendline}-${visuals.shadow}-${visuals.showIcons}-${filters.map(f=>f.visible).join('')}`}
                      ref={chartRef}
                      data={chartData}
                      options={chartOptions}
                      plugins={chartPlugins}
                    />
                  </div>
                  {visuals.showIcons && aggregatedResults && (
                    <div 
                      className={`flex justify-around items-center pt-0.5 pb-0.5 px-[2%] z-10 w-full transition-all duration-300 ${['pie', 'doughnut'].includes(config.chartType) ? 'mt-0.5' : ''}`}
                    >
                      {config.iconMode === 'centered' ? (
                        <div className="flex-1 flex justify-center py-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-12 h-12 bg-white rounded-2xl border border-slate-100 shadow-md flex items-center justify-center text-indigo-600"
                            onClick={() => {
                              setSelectedLabelForIcon('_global_');
                              setSelectedIconName(config.globalIcon || '');
                              setShowIconModal(true);
                            }}
                          >
                            <DynamicIcon 
                              name={config.globalIcon || 'Circle'} 
                              size={Math.max(20, (visuals.iconSize + 16) * (visuals.chartHeight / 580))} 
                              style={{ 
                                color: visuals.iconColor,
                                opacity: visuals.iconOpacity
                              }} 
                            />
                          </motion.button>
                        </div>
                      ) : aggregatedResults.labels.map((label, idx) => {
                        const ratio = visuals.chartHeight / 580;
                        const dynamicIconSize = Math.max(8, Math.min(visuals.iconSize + 4, (visuals.iconSize + 4) * ratio));
                        const buttonSizeClass = visuals.chartHeight < 300 ? 'w-5 h-5' : 
                                               visuals.chartHeight < 400 ? 'w-7 h-7' : 
                                               visuals.chartHeight < 550 ? 'w-9 h-9' : 'w-10 h-10 lg:w-12 lg:h-12';
                        
                        const iconName = config.iconMode === 'unified' 
                          ? (config.globalIcon || 'Circle') 
                          : getCategoryIconWithPreference(label);

                        return (
                          <div key={idx} className="flex-1 flex justify-center">
                            <motion.button
                              whileHover={{ scale: 1.15, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className={`${buttonSizeClass} bg-white rounded-lg lg:rounded-xl border border-slate-100 shadow-sm flex items-center justify-center transition-all hover:border-indigo-400 hover:shadow-md group relative`}
                              onClick={() => {
                                if (config.iconMode === 'unified') {
                                  setSelectedLabelForIcon('_global_');
                                  setSelectedIconName(config.globalIcon || '');
                                } else {
                                  setSelectedLabelForIcon(label);
                                  setSelectedIconName(iconName);
                                }
                                setShowIconModal(true);
                              }}
                              title={config.iconMode === 'unified' ? "Customize global icon" : `Customize icon for ${label}`}
                            >
                              <DynamicIcon
                                name={iconName}
                                size={dynamicIconSize}
                                style={{ 
                                  color: visuals.iconColor, 
                                  opacity: visuals.iconOpacity 
                                }}
                                className="transition-colors group-hover:text-indigo-600"
                              />
                              <div className="absolute -top-0.5 -right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full border border-white shadow-sm" />
                              </div>
                            </motion.button>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

      {showIconModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Choose Icon for "{selectedLabelForIcon}"</h3>
              <button onClick={() => setShowIconModal(false)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-all">
                <SafeIcon name="X" size={18} />
              </button>
            </div>
            
            <div className="relative mb-6">
              <SafeIcon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search icons (e.g., Heart, mdi:heart)"
                className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 bg-slate-50"
                value={selectedIconName}
                onChange={(e) => {
                  setSelectedIconName(e.target.value);
                  setShowIconSuggestions(true);
                }}
                onFocus={() => setShowIconSuggestions(true)}
              />
              {showIconSuggestions && filteredIconSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-[2rem] border border-slate-100 bg-white shadow-2xl no-scrollbar">
                  {filteredIconSuggestions.map((item) => (
                    <button
                      key={item.icon}
                      type="button"
                      className="w-full px-5 py-3 text-left text-sm text-slate-700 hover:bg-indigo-50 flex items-center gap-3 transition-colors"
                      onClick={() => {
                        setSelectedIconName(item.icon);
                        setShowIconSuggestions(false);
                      }}
                    >
                      <SafeIcon name={item.icon} size={18} className="text-indigo-500" />
                      <div className="min-w-0">
                        <div className="font-black text-xs text-slate-800">{item.icon}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => { 
                  if (selectedLabelForIcon === '_global_') {
                    setConfig(prev => ({ ...prev, globalIcon: selectedIconName }));
                  } else {
                    setCustomIcons(prev => ({ ...prev, [selectedLabelForIcon.toLowerCase()]: selectedIconName })); 
                  }
                  setShowIconModal(false); 
                  setSelectedIconName(''); 
                }} 
                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                Apply Change
              </button>
              <button 
                onClick={() => setShowIconModal(false)} 
                className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
