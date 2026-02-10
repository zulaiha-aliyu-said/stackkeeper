import { useState, useEffect, useCallback } from 'react';
import { UserTier, TIER_LIMITS } from '@/types/team';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const STORAGE_KEY = 'stackvault_tier';

export function useTier() {
  const { user } = useAuth();
  const [tier, setTierState] = useState<UserTier>('starter');
  const [isLoading, setIsLoading] = useState(true);

  // Load tier from profile (Supabase) or fallback to localStorage
  useEffect(() => {
    const loadTier = async () => {
      if (user) {
        const { data, error } = await (supabase
          .from('profiles')
          .select('tier')
          .eq('id', user.id)
          .single() as any);

        if (!error && data?.tier && ['starter', 'pro', 'agency'].includes(data.tier)) {
          setTierState(data.tier as UserTier);
          localStorage.setItem(STORAGE_KEY, data.tier);
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved && ['starter', 'pro', 'agency'].includes(saved)) {
            setTierState(saved as UserTier);
          }
        }
      } else {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && ['starter', 'pro', 'agency'].includes(saved)) {
          setTierState(saved as UserTier);
        }
      }
      setIsLoading(false);
    };
    loadTier();
  }, [user]);

  const setTier = useCallback((newTier: UserTier) => {
    setTierState(newTier);
    localStorage.setItem(STORAGE_KEY, newTier);
  }, []);

  const redeemCode = useCallback(async (code: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to redeem a code');
      return false;
    }

    const { data, error } = await (supabase.rpc as any)('redeem_code', {
      _code: code.trim().toUpperCase(),
      _user_id: user.id,
    });

    if (error) {
      const msg = error.message.includes('Invalid') 
        ? 'Invalid or already redeemed code' 
        : error.message;
      toast.error(msg);
      return false;
    }

    const newTier = data as string;
    if (newTier && ['starter', 'pro', 'agency'].includes(newTier)) {
      setTierState(newTier as UserTier);
      localStorage.setItem(STORAGE_KEY, newTier);
      toast.success(`🎉 Code redeemed! You're now on the ${newTier.charAt(0).toUpperCase() + newTier.slice(1)} plan!`);
      return true;
    }

    toast.error('Something went wrong');
    return false;
  }, [user]);

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
    redeemCode,
    isStarter: tier === 'starter',
    isPro: tier === 'pro',
    isAgency: tier === 'agency',
  };
}
