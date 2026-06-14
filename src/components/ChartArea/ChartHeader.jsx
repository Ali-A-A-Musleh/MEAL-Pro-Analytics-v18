import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SafeIcon from '../SafeIcon';

const ChartHeader = ({ chartType, onSetChartType, onToggleSidebar }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const hoverTimeoutRef = useRef(null);

  const categories = [
    {
      id: 'lines',
      title: 'Statistical Lines',
      icon: 'TrendingUp',
      color: 'from-blue-500 to-indigo-600',
      glow: 'shadow-blue-200/50',
      items: [
        { id: 'line', icon: 'TrendingUp', label: 'Line Trends', desc: 'Linear trends over uniform continuous intervals' },
        { id: 'spline', icon: 'Activity', label: 'Curved Splines', desc: 'Smooth bezier curve paths minimizing visual noise' },
        { id: 'steppedLine', icon: 'Menu', label: 'Stepped Lines', desc: 'Discrete step changes indicating abrupt updates' },
        { id: 'area', icon: 'Mountain', label: 'Area Volumes', desc: 'Linear line chart with filled volume areas' },
        { id: 'smoothArea', icon: 'Waves', label: 'Smooth Areas', desc: 'Beizer curved area volumes with gradient fills' }
      ]
    },
    {
      id: 'pillars',
      title: 'Pillars & Columns',
      icon: 'BarChart3',
      color: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-200/50',
      items: [
        { id: 'bar', icon: 'BarChart2', label: 'Vertical Columns', desc: 'Observe individual discrete column sizes' },
        { id: 'horizontalBar', icon: 'AlignLeft', label: 'Horizontal Bars', desc: 'Horizontal layout suited for long label names' },
        { id: 'stackedBar', icon: 'Layers', label: 'Stacked Columns', desc: 'Segmented columns showing portion breakdowns' },
        { id: 'stackedHorizontalBar', icon: 'Database', label: 'Stacked Horizontals', desc: 'Horizontal segmented stack comparisons' }
      ]
    },
    {
      id: 'distribution',
      title: 'Radial & Proportional',
      icon: 'PieChart',
      color: 'from-violet-500 to-fuchsia-600',
      glow: 'shadow-violet-200/50',
      items: [
        { id: 'pie', icon: 'PieChart', label: 'Pie Chart', desc: 'Visualize proportional percentages of a whole' },
        { id: 'doughnut', icon: 'CircleDot', label: 'Doughnut Ring', desc: 'Relative share donut with customizable center' },
        { id: 'semiDoughnut', icon: 'Gauge', label: 'Semi-Doughnut', desc: 'Compact half-circle speedometer style tracker' },
        { id: 'radar', icon: 'Disc', label: 'Radar Spider', desc: 'Multivariate radar grid matching spider webs' },
        { id: 'polarArea', icon: 'Compass', label: 'Polar Area', desc: 'Sector sizes mapped by distance from center' }
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced Analytics',
      icon: 'Sliders',
      color: 'from-amber-600 to-rose-600',
      glow: 'shadow-rose-200/50',
      items: [
        { id: 'combo', icon: 'PlusSquare', label: 'Combo Bar & Line', desc: 'Overlay raw column data with secondary curve trends' },
        { id: 'scatter', icon: 'Grid', label: 'Scatter Correlation', desc: 'Correlate bivariate values as 2D coordinate dots' }
      ]
    }
  ];

  const handleMouseEnter = (catId) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setActiveCategory(catId);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 250);
  };

  const toggleCategory = (catId) => {
    setActiveCategory(prev => prev === catId ? null : catId);
  };

  const currentChartItem = categories
    .flatMap(c => c.items)
    .find(item => item.id === chartType) || { id: 'bar', icon: 'BarChart2', label: 'Columns', desc: 'Vertical column comparisons' };

  return (
    <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 relative z-40 w-full mb-4">
      
      {/* BRANDING HUB */}
      <div className="flex items-center gap-4 w-full xl:w-auto">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden touch-target p-2.5 rounded-full glass-panel shadow-sm border border-slate-200/80 hover:scale-105 active:scale-95 transition-transform bg-white/90"
        >
          <SafeIcon name="Menu" size={22} className="text-slate-700" />
        </button>
        <div>
          <h2 className="text-2xl lg:text-3.5xl font-black text-slate-900 tracking-tight">
            MEAL Pro Analytics Studio
          </h2>
          <p className="text-slate-500 text-xs lg:text-sm font-medium mt-1">
            Dynamic analytics engine, smart styling parameters, and live multi-type charts
          </p>
        </div>
      </div>

      {/* DROPDOWNS BAR */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50/50 p-2 rounded-3xl border border-slate-200/50 backdrop-blur-xl shadow-md w-full xl:w-auto overflow-visible select-none justify-end">
        
        {/* Selected Indicator Pill */}
        <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 bg-indigo-50/70 border border-indigo-100 rounded-2xl shrink-0">
          <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <SafeIcon name={currentChartItem.icon} size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none">ACTIVE TYPE</span>
            <span className="text-[11px] font-black text-indigo-950 mt-0.5">{currentChartItem.label}</span>
          </div>
        </div>

         {/* Category Controls Selector */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto relative" onMouseLeave={handleMouseLeave}>
          {categories.map((cat) => {
            const hasActiveUnder = cat.items.some(it => it.id === chartType);
            const isOpen = activeCategory === cat.id;
            const isLeftCategory = ['lines', 'pillars'].includes(cat.id);
            const positionClasses = isLeftCategory
              ? "lg:left-0 lg:right-auto lg:translate-x-0"
              : "lg:right-0 lg:left-auto lg:translate-x-0";

            return (
              <div
                key={cat.id}
                className="static lg:relative"
                onMouseEnter={() => handleMouseEnter(cat.id)}
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  title={cat.title}
                  className={`px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-[11px] font-black tracking-tight transition-all duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2 border shadow-sm ${
                    hasActiveUnder 
                      ? 'bg-gradient-to-r text-white border-transparent ' + cat.color + ' ' + cat.glow
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-350 hover:bg-slate-50'
                  }`}
                >
                  <SafeIcon name={cat.icon} size={13} className="shrink-0" />
                  <span className="hidden lg:inline">{cat.title}</span>
                  <SafeIcon name="ChevronDown" size={11} className={`transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className={`absolute left-2 right-2 ${positionClasses} top-full mt-2.5 lg:w-96 bg-white/95 rounded-[1.8rem] border border-slate-200/80 shadow-2xl p-2.5 z-50 backdrop-blur-2xl origin-top`}
                    >
                      <div className="px-3.5 py-2.5 bg-slate-50 rounded-[1.2rem] border border-slate-100 mb-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none block">Category Layouts</span>
                        <span className="text-[12px] font-black text-slate-800 mt-1 block">{cat.title}</span>
                      </div>

                      <div className="flex flex-col gap-1 max-h-96 overflow-y-auto no-scrollbar">
                        {cat.items.map((item) => {
                          const isSelected = chartType === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                onSetChartType(item.id);
                                setActiveCategory(null);
                              }}
                              className={`w-full p-2.5 rounded-[1.2rem] text-left transition-all flex items-start gap-3 cursor-pointer group hover:scale-[1.01] ${
                                isSelected
                                  ? 'bg-indigo-50/80 border border-indigo-200/40 shadow-sm'
                                  : 'hover:bg-slate-50 border border-transparent'
                              }`}
                            >
                              <div className={`p-2 rounded-xl shrink-0 transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-indigo-600 text-white shadow-md scale-105' 
                                  : 'bg-slate-150-custom text-slate-500 bg-slate-100 group-hover:bg-indigo-100/60 group-hover:text-indigo-600'
                              }`}>
                                <SafeIcon name={item.icon} size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={`text-[11.5px] font-black block leading-tight ${isSelected ? 'text-indigo-950' : 'text-slate-700 group-hover:text-indigo-950'}`}>
                                  {item.label}
                                </span>
                                <span className={`text-[9.5px] font-medium leading-snug block mt-0.5 ${isSelected ? 'text-indigo-600/95 font-semibold' : 'text-slate-400 group-hover:text-slate-500'}`}>
                                  {item.desc}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="self-center pr-1 shrink-0">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shadow shadow-indigo-400 animate-pulse" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default ChartHeader;
