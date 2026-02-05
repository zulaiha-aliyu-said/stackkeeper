import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  InterfaceMode,
  SIMPLE_MODE_FEATURES,
  POWER_MODE_FEATURES
} from '@/types/settings';
import { toast } from 'sonner';

export function useInterfaceMode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  // We can treat interface mode as part of the user profile
  // Or fetch it separately if it's in a settings table.
  // The schema added 'interface_mode' to users table.

  const { data: mode = 'simple' } = useQuery({
    queryKey: ['interface_mode', user?.id],
    queryFn: async () => {
      // We could fetch this from /api/me if it returns the full user object including interface_mode
      // Or a specific settings endpoint. Let's assume /api/me returns it or we make a dedicated call.
      // Actually, useAuth might already have it if we update the user object.
      // But let's fetch it to be sure of latest state.
      if (!user) return 'simple';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return 'simple';
      const data = await res.json();
      return data.interface_mode || 'simple';
    },
    enabled: !!user,
    initialData: 'simple'
  });

  const updateModeMutation = useMutation({
    mutationFn: async (newMode: InterfaceMode) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/me/settings`, { // Need to implement this or just update user
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ interface_mode: newMode }),
      });
      if (!res.ok) throw new Error('Failed to update mode');
      return res.json();
    },
    onSuccess: (data, newMode) => {
      queryClient.setQueryData(['interface_mode', user?.id], newMode);
      toast.success(`Switched to ${newMode} mode`);
    },
    onError: () => {
      toast.error('Failed to update interface mode');
    }
  });

  const setMode = useCallback((newMode: InterfaceMode) => {
    updateModeMutation.mutate(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'simple' ? 'power' : 'simple';
    setMode(newMode);
  }, [mode, setMode]);

  const isSimpleMode = mode === 'simple';
  const isPowerMode = mode === 'power';

  const features = isSimpleMode ? SIMPLE_MODE_FEATURES : POWER_MODE_FEATURES;

  return {
    mode: mode as InterfaceMode,
    setMode,
    toggleMode,
    isSimpleMode,
    isPowerMode,
    features,
  };
}
