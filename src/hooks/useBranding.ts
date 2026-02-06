import { useState, useCallback } from 'react';
import { BrandingSettings } from '@/types/team';
import { useTier } from './useTier';

const STORAGE_KEY = 'stackvault_branding';

const DEFAULT_BRANDING: BrandingSettings = {
  logo: null,
  appName: 'StackVault',
  primaryColor: '160 84% 39%',
  accentColor: '217 91% 60%',
  showPoweredBy: true,
};

function loadBranding(): BrandingSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_BRANDING, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_BRANDING;
}

export function useBranding() {
  const { tier } = useTier();
  const [branding, setBrandingState] = useState<BrandingSettings>(loadBranding);

  const updateBranding = useCallback((updates: Partial<BrandingSettings>) => {
    setBrandingState(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      if (tier === 'agency') {
        document.documentElement.style.setProperty('--primary', next.primaryColor);
        document.documentElement.style.setProperty('--ring', next.primaryColor);
      }
      return next;
    });
  }, [tier]);

  const resetBranding = useCallback(() => {
    updateBranding(DEFAULT_BRANDING);
    document.documentElement.style.setProperty('--primary', DEFAULT_BRANDING.primaryColor);
    document.documentElement.style.setProperty('--ring', DEFAULT_BRANDING.primaryColor);
  }, [updateBranding]);

  const setLogo = useCallback((logoUrl: string | null) => updateBranding({ logo: logoUrl }), [updateBranding]);
  const setAppName = useCallback((name: string) => updateBranding({ appName: name || 'StackVault' }), [updateBranding]);
  const setPrimaryColor = useCallback((color: string) => updateBranding({ primaryColor: color }), [updateBranding]);
  const setAccentColor = useCallback((color: string) => updateBranding({ accentColor: color }), [updateBranding]);
  const togglePoweredBy = useCallback(() => updateBranding({ showPoweredBy: !branding.showPoweredBy }), [branding.showPoweredBy, updateBranding]);

  const canCustomizeBranding = tier === 'agency';

  return {
    branding,
    isLoading: false,
    updateBranding,
    resetBranding,
    setLogo,
    setAppName,
    setPrimaryColor,
    setAccentColor,
    togglePoweredBy,
    canCustomizeBranding,
    defaultBranding: DEFAULT_BRANDING,
  };
}
