import Fuse from 'fuse.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import humIconsMetadata from '../../node_modules/@platyplus/humanitarian-icons/dist/icons.json';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadarController,
  PolarAreaController,
  RadialLinearScale,
  Tooltip,
  Legend,
  Title,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadarController,
  PolarAreaController,
  Tooltip,
  Legend,
  Title,
  Filler,
  ChartDataLabels
);

export const chartComponents = {
  bar: 'bar',
  line: 'line',
  area: 'line',
  pie: 'pie',
  doughnut: 'doughnut',
  radar: 'radar',
  Radar: RadarController
};

export const colorPalettes = [
  { p: '#6366f1', s: '#f43f5e', t: '#10b981', q: '#f59e0b' }, // Indigo / Rose / Emerald / Amber
  { p: '#10b981', s: '#3b82f6', t: '#8b5cf6', q: '#06b6d4' }, // Emerald / Blue / Violet / Cyan
  { p: '#f59e0b', s: '#ef4444', t: '#14b8a6', q: '#ec4899' }, // Amber / Red / Teal / Pink
  { p: '#8b5cf6', s: '#06b6d4', t: '#f43f5e', q: '#10b981' }, // Violet / Cyan / Rose / Emerald
  { p: '#3b82f6', s: '#10b981', t: '#f59e0b', q: '#6366f1' }, // Blue / Emerald / Amber / Indigo
  { p: '#ec4899', s: '#8b5cf6', t: '#3b82f6', q: '#14b8a6' }, // Pink / Violet / Blue / Teal
  { p: '#FCD34D', s: '#F87171', t: '#60A5FA', q: '#34D399' }, // Pastel Punch
  { p: '#0EA5E9', s: '#D946EF', t: '#F59E0B', q: '#10B981' }, // Cyberpunk Bright
  { p: '#312E81', s: '#4338CA', t: '#5850EC', q: '#667EEA' }, // Deep Oceans
  { p: '#991B1B', s: '#B91C1C', t: '#DC2626', q: '#EF4444' }, // Crimson Gradient
  { p: '#064E3B', s: '#065F46', t: '#047857', q: '#059669' }, // Forest Depths
  { p: '#78350F', s: '#92400E', t: '#B45309', q: '#D97706' }, // Earthy Tones
  { p: '#1E293B', s: '#000000', t: '#475569', q: '#94A3B8' }, // Luxury Dark
  { p: '#BE185D', s: '#DB2777', t: '#F472B6', q: '#FBCFE8' }, // Rose Petals
  { p: '#2563eb', s: '#4f46e5', t: '#7c3aed', q: '#9333ea' }, // Blues & Purples
  { p: '#059669', s: '#10b981', t: '#34d399', q: '#6ee7b7' }, // All Greens
  { p: '#dc2626', s: '#ea580c', t: '#f59e0b', q: '#fbbf24' }, // Warm / Fire
  { p: '#0891b2', s: '#06b6d4', t: '#22d3ee', q: '#67e8f9' }, // Cool / Water
  { p: '#4f46e5', s: '#ec4899', t: '#f43f5e', q: '#fbbf24' }, // Modern / Vibrant
  { p: '#1e293b', s: '#475569', t: '#94a3b8', q: '#cbd5e1' }  // Slate / Grayscale
];

