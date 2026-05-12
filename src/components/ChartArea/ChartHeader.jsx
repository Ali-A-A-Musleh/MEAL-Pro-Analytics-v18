import { motion } from 'motion/react';
import SafeIcon from '../SafeIcon';

const ChartHeader = ({ chartType, onSetChartType, onToggleSidebar }) => {
  const chartTypes = [
    { id: 'bar', icon: 'BarChart2', label: 'Bars' },
    { id: 'line', icon: 'TrendingUp', label: 'Lines' },
    { id: 'area', icon: 'Mountain', label: 'Areas' },
    { id: 'pie', icon: 'PieChart', label: 'Pie' },
    { id: 'doughnut', icon: 'Donut', label: 'Doughnut' }
  ];

  return (
    <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="lg:hidden touch-target p-2 rounded-full bg-white shadow-sm border border-slate-200"
      >
        <SafeIcon name="Menu" size={24} className="text-slate-700" />
      </button>
      <div>
        <h2 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight">Advanced Analytics Center</h2>
        <p className="text-slate-500 text-xs lg:text-sm font-medium mt-1">Smart Monitoring and Evaluation System for Humanitarian and Development Projects</p>
      </div>

      <div className="flex bg-white p-1 rounded-full shadow-sm border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
        {chartTypes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSetChartType(item.id)}
            className={`relative px-4 lg:px-6 py-2 lg:py-3 rounded-full flex items-center gap-2 transition-all duration-300 whitespace-nowrap touch-target ${chartType === item.id ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {chartType === item.id && (
              <motion.div
                layoutId="activeChart"
                className="absolute inset-0 bg-indigo-600 rounded-full shadow-lg shadow-indigo-100"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <SafeIcon name={item.icon} size={16} />
              <span className="text-xs font-black hidden sm:inline">{item.label}</span>
            </span>
          </button>
        ))}
      </div>
    </header>
  );
};

export default ChartHeader;
