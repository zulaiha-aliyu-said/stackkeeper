import { Flame } from 'lucide-react';
import { getStreakEmoji, getStreakMessage } from '@/lib/streaks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function StreakBadge({ streak, size = 'sm', showLabel = false }: StreakBadgeProps) {
  if (streak === 0) return null;

  const emoji = getStreakEmoji(streak);
  const message = getStreakMessage(streak);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-3 py-1.5 gap-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-600 dark:text-orange-400 font-medium ${sizeClasses[size]}`}
          >
            {emoji || <Flame className={iconSizes[size]} />}
            <span>{streak} day{streak !== 1 ? 's' : ''}</span>
            {showLabel && message && (
              <span className="text-muted-foreground ml-1">• {message}</span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{message || `${streak} day streak`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
