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

      <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 scrollbar-none">
        {filters.map((item, idx) => (
          <div key={item.label} className="space-y-3 rounded-[2rem] border border-slate-50 bg-white p-3 hover:bg-slate-50/50 transition-all shadow-sm">
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
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm overflow-hidden"
              >
                <div className="relative">
                  <SafeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" name="Search" size={16} />
                  <input
                    type="text"
                    value={selectedIconName}
                    onChange={(e) => onSetSelectedIconName(e.target.value)}
                    className="w-full pr-3 pl-10 py-3 rounded-2xl border border-indigo-100 bg-white text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Search icon name..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-center w-full cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-white py-4 text-[11px] font-black text-slate-600 hover:border-indigo-300 transition-all">
                    <SafeIcon name="UploadCloud" size={18} />
                    <span className="ml-2">Upload Custom Icon</span>
                    <input
                      key={`upload-${item.label}`}
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      className="hidden"
                      onChange={(e) => onUploadIcon(e.target.files?.[0], item.label)}
                    />
                  </label>
                  <p className="text-[9px] text-slate-500 text-center leading-tight">Supports PNG, JPG, SVG. Use SVG for color customization.</p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSaveIcon(item.label)}
                      className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white text-[11px] font-black hover:bg-indigo-700 transition-all"
                    >
                      Save Icon
                    </button>
                    {customIcons[item.label.toLowerCase()] && (
                      <button
                        type="button"
                        onClick={() => onResetIcon(item.label)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-[11px] font-black text-white hover:bg-rose-600 transition-all"
                      >
                        <SafeIcon name="Trash2" size={16} />
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 pt-2">
                  {filteredIconSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.icon}
                      type="button"
                      className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 p-2 text-slate-600 transition-all hover:border-indigo-300 hover:bg-indigo-50"
                      onClick={() => onSetSelectedIconName(suggestion.icon)}
                    >
                      <SafeIcon name={suggestion.icon} size={18} />
                      <span className="mt-1 text-[8px] font-black text-slate-500 truncate w-full text-center">{suggestion.icon}</span>
                    </button>
                  ))}
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