export const iconMappings = [
  { regex: /(male|man|boy|men|guys)/, icon: 'mdi:gender-male', label: 'male man boy men guys person gender' },
  { regex: /(female|woman|girl|women|ladies)/, icon: 'mdi:gender-female', label: 'female woman girl women ladies person gender' },
  { regex: /(accessibility|disability|disabled|dda|handicap)/, icon: 'Accessibility', label: 'accessibility disability disabled dda handicap' },
  { regex: /(wheelchair)/, icon: 'mdi:wheelchair', label: 'wheelchair disability accessibility handicap' },
  { regex: /(child|children|kids|infant)/, icon: 'mdi:baby-face-outline', label: 'child boy girl children kids infant baby' },
  { regex: /(household|family|relatives)/, icon: 'Users', label: 'family household relatives parents' },
  { regex: /(support|assistance|aid|help|care)/, icon: 'Heart', label: 'support assistance aid help care' },
  { regex: /(safety|protection|security|lock)/, icon: 'ShieldCheck', label: 'protection safety security lock' },
  { regex: /(food|meal|grocery|nutrition|eat)/, icon: 'hum:Food', label: 'food meal nutrition eat grocery humanitarian' },
  { regex: /(water|drink|hydration|liquid|wash)/, icon: 'hum:Water', label: 'water drink hydration liquid wash' },
  { regex: /(health|medical|clinic|doctor|medicine|hospital)/, icon: 'hum:Health', label: 'health medical clinic doctor medicine hospital humanitarian' },
  { regex: /(shelter|housing|camp|home|building)/, icon: 'hum:Shelter', label: 'shelter housing camp home building' },
  { regex: /(education|school|student|learning|class|teacher)/, icon: 'hum:Education', label: 'education school student learning class teacher' },
  { regex: /(finance|money|funding|budget|grant|cash|profit)/, icon: 'hum:Financing', label: 'finance money funding budget grant cash profit' },
  { regex: /(job|employment|livelihood|work|career|business)/, icon: 'Briefcase', label: 'job employment livelihood work career business' },
  { regex: /(transport|vehicle|bus|car|truck|travel)/, icon: 'Truck', label: 'transport vehicle bus car truck travel' },
  { regex: /(community|social|society|group)/, icon: 'Users', label: 'community social society group' },
  { regex: /(awareness|training|sessions|knowledge|info)/, icon: 'Info', label: 'awareness training sessions knowledge info' },
  { regex: /(project|activity|program|task)/, icon: 'Layers', label: 'project activity program task' },
  { regex: /(complaint|feedback|report|response|chat)/, icon: 'MessageCircle', label: 'complaint feedback report response chat' },
  { regex: /(debt|loan|finance|liability|bill)/, icon: 'CreditCard', label: 'debt loan finance liability bill' },
  { regex: /(risk|danger|hazard|threat|warning)/, icon: 'AlertTriangle', label: 'risk danger hazard threat warning' },
  { regex: /(displacement|displaced|refugees|migration|move)/, icon: 'hum:Refugees', label: 'displacement displaced refugees migration move' },
  { regex: /(report|document|file|data)/, icon: 'FileText', label: 'report document file data' },
  { regex: /(indicator|metrics|target|goal)/, icon: 'Target', label: 'indicator metrics target goal' },
  { regex: /(survey|questionnaire|assessment|check)/, icon: 'ClipboardCheck', label: 'survey questionnaire assessment check' },
  { regex: /(nutrition)/, icon: 'hum:Nutrition', label: 'nutrition food health' },
  { regex: /(protection|safety|security)/, icon: 'hum:Protection', label: 'protection safety security' },
  { regex: /(sanitation|latrine|toilet|hygiene)/, icon: 'hum:Sanitation', label: 'sanitation hygiene wash' },
  { regex: /(logistics|supply|delivery)/, icon: 'hum:Logistics', label: 'logistics supply delivery' },
  { regex: /(agriculture|farming|crops)/, icon: 'hum:Agriculture', label: 'agriculture farming crops' },
  { regex: /(camera|photo|image|picture)/, icon: 'Camera', label: 'camera photo image picture' },
  { regex: /(phone|mobile|cell|smartphone)/, icon: 'Smartphone', label: 'phone mobile cell smartphone' },
  { regex: /(laptop|computer|pc|desktop)/, icon: 'Laptop', label: 'laptop computer pc desktop' },
  { regex: /(tv|television|screen|display|monitor)/, icon: 'Tv', label: 'tv television screen display monitor' },
  { regex: /(search|find|lookup)/, icon: 'Search', label: 'search find lookup' },
  { regex: /(settings|config|gear)/, icon: 'Settings', label: 'settings config gear settings' },
  { regex: /(trash|delete|remove)/, icon: 'Trash2', label: 'trash delete remove' },
  { regex: /(edit|write|pencil)/, icon: 'Edit3', label: 'edit write pencil' },
  { regex: /(cloud|online|network)/, icon: 'Cloud', label: 'cloud online network' },
  { regex: /(shopping|cart|store|bag)/, icon: 'ShoppingCart', label: 'shopping cart store bag buy' },
  { regex: /(location|map|pin|place)/, icon: 'MapPin', label: 'location map pin place' }
];

const humIconMappings = Object.keys(humIconsMetadata).map(key => ({
  icon: `hum:${key}`,
  label: key.toLowerCase().replace(/-/g, ' ') + ' humanitarian'
}));

const mainFuse = new Fuse(iconMappings, {
  keys: ['label', 'icon'],
  threshold: 0.35,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2
});

const humFuse = new Fuse(humIconMappings, {
  keys: ['label', 'icon'],
  threshold: 0.35,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2
});

