import { useState } from 'react';
import { X, Vault, Package, Zap, Trophy, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

interface OnboardingWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFirstTool: () => void;
  onLoadDemo: () => void;
  userName?: string | null;
}

const STEPS = [
  {
    icon: Vault,
    title: 'Welcome to StackVault!',
    subtitle: 'Your lifetime deal command center',
    description:
      'Track every tool you own, monitor usage, get refund alerts, and make sure no deal goes to waste.',
    highlight: 'Never lose track of a purchase again.',
  },
  {
    icon: Package,
    title: 'Add Your Tools',
    subtitle: 'Build your vault',
    description:
      'Add tools manually, import from email receipts, or load our demo to explore. Each tool tracks price, platform, usage, and more.',
    highlight: 'Supports LTD, PitchGround, DealFuel & more.',
  },
  {
    icon: Zap,
    title: 'Track Usage & ROI',
    subtitle: 'Know your numbers',
    description:
      'Log when you use each tool. StackVault calculates your Stack Score™, highlights unused tools in the "Tool Graveyard", and sends refund window alerts.',
    highlight: 'Stop wasting money on forgotten tools.',
  },
  {
    icon: Trophy,
    title: "You're All Set!",
    subtitle: 'Start building your vault',
    description:
      'Add your first tool to get started, or load the demo with 47 pre-configured tools to explore every feature instantly.',
    highlight: "Let's go!",
  },
];

export function OnboardingWelcomeModal({
  isOpen,
  onClose,
  onAddFirstTool,
  onLoadDemo,
  userName,
}: OnboardingWelcomeModalProps) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleNext = () => {
    if (isLast) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (isFirst) return;
    setStep((s) => s - 1);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Close */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-8 bg-primary'
                  : i < step
                  ? 'w-4 bg-primary/40'
                  : 'w-4 bg-border'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-8 pt-8 pb-6 text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground">
            {isFirst && userName
              ? `Welcome, ${userName}!`
              : current.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{current.subtitle}</p>

          {/* Description */}
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            {current.description}
          </p>

          {/* Highlight */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            {current.highlight}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border px-8 py-5">
          {isLast ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  onClose();
                  onAddFirstTool();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Package className="h-4 w-4" />
                Add Your First Tool
              </button>
              <button
                onClick={() => {
                  onClose();
                  onLoadDemo();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <Zap className="h-4 w-4" />
                Load Demo (47 tools)
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip
              </button>
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
