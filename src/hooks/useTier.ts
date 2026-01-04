import { useState, useEffect, useCallback } from 'react';
import { UserTier, TIER_LIMITS } from '@/types/team';

const STORAGE_KEY = 'stackvault_tier';

export function useTier() {
  const [tier, setTierState] = useState<UserTier>('starter');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['starter', 'pro', 'agency'].includes(saved)) {
      setTierState(saved as UserTier);
    }
    setIsLoading(false);
  }, []);

  const setTier = useCallback((newTier: UserTier) => {
    setTierState(newTier);
    localStorage.setItem(STORAGE_KEY, newTier);
  }, []);

  const limits = TIER_LIMITS[tier];

  const canAccessFeature = useCallback((feature: keyof typeof TIER_LIMITS['starter']) => {
    return limits[feature];
  }, [limits]);

  const isFeatureLocked = useCallback((feature: keyof typeof TIER_LIMITS['starter']) => {
    const value = limits[feature];
    if (typeof value === 'boolean') return !value;
    if (typeof value === 'number') return value === 0;
    return false;
  }, [limits]);

  const getUpgradeMessage = useCallback((feature: string) => {
    if (tier === 'starter') {
      return `Upgrade to Pro or Agency to unlock ${feature}`;
    }
    if (tier === 'pro') {
      return `Upgrade to Agency to unlock ${feature}`;
    }
    return null;
  }, [tier]);

  return {
    tier,
    setTier,
    isLoading,
    limits,
    canAccessFeature,
    isFeatureLocked,
    getUpgradeMessage,
    isStarter: tier === 'starter',
    isPro: tier === 'pro',
    isAgency: tier === 'agency',
  };
}
