import { useState, useEffect, useCallback } from 'react';
import { Stack } from '@/types/team';
import { useTier } from './useTier';

const STORAGE_KEY = 'stackvault_stacks';
const ACTIVE_STACK_KEY = 'stackvault_active_stack';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

const DEFAULT_STACK: Stack = {
  id: 'default',
  name: 'My Stack',
  description: 'Your personal tool collection',
  createdAt: new Date().toISOString(),
  isDefault: true,
};

export function useStacks() {
  const [stacks, setStacks] = useState<Stack[]>([DEFAULT_STACK]);
  const [activeStackId, setActiveStackId] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);
  const { limits, tier } = useTier();

  useEffect(() => {
    const savedStacks = localStorage.getItem(STORAGE_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_STACK_KEY);
    
    if (savedStacks) {
      try {
        const parsed = JSON.parse(savedStacks);
        if (parsed.length > 0) {
          setStacks(parsed);
        }
      } catch {
        setStacks([DEFAULT_STACK]);
      }
    }
    
    if (savedActiveId) {
      setActiveStackId(savedActiveId);
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stacks));
    }
  }, [stacks, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(ACTIVE_STACK_KEY, activeStackId);
    }
  }, [activeStackId, isLoading]);

  const createStack = useCallback((name: string, description?: string) => {
    if (stacks.length >= limits.maxStacks) {
      return { success: false, error: 'Stack limit reached' };
    }

    const newStack: Stack = {
      id: generateId(),
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
      isDefault: false,
    };

    setStacks(prev => [...prev, newStack]);
    return { success: true, stack: newStack };
  }, [stacks.length, limits.maxStacks]);

  const updateStack = useCallback((id: string, updates: Partial<Omit<Stack, 'id' | 'createdAt' | 'isDefault'>>) => {
    setStacks(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
  }, []);

  const deleteStack = useCallback((id: string) => {
    const stack = stacks.find(s => s.id === id);
    if (stack?.isDefault) {
      return { success: false, error: 'Cannot delete default stack' };
    }

    setStacks(prev => prev.filter(s => s.id !== id));
    
    if (activeStackId === id) {
      const defaultStack = stacks.find(s => s.isDefault);
      setActiveStackId(defaultStack?.id || 'default');
    }

    return { success: true };
  }, [stacks, activeStackId]);

  const switchStack = useCallback((id: string) => {
    if (stacks.some(s => s.id === id)) {
      setActiveStackId(id);
    }
  }, [stacks]);

  const activeStack = stacks.find(s => s.id === activeStackId) || stacks[0];
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
