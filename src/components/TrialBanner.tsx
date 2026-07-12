import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useTier } from '@/hooks/useTier';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock, Gift, ArrowRight } from 'lucide-react';

const NUDGE_KEY = 'sv_trial_nudge';

function nudgeShown(key: string) {
  return sessionStorage.getItem(`${NUDGE_KEY}_${key}`) === '1';
}

function markNudge(key: string) {
  sessionStorage.setItem(`${NUDGE_KEY}_${key}`, '1');
}

/** Friendly trial upgrade prompts — once per session per milestone. */
export function TrialUpgradeNudges() {
  const { isOnTrial, isTrialExpired, trialDaysLeft, hasLifetimePlan } = useTier();
  const ran = useRef(false);

  useEffect(() => {
    if (hasLifetimePlan || ran.current) return;
    ran.current = true;

    if (isOnTrial) {
      const days = trialDaysLeft;

      if (days >= 7 && !nudgeShown('welcome')) {
        markNudge('welcome');
        toast('🚀 Pro trial unlocked', {
          description: 'You have 7 days of unlimited tools & insights. Make it yours with an LTD code anytime.',
          duration: 7000,
          action: {
            label: 'View plans',
            onClick: () => {
              window.location.href = '/settings?tab=billing';
            },
          },
        });
        return;
      }

      if (days === 4 || days === 3) {
        const key = `mid_${days}`;
        if (!nudgeShown(key)) {
          markNudge(key);
          toast('✨ How’s the trial going?', {
            description: `${days} days left. Your stack is looking great — lock in lifetime access when you’re ready.`,
            duration: 6500,
            action: {
              label: 'Upgrade',
              onClick: () => {
                window.location.href = '/settings?tab=billing';
              },
            },
          });
        }
        return;
      }

      if (days === 2) {
        if (!nudgeShown('d2')) {
          markNudge('d2');
          toast('⏳ 2 days left on Pro', {
            description: 'Keep everything you’ve built. Redeem an LTD code and never look back.',
            duration: 7000,
            action: {
              label: 'Redeem code',
              onClick: () => {
                window.location.href = '/settings?tab=billing';
              },
            },
          });
        }
        return;
      }

      if (days === 1) {
        if (!nudgeShown('d1')) {
          markNudge('d1');
          toast('🎁 Last day of your trial', {
            description: 'Upgrade today and keep Pro features forever — one payment, lifetime access.',
            duration: 8000,
            action: {
              label: 'Keep Pro forever',
              onClick: () => {
                window.location.href = '/settings?tab=billing';
              },
            },
          });
        }
      }
      return;
    }

    if (isTrialExpired && !nudgeShown('expired')) {
      markNudge('expired');
      toast('Trial ended — your tools are safe', {
        description: 'Redeem an LTD code anytime to unlock full access again. Nothing was deleted.',
        duration: 8000,
        action: {
          label: 'Upgrade now',
          onClick: () => {
            window.location.href = '/settings?tab=billing';
          },
        },
      });
    }
  }, [hasLifetimePlan, isOnTrial, isTrialExpired, trialDaysLeft]);

  return null;
}

export function TrialBanner() {
  const { isOnTrial, isTrialExpired, trialDaysLeft, hasLifetimePlan } = useTier();

  if (hasLifetimePlan) return null;

  if (isOnTrial) {
    const progress = Math.min(100, Math.max(0, ((7 - trialDaysLeft) / 7) * 100));
    const urgent = trialDaysLeft <= 2;

    return (
      <div
        className={`border-b ${
          urgent
            ? 'border-amber-500/40 bg-amber-500/10'
            : 'border-primary/30 bg-primary/5'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                urgent ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-primary/15 text-primary'
              }`}
            >
              {urgent ? <Clock className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">
                {trialDaysLeft === 1
                  ? 'Last day of your Pro trial'
                  : `${trialDaysLeft} days left on your Pro trial`}
              </p>
              <p className="text-xs text-muted-foreground">
                Unlimited tools & insights unlocked. Redeem an LTD code to keep it forever.
              </p>
              <div className="h-1.5 w-full max-w-xs rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    urgent ? 'bg-amber-500' : 'bg-primary'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          <Button asChild size="sm" className="gap-2 shrink-0">
            <Link to="/settings?tab=billing">
              <Gift className="h-4 w-4" />
              Upgrade to lifetime
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isTrialExpired) {
    return (
      <div className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Your free trial has ended</p>
            <p className="text-xs text-muted-foreground">
              Your tools are safe. Redeem a lifetime code to unlock full access again.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="gap-2 shrink-0">
            <Link to="/settings?tab=billing">
              Redeem LTD code
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
