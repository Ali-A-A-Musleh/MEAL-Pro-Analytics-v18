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
        <div key={metric.label} className="bg-white p-3 lg:p-5 rounded-full border border-slate-50 flex items-center gap-3 lg:gap-5 shadow-[0_8px_20px_-12px_rgba(0,0,0,0.1)] hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-1 group">
          <div className={`${colorClasses[metric.color] || colorClasses.indigo} w-10 h-10 lg:w-14 lg:h-14 rounded-full flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
            <SafeIcon name={metric.icon} size={18} className="lg:scale-125" />
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
