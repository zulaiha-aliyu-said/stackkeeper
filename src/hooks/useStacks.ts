import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack } from '@/types/team';
import { useTier } from './useTier';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useStacks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { limits, tier } = useTier();
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  // Local state for active stack selection (session only)
  // Or persist to localStorage just for "last active stack"
  const [localActiveStackId, setLocalActiveStackId] = useState<string>('default');

  const { data: stacks = [], isLoading } = useQuery({
    queryKey: ['stacks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/stacks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stacks');
      return res.json();
    },
    enabled: !!user,
  });

  const createStackMutation = useMutation({
    mutationFn: async (vars: { name: string; description?: string }) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/stacks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(vars),
      });
      if (!res.ok) throw new Error('Failed to create stack');
      return res.json();
    },
    onSuccess: (newStack) => {
      queryClient.invalidateQueries({ queryKey: ['stacks'] });
      toast.success('Stack created');
      return { success: true, stack: newStack };
    },
    onError: () => {
      toast.error('Failed to create stack');
    }
  });

  const activeStackId = localActiveStackId; // We can improve this to sync with DB last status later

  const createStack = (name: string, description?: string) => {
    if (stacks.length >= limits.maxStacks) {
      return { success: false, error: 'Stack limit reached' };
    }
    createStackMutation.mutate({ name, description });
    // Optimistically returning success is tricky here as it's async in mutation
    // Use the mutation callback or just return "processing"
    return { success: true };
  };

  const updateStack = (id: string, updates: Partial<Omit<Stack, 'id' | 'createdAt' | 'isDefault'>>) => {
    // TODO: Implement PUT /api/stacks/:id
    console.log('Update stack not yet implemented in backend');
  };

  const deleteStack = (id: string) => {
    const stack = stacks.find((s: Stack) => s.id === id);
    if (stack?.isDefault) {
      return { success: false, error: 'Cannot delete default stack' };
    }
    // TODO: Implement DELETE /api/stacks/:id
    console.log('Delete stack not yet implemented in backend');
    return { success: true };
  };

  const switchStack = (id: string) => {
    if (stacks.some((s: Stack) => s.id === id)) {
      setLocalActiveStackId(id);
    }
  };

  const activeStack = stacks.find((s: Stack) => s.id === activeStackId) || stacks[0];
  const canAddStack = stacks.length < limits.maxStacks;
  const remainingStacks = Math.max(0, limits.maxStacks - stacks.length);
  const hasMultipleStacks = tier === 'agency';

  return {
    stacks,
    activeStack,
    activeStackId,
    isLoading,
    createStack,
    updateStack,
    deleteStack,
    switchStack,
    canAddStack,
    remainingStacks,
    maxStacks: limits.maxStacks,
    hasMultipleStacks,
  };
}
