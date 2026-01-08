import { useState, useEffect, useCallback } from 'react';
import { SocialSettings, DEFAULT_SOCIAL_SETTINGS } from '@/types/settings';
import { useTier } from '@/hooks/useTier';

const STORAGE_KEY = 'stackvault_social_settings';

export function useSocialSettings() {
  const { isAgency } = useTier();
  const [settings, setSettingsState] = useState<SocialSettings>(DEFAULT_SOCIAL_SETTINGS);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettingsState({ ...DEFAULT_SOCIAL_SETTINGS, ...parsed });
      } catch {
        // Use defaults
      }
    }
  }, []);

  const updateSettings = useCallback((updates: Partial<SocialSettings>) => {
    setSettingsState(prev => {
      const newSettings = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULT_SOCIAL_SETTINGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SOCIAL_SETTINGS));
  }, []);

  // If not Agency, all social features are disabled
  const effectiveSettings: SocialSettings = isAgency 
    ? settings 
    : DEFAULT_SOCIAL_SETTINGS;

  return {
    settings: effectiveSettings,
    updateSettings,
    resetSettings,
    enableBattles: effectiveSettings.enableBattles,
    enablePublicProfile: effectiveSettings.enablePublicProfile,
    enableStealMyStack: effectiveSettings.enableStealMyStack,
    canConfigureSocial: isAgency,
  };
}
