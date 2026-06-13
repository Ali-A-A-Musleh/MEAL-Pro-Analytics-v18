import { useState } from 'react';
import SafeIcon from '../../SafeIcon';
import DynamicIcon from '../../DynamicIcon';
import { useDebounce } from '../../../hooks/useDebounce';

const IconFiltering = ({
  filters,
  customIcons,
  activeIconTarget,
  isEditingIcons,
  selectedIconName,
  filteredIconSuggestions,
  visuals,
  iconLibrary,
  legendAliases,
  onSaveAlias,
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
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [editingLabel, setEditingLabel] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Filter active categories based on search input
  const filteredCategories = filters.filter(item => 
    (item.label || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    (legendAliases?.[item.label] || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  const startEditing = (label) => {
    setEditingLabel(label);
    setEditValue(legendAliases?.[label] || label);
  };

  const handleSaveAlias = (original) => {
    if (onSaveAlias && editValue.trim()) {
      onSaveAlias(original, editValue.trim());
    }
    setEditingLabel(null);
  };

  return (
    <section id="icon-control-panel" className="bg-white p-4 lg:p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5">
      {/* Header Info */}
      {/* Header Info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            <SafeIcon name="Target" size={12} /> Icon Customization & Filtering
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onShowAll}
              className="text-[10px] font-black rounded-2xl border border-slate-200 bg-indigo-50 text-indigo-700 px-3 py-2 hover:bg-indigo-100 transition-all uppercase"
            >
              Show All
            </button>
            <button
              type="button"
              onClick={onHideAll}
              className="text-[10px] font-black rounded-2xl border border-slate-200 bg-white text-slate-700 px-3 py-2 hover:bg-slate-50 transition-all uppercase"
            >
              Hide All
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-500">Control category visibility and choose custom icons for each data point.</p>
      </div>

      {/* Icon Library Selector */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 w-fit">
        <button
          onClick={() => onSetIconLibrary('standard')}
          title="Standard Icons (Lucide)"
          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 ${iconLibrary === 'standard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <SafeIcon name="LayoutGrid" size={10} /> Lucide
        </button>
        <button
          onClick={() => onSetIconLibrary('humanitarian')}
          title="Humanitarian Icons (OCHA)"
          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 ${iconLibrary === 'humanitarian' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <SafeIcon name="Globe" size={10} /> OCHA
        </button>
      </div>

      {/* Search Input for Sidebar Categories */}
      <div className="relative">
        <label htmlFor="search-active-categories" className="sr-only">Search active categories</label>
        <SafeIcon name="Search" size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id="search-active-categories"
          name="search-active-categories"
          type="text"
          placeholder="Search active categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-100"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <SafeIcon name="X" size={10} />
          </button>
        )}
      </div>

      {/* Categories List */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 sidebar-scroll">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((item, idx) => {
            const iconName = getCategoryIconWithPreference(item.label);
            const isCustomized = !!customIcons[String(item.label).toLowerCase()];
            const displayName = legendAliases?.[item.label] || item.label || `Category ${idx + 1}`;

            return (
              <div 
                key={`${idx}-${item.label || 'cat'}`}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-300 ${item.visible ? 'bg-white border-slate-100 hover:border-indigo-100 shadow-sm' : 'bg-slate-50/70 border-slate-100 opacity-60'}`}
              >
                {/* Left side: Icon bubble and text */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Icon Customizer Trigger Bubble */}
                  <button
                    type="button"
                    onClick={() => {
                      const label = item.label || `category-${idx}`;
                      onSetActiveIconTarget(label);
                      onSetSelectedIconName(iconName);
                      onSetIsEditingIcons(true);
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-transform hover:scale-105 active:scale-95 shrink-0 ${item.visible ? 'bg-indigo-50/60 border-indigo-200 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}
                    title="Click to customize category icon"
                  >
                    <DynamicIcon 
                      name={iconName} 
                      size={18} 
                      style={{ color: item.visible ? visuals.iconColor : undefined }}
                    />
                  </button>

                  {/* Category Name Label (with double-click inline editor) */}
                  <div className="flex-1 min-w-0 pr-2">
                    {editingLabel === item.label ? (
                      <input
                        id={`edit-category-${idx}`}
                        name={`edit-category-${idx}`}
                        aria-label="Edit category name"
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSaveAlias(item.label)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveAlias(item.label)}
                        className="w-full bg-slate-50 border border-indigo-200 rounded px-1.5 py-0.5 text-[10px] font-black text-slate-800 outline-none"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 group">
                        <span 
                          onDoubleClick={() => startEditing(item.label)}
                          className="text-[10px] font-black text-slate-700 truncate block cursor-pointer hover:text-indigo-600 transition-colors uppercase tracking-tight"
                          title="Double click to edit category name"
                        >
                          {displayName}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEditing(item.label)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-opacity shrink-0"
                          title="Edit Category Name"
                        >
                          <SafeIcon name="Pencil" size={8} />
                        </button>
                      </div>
                    )}
                    <span className="text-[7.5px] text-slate-400 uppercase tracking-widest font-black block mt-0.5">
                      {isCustomized ? 'Custom Tag' : 'Default Mapping'}
                    </span>
                  </div>
                </div>

                {/* Right side: Action controls */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {/* Single Reset Button (visible only if customized) */}
                  {isCustomized && (
                    <button
                      type="button"
                      onClick={() => onResetIcon(item.label)}
                      className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-slate-100 transition-all shadow-sm active:scale-90"
                      title="Reset icon to default"
                    >
                      <SafeIcon name="RotateCcw" size={10} />
                    </button>
                  )}

                  {/* Edit Icon Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const label = item.label || `category-${idx}`;
                      onSetActiveIconTarget(label);
                      onSetSelectedIconName(iconName);
                      onSetIsEditingIcons(true);
                    }}
                    className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg border border-slate-100 transition-all shadow-sm active:scale-90"
                    title="Change icon"
                  >
                    <SafeIcon name="Palette" size={10} />
                  </button>

                  {/* Toggle Eye/EyeOff Button */}
                  <button
                    type="button"
                    onClick={() => onToggleFilter(item.label)}
                    className={`p-1.5 rounded-lg border transition-all shadow-sm active:scale-90 ${item.visible ? 'bg-indigo-50/50 border-indigo-100 text-indigo-600 hover:bg-indigo-100/50' : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'}`}
                    title={item.visible ? 'Hide from Chart' : 'Show on Chart'}
                  >
                    <SafeIcon name={item.visible ? 'Eye' : 'EyeOff'} size={10} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
            <SafeIcon name="SearchX" size={24} className="mx-auto text-slate-300 mb-2 opacity-50" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No matching categories</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default IconFiltering;
