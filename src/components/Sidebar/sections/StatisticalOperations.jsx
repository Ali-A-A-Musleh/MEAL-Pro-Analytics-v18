import SafeIcon from '../../SafeIcon';

const StatisticalOperations = ({ aggFunc, showPercentage, onSetAggFunc, onTogglePercentage, config, onSetConfig }) => {
  return (
    <section className="space-y-4">
      <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
        <SafeIcon name="FunctionSquare" size={12} /> Statistical Operations & Analysis
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 block ml-1">Aggregation Logic</label>
          <div className="grid grid-cols-3 gap-1.5">
            {['sum', 'avg', 'count', 'unique', 'max', 'min'].map((func) => (
              <button
                key={func}
                onClick={() => onSetAggFunc(func)}
                className={`py-2 px-2 rounded-xl border text-[10px] font-bold transition-all touch-target ${aggFunc === func ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'}`}
              >
                {func.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block ml-1">Data Synthesis</label>
          <button
            onClick={onTogglePercentage}
            className={`w-full py-3 rounded-2xl border text-[10px] font-black transition-all flex items-center justify-center gap-2 touch-target ${showPercentage ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'}`}
          >
            <SafeIcon name="Percent" size={14} />
            {showPercentage ? 'Return to Raw Values' : 'Convert to Percentages (%)'}
          </button>

          <button
            onClick={() => onSetConfig({ ...config, showTrendline: !config.showTrendline })}
            className={`w-full py-3 rounded-2xl border text-[10px] font-black transition-all flex items-center justify-center gap-2 touch-target ${config.showTrendline ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'}`}
          >
            <SafeIcon name="TrendingUp" size={14} />
            {config.showTrendline ? 'Remove Linear Trend' : 'Inject Linear Trendline'}
          </button>

          <button
            onClick={() => onSetConfig({ ...config, showRawPath: !config.showRawPath })}
            className={`w-full py-3 rounded-2xl border text-[10px] font-black transition-all flex items-center justify-center gap-2 touch-target ${config.showRawPath ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-rose-300'}`}
          >
            <SafeIcon name="Share2" size={14} />
            {config.showRawPath ? 'Remove Raw Dashed Line' : 'Inject Raw Dashed Line'}
          </button>
        </div>
        
        {config.chartType === 'radar' && (
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
            <p className="text-[9px] font-bold text-amber-700 leading-tight">
              <SafeIcon name="Info" size={10} className="inline mr-1" />
              Radar charts are best for comparing multiple quantitative variables (at least 3 categories recommended).
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default StatisticalOperations;
