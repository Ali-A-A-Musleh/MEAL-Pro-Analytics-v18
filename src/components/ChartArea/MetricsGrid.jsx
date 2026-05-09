import SafeIcon from '../SafeIcon';

const MetricsGrid = ({ metrics }) => {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600'
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="bg-white p-3 lg:p-5 rounded-[2rem] border border-slate-100 flex items-center gap-3 lg:gap-4 shadow-sm hover:shadow-md transition-all">
          <div className={`${colorClasses[metric.color] || colorClasses.indigo} p-2.5 lg:p-3.5 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-inner`}>
            <SafeIcon name={metric.icon} size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{metric.label}</p>
            <h4 className="text-[11px] lg:text-[13px] font-black text-slate-800 truncate">{metric.value}</h4>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsGrid;
