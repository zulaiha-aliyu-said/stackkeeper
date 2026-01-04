import { useState, useEffect, useCallback } from 'react';
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

export function useBranding() {
  const [branding, setBrandingState] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);
  const { tier } = useTier();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBrandingState({ ...DEFAULT_BRANDING, ...parsed });
      } catch {
        setBrandingState(DEFAULT_BRANDING);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
      
      // Apply branding to CSS variables
      if (tier === 'agency') {
        document.documentElement.style.setProperty('--primary', branding.primaryColor);
        document.documentElement.style.setProperty('--ring', branding.primaryColor);
      }
    }
  }, [branding, isLoading, tier]);

  const updateBranding = useCallback((updates: Partial<BrandingSettings>) => {
    setBrandingState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetBranding = useCallback(() => {
    setBrandingState(DEFAULT_BRANDING);
    document.documentElement.style.setProperty('--primary', DEFAULT_BRANDING.primaryColor);
    document.documentElement.style.setProperty('--ring', DEFAULT_BRANDING.primaryColor);
  }, []);

  const setLogo = useCallback((logoUrl: string | null) => {
    updateBranding({ logo: logoUrl });
  }, [updateBranding]);

  const setAppName = useCallback((name: string) => {
    updateBranding({ appName: name || 'StackVault' });
  }, [updateBranding]);

  const setPrimaryColor = useCallback((color: string) => {
    updateBranding({ primaryColor: color });
  }, [updateBranding]);

  const setAccentColor = useCallback((color: string) => {
    updateBranding({ accentColor: color });
  }, [updateBranding]);

  const togglePoweredBy = useCallback(() => {
    updateBranding({ showPoweredBy: !branding.showPoweredBy });
  }, [branding.showPoweredBy, updateBranding]);

  const canCustomizeBranding = tier === 'agency';

  return {
    branding,
    isLoading,
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
