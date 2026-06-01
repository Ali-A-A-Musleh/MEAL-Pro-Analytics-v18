import SafeIcon from '../../SafeIcon';

const StatisticalOperations = ({ aggFunc, showPercentage, onSetAggFunc, onTogglePercentage, config, onSetConfig, columnTypes = {} }) => {
  const yAxisType = columnTypes[config.yAxis] || 'text';
  const isYNumeric = yAxisType === 'number';

  // Automatically switch active aggregation if Y-axis changed to qualitative and an invalid func was selected
  const isInvalidFunc = !isYNumeric && ['sum', 'avg', 'max', 'min'].includes(aggFunc);

  return (
    <section className="space-y-4">
      <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
        <SafeIcon name="FunctionSquare" size={12} /> Statistical Operations & Analysis
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 block ml-1">Aggregation Logic</label>
          <div className="grid grid-cols-3 gap-1.5">
            {['sum', 'avg', 'count', 'unique', 'max', 'min'].map((func) => {
              const requiresNumeric = ['sum', 'avg', 'max', 'min'].includes(func);
              const isDisabled = requiresNumeric && !isYNumeric;
              const isActive = aggFunc === func;

              return (
                <button
                  key={func}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && onSetAggFunc(func)}
                  className={`py-2 px-2 rounded-xl border text-[10px] font-bold transition-all touch-target flex flex-col items-center justify-center relative ${
                    isDisabled
                      ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
                      : isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'
                  }`}
                  title={isDisabled ? "Requires a numeric variable mapping for the Vertical Axis (Y)" : ""}
                >
                  <span>{func.toUpperCase()}</span>
                  {isDisabled && (
                    <span className="absolute -top-1 -right-1 bg-slate-200 text-slate-500 rounded-full p-0.5 scale-[0.7] border border-white">
                      <SafeIcon name="LockKeyhole" size={8} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isInvalidFunc && (
          <div className="bg-amber-50/70 border border-amber-200/40 p-3 rounded-2xl text-[10px] font-bold text-amber-800 leading-normal flex items-start gap-2.5 animate-bounce">
            <SafeIcon name="AlertTriangle" size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>Y-Axis (<span className="font-extrabold font-mono text-indigo-900">{config.yAxis}</span>) is categorized as qualitative (Text).</p>
              <p className="text-[9px] font-medium text-slate-500">Formulas like {aggFunc.toUpperCase()} require numeric variables. Choose COUNT or update question data type in the Mapping settings above.</p>
            </div>
          </div>
        )}

        {!isInvalidFunc && !isYNumeric && (
          <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-2xl text-[10px] font-semibold text-slate-500 leading-normal flex items-start gap-2.5">
            <SafeIcon name="Info" size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-slate-600">Pure Qualitative Analysis</p>
              <p className="text-[9px] font-medium text-slate-400">Y-Axis is currently mapped with categorical values. Only count aggregates are displayed.</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block ml-1">Data Synthesis</label>
          <button
            type="button"
            onClick={onTogglePercentage}
            className={`w-full py-3 rounded-2xl border text-[10px] font-black transition-all flex items-center justify-center gap-2 touch-target ${showPercentage ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'}`}
          >
            <SafeIcon name="Percent" size={14} />
            {showPercentage ? 'Return to Raw Values' : 'Convert to Percentages (%)'}
          </button>

          <button
            type="button"
            onClick={() => onSetConfig({ ...config, showTrendline: !config.showTrendline })}
            className={`w-full py-3 rounded-2xl border text-[10px] font-black transition-all flex items-center justify-center gap-2 touch-target ${config.showTrendline ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'}`}
          >
            <SafeIcon name="TrendingUp" size={14} />
            {config.showTrendline ? 'Remove Linear Trend' : 'Inject Linear Trendline'}
          </button>

          <button
            type="button"
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
