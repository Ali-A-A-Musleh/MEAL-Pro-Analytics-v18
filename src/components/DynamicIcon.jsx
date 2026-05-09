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
        // Apply color by replacing fill and stroke attributes
        const color = style.color || '#000000';
        svgContent = svgContent.replace(/(fill|stroke)="[^"]*"/g, `$1="${color}"`);
        return (
          <div
            className={className}
            style={{ width: size, height: size, display: 'inline-block', ...style }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
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
