import { useState, useEffect } from 'react';
import { useUserSettings } from '@/lib/firebaseHooks';

const GLASS_EFFECT_KEY = 'glassEffectEnabled';

export function useGlassEffect() {
  const { settings, updateSettings, isLoading } = useUserSettings();
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    // Default to true (enabled)
    // Try Firebase first, then localStorage as fallback
    if (settings?.glassEffectEnabled !== undefined) {
      return settings.glassEffectEnabled;
    }
    const saved = localStorage.getItem(GLASS_EFFECT_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  // Sync with Firebase UserSettings when settings change
  useEffect(() => {
    if (!isLoading && settings?.glassEffectEnabled !== undefined) {
      setIsEnabled(settings.glassEffectEnabled);
    } else if (!isLoading && !settings?.glassEffectEnabled) {
      // Migrate from localStorage to Firebase
      const saved = localStorage.getItem(GLASS_EFFECT_KEY);
      if (saved !== null) {
        const value = saved === 'true';
        updateSettings({ glassEffectEnabled: value }).then(() => {
          localStorage.removeItem(GLASS_EFFECT_KEY);
        }).catch(console.error);
        setIsEnabled(value);
      }
    }
  }, [settings?.glassEffectEnabled, isLoading, updateSettings]);

  useEffect(() => {
    if (!isLoading && updateSettings) {
      // Save to Firebase UserSettings
      updateSettings({ glassEffectEnabled: isEnabled }).catch(console.error);
      // Keep localStorage as fallback for now
      localStorage.setItem(GLASS_EFFECT_KEY, String(isEnabled));
    }
  }, [isEnabled, isLoading, updateSettings]);

  const toggle = () => {
    setIsEnabled(prev => !prev);
  };

  return {
    isEnabled,
    toggle,
    setIsEnabled
  };
}
