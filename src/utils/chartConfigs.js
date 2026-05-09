import Fuse from 'fuse.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
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
  { p: '#6366f1', s: '#f43f5e', t: '#10b981', q: '#f59e0b' },
  { p: '#10b981', s: '#3b82f6', t: '#8b5cf6', q: '#06b6d4' },
  { p: '#f59e0b', s: '#ef4444', t: '#14b8a6', q: '#ec4899' },
  { p: '#8b5cf6', s: '#06b6d4', t: '#f43f5e', q: '#10b981' },
  { p: '#3b82f6', s: '#10b981', t: '#f59e0b', q: '#6366f1' },
  { p: '#ec4899', s: '#8b5cf6', t: '#3b82f6', q: '#14b8a6' }
];

export const iconMappings = [
  { regex: /(male|man|boy|men|guys)/, icon: 'Male', label: 'male man' },
  { regex: /(female|woman|girl|women|ladies)/, icon: 'Female', label: 'female woman' },
  { regex: /(child|children|kids|infant)/, icon: 'User', label: 'child boy girl children' },
  { regex: /(household|family|relatives)/, icon: 'Users', label: 'family household' },
  { regex: /(support|assistance|aid|help)/, icon: 'Heart', label: 'support assistance aid help' },
  { regex: /(safety|protection|security)/, icon: 'ShieldCheck', label: 'protection safety security' },
  { regex: /(food|meal|grocery|nutrition)/, icon: 'Utensils', label: 'food meal nutrition' },
  { regex: /(water|drink|hydration|liquid)/, icon: 'Droplet', label: 'water drink hydration' },
  { regex: /(health|medical|clinic|doctor|medicine)/, icon: 'HeartPulse', label: 'health medical clinic doctor' },
  { regex: /(shelter|housing|camp|home)/, icon: 'Home', label: 'shelter housing camp' },
  { regex: /(education|school|student|learning)/, icon: 'BookOpen', label: 'education school student learning' },
  { regex: /(finance|money|funding|budget|grant|cash)/, icon: 'DollarSign', label: 'finance money funding budget' },
  { regex: /(job|employment|livelihood|work|career)/, icon: 'Briefcase', label: 'job employment livelihood work' },
  { regex: /(transport|vehicle|bus|car|truck)/, icon: 'Truck', label: 'transport vehicle bus car' },
  { regex: /(community|social|society)/, icon: 'Users', label: 'community social' },
  { regex: /(awareness|training|sessions|knowledge)/, icon: 'BookOpen', label: 'awareness training sessions' },
  { regex: /(project|activity|program)/, icon: 'Layers', label: 'project activity program' },
  { regex: /(complaint|feedback|report|response)/, icon: 'MessageCircle', label: 'complaint feedback report' },
  { regex: /(debt|loan|finance|liability)/, icon: 'CreditCard', label: 'debt loan finance' },
  { regex: /(risk|danger|hazard|threat)/, icon: 'AlertTriangle', label: 'risk danger hazard' },
  { regex: /(displacement|displaced|refugees|migration)/, icon: 'Flag', label: 'displacement displaced refugees' },
  { regex: /(report|document|file)/, icon: 'FileText', label: 'report document' },
  { regex: /(indicator|metrics|target)/, icon: 'Target', label: 'indicator metrics target' },
  { regex: /(survey|questionnaire|assessment)/, icon: 'ClipboardCheck', label: 'survey questionnaire assessment' },
  { regex: /(housing|shelter|domicile)/, icon: 'Home', label: 'housing shelter domicile' },
  { regex: /(camera|photo|image|picture)/, icon: 'Camera', label: 'camera photo image picture' },
  { regex: /(phone|mobile|cell|smartphone)/, icon: 'Smartphone', label: 'phone mobile cell' },
  { regex: /(laptop|computer|pc|desktop)/, icon: 'Laptop', label: 'laptop computer pc' },
  { regex: /(tv|television|screen|display)/, icon: 'Tv', label: 'tv television screen display' }
];

const fuse = new Fuse(iconMappings, {
  keys: ['label'],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2
});

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

  const fuzzyResult = fuse.search(normalized)[0];
  if (fuzzyResult && typeof fuzzyResult.score === 'number' && fuzzyResult.score <= 0.45) {
    return fuzzyResult.item.icon;
  }

  const fallbackIcons = ['Box', 'Layers', 'Package', 'Archive', 'Database', 'Folder', 'Layout'];
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

export const buildChartOptions = (config, visuals, rawTotal) => ({
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 20,
      bottom: visuals.showIcons && config.chartType === 'bar' ? 15 : 0
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
      position: 'top',
      labels: {
        font: { family: 'Inter', size: 12, weight: 'bold' },
        usePointStyle: true,
        padding: 20
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
          if (config.showPercentage) {
            const percent = rawTotal === 0 ? 0 : ((Number(rawValue) / rawTotal) * 100).toFixed(1);
            return ` ${dataset.label}: ${percent}% (${Number(rawValue).toLocaleString()})`;
          }
          return ` ${dataset.label}: ${Number(rawValue).toLocaleString()}`;
        }
      }
    },
    datalabels: {
      display: visuals.showDataLabels,
      anchor: 'end',
      align: 'end',
      font: { family: 'Inter', weight: 'bold', size: 11 },
      color: '#475569',
      formatter: (value, context) => {
        if (config.showPercentage) {
          const rawValue = context.dataset.rawData?.[context.dataIndex] ?? Number(value);
          if (rawTotal === 0) return '0%';
          return `${((Number(rawValue) / rawTotal) * 100).toFixed(1)}%`;
        }

        if (typeof value === 'number') {
          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
          if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        }
        return Number(value).toLocaleString();
      }
    }
  },
  scales: ['pie', 'doughnut'].includes(config.chartType)
    ? {}
    : {
        y: {
          grid: { display: visuals.grid, color: '#f1f5f9', drawBorder: false },
          ticks: {
            display: visuals.showAxisLabels,
            font: { family: 'Inter', size: 11 },
            color: '#64748b',
            callback: (value) => (config.showPercentage ? `${value}%` : Number(value).toLocaleString())
          },
          beginAtZero: true,
          max: config.showPercentage ? 100 : undefined,
          title: {
            display: visuals.showAxisLabels,
            text: config.yAxisLabel || config.yAxis,
            color: '#475569',
            font: { family: 'Inter', size: 12, weight: 'bold' }
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            display: visuals.showAxisLabels,
            font: { family: 'Inter', size: 11 },
            color: '#64748b'
          },
          title: {
            display: visuals.showAxisLabels,
            text: config.xAxisLabel || config.xAxis,
            color: '#475569',
            font: { family: 'Inter', size: 12, weight: 'bold' }
          }
        }
      }
});
