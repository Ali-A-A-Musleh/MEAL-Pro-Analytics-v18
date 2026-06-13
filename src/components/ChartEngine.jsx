import { useEffect, useRef, memo } from 'react';
import { getDesignSettings } from '../services/SettingsService';

// Brand colors: Place your project's brand identity colors here for subsequent customization.
const brandColors = {
  primary: '#4338ca',
  secondary: '#2563eb',
  accent: '#ec4899',
  muted: '#eef2ff'
};

function ChartEngine({ selectedProject, selectedDesign, onApplySettings, onFade }) {
  const prevRef = useRef({ p: null, d: null });

  useEffect(() => {
    if (!selectedProject || !selectedDesign) return;
    const prev = prevRef.current;
    if (prev.p === selectedProject && prev.d === selectedDesign) return;

    const designSettings = getDesignSettings(selectedProject, selectedDesign);
    onApplySettings?.(designSettings);
    // trigger a single fade when selection changes
    onFade?.();

    prevRef.current = { p: selectedProject, d: selectedDesign };
  }, [selectedProject, selectedDesign, onApplySettings, onFade]);

  useEffect(() => {
    const handleUpdate = () => {
      if (!selectedProject || !selectedDesign) return;
      const designSettings = getDesignSettings(selectedProject, selectedDesign);
      onApplySettings?.(designSettings);
    };

    window.addEventListener('project-settings-updated', handleUpdate);
    return () => {
      window.removeEventListener('project-settings-updated', handleUpdate);
    };
  }, [selectedProject, selectedDesign, onApplySettings]);

  return null;
}

export default memo(ChartEngine);
