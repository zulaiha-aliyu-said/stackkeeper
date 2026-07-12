import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserTier, TIER_LIMITS } from '@/types/team';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const STORAGE_KEY = 'stackvault_tier';
const TRIAL_STORAGE_KEY = 'stackvault_trial_ends_at';

const VALID_TIERS = ['starter', 'pro', 'agency'];

/** Pro-level access during the 7-day trial so users can fully explore. */
const TRIAL_LIMITS = TIER_LIMITS.pro;

const FREE_LIMITS = {
  maxTools: 5,
  maxStacks: 1,
  maxTeamMembers: 0,
  hasAdvancedAnalytics: false,
  hasTeamFeatures: false,
  hasBranding: false,
  hasPublicProfile: false,
  hasBattles: false,
  hasEmailImport: false,
} as const;

function daysRemaining(endsAt: string | null): number {
  if (!endsAt) return 0;
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function useTier() {
  const { user, isReady } = useAuth();
  const [tier, setTierState] = useState<UserTier | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [trialStartedAt, setTrialStartedAt] = useState<string | null>(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadTier = useCallback(async () => {
    if (!isReady) return;

    if (user) {
      try {
        const { data, error } = await (supabase
          .from('profiles')
          .select('tier, trial_started_at, trial_ends_at, trial_used')
          .eq('id', user.id)
          .single() as any);

        if (!error && data) {
          if (data.tier && VALID_TIERS.includes(data.tier)) {
            setTierState(data.tier as UserTier);
            localStorage.setItem(STORAGE_KEY, data.tier);
          } else {
            setTierState(null);
            localStorage.removeItem(STORAGE_KEY);
          }

          setTrialStartedAt(data.trial_started_at || null);
          setTrialEndsAt(data.trial_ends_at || null);
          setTrialUsed(!!data.trial_used);

          if (data.trial_ends_at) {
            localStorage.setItem(TRIAL_STORAGE_KEY, data.trial_ends_at);
          } else {
            localStorage.removeItem(TRIAL_STORAGE_KEY);
          }
        }
      } catch (err) {
        console.error('Failed to load tier:', err);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && VALID_TIERS.includes(saved)) {
          setTierState(saved as UserTier);
        }
        const savedTrial = localStorage.getItem(TRIAL_STORAGE_KEY);
        if (savedTrial) setTrialEndsAt(savedTrial);
      }
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && VALID_TIERS.includes(saved)) {
        setTierState(saved as UserTier);
      } else {
        setTierState(null);
      }
      const savedTrial = localStorage.getItem(TRIAL_STORAGE_KEY);
      setTrialEndsAt(savedTrial);
    }
    setIsLoading(false);
  }, [user, isReady]);

  useEffect(() => {
    loadTier();
  }, [loadTier]);

  const setTier = useCallback((newTier: UserTier) => {
    setTierState(newTier);
    localStorage.setItem(STORAGE_KEY, newTier);
  }, []);

  const hasLifetimePlan = tier !== null;
  const trialDaysLeft = useMemo(() => daysRemaining(trialEndsAt), [trialEndsAt]);
  const isOnTrial = !hasLifetimePlan && !!trialEndsAt && trialDaysLeft > 0;
  const isTrialExpired = !hasLifetimePlan && trialUsed && (!trialEndsAt || trialDaysLeft <= 0);

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
      const raw = error.message || '';
      let msg = 'Could not redeem code';
      if (raw.includes('Invalid') || raw.includes('already redeemed')) {
        msg = 'Invalid or already redeemed code';
      } else if (raw.includes('already used your free trial')) {
        msg = 'You have already used your free trial';
      } else if (raw.includes('already have an active lifetime')) {
        msg = 'You already have an active lifetime plan';
      } else if (raw) {
        msg = raw;
      }
      toast.error(msg);
      return false;
    }

    const result = data as string;

    if (result === 'trial') {
      await loadTier();
      toast.success('🎉 Your 7-day Pro trial is live!', {
        description: 'Explore unlimited tools and advanced insights — then lock in lifetime access anytime.',
        duration: 6000,
      });
      return true;
    }

    if (result && VALID_TIERS.includes(result)) {
      const wasOnTrial = isOnTrial;
      setTierState(result as UserTier);
      localStorage.setItem(STORAGE_KEY, result);
      await loadTier();

      const planName = result.charAt(0).toUpperCase() + result.slice(1);
      if (wasOnTrial) {
        toast.success(`✨ Upgraded to ${planName} — yours forever!`, {
          description: 'Your trial converted to lifetime access. Everything you built stays unlocked.',
          duration: 7000,
        });
      } else {
        toast.success(`🎉 Welcome to ${planName}!`, {
          description: 'Lifetime access unlocked. No subscriptions, no surprises.',
          duration: 6000,
        });
      }
      return true;
    }

    toast.error('Something went wrong');
    return false;
  }, [user, isOnTrial, loadTier]);

  const limits = hasLifetimePlan
    ? TIER_LIMITS[tier!]
    : isOnTrial
      ? TRIAL_LIMITS
      : FREE_LIMITS;

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
    if (isOnTrial) {
      return `Loving ${feature}? Redeem an LTD code to keep it forever`;
    }
    if (isTrialExpired) {
      return `Your trial ended — redeem a code to unlock ${feature}`;
    }
    if (!tier) {
      return `Redeem a trial or LTD code to unlock ${feature}`;
    }
    if (tier === 'starter') {
      return `Redeem a Pro or Agency code to unlock ${feature}`;
    }
    if (tier === 'pro') {
      return `Redeem an Agency code to unlock ${feature}`;
    }
    return null;
  }, [tier, isOnTrial, isTrialExpired]);

  return {
    tier,
    setTier,
    isLoading,
    limits,
    canAccessFeature,
    isFeatureLocked,
    getUpgradeMessage,
    redeemCode,
    refreshTier: loadTier,
    hasNoPlan: !hasLifetimePlan && !isOnTrial,
    hasLifetimePlan,
    isStarter: tier === 'starter',
    isPro: tier === 'pro',
    isAgency: tier === 'agency',
    isOnTrial,
    isTrialExpired,
    trialUsed,
    trialEndsAt,
    trialStartedAt,
    trialDaysLeft,
  };
}