export const searchIcons = (query, library = 'standard') => {
  const targetMappings = library === 'humanitarian' ? humIconMappings : iconMappings;
  const targetFuse = library === 'humanitarian' ? humFuse : mainFuse;

  if (!query) {
    const uniqueIcons = new Map();
    targetMappings.forEach(item => {
      if (!uniqueIcons.has(item.icon)) {
        uniqueIcons.set(item.icon, { icon: item.icon, label: item.label });
      }
    });
    return Array.from(uniqueIcons.values()).slice(0, library === 'humanitarian' ? 40 : 20);
  }

  const results = targetFuse.search(query);
  const uniqueIcons = new Map();

  results.forEach(r => {
    if (!uniqueIcons.has(r.item.icon)) {
      uniqueIcons.set(r.item.icon, { icon: r.item.icon, label: r.item.label });
    }
  });

  return Array.from(uniqueIcons.values());
};

export const getCategoryIcon = (label, dynamicOverrides = {}) => {
  const normalized = String(label).toLowerCase();

  // Check dynamic overrides first
  if (dynamicOverrides[normalized]) {
    return dynamicOverrides[normalized];
  }

  for (const item of iconMappings) {
    if (item.regex.test(normalized)) {
      return item.icon;
    }
  }

  const fuzzyResult = mainFuse.search(normalized)[0];
  if (fuzzyResult && typeof fuzzyResult.score === 'number' && fuzzyResult.score <= 0.45) {
    return fuzzyResult.item.icon;
  }

  const fallbackIcons = ['Box', 'Layers', 'Package', 'Archive', 'Database', 'Folder', 'Layout', 'Square', 'Circle', 'Triangle'];
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }

  return fallbackIcons[Math.abs(hash) % fallbackIcons.length];
};

export const getSemanticIcon = (label) => {
  // Future: replace with semantic AI / embeddings-based classification
  return getCategoryIcon(label);
};

