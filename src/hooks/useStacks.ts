import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack } from '@/types/team';
import { useTier } from './useTier';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useStacks() {
  const { user, isReady } = useAuth();
  const queryClient = useQueryClient();
  const { limits, tier } = useTier();

  const [localActiveStackId, setLocalActiveStackId] = useState<string>('default');

  const { data: stacks = [], isLoading } = useQuery({
    queryKey: ['stacks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('stacks' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        // If table doesn't exist, return a default stack
        console.warn('Stacks fetch error (table may not exist):', error.message);
        return [{
          id: 'default',
          name: 'Default Stack',
          description: 'Your main tool collection',
          isDefault: true,
          createdAt: new Date().toISOString(),
        }] as Stack[];
      }

      const result = (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        isDefault: s.is_default || false,
        createdAt: s.created_at,
      }));

      // Always ensure a default stack exists
      if (result.length === 0) {
        return [{
          id: 'default',
          name: 'Default Stack',
          description: 'Your main tool collection',
          isDefault: true,
          createdAt: new Date().toISOString(),
        }] as Stack[];
      }

      return result as Stack[];
    },
    enabled: isReady && !!user,
  });

  const createStackMutation = useMutation({
    mutationFn: async (vars: { name: string; description?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('stacks' as any)
        .insert({
          user_id: user.id,
          name: vars.name,
          description: vars.description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stacks'] });
      toast.success('Stack created');
    },
    onError: () => {
      toast.error('Failed to create stack');
    }
  });

  const activeStackId = localActiveStackId;

  const createStack = (name: string, description?: string) => {
    if (stacks.length >= limits.maxStacks) {
      return { success: false, error: 'Stack limit reached' };
    }
    createStackMutation.mutate({ name, description });
    return { success: true };
  };

  const updateStack = (id: string, updates: Partial<Omit<Stack, 'id' | 'createdAt' | 'isDefault'>>) => {
    // TODO: Implement when stacks table is available
    console.log('Update stack not yet implemented');
  };

  const deleteStack = (id: string) => {
    const stack = stacks.find((s: Stack) => s.id === id);
    if (stack?.isDefault) {
      return { success: false, error: 'Cannot delete default stack' };
    }
    // TODO: Implement when stacks table is available
    console.log('Delete stack not yet implemented');
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
