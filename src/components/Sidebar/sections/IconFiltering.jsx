import { motion } from 'motion/react';
import SafeIcon from '../../SafeIcon';
import DynamicIcon from '../../DynamicIcon';

const IconFiltering = ({
  filters,
  customIcons,
  activeIconTarget,
  isEditingIcons,
  selectedIconName,
  filteredIconSuggestions,
  visuals,
  iconLibrary,
  onSetIconLibrary,
  onToggleFilter,
  onShowAll,
  onHideAll,
  onSetActiveIconTarget,
  onSetIsEditingIcons,
  onSetSelectedIconName,
  onUploadIcon,
  onSaveIcon,
  onResetIcon,
  onSetVisuals,
  getCategoryIconWithPreference
}) => {
  return (
    <section id="icon-control-panel" className="bg-white p-4 lg:p-5 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            <SafeIcon name="Target" size={12} /> Icon Customization & Filtering
          </h3>
          <p className="text-[10px] text-slate-500">Control category visibility and choose custom icons for each data point.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onShowAll}
            className="text-[10px] font-black rounded-2xl border border-slate-200 bg-indigo-50 text-indigo-700 px-3 py-2 hover:bg-indigo-100 transition-all"
          >
            Show All
          </button>
          <button
            type="button"
            onClick={onHideAll}
            className="text-[10px] font-black rounded-2xl border border-slate-200 bg-white text-slate-700 px-3 py-2 hover:bg-slate-50 transition-all"
          >
            Hide All
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 mb-4">
        <label className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Library Source</label>
        <div className="flex gap-1">
          <button
            onClick={() => onSetIconLibrary('standard')}
            title="Standard icons (Lucide)"
            className={`p-2 rounded-xl transition-all ${iconLibrary === 'standard' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'}`}
          >
            <SafeIcon name="LayoutGrid" size={14} />
          </button>
          <button
            onClick={() => onSetIconLibrary('humanitarian')}
            title="Humanitarian icons (OCHA)"
            className={`p-2 rounded-xl transition-all ${iconLibrary === 'humanitarian' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'}`}
          >
            <SafeIcon name="Globe" size={14} />
          </button>
        </div>
      </div>

      <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 scrollbar-none">
        {filters.map((item, idx) => (
          <div key={`${item.label}-${idx}`} className="space-y-3 rounded-[2rem] border border-slate-100 bg-white p-3 hover:bg-slate-50/50 transition-all shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.visible}
                  onChange={() => onToggleFilter(item.label)}
                  className="sr-only"
                />
                <div className={`flex items-center justify-center w-7 h-7 rounded-2xl border transition-all ${item.visible ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                  <SafeIcon name="CheckCircle2" size={16} />
                </div>
                <span className="text-[10px] font-black text-slate-700 truncate max-w-[120px]">
                  {item.label || <span className="italic text-slate-400">Empty Label</span>}
                </span>
              </label>
              <button
                type="button"
                onClick={() => onSetActiveIconTarget(item.label === activeIconTarget ? '' : item.label)}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-[10px] font-black transition-all ${activeIconTarget === item.label ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'}`}
              >
                <DynamicIcon 
                  name={getCategoryIconWithPreference(item.label)} 
                  size={14} 
                  style={{ color: activeIconTarget === item.label ? '#ffffff' : visuals.iconColor }}
                />
                Change
              </button>
            </div>

            {activeIconTarget === item.label && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="mt-3 space-y-4 rounded-[2rem] border border-indigo-100 bg-white p-4 shadow-xl relative z-10"
              >
                <div className="flex flex-col gap-3">
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                      <SafeIcon name="Search" size={14} />
                    </div>
                    <input
                      type="text"
                      autoFocus
                      value={selectedIconName}
                      onChange={(e) => onSetSelectedIconName(e.target.value)}
                      className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-indigo-50 bg-slate-50/50 text-[11px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 shadow-inner-sm"
                      placeholder={`Find icons...`}
                    />
                    
                    {/* Compact Library Toggle inside search board */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center p-0.5 bg-white/80 rounded-lg border border-slate-100 shadow-sm">
                      <button
                        onClick={() => onSetIconLibrary('standard')}
                        title="Standard Icons"
                        className={`p-1.5 rounded-md transition-all ${iconLibrary === 'standard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-slate-400'}`}
                      >
                        <SafeIcon name="LayoutGrid" size={10} />
                      </button>
                      <button
                        onClick={() => onSetIconLibrary('humanitarian')}
                        title="Humanitarian Icons"
                        className={`p-1.5 rounded-md transition-all ${iconLibrary === 'humanitarian' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-slate-400'}`}
                      >
                        <SafeIcon name="Globe" size={10} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-none">
                    {filteredIconSuggestions.length > 0 ? (
                      filteredIconSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.icon}
                          type="button"
                          className={`flex flex-col items-center justify-center rounded-xl aspect-square border-2 transition-all active:scale-90 ${selectedIconName === suggestion.icon ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-slate-50 bg-white text-slate-400 hover:border-indigo-100 hover:text-indigo-500'}`}
                          onClick={() => onSetSelectedIconName(suggestion.icon)}
                        >
                          <DynamicIcon name={suggestion.icon} size={20} />
                          <span className="mt-1 text-[6.5px] font-bold uppercase tracking-tighter truncate w-full text-center px-1">
                            {suggestion.icon.replace('hum:', '').replace('huma-', '')}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-4 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                         <SafeIcon name="SearchX" size={20} className="mx-auto text-slate-300 mb-1" />
                         <p className="text-[9px] font-bold text-slate-400">No results found</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <label className="flex items-center justify-center gap-2 flex-1 cursor-pointer rounded-xl border border-dashed border-indigo-200 bg-slate-50/50 py-2.5 text-[9px] font-black text-indigo-600 hover:bg-white transition-all">
                    <SafeIcon name="Plus" size={12} />
                    <span>Upload Logo</span>
                    <input
                      key={`upload-${item.label}`}
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      className="hidden"
                      onChange={(e) => onUploadIcon(e.target.files?.[0], item.label)}
                    />
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => onSaveIcon(item.label)}
                    className="flex-[2] py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:translate-y-px transition-all"
                  >
                    Confirm Selection
                  </button>
                  
                  {customIcons[item.label.toLowerCase()] && (
                    <button
                      type="button"
                      onClick={() => onResetIcon(item.label)}
                      title="Reset to default icon"
                      className="w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <SafeIcon name="RotateCcw" size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-50">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-indigo-700 uppercase">Icon Color</span>
          <input
            type="color"
            value={visuals.iconColor}
            onChange={(e) => onSetVisuals({ ...visuals, iconColor: e.target.value })}
            className="w-8 h-8 rounded-full border-2 border-white shadow-lg cursor-pointer"
          />
        </div>
        
        <div className="space-y-4">
          {[
            { label: 'Icon Size', value: visuals.iconSize, name: 'iconSize', min: 12, max: 48, step: 2, unit: 'px' },
            { label: 'Icon Opacity', value: visuals.iconOpacity, name: 'iconOpacity', min: 0.1, max: 1, step: 0.05, unit: '%' }
          ].map((slider) => (
            <div key={slider.name} className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-black text-indigo-600 uppercase tracking-tight">
                <span>{slider.label}</span>
                <span className="text-indigo-800">
                  {slider.name === 'iconOpacity' ? `${Math.round(slider.value * 100)}%` : `${slider.value}px`}
                </span>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={slider.value}
                onChange={(e) => onSetVisuals({ ...visuals, [slider.name]: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 h-1.5 bg-white rounded-lg appearance-none cursor-pointer border border-indigo-200"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IconFiltering;
