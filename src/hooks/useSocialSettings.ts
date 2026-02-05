import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SocialSettings, DEFAULT_SOCIAL_SETTINGS } from '@/types/settings';
import { useTier } from '@/hooks/useTier';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useSocialSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isAgency } = useTier();
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  const { data: settings = DEFAULT_SOCIAL_SETTINGS } = useQuery({
    queryKey: ['settings', 'social', user?.id],
    queryFn: async () => {
      if (!user) return DEFAULT_SOCIAL_SETTINGS;
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/settings/social`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return DEFAULT_SOCIAL_SETTINGS;
      const data = await res.json();
      return { ...DEFAULT_SOCIAL_SETTINGS, ...data };
    },
    enabled: !!user,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<SocialSettings>) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/settings/social`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...settings, ...updates }),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: (newData) => {
      queryClient.setQueryData(['settings', 'social', user?.id], newData);
      toast.success('Social settings updated');
    },
    onError: () => {
      toast.error('Failed to update settings');
    }
  });

  const updateSettings = useCallback((updates: Partial<SocialSettings>) => {
    updateSettingsMutation.mutate(updates);
  }, []);

  const resetSettings = useCallback(() => {
    updateSettingsMutation.mutate(DEFAULT_SOCIAL_SETTINGS);
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