export const buildChartOptions = (config, visuals, rawTotal, labels = [], filters = []) => {
  const scalingRatio = Math.max(0.4, visuals.chartHeight / 600);

  const isHorizontalMode = ['horizontalBar', 'stackedHorizontalBar'].includes(config.chartType) ||
    (['bar', 'stackedBar', 'line', 'spline', 'steppedLine', 'area', 'smoothArea', 'combo', 'scatter'].includes(config.chartType) && visuals.chartOrientation === 'h');

  const isStackedMode = ['stackedBar', 'stackedHorizontalBar'].includes(config.chartType) || !!config.stacked;

  const numberFormatter = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    if (config.numberFormat === 'compact') {
      return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(num);
    }
    return new Intl.NumberFormat('en-US').format(num);
  };

  return {
    responsive: true,
    devicePixelRatio: 2, // High resolution override
    indexAxis: isHorizontalMode ? 'y' : 'x',
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: (visuals.legendPosition === 'top' ? (5 + (visuals.legendSpacing || 0)) * scalingRatio : 0) + 10 * scalingRatio,
        bottom: (visuals.legendPosition === 'bottom' ? (5 + (visuals.legendSpacing || 0)) * scalingRatio : (visuals.showIcons ? 10 * scalingRatio : 15 * scalingRatio)) + 10 * scalingRatio,
        left: (visuals.legendPosition === 'left' ? (5 + (visuals.legendSpacing || 0)) * scalingRatio : (isHorizontalMode && visuals.showIcons ? 65 * scalingRatio : (isHorizontalMode ? 25 : 45))) + 10 * scalingRatio,
        right: (visuals.legendPosition === 'right' ? (5 + (visuals.legendSpacing || 0)) * scalingRatio : 30 * scalingRatio) + 10 * scalingRatio
      }
    },
    animation: {
      duration: 350,
      easing: 'easeOutQuart'
    },
    plugins: {
      title: {
        display: false,
        text: config.chartTitle,
        color: '#1e293b',
        font: { family: 'Inter', size: 20 * scalingRatio, weight: '800' },
        padding: { top: 15, bottom: 5 }
      },
      legend: {
        display: visuals.showLegend,
        position: visuals.legendPosition || 'top',
        align: 'center',
        fullSize: true,
        maxHeight: (visuals.legendPosition === 'top' || visuals.legendPosition === 'bottom') ? 120 * scalingRatio : undefined,
        maxWidth: (visuals.legendPosition === 'left' || visuals.legendPosition === 'right') ? (visuals.legendWidth || 180) : undefined,
        padding: 40 * scalingRatio,
        labels: {
          font: { family: 'Inter', size: (visuals.legendFontSize || 12) * scalingRatio, weight: '800' },
          usePointStyle: true,
          pointStyleWidth: 12 * scalingRatio,
          padding: ((visuals.legendPosition === 'left' || visuals.legendPosition === 'right') ? 12 : 20) * scalingRatio,
          color: '#334155',
          boxWidth: 10 * scalingRatio,
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            const labels = chart.data.labels;
            const charLimit = visuals.labelMaxLength || 40;

            if (config.groupBy) {
              return datasets.map((dataset, index) => {
                const bgColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor;
                const bColor = Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor;
                let text = dataset.label;
                if (text.length > charLimit) {
                  text = text.slice(0, Math.max(3, charLimit - 3)) + '...';
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

            if (datasets.length > 0 && !config.groupBy) {
              return labels.map((label, i) => {
                const dataset = datasets[0];
                const bgColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : dataset.backgroundColor;
                const bColor = Array.isArray(dataset.borderColor) ? dataset.borderColor[i] : dataset.borderColor;
                let text = String(label);
                if (text.length > charLimit) {
                  text = text.slice(0, Math.max(3, charLimit - 3)) + '...';
                }
                const originalLabel = dataset.originalLabels?.[i];
                const filterItem = originalLabel ? filters.find(f => f.label === originalLabel) : null;
                const isHidden = filterItem ? filterItem.visible === false : false;
                return {
                  text,
                  fillStyle: bgColor,
                  strokeStyle: bColor,
                  lineWidth: dataset.borderWidth,
                  hidden: isHidden,
                  index: i,
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
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 13 * scalingRatio, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 * scalingRatio, weight: 'bold' },
        padding: 12 * scalingRatio,
        cornerRadius: 12 * scalingRatio,
        callbacks: {
          title: (items) => items?.[0]?.label || '',
          label: (context) => {
            const dataset = context.dataset;
            const xIndex = context.dataIndex;
            const rawValue = dataset.rawData?.[xIndex] ?? Number(context.raw);
            const labelPrefix = config.groupBy ? `${dataset.label}: ` : '';

            if (config.showPercentage) {
              const percent = rawTotal === 0 ? 0 : ((Number(rawValue) / rawTotal) * 100).toFixed(1);
              return ` ${labelPrefix}${percent}% (${numberFormatter(Number(rawValue))})`;
            }
            return ` ${labelPrefix}${numberFormatter(Number(rawValue))}`;
          }
        }
      },
      datalabels: {
        display: visuals.showDataLabels ? 'auto' : false,
        anchor: visuals.dataLabelPosition === 'inside' ? 'center' : 'end',
        align: visuals.dataLabelPosition === 'inside' ? 'center' : 'end',
        offset: (visuals.dataLabelPosition === 'inside' ? 0 : 12) * scalingRatio,
        font: { family: 'Inter', weight: 'bold', size: (visuals.dataLabelFontSize || 11) * scalingRatio },
        color: visuals.dataLabelColor || (visuals.dataLabelPosition === 'inside' ? '#ffffff' : '#475569'),
        padding: 4 * scalingRatio,
        formatter: (value, context) => {
          const rawValue = context.dataset.rawData?.[context.dataIndex] ?? Number(value);
          const percentage = rawTotal === 0 ? 0 : (Number(rawValue) / rawTotal) * 100;

          // Hide labels for segments smaller than 2% in Pie/Doughnut/PolarArea charts to prevent overlaps
          if (percentage < 2 && ['pie', 'doughnut', 'semiDoughnut', 'polarArea'].includes(config.chartType)) return null;

          if (config.showPercentage) {
            return `${percentage.toFixed(1)}%`;
          }
          return numberFormatter(rawValue);
        }
      }
    },
    scales: ['pie', 'doughnut', 'semiDoughnut'].includes(config.chartType)
      ? {}
      : ['radar', 'polarArea'].includes(config.chartType)
        ? {
          r: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            angleLines: { color: 'rgba(0,0,0,0.05)' },
            pointLabels: {
              font: { family: 'Inter', size: ((visuals.xAxisFontSize || 11) - 1) * scalingRatio, weight: '700' },
              color: '#64748b'
            },
            ticks: {
              backdropColor: 'transparent',
              color: '#94a3b8',
              font: { family: 'Inter', size: 9 * scalingRatio },
              callback: (val) => numberFormatter(val)
            }
          }
        }
        : {
          y: {
            stacked: isStackedMode,
            display: visuals.grid,
            beginAtZero: !isHorizontalMode,
            max: (!isHorizontalMode && config.showPercentage) ? 100 : undefined,
            grid: { color: 'rgba(0,0,0,0.03)', drawBorder: false },
            ticks: {
              display: visuals.showAxisTicks !== false,
              color: '#64748b',
              maxRotation: isHorizontalMode ? 0 : 90,
              minRotation: isHorizontalMode ? 0 : 0,
              autoSkip: !isHorizontalMode,
              autoSkipPadding: 15,
              font: {
                family: 'Inter',
                weight: '600',
                size: ((isHorizontalMode ? (visuals.xAxisFontSize > 12 ? 12 : visuals.xAxisFontSize) : visuals.yAxisFontSize) || 11) * scalingRatio
              },
              callback: function (value) {
                if (isHorizontalMode) {
                  let lbl = labels[value] || this.getLabelForValue(value);
                  lbl = String(lbl);
                  const maxChars = visuals.labelMaxLength || 20;
                  if (lbl.length > maxChars) {
                    const words = lbl.split(' ');
                    const lines = [];
                    let currentLine = '';
                    words.forEach(word => {
                      if ((currentLine + ' ' + word).trim().length <= maxChars) {
                        currentLine = (currentLine + ' ' + word).trim();
                      } else {
                        if (currentLine) lines.push(currentLine);
                        currentLine = word.length > maxChars ? word.slice(0, maxChars - 3) + '...' : word;
                      }
                    });
                    if (currentLine) lines.push(currentLine);
                    return lines;
                  }
                  return lbl;
                }
                if (config.showPercentage) {
                  return `${Number(value).toFixed(0)}%`;
                }
                return numberFormatter(value);
              },
              padding: 8 * scalingRatio
            },
            title: {
              display: isHorizontalMode ? visuals.showXAxisLabel : visuals.showYAxisLabel,
              text: isHorizontalMode ? (config.xAxisLabel || config.xAxis) : (config.yAxisLabel || config.yAxis),
              color: '#475569',
              font: {
                family: 'Inter',
                size: ((isHorizontalMode ? visuals.xAxisTitleFontSize : visuals.yAxisTitleFontSize) || 12) * scalingRatio,
                weight: 'bold'
              },
              padding: { bottom: 2 * scalingRatio }
            }
          },
          x: {
            stacked: isStackedMode,
            display: visuals.grid,
            beginAtZero: isHorizontalMode,
            max: (isHorizontalMode && config.showPercentage) ? 100 : undefined,
            grid: { display: false },
            ticks: {
              display: visuals.showAxisTicks !== false,
              color: '#64748b',
              maxRotation: 0,
              minRotation: 0,
              autoSkip: isHorizontalMode,
              autoSkipPadding: 15,
              font: {
                family: 'Inter',
                weight: '600',
                size: ((isHorizontalMode ? visuals.yAxisFontSize : (visuals.xAxisFontSize > 11 ? 11 : visuals.xAxisFontSize)) || 11) * scalingRatio
              },
              callback: function (value) {
                if (isHorizontalMode) {
                  if (config.showPercentage) {
                    return `${Number(value).toFixed(0)}%`;
                  }
                  return numberFormatter(value);
                }
                let lbl = labels[value] || this.getLabelForValue(value);
                lbl = String(lbl);
                const maxChars = visuals.labelMaxLength || 20;
                if (lbl.length > maxChars) {
                  const words = lbl.split(' ');
                  const lines = [];
                  let currentLine = '';
                  words.forEach(word => {
                    if ((currentLine + ' ' + word).trim().length <= maxChars) {
                      currentLine = (currentLine + ' ' + word).trim();
                    } else {
                      if (currentLine) lines.push(currentLine);
                      currentLine = word.length > maxChars ? word.slice(0, maxChars - 3) + '...' : word;
                    }
                  });
                  if (currentLine) lines.push(currentLine);
                  return lines;
                }
                return lbl;
              },
              padding: (!isHorizontalMode ? (visuals.showIcons ? 12 : 8) : 8) * scalingRatio
            },
            title: {
              display: isHorizontalMode ? visuals.showYAxisLabel : visuals.showXAxisLabel,
              text: isHorizontalMode ? (config.yAxisLabel || config.yAxis) : (config.xAxisLabel || config.xAxis),
              color: '#475569',
              font: {
                family: 'Inter',
                size: ((isHorizontalMode ? visuals.yAxisTitleFontSize : visuals.xAxisTitleFontSize) || 12) * scalingRatio,
                weight: 'bold'
              },
              padding: { top: 2 * scalingRatio }
            }
          }
        }
  };
};
