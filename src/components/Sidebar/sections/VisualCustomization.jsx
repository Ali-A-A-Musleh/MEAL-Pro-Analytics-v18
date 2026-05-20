import SafeIcon from '../../SafeIcon';
import DynamicIcon from '../../DynamicIcon';
import { colorPalettes } from '../../../utils/chartConfigs';

const VisualCustomization = ({ visuals, config, aggregatedResults, onSetVisuals, onSetConfig, onPickGlobalIcon }) => {
  const palette = [visuals.primaryColor, visuals.secondaryColor, visuals.tertiaryColor, visuals.quaternaryColor];

  const handleSliderChange = (name, value) => {
    onSetVisuals({
      ...visuals,
      [name]: name.includes('Width') || name.includes('Blur') || name.includes('Height') ? Number(value) : parseFloat(value)
    });
  };

  return (
    <section className="bg-slate-50 p-4 lg:p-5 rounded-[2.5rem] space-y-5 border border-slate-100 shadow-inner">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <SafeIcon name="Palette" size={12} /> Appearance Customization
        </h3>
      </div>

      <div className="space-y-4">
        {/* Unified Icon Select when center or unified is chosen */}
        {visuals.showIcons && (
          <div className="bg-indigo-50/50 p-4 rounded-[2.5rem] border border-indigo-100 mb-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                <SafeIcon name="SmilePlus" size={12} /> Icon Intelligence Lab
              </h4>
            </div>
            
            <div className="grid grid-cols-3 gap-1 bg-white/60 p-1 rounded-2xl border border-indigo-50">
              {[
                { id: 'per-category', label: 'Layered' },
                { id: 'unified', label: 'Single' },
                { id: 'centered', label: 'Core' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => onSetConfig({ ...config, iconMode: mode.id })}
                  className={`py-2 text-[8px] font-black rounded-xl transition-all ${config.iconMode === mode.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {['unified', 'centered'].includes(config.iconMode) && (
              <div className="flex gap-3 items-center bg-white p-2 rounded-2xl border border-indigo-100 shadow-sm">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <DynamicIcon name={config.globalIcon} size={20} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 pt-2">
              {[
                { label: 'Element Size', value: visuals.iconSize, name: 'iconSize', min: 8, max: 48, step: 1 },
                { label: 'Shell Diameter', value: visuals.iconContainerSize, name: 'iconContainerSize', min: 10, max: 100, step: 1 },
                { label: 'Shell Density', value: visuals.iconContainerOpacity, name: 'iconContainerOpacity', min: 0, max: 1, step: 0.01 },
                { label: 'Vertical Drift', value: visuals.iconOffset, name: 'iconOffset', min: 0, max: 100, step: 1 },
                { label: 'Core Opacity', value: visuals.iconOpacity, name: 'iconOpacity', min: 0, max: 1, step: 0.05 },
              ].map((slider) => (
                <div key={slider.name} className="px-1">
                  <div className="flex justify-between text-[8px] font-black text-indigo-400 uppercase mb-1">
                    <span>{slider.label}</span>
                    <span className="text-indigo-900">{slider.value}</span>
                  </div>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={slider.value}
                    onChange={(e) => handleSliderChange(slider.name, e.target.value)}
                    className="w-full accent-indigo-600 h-1 bg-white rounded-lg appearance-none cursor-pointer border border-indigo-100"
                  />
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between px-2 pt-1 border-t border-indigo-100 mt-2">
              <span className="text-[9px] font-black text-indigo-300 uppercase">Vector Color</span>
              <input 
                type="color" 
                value={visuals.iconColor} 
                onChange={(e) => onSetVisuals({ ...visuals, iconColor: e.target.value })}
                className="w-10 h-6 rounded-lg border-0 cursor-pointer overflow-hidden bg-transparent" 
              />
            </div>
          </div>
        )}

        {/* Radar Settings - Conditional */}
        {config.chartType === 'radar' && (
          <div className="bg-amber-50/50 p-4 rounded-[2.5rem] border border-amber-100 space-y-3">
             <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-2">
                <SafeIcon name="Disc" size={12} /> Radar Precision
             </h4>
             <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSetVisuals({...visuals, tension: visuals.tension === 0 ? 0.4 : 0})}
                  className={`py-2 rounded-xl text-[9px] font-black border transition-all ${visuals.tension > 0 ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-600 border-amber-200'}`}
                >
                  {visuals.tension > 0 ? 'Curved Web' : 'Sharp Grid'}
                </button>
                <button
                  onClick={() => onSetVisuals({...visuals, fill: visuals.fill === false ? true : false})}
                  className={`py-2 rounded-xl text-[9px] font-black border transition-all ${visuals.fill !== false ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-600 border-amber-200'}`}
                >
                  {visuals.fill !== false ? 'Solid Core' : 'Inner Wireframe'}
                </button>
             </div>
          </div>
        )}

        {/* Number Format Selection */}
        <div className="flex flex-col gap-3 bg-white/50 p-2 rounded-[2rem] border border-slate-100 shadow-sm">
          <span className="text-[10px] font-black text-slate-700 uppercase ml-3">Value Formatting</span>
          <div className="flex bg-white p-1 rounded-full border border-slate-200">
            {[
              { id: 'raw', label: 'Raw' },
              { id: 'compact', label: 'Compact (k/M)' }
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => onSetConfig({ ...config, numberFormat: fmt.id })}
                className={`flex-1 px-4 py-2 text-[10px] font-black rounded-full transition-all ${config.numberFormat === fmt.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Value Label Placement & Color */}
        <div className="flex flex-col gap-3 bg-white/50 p-2 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center px-3">
            <span className="text-[10px] font-black text-slate-700 uppercase">Value Customization</span>
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={visuals.dataLabelColor} 
                onChange={(e) => onSetVisuals({ ...visuals, dataLabelColor: e.target.value })}
                className="w-5 h-5 rounded-full border-0 cursor-pointer overflow-hidden bg-transparent" 
              />
              <span className="text-[9px] font-bold text-slate-400">Color</span>
            </div>
          </div>
          
          <div className="flex bg-white p-1 rounded-full border border-slate-200">
            {[
              { id: 'outside', label: 'Outside' },
              { id: 'inside', label: 'Inside' }
            ].map((pos) => (
              <button
                key={pos.id}
                onClick={() => onSetVisuals({ ...visuals, dataLabelPosition: pos.id })}
                className={`flex-1 px-4 py-2 text-[10px] font-black rounded-full transition-all ${visuals.dataLabelPosition === pos.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend Customization */}
        <div className="flex flex-col gap-3 bg-white/50 p-3 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-slate-700 uppercase">Legend Layout</span>
            <SafeIcon name="Layout" size={10} className="text-slate-400" />
          </div>
          <div className="grid grid-cols-4 gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200">
            {[
              { id: 'top', icon: 'ArrowUp' },
              { id: 'bottom', icon: 'ArrowDown' },
              { id: 'left', icon: 'ArrowLeft' },
              { id: 'right', icon: 'ArrowRight' }
            ].map((pos) => (
              <button
                key={pos.id}
                title={`Position: ${pos.id}`}
                onClick={() => onSetVisuals({ ...visuals, legendPosition: pos.id })}
                className={`py-2 flex items-center justify-center rounded-xl transition-all ${visuals.legendPosition === pos.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <SafeIcon name={pos.icon} size={14} />
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 px-1 italic">
            <span>{visuals.legendPosition} focused</span>
            <button onClick={() => onSetVisuals({...visuals, showLegend: !visuals.showLegend})} className="text-indigo-600">
              {visuals.showLegend ? 'Hide Legend' : 'Show Legend'}
            </button>
          </div>

          {visuals.showLegend && (
            <div className="space-y-3 mt-1 pt-1 border-t border-slate-100">
              {/* Legend Font Size */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase">
                  <span>Font Size</span>
                  <span className="text-indigo-600">{visuals.legendFontSize || 12}px</span>
                </div>
                <input 
                  type="range"
                  min="8"
                  max="20"
                  value={visuals.legendFontSize || 12}
                  onChange={(e) => onSetVisuals({ ...visuals, legendFontSize: Number(e.target.value) })}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Legend Width (Only if Left or Right) */}
              {(visuals.legendPosition === 'left' || visuals.legendPosition === 'right') && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase">
                    <span>Legend Width</span>
                    <span className="text-indigo-600">{visuals.legendWidth || 200}px</span>
                  </div>
                  <input 
                    type="range"
                    min="120"
                    max="300"
                    value={visuals.legendWidth || 200}
                    onChange={(e) => onSetVisuals({ ...visuals, legendWidth: Number(e.target.value) })}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              )}

              {/* Legend Spacing */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase">
                  <span>Legend Spacing</span>
                  <span className="text-indigo-600">{visuals.legendSpacing || 30}px</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="80"
                  value={visuals.legendSpacing || 30}
                  onChange={(e) => onSetVisuals({ ...visuals, legendSpacing: Number(e.target.value) })}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Chart Orientation (Only for Bar, Line, Area) */}
        {['bar', 'line', 'area'].includes(config.chartType) && (
          <div className="flex flex-col gap-3 bg-white/50 p-2 rounded-[2rem] border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black text-slate-700 uppercase ml-3">Chart Orientation</span>
            <div className="flex bg-white p-1 rounded-full border border-slate-200">
              {[
                { id: 'v', label: 'Vertical' },
                { id: 'h', label: 'Horizontal' }
              ].map((orient) => (
                <button
                  key={orient.id}
                  onClick={() => onSetVisuals({ ...visuals, chartOrientation: orient.id })}
                  className={`flex-1 px-4 py-2 text-[10px] font-black rounded-full transition-all ${visuals.chartOrientation === orient.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {orient.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Icon Mode Selection */}
        <div className="flex flex-col gap-3 bg-white/50 p-2 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center px-3">
            <span className="text-[10px] font-black text-slate-700 uppercase">Icon Placement</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Show</span>
              <button
                onClick={() => onSetVisuals({ ...visuals, showIcons: !visuals.showIcons })}
                className={`w-8 h-4 rounded-full transition-all relative ${visuals.showIcons ? 'bg-indigo-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${visuals.showIcons ? 'left-4.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
          <div className="flex bg-white p-1 rounded-full border border-slate-200 overflow-hidden">
            {[
              { id: 'per-category', label: 'Categorical' },
              { id: 'unified', label: 'Unified' },
              { id: 'centered', label: 'Centered' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => onSetConfig({ ...config, iconMode: mode.id })}
                className={`flex-1 px-2 py-2 text-[9px] font-black rounded-full transition-all ${config.iconMode === mode.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 bg-white/50 p-2 rounded-[2rem] border border-slate-100 shadow-sm">
          <span className="text-[10px] font-black text-slate-700 uppercase ml-3">Color Mode Selection</span>
          <div className="flex bg-white p-1 rounded-full border border-slate-200">
            {['single', 'dual', 'multi'].map((mode) => (
              <button
                key={mode}
                onClick={() => onSetVisuals({ ...visuals, colorMode: mode })}
                className={`px-6 py-2.5 text-[10px] font-black rounded-full transition-all flex-1 whitespace-nowrap ${visuals.colorMode === mode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 py-1">
          {colorPalettes.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSetVisuals({
                ...visuals,
                colorMode: 'multi',
                primaryColor: p.p,
                secondaryColor: p.s,
                tertiaryColor: p.t,
                quaternaryColor: p.q
              })}
              className="w-full aspect-square rounded-full shadow-sm border-2 border-white hover:scale-110 active:scale-95 transition-all opacity-90 hover:opacity-100"
              style={{ background: `linear-gradient(135deg, ${p.p} 0%, ${p.s} 50%, ${p.t} 100%, ${p.q} 100%)` }}
              title="Apply palette"
            />
          ))}
        </div>

        <div className="flex justify-around items-center bg-white py-4 rounded-3xl border border-slate-100 shadow-sm">
          {['primaryColor', 'secondaryColor', 'tertiaryColor', 'quaternaryColor'].map((field, index) => {
            if (index >= 2 && visuals.colorMode === 'single') return null;
            if (index === 3 && visuals.colorMode !== 'multi') return null;
            return (
              <div key={field} className="flex flex-col items-center gap-2">
                <div className="relative w-10 h-10 group">
                  <input
                    type="color"
                    value={visuals[field]}
                    onChange={(e) => onSetVisuals({ ...visuals, [field]: e.target.value })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="w-full h-full rounded-full border-2 border-white shadow-md ring-1 ring-slate-200 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: visuals[field] }}
                  />
                </div>
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">{field.replace('Color', '')}</span>
              </div>
            );
          })}
        </div>

        {aggregatedResults?.labels?.length > 1 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Label color overrides</span>
              <button type="button" onClick={() => onSetVisuals({ ...visuals, labelColorMap: {} })} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800">
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {aggregatedResults.labels.map((label) => (
                <label key={label} className="flex items-center gap-3 bg-slate-50 rounded-[1.25rem] p-2 border border-slate-100 hover:border-indigo-200 transition-colors">
                  <span className="text-[10px] font-black text-slate-600 truncate flex-1 ml-1">{label}</span>
                  <div className="relative w-8 h-8 group shrink-0">
                    <input
                      type="color"
                      value={visuals.labelColorMap[label] || visuals.primaryColor}
                      onChange={(e) => onSetVisuals({
                        ...visuals,
                        labelColorMap: { ...visuals.labelColorMap, [label]: e.target.value }
                      })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div 
                      className="w-full h-full rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: visuals.labelColorMap[label] || visuals.primaryColor }}
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 pt-2">
        {[
          { label: 'Chart Height', value: visuals.chartHeight, name: 'chartHeight', min: 200, max: 1200, step: 10 },
          { label: 'Curve Tension', value: visuals.tension, name: 'tension', min: 0, max: 1, step: 0.05 },
          { label: 'Fill Opacity', value: visuals.opacity, name: 'opacity', min: 0.1, max: 1, step: 0.05 },
          { label: 'Border Width', value: visuals.borderWidth, name: 'borderWidth', min: 0, max: 8, step: 1 },
          { label: 'Background Blur', value: visuals.glassBlur, name: 'glassBlur', min: 0, max: 48, step: 1 },
          { label: 'Card Opacity', value: visuals.glassOpacity, name: 'glassOpacity', min: 0.2, max: 1, step: 0.05 },
          { label: 'Legend Font Size', value: visuals.legendFontSize, name: 'legendFontSize', min: 6, max: 24, step: 1 },
          ...(visuals.legendPosition === 'left' || visuals.legendPosition === 'right' ? [
            { label: 'Legend Area Width', value: visuals.legendWidth, name: 'legendWidth', min: 100, max: 400, step: 1 }
          ] : []),
          { label: 'Value Font Size', value: visuals.dataLabelFontSize, name: 'dataLabelFontSize', min: 6, max: 20, step: 1 },
          { label: 'X Axis Ticks Size', value: visuals.xAxisFontSize, name: 'xAxisFontSize', min: 6, max: 20, step: 1 },
          { label: 'X Axis Title Size', value: visuals.xAxisTitleFontSize, name: 'xAxisTitleFontSize', min: 6, max: 20, step: 1 },
          { label: 'Y Axis Ticks Size', value: visuals.yAxisFontSize, name: 'yAxisFontSize', min: 6, max: 20, step: 1 },
          { label: 'Y Axis Title Size', value: visuals.yAxisTitleFontSize, name: 'yAxisTitleFontSize', min: 6, max: 20, step: 1 }
        ].map((slider) => (
          <div key={slider.name} className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-tight">
              <span>{slider.label}</span>
              <span className="text-indigo-600">
                {slider.name === 'opacity' || slider.name === 'glassOpacity' 
                  ? `${Math.round(slider.value * 100)}%` 
                  : `${slider.value}${slider.name === 'borderWidth' || slider.name === 'chartHeight' ? 'px' : ''}`}
              </span>
            </div>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={slider.value}
              onChange={(e) => handleSliderChange(slider.name, e.target.value)}
              className="w-full accent-indigo-600 h-1.5 bg-white rounded-lg appearance-none cursor-pointer border border-slate-200"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        {[
          { name: 'shadow', icon: 'Sun', label: 'Shadows' },
          { name: 'grid', icon: 'Grid', label: 'Grid' },
          { name: 'showIcons', icon: 'Smile', label: 'Data Icons' },
          { name: 'showDataLabels', icon: 'Hash', label: 'Values' },
          { name: 'showLegend', icon: 'List', label: 'Legend' },
          { name: 'showTrendline', icon: 'TrendingUp', label: 'Linear Trend' },
          { name: 'showRawPath', icon: 'Share2', label: 'Raw Path' },
          { name: 'showAxisTicks', icon: 'Type', label: 'Axis Ticks' },
          { name: 'showXAxisLabel', icon: 'ArrowRight', label: 'X Axis Label' },
          { name: 'showYAxisLabel', icon: 'ArrowUp', label: 'Y Axis Label' }
        ].map((item) => {
          const isActive = item.name === 'showTrendline' 
            ? config.showTrendline 
            : item.name === 'showRawPath' 
            ? config.showRawPath 
            : visuals[item.name];

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => {
                if (item.name === 'showTrendline') {
                  onSetConfig({ ...config, showTrendline: !config.showTrendline });
                } else if (item.name === 'showRawPath') {
                  onSetConfig({ ...config, showRawPath: !config.showRawPath });
                } else {
                  onSetVisuals({ ...visuals, [item.name]: !visuals[item.name] });
                }
              }}
              className={`py-2.5 rounded-xl text-[9px] font-black border transition-all flex items-center justify-center gap-1.5 touch-target ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
            >
              <SafeIcon name={item.icon} size={10} /> {item.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default VisualCustomization;
