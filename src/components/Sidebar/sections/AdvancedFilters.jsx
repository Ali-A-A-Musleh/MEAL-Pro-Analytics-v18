import { useState, useMemo } from 'react';
import SafeIcon from '../../SafeIcon';

const AdvancedFilters = ({ data, columns, advancedFilters, onToggleValue }) => {
  const [selectedColumn, setSelectedColumn] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const uniqueValues = useMemo(() => {
    if (!selectedColumn || !data.length) return [];
    return [...new Set(data.map(row => String(row[selectedColumn] ?? 'Undefined')))].sort();
  }, [selectedColumn, data]);

  const filteredValues = useMemo(() => {
    if (!searchQuery) return uniqueValues;
    return uniqueValues.filter(val => val.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [uniqueValues, searchQuery]);

  const activeFilterColumns = Object.keys(advancedFilters).filter(col => advancedFilters[col].excluded.length > 0);

  return (
    <section className="space-y-4 bg-white p-4 lg:p-5 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <SafeIcon name="Filter" size={12} /> Advanced Data Filters
      </h3>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-black text-slate-500 block uppercase tracking-tighter">Select Column to Filter</label>
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          >
            <option value="">-- Choose Column --</option>
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        {selectedColumn && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="relative">
              <SafeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" name="Search" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search values..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-[11px] font-medium outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-none">
              {filteredValues.map((val) => {
                const isExcluded = advancedFilters[selectedColumn]?.excluded.includes(val);
                return (
                  <button
                    key={val}
                    onClick={() => onToggleValue(selectedColumn, val)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-[10px] font-bold transition-all ${!isExcluded ? 'bg-white text-slate-700 border-slate-100 hover:border-indigo-100' : 'bg-slate-50 text-slate-400 border-dashed border-slate-200'}`}
                  >
                    <span className="truncate flex-1 text-left">{val}</span>
                    <SafeIcon name={!isExcluded ? 'Eye' : 'EyeOff'} size={12} className={!isExcluded ? 'text-indigo-500' : 'text-slate-300'} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeFilterColumns.length > 0 && (
          <div className="pt-3 border-t border-slate-50">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Active Filters</p>
            <div className="flex flex-wrap gap-1.5">
              {activeFilterColumns.map(col => (
                <div key={col} className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[9px] font-black flex items-center gap-2 border border-indigo-100">
                  {col}: {advancedFilters[col].excluded.length} hidden
                  <button onClick={() => onToggleValue(col, null, true)} className="hover:text-indigo-900">
                    <SafeIcon name="X" size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdvancedFilters;
