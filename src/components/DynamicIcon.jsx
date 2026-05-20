import { useMemo } from 'react';
import SafeIcon from './SafeIcon';
import DOMPurify from 'dompurify';

const DynamicIcon = ({ name, size = 16, className = '', style = {} }) => {
  // We use a stable unique ID for each icon instance to strictly scope the style tag
  const iconId = useMemo(() => `icon-${Math.random().toString(36).slice(2, 11)}`, []);
  
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
        // Remove hardcoded dimensions and any existing style tags to avoid conflicts
        const svgCleaned = svgContent
          .replace(/\b(width|height)="[^"]*"/g, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '');
        
        // Securely sanitize the cleaned SVG using DOMPurify with strict SVG attributes whitelist
        const sanitizedSvg = DOMPurify.sanitize(svgCleaned, {
          USE_PROFILES: { svg: true },
          ADD_ATTR: ['id', 'class', 'style', 'fill', 'stroke', 'viewBox', 'd', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height'],
        });

        // Inject the style scoped to this specific icon ID
        // Note: Using a single style tag for all icons or moving it to a higher level can sometimes help with html2canvas
        // But for isolation, we keep it here. We'll use a safer selector.
        const styledSvg = `<style>
          #${iconId} path, #${iconId} circle, #${iconId} rect, #${iconId} ellipse, #${iconId} polygon, #${iconId} polyline, #${iconId} line { 
            fill: inherit !important; 
            stroke: inherit !important;
          }
          #${iconId} [fill="none"], .none, .fill-none { fill: none !important; }
          #${iconId} [stroke="none"], .stroke-none { stroke: none !important; }
        </style>${sanitizedSvg.replace(/<svg([^>]*)>/i, `<svg id="${iconId}" $1>`)}`;

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
