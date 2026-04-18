import { useState, useCallback } from 'react';
import { SocialSettings, DEFAULT_SOCIAL_SETTINGS } from '@/types/settings';
import { useTier } from '@/hooks/useTier';

const STORAGE_KEY = 'stackvault_social_settings';

function loadSettings(): SocialSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_SOCIAL_SETTINGS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_SOCIAL_SETTINGS;
}

export function useSocialSettings() {
  const { isAgency } = useTier();
  const [settings, setSettingsState] = useState<SocialSettings>(loadSettings);

  const updateSettings = useCallback((updates: Partial<SocialSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    updateSettings(DEFAULT_SOCIAL_SETTINGS);
  }, [updateSettings]);

  const effectiveSettings: SocialSettings = isAgency ? settings : DEFAULT_SOCIAL_SETTINGS;

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
