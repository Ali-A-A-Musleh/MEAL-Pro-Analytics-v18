import SafeIcon from '../../SafeIcon';
import { colorPalettes } from '../../../utils/chartConfigs';

const VisualCustomization = ({ visuals, config, aggregatedResults, onSetVisuals, onSetConfig }) => {
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
          { label: 'Chart Height', value: visuals.chartHeight, name: 'chartHeight', min: 300, max: 1200, step: 10 },
          { label: 'Curve Tension', value: visuals.tension, name: 'tension', min: 0, max: 1, step: 0.05 },
          { label: 'Fill Opacity', value: visuals.opacity, name: 'opacity', min: 0.1, max: 1, step: 0.05 },
          { label: 'Border Width', value: visuals.borderWidth, name: 'borderWidth', min: 0, max: 8, step: 1 },
          { label: 'Background Blur', value: visuals.glassBlur, name: 'glassBlur', min: 0, max: 48, step: 1 },
          { label: 'Card Opacity', value: visuals.glassOpacity, name: 'glassOpacity', min: 0.2, max: 1, step: 0.05 }
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
          { name: 'showTrendline', icon: 'TrendingUp', label: 'Trend Line' },
          { name: 'showXAxisLabel', icon: 'ArrowRight', label: 'X Axis Label' },
          { name: 'showYAxisLabel', icon: 'ArrowUp', label: 'Y Axis Label' }
        ].map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() =>
              item.name === 'showTrendline'
                ? onSetConfig({ ...config, showTrendline: !config.showTrendline })
                : onSetVisuals({ ...visuals, [item.name]: !visuals[item.name] })
            }
            className={`py-2.5 rounded-xl text-[9px] font-black border transition-all flex items-center justify-center gap-1.5 touch-target ${((item.name === 'showTrendline' ? config.showTrendline : visuals[item.name]) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300')}`}
          >
            <SafeIcon name={item.icon} size={10} /> {item.label}
          </button>
        ))}
      </div>
    </section>
  );
};

export default VisualCustomization;
