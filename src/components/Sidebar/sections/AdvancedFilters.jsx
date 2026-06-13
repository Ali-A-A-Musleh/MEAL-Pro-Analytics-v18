import { useState, useMemo, useEffect } from 'react';
import SafeIcon from '../../SafeIcon';

const AdvancedFilters = ({ data, columns, advancedFilters, onToggleValue }) => {
  const [selectedColumn, setSelectedColumn] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(100);

  // Reset limit when selection or search changes
  useEffect(() => {
    setVisibleLimit(100);
  }, [selectedColumn, searchQuery]);

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
          <label htmlFor="filter-column-select" className="text-[10px] font-black text-slate-500 block uppercase tracking-tighter">Select Column to Filter</label>
          <select
            id="filter-column-select"
            name="filter-column"
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
              <label htmlFor="search-values-input" className="sr-only">Search values</label>
              <SafeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" name="Search" size={14} />
              <input
                id="search-values-input"
                name="search-values"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search values..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-[11px] font-medium outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-none">
              {filteredValues.slice(0, visibleLimit).map((val) => {
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

              {filteredValues.length > visibleLimit && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleLimit(prev => prev + 100)}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-[10px] font-black text-indigo-600 rounded-xl border border-dashed border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <SafeIcon name="ChevronDown" size={12} />
                    Load More (+100)
                  </button>
                  <p className="text-[9px] font-bold text-slate-450 text-center mt-1.5">
                    Showing {visibleLimit} of {filteredValues.length} unique values
                  </p>
                </div>
              )}
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
