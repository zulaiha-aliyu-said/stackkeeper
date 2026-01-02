import { AlertTriangle, X, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface DemoModeBannerProps {
  onClearDemo: () => void;
  onDismiss: () => void;
  toolCount: number;
}

export function DemoModeBanner({ onClearDemo, onDismiss, toolCount }: DemoModeBannerProps) {
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = () => {
    setIsClearing(true);
    setTimeout(() => {
      onClearDemo();
    }, 500);
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 mb-6">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent animate-pulse opacity-50" />
      
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full p-2 bg-primary/20 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              Demo Mode Active
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                {toolCount} sample tools
              </span>
            </h4>
            <p className="text-sm text-muted-foreground mt-0.5">
              Explore all features with pre-loaded sample data. Clear demo to add your own tools.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={isClearing}
            className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
          >
            <Trash2 className="h-4 w-4" />
            {isClearing ? 'Clearing...' : 'Clear Demo'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Keep Exploring
          </Button>
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-secondary transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
