

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BrandingSettings } from '@/types/team';
import { useTier } from './useTier';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const DEFAULT_BRANDING: BrandingSettings = {
  logo: null,
  appName: 'StackVault',
  primaryColor: '160 84% 39%',
  accentColor: '217 91% 60%',
  showPoweredBy: true,
};

export function useBranding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { tier } = useTier();
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  const { data: branding = DEFAULT_BRANDING, isLoading } = useQuery({
    queryKey: ['branding', user?.id],
    queryFn: async () => {
      if (!user) return DEFAULT_BRANDING;
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/settings/branding`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch branding');
      const data = await res.json();
      return { ...DEFAULT_BRANDING, ...data }; // Merge with defaults
    },
    enabled: !!user,
  });

  const updateBrandingMutation = useMutation({
    mutationFn: async (updates: Partial<BrandingSettings>) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/settings/branding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...branding, ...updates }),
      });
      if (!res.ok) throw new Error('Failed to save branding');
      return res.json();
    },
    onSuccess: (newData) => {
      queryClient.setQueryData(['branding', user?.id], newData);

      // Apply branding to CSS variables immediately
      if (tier === 'agency') {
        document.documentElement.style.setProperty('--primary', newData.primaryColor || DEFAULT_BRANDING.primaryColor);
        document.documentElement.style.setProperty('--ring', newData.primaryColor || DEFAULT_BRANDING.primaryColor);
      }
      toast.success('Branding updated');
    },
    onError: () => {
      toast.error('Failed to update branding');
    }
  });

  const updateBranding = (updates: Partial<BrandingSettings>) => {
    updateBrandingMutation.mutate(updates);
  };

  const resetBranding = useCallback(() => {
    updateBranding(DEFAULT_BRANDING);
    document.documentElement.style.setProperty('--primary', DEFAULT_BRANDING.primaryColor);
    document.documentElement.style.setProperty('--ring', DEFAULT_BRANDING.primaryColor);
  }, []);

  const setLogo = useCallback((logoUrl: string | null) => {
    updateBranding({ logo: logoUrl });
  }, []);

  const setAppName = useCallback((name: string) => {
    updateBranding({ appName: name || 'StackVault' });
  }, []);

  const setPrimaryColor = useCallback((color: string) => {
    updateBranding({ primaryColor: color });
  }, []);

  const setAccentColor = useCallback((color: string) => {
    updateBranding({ accentColor: color });
  }, []);

  const togglePoweredBy = useCallback(() => {
    updateBranding({ showPoweredBy: !branding.showPoweredBy });
  }, [branding.showPoweredBy]);

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
