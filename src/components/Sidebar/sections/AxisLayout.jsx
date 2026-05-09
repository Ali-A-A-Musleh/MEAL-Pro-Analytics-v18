import SafeIcon from '../../SafeIcon';

const AxisLayout = ({ columns, config, onSetConfig }) => {
  return (
    <section className="space-y-4">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <SafeIcon name="Layout" size={12} /> Axis Layout
      </h3>
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-black text-slate-500 block uppercase tracking-tighter">Horizontal Axis (X)</label>
          <select
            value={config.xAxis}
            onChange={(e) => onSetConfig({ ...config, xAxis: e.target.value })}
            className="w-full p-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          >
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-500 block uppercase tracking-tighter">Vertical Axis (Y)</label>
          <select
            value={config.yAxis}
            onChange={(e) => onSetConfig({ ...config, yAxis: e.target.value })}
            className="w-full p-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          >
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-indigo-500 block uppercase tracking-tighter underline">Group By</label>
          <select
            value={config.groupBy}
            onChange={(e) => onSetConfig({ ...config, groupBy: e.target.value })}
            className="w-full p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs font-black shadow-sm outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
          >
            <option value="">-- No Grouping --</option>
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
};

export default AxisLayout;
