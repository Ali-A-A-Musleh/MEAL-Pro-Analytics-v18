import { useMemo } from 'react';
import SafeIcon from './SafeIcon';

const DynamicIcon = ({ name, size = 16, className = '', style = {} }) => {
  const normalized = String(name || '').trim();
  if (/^(data:|http:|https:)/i.test(normalized)) {
    // Check if it's an SVG data URL
    if (normalized.startsWith('data:image/svg+xml')) {
      // Decode base64 if present
      let svgContent = normalized;
      try {
        if (normalized.includes('base64,')) {
          const base64 = normalized.split('base64,')[1];
          svgContent = atob(base64);
        } else if (normalized.includes(',')) {
          svgContent = decodeURIComponent(normalized.split(',')[1]);
        }
        
        // We use a stable unique ID for each icon instance to strictly scope the style tag
        const iconId = useMemo(() => `icon-${Math.random().toString(36).slice(2, 11)}`, []);
        
        // Remove hardcoded dimensions and any existing style tags to avoid conflicts
        const svgCleaned = svgContent
          .replace(/\b(width|height)="[^"]*"/g, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '');
        
        // Inject the style scoped to this specific icon ID
        // and ensure the ID is added to the SVG tag regardless of its attributes
        const styledSvg = `<style>
          #${iconId}, #${iconId} * { 
            fill: inherit !important; 
            stroke: inherit !important;
            transition: fill 0.3s ease, stroke 0.3s ease;
          }
          #${iconId} [fill="none"], #${iconId} .none, .fill-none { fill: none !important; }
          #${iconId} [stroke="none"], .stroke-none { stroke: none !important; }
        </style>${svgCleaned.replace(/<svg([^>]*)>/i, `<svg id="${iconId}" $1>`)}`;

        return (
          <div
            className={`dynamic-icon-wrapper ${className}`}
            style={{ 
              width: size, 
              height: size, 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fill: style.color || 'currentColor',
              stroke: style.color || 'currentColor',
              color: style.color || 'inherit',
              ...style 
            }}
            dangerouslySetInnerHTML={{ __html: styledSvg }}
          />
        );
      } catch (e) {
        console.error('Failed to parse SVG icon', e);
      }
    }
    // For other images (PNG, JPG, etc.), use img tag - color change not supported
    return <img src={normalized} alt="custom icon" width={size} height={size} className={className} style={{ ...style, objectFit: 'contain' }} />;
  }
  return <SafeIcon name={name} size={size} className={className} style={style} />;
};

export default DynamicIcon;
