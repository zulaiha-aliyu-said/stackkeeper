import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: { current: number; total: number };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

const rarityColors = {
  common: {
    bg: 'bg-secondary',
    border: 'border-border',
    icon: 'text-muted-foreground',
    glow: '',
  },
  rare: {
    bg: 'bg-info/10',
    border: 'border-info/30',
    icon: 'text-info',
    glow: 'shadow-info/20',
  },
  epic: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: 'text-purple-400',
    glow: 'shadow-purple-500/20',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/50',
    icon: 'text-amber-400',
    glow: 'shadow-amber-500/30 shadow-lg',
  },
};

const sizeClasses = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
};

const iconSizes = {
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-9 w-9',
};

export function AchievementBadge({ achievement, size = 'md', showProgress = true }: AchievementBadgeProps) {
  const colors = rarityColors[achievement.rarity];
  const Icon = achievement.icon;

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl border-2 transition-all duration-300',
          sizeClasses[size],
          colors.bg,
          colors.border,
          achievement.unlocked ? colors.glow : 'opacity-40 grayscale',
          achievement.unlocked && 'hover:scale-110'
        )}
      >
        <Icon className={cn(iconSizes[size], achievement.unlocked ? colors.icon : 'text-muted-foreground')} />
        
        {/* Locked overlay */}
        {!achievement.unlocked && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60">
            <span className="text-lg">🔒</span>
          </div>
        )}

        {/* Legendary shimmer effect */}
        {achievement.unlocked && achievement.rarity === 'legendary' && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        )}
      </div>

      <div className="text-center max-w-[100px]">
        <p className={cn(
          'text-xs font-medium truncate',
          achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {achievement.name}
        </p>
        
        {showProgress && achievement.progress && !achievement.unlocked && (
          <div className="mt-1 w-full h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(achievement.progress.current / achievement.progress.total) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
