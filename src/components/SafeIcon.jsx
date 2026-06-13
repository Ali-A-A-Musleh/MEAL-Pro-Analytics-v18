import * as Icons from 'lucide-react';
import { Icon } from '@iconify/react';

const normalizeIconName = (name) => {
  const raw = String(name || '').trim();
  
  // Try Humanitarian Icons first if prefixed
  if (raw.toLowerCase().startsWith('hum:')) {
    const humName = raw.slice(4).toLowerCase().replace(/[^a-z0-9]/g, '-');
    return { type: 'hum', name: `huma-${humName}` };
  }

  const directKey = raw.replace(/[^a-zA-Z0-9]/g, '');
  if (Icons[directKey]) return { type: 'lucide', name: directKey };

  const pascal = raw
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  if (Icons[pascal]) return { type: 'lucide', name: pascal };

  const lower = pascal.toLowerCase();
  const match = Object.keys(Icons).find((key) => key.toLowerCase() === lower);
  if (match) return { type: 'lucide', name: match };

  // Try Iconify with common prefixes
  const iconifyPrefixes = ['mdi:', 'fa:', 'ion:', 'lucide:', 'heroicons:', 'tabler:', 'feather:'];
  
  // If it already has a prefix, just return it as iconify
  if (iconifyPrefixes.some(p => raw.toLowerCase().startsWith(p))) {
    return { type: 'iconify', name: raw.toLowerCase() };
  }

  // Otherwise default to mdi prefix for non-lucide icons
  const iconifyName = 'mdi:' + raw.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return { type: 'iconify', name: iconifyName };
};

const SafeIcon = ({ name, size = 16, className = '', style = {} }) => {
  const normalized = normalizeIconName(name);
  if (normalized.type === 'lucide') {
    const IconComponent = Icons[normalized.name] || Icons['Circle'];
    return <IconComponent size={size} className={className} style={style} color={style.color || undefined} />;
  } else if (normalized.type === 'iconify') {
    return <Icon icon={normalized.name} width={size} height={size} className={className} style={{ color: style.color, ...style }} />;
  } else if (normalized.type === 'hum') {
    return <i className={`${normalized.name} ${className}`} style={{ fontSize: size, color: style.color, ...style }} />;
  }
  return <Icons.Circle size={size} className={className} style={style} color={style.color || undefined} />;
};

export default SafeIcon;
