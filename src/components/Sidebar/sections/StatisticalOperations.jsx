import SafeIcon from '../../SafeIcon';

const StatisticalOperations = ({ aggFunc, showPercentage, onSetAggFunc, onTogglePercentage }) => {
  return (
    <section className="space-y-4">
      <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
        <SafeIcon name="FunctionSquare" size={12} /> Statistical Operation
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {['sum', 'avg', 'count', 'unique', 'max', 'min'].map((func) => (
          <button
            key={func}
            onClick={() => onSetAggFunc(func)}
            className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all touch-target ${aggFunc === func ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200'}`}
          >
            {func.charAt(0).toUpperCase() + func.slice(1)}
          </button>
        ))}
      </div>
      <button
        onClick={onTogglePercentage}
        className={`w-full py-2.5 mt-2 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-2 touch-target ${showPercentage ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'}`}
      >
        <SafeIcon name="Percent" size={14} />
        {showPercentage ? 'Cancel Percentage' : 'Show Results as Percentage (%)'}
      </button>
    </section>
  );
};

export default StatisticalOperations;
