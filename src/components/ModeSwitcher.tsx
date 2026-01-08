import { Zap, Leaf } from 'lucide-react';
import { useInterfaceMode } from '@/hooks/useInterfaceMode';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ModeSwitcherProps {
  showLabel?: boolean;
  className?: string;
}

export function ModeSwitcher({ showLabel = false, className }: ModeSwitcherProps) {
  const { mode, toggleMode, isSimpleMode } = useInterfaceMode();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleMode}
            className={cn(
              "flex items-center gap-2 h-9 px-3 rounded-lg transition-colors",
              isSimpleMode 
                ? "bg-secondary hover:bg-secondary/80 text-muted-foreground" 
                : "bg-primary/10 hover:bg-primary/20 text-primary",
              className
            )}
          >
            {isSimpleMode ? (
              <Leaf className="h-4 w-4" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {showLabel && (
              <span className="text-sm font-medium">
                {isSimpleMode ? 'Simple' : 'Power'}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            {isSimpleMode 
              ? 'Simple Mode: Essential features only. Click for Power Mode.' 
              : 'Power Mode: All features enabled. Click for Simple Mode.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
