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
  Tooltip,
  Legend,
  Title,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
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
  doughnut: 'doughnut'
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

export const buildChartOptions = (config, visuals, rawTotal) => {
  const numberFormatter = (value) => {
    if (config.numberFormat === 'compact') {
      return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(value);
    }
    return new Intl.NumberFormat('en-US').format(value);
  };

  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: ['pie', 'doughnut'].includes(config.chartType) 
          ? (config.chartTitle ? (visuals.showLegend ? 60 : 30) : (visuals.showLegend ? 50 : 20))
          : (config.chartTitle ? (visuals.showLegend ? 40 : 20) : (visuals.showLegend ? 30 : 10)),
        bottom: visuals.showIcons ? 15 : 5,
        left: 10,
        right: 10
      }
    },
    animation: {
      duration: 800,
      easing: 'easeOutQuart'
    },
    plugins: {
      title: {
        display: Boolean(config.chartTitle),
        text: config.chartTitle,
        color: '#0f172a',
        font: { family: 'Inter', size: 18, weight: '800' },
        padding: { top: 10, bottom: 20 }
      },
      legend: {
        display: visuals.showLegend,
        position: 'top',
        align: 'center',
        labels: {
          font: { family: 'Inter', size: visuals.legendFontSize || 12, weight: 'bold' },
          usePointStyle: true,
          padding: 24,
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            const labels = chart.data.labels;
            
            // If grouped, show datasets as legend items
            if (config.groupBy) {
              return datasets.map((dataset, index) => {
                const bgColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor;
                const bColor = Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor;
                return {
                  text: dataset.label,
                  fillStyle: bgColor,
                  strokeStyle: bColor || bgColor,
                  lineWidth: 1,
                  hidden: !chart.isDatasetVisible(index),
                  datasetIndex: index,
                  pointStyle: 'circle'
                };
              });
            }
            
            // If no Group By is used but color mode is not 'single', generate individual legend items for each bar/category
            if (datasets.length > 0 && visuals.colorMode !== 'single') {
              return labels.map((label, i) => {
                const dataset = datasets[0];
                const bgColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : dataset.backgroundColor;
                const bColor = Array.isArray(dataset.borderColor) ? dataset.borderColor[i] : dataset.borderColor;
                return {
                  text: String(label),
                  fillStyle: bgColor,
                  strokeStyle: bColor,
                  lineWidth: dataset.borderWidth,
                  hidden: !chart.isDatasetVisible(0),
                  index: i,
                  datasetIndex: 0,
                  pointStyle: 'circle'
                };
              });
            }
            
            // Default legend behavior
            return datasets.map((dataset, index) => ({
              text: dataset.label,
              fillStyle: dataset.backgroundColor,
              strokeStyle: dataset.backgroundColor,
              lineWidth: 0,
              hidden: !chart.isDatasetVisible(index),
              datasetIndex: index,
              pointStyle: 'circle'
            }));
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 13, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12, weight: 'bold' },
        padding: 12,
        cornerRadius: 12,
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
        offset: visuals.dataLabelPosition === 'inside' ? 0 : 12,
        font: { family: 'Inter', weight: 'bold', size: visuals.dataLabelFontSize || 11 },
        color: visuals.dataLabelColor || (visuals.dataLabelPosition === 'inside' ? '#ffffff' : '#475569'),
        padding: 4,
        formatter: (value, context) => {
          const rawValue = context.dataset.rawData?.[context.dataIndex] ?? Number(value);
          const percentage = rawTotal === 0 ? 0 : (Number(rawValue) / rawTotal) * 100;

          // Hide labels for segments smaller than 2% in Pie/Doughnut charts to prevent overlaps
          if (percentage < 2 && ['pie', 'doughnut'].includes(config.chartType)) return null;

          if (config.showPercentage) {
            return `${percentage.toFixed(1)}%`;
          }
          return numberFormatter(value);
        }
      }
    },
    scales: ['pie', 'doughnut'].includes(config.chartType)
      ? {}
      : {
          y: {
            display: visuals.grid,
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.03)', drawBorder: false },
            ticks: { 
              color: '#64748b', 
              font: { family: 'Inter', weight: '600', size: visuals.yAxisFontSize || 11 },
              callback: (value) => numberFormatter(value),
              padding: 10
            },
            title: {
              display: visuals.showYAxisLabel,
              text: config.yAxisLabel || config.yAxis,
              color: '#475569',
              font: { family: 'Inter', size: visuals.yAxisTitleFontSize || 12, weight: 'bold' },
              padding: { bottom: 10 }
            }
          },
          x: {
            display: visuals.grid,
            grid: { display: false },
            ticks: { 
              color: '#64748b', 
              font: { family: 'Inter', weight: '600', size: visuals.xAxisFontSize || 11 },
              padding: 10
            },
            title: {
              display: visuals.showXAxisLabel,
              text: config.xAxisLabel || config.xAxis,
              color: '#475569',
              font: { family: 'Inter', size: visuals.xAxisTitleFontSize || 12, weight: 'bold' },
              padding: { top: 10 }
            }
          }
        }
  };
};
