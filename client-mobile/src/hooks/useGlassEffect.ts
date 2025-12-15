import { useState, useEffect } from 'react';

const GLASS_EFFECT_KEY = 'glassEffectEnabled';

export function useGlassEffect() {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    // Default to true (enabled)
    const saved = localStorage.getItem(GLASS_EFFECT_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem(GLASS_EFFECT_KEY, String(isEnabled));
  }, [isEnabled]);

  const toggle = () => {
    setIsEnabled(prev => !prev);
  };

  return {
    isEnabled,
    toggle,
    setIsEnabled
  };
}
