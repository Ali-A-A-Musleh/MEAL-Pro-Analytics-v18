import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SafeIcon from '../../SafeIcon';

const SettingsUI = ({
  columns,
  columnTypes,
  suggestedTypes = {},
  onChangeColumnType,
  config,
  onSetConfig,
  visuals,
  onSetVisuals,
  uniqueChoicesMap,
  selectedMultipleChoices,
  onToggleMultipleChoice,
  onSelectAllMultipleChoices,
  onSelectNoneMultipleChoices,
  columnAliases = {},
  onOpenQuestionSettings,
}) => {
  // Accordion state - keeps track of which column is expanded
  const [expandedCol, setExpandedCol] = useState(null);

  const selectedXIsMultiple = columnTypes[config.xAxis] === 'select_multiple';
  const selectedYIsMultiple = columnTypes[config.yAxis] === 'select_multiple';
  const selectedGroupIsMultiple = columnTypes[config.groupBy] === 'select_multiple';

  const toggleAccordion = (col) => {
    setExpandedCol((prev) => (prev === col ? null : col));
  };

  const handleOpenSettingsClick = (e, col) => {
    e.stopPropagation(); // prevent expanding/collapsing accordion when settings icon is clicked
    if (onOpenQuestionSettings) {
      onOpenQuestionSettings(col);
    }
  };

  return (
    <section className="space-y-6">
      {/* 1. Axis Layout Header & Selectors */}
      <div className="bg-white p-5 lg:p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <SafeIcon name="Layout" size={14} className="text-slate-400" /> Axis & Mapping Configuration
        </h3>

        <div className="space-y-4">
          {/* X Axis Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 block uppercase tracking-tight flex items-center gap-1.5">
              <span>Horizontal Axis (X)</span>
              {selectedXIsMultiple && (
                <span className="flex items-center gap-1 text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-black uppercase">
                  <SafeIcon name="ListChecks" size={10} /> Multiple Choice
                </span>
              )}
            </label>
            <div className="relative">
              <select
                value={config.xAxis}
                onChange={(e) => onSetConfig({ ...config, xAxis: e.target.value })}
                className="w-full p-3 pr-10 bg-white border border-slate-100 rounded-2xl text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Select X Axis --</option>
                {columns.map((col) => {
                  const isMultiple = columnTypes[col] === 'select_multiple';
                  const displayName = columnAliases[col] || col;
                  return (
                    <option key={col} value={col}>
                      {displayName} {isMultiple ? ' (📁 Multiple Choice)' : ''}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <SafeIcon name="ChevronDown" size={14} />
              </div>
            </div>
          </div>

          {/* Y Axis Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 block uppercase tracking-tight flex items-center gap-1.5">
              <span>Vertical Axis (Y)</span>
              {selectedYIsMultiple && (
                <span className="flex items-center gap-1 text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-black uppercase">
                  <SafeIcon name="ListChecks" size={10} /> Multiple Choice
                </span>
              )}
            </label>
            <div className="relative">
              <select
                value={config.yAxis}
                onChange={(e) => onSetConfig({ ...config, yAxis: e.target.value })}
                className="w-full p-3 pr-10 bg-white border border-slate-100 rounded-2xl text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Select Y Axis --</option>
                {columns.map((col) => {
                  const isMultiple = columnTypes[col] === 'select_multiple';
                  const displayName = columnAliases[col] || col;
                  return (
                    <option key={col} value={col}>
                      {displayName} {isMultiple ? ' (📁 Multiple Choice)' : ''}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <SafeIcon name="ChevronDown" size={14} />
              </div>
            </div>
          </div>

          {/* Group By Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 block uppercase tracking-tight flex items-center gap-1.5">
              <span>Group By</span>
              {selectedGroupIsMultiple && (
                <span className="flex items-center gap-1 text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-black uppercase">
                  <SafeIcon name="ListChecks" size={10} /> Multiple Choice
                </span>
              )}
            </label>
            <div className="relative">
              <select
                value={config.groupBy}
                onChange={(e) => onSetConfig({ ...config, groupBy: e.target.value })}
                className="w-full p-3 pr-10 bg-indigo-50/30 border border-indigo-50 rounded-2xl text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
              >
                <option value="">-- No Grouping --</option>
                {columns.map((col) => {
                  const isMultiple = columnTypes[col] === 'select_multiple';
                  const displayName = columnAliases[col] || col;
                  return (
                    <option key={col} value={col}>
                      {displayName} {isMultiple ? ' (📁 Multiple Choice)' : ''}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <SafeIcon name="ChevronDown" size={14} />
              </div>
            </div>
          </div>

          {/* Orientation Toggle Button */}
          {['bar', 'stackedBar', 'line', 'spline', 'steppedLine', 'area', 'smoothArea', 'scatter', 'combo'].includes(config.chartType) && (
            <button
              onClick={() => onSetVisuals && onSetVisuals({ ...visuals, chartOrientation: visuals?.chartOrientation === 'h' ? 'v' : 'h' })}
              className={`w-full py-3 rounded-2xl border text-[10px] font-black transition-all flex items-center justify-center gap-2 touch-target ${
                visuals?.chartOrientation === 'h'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <SafeIcon name="ArrowLeftRight" size={14} />
              {visuals?.chartOrientation === 'h' ? 'Horizontal Mode (Active)' : 'Switch to Horizontal'}
            </button>
          )}
        </div>
      </div>

      {/* 2. Unified Question Accordion List */}
      <div className="bg-white p-5 lg:p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <SafeIcon name="ListTodo" size={14} className="text-slate-400" /> Question-Based Settings UI
        </h3>

        <p className="text-[10px] font-bold text-slate-400 leading-relaxed font-sans">
          Questions are organized into neat expandable boxes. Toggle multiple-choice answer values directly, or click the <SafeIcon name="Settings" size={10} className="inline-block text-slate-500 align-middle" /> cog icon to rename questions or reformat column types.
        </p>

        <div className="space-y-3 max-h-[550px] overflow-y-auto no-scrollbar pr-1">
          {columns.map((col) => {
            const isExpanded = expandedCol === col;
            const type = columnTypes[col] || 'text';
            const displayName = columnAliases[col] || col;
            const hasSuggestion = suggestedTypes && suggestedTypes[col] === 'select_multiple' && type !== 'select_multiple';
            const choices = uniqueChoicesMap[col] || [];
            const selected = selectedMultipleChoices[col] || [];

            return (
              <div
                key={col}
                className={`border rounded-3xl transition-all duration-300 shadow-[0_2px_8px_rgba(15,23,42,0.01)] ${
                  isExpanded
                    ? 'border-indigo-200 bg-gradient-to-b from-white to-indigo-50/5 shadow-[0_4px_20px_rgba(99,102,241,0.04)]'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                {/* Accordion Trigger Header */}
                <div
                  onClick={() => toggleAccordion(col)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Format Icon */}
                    {type === 'select_multiple' ? (
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0 border border-indigo-100/30">
                        <SafeIcon name="ListChecks" size={14} />
                      </div>
                    ) : type === 'number' ? (
                      <div className="p-2 bg-rose-50 text-rose-500 rounded-2xl shrink-0 border border-rose-100/30">
                        <SafeIcon name="Hash" size={14} />
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-50 text-slate-500 rounded-2xl shrink-0 border border-slate-100">
                        <SafeIcon name="Type" size={14} />
                      </div>
                    )}

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 truncate pr-1" title={displayName}>
                        {displayName}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                        {type === 'select_multiple' ? (
                          <>
                            <span className="text-indigo-600 font-black">Multiple Choice</span>
                            <span>•</span>
                            <span className="text-slate-500 font-extrabold">{selected.length}/{choices.length} filtered</span>
                          </>
                        ) : type === 'number' ? (
                          <span className="text-rose-600 font-black">Numeric Value</span>
                        ) : (
                          <span className="text-slate-500 font-black">Text / Category</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleOpenSettingsClick(e, col)}
                      className="p-2 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl transition-all select-none cursor-pointer"
                      title="Rename or Reformat Question"
                    >
                      <SafeIcon name="Settings" size={14} />
                    </button>
                    <div className={`p-1.5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`}>
                      <SafeIcon name="ChevronDown" size={14} />
                    </div>
                  </div>
                </div>

                {/* Expanded Accordion Area */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden border-t border-slate-50/80 bg-slate-50/20"
                    >
                      <div className="p-4 space-y-3">
                        {hasSuggestion && (
                          <div className="p-3 bg-amber-50/60 border border-amber-200/30 rounded-2xl text-[10px] text-amber-900 font-bold gap-3 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-amber-800">
                              <SafeIcon name="AlertTriangle" size={12} className="text-amber-500 animate-bounce shrink-0" />
                              <span>Recognized as choice responsive. Recommend format upgrade?</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => onChangeColumnType(col, 'select_multiple')}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-black tracking-wider text-[9px] uppercase transition-all shadow-sm shrink-0"
                            >
                              Upgrade
                            </button>
                          </div>
                        )}

                        {type === 'select_multiple' ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                Visible Labels Filter
                              </span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => onSelectAllMultipleChoices(col)}
                                  className="text-[9px] font-black text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-100 px-2 py-0.5 rounded-lg transition-colors shadow-sm cursor-pointer select-none"
                                >
                                  All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onSelectNoneMultipleChoices(col)}
                                  className="text-[9px] font-black text-slate-500 hover:text-slate-600 bg-white border border-slate-100 px-2 py-0.5 rounded-lg transition-colors shadow-sm cursor-pointer select-none"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto no-scrollbar bg-white border border-slate-100/50 rounded-2xl p-2">
                              {choices.length === 0 ? (
                                <span className="text-[9px] text-slate-400 font-bold block text-center py-2 italic">
                                  No options detected.
                                </span>
                              ) : (
                                choices.map((choice) => {
                                  const isChecked = selected.includes(choice);
                                  return (
                                    <button
                                      key={choice}
                                      type="button"
                                      onClick={() => onToggleMultipleChoice(col, choice)}
                                      className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all text-[11px] font-semibold select-none cursor-pointer min-w-0 ${
                                        isChecked
                                          ? 'border-indigo-200 bg-indigo-50/30 text-indigo-950 shadow-sm'
                                          : 'border-slate-50 hover:border-slate-200 text-slate-600 bg-slate-50/10'
                                      }`}
                                    >
                                      <span className="truncate pr-2" title={choice}>
                                        {choice}
                                      </span>
                                      <div
                                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                                          isChecked
                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                            : 'border-slate-300 bg-white'
                                        }`}
                                      >
                                        {isChecked && <SafeIcon name="Check" size={8} />}
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100/60 rounded-2xl p-3 leading-relaxed flex items-center gap-2">
                            <SafeIcon name="Info" size={14} className="text-slate-400 shrink-0" />
                            <span>
                              This is mapped as a regular {type === 'number' ? 'numeric column' : 'text column'}. Its items are plotted directly on the labels or computed quantitatively. Expand type formats to select multiple filters.
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SettingsUI;
