import { useMemo } from 'react';
import { 
  Trophy, 
  Rocket, 
  Target, 
  Flame, 
  Crown,
  Star,
  Zap,
  TrendingUp,
  Package,
  DollarSign,
  Calendar,
  Ghost,
  Sparkles
} from 'lucide-react';
import { AchievementBadge, Achievement } from './AchievementBadge';
import { Tool } from '@/types/tool';

interface AchievementsPanelProps {
  tools: Tool[];
  totalInvestment: number;
  stackScore: number;
}

export function AchievementsPanel({ tools, totalInvestment, stackScore }: AchievementsPanelProps) {
  const achievements = useMemo((): Achievement[] => {
    const usedTools = tools.filter(t => t.lastUsed !== null);
    const totalUses = tools.reduce((sum, t) => sum + t.timesUsed, 0);
    const categories = new Set(tools.map(t => t.category));

    return [
      // Getting Started
      {
        id: 'first-tool',
        name: 'First Steps',
        description: 'Add your first tool to the vault',
        icon: Rocket,
        unlocked: tools.length >= 1,
        rarity: 'common',
        progress: { current: Math.min(tools.length, 1), total: 1 },
      },
      {
        id: 'tool-collector',
        name: 'Collector',
        description: 'Add 10 tools to your vault',
        icon: Package,
        unlocked: tools.length >= 10,
        rarity: 'common',
        progress: { current: Math.min(tools.length, 10), total: 10 },
      },
      {
        id: 'tool-hoarder',
        name: 'Tool Hoarder',
        description: 'Add 25 tools to your vault',
        icon: Crown,
        unlocked: tools.length >= 25,
        rarity: 'rare',
        progress: { current: Math.min(tools.length, 25), total: 25 },
      },
      // Usage
      {
        id: 'first-use',
        name: 'Getting Started',
        description: 'Mark a tool as used',
        icon: Zap,
        unlocked: usedTools.length >= 1,
        rarity: 'common',
        progress: { current: Math.min(usedTools.length, 1), total: 1 },
      },
      {
        id: 'power-user',
        name: 'Power User',
        description: 'Use tools 50 times total',
        icon: Flame,
        unlocked: totalUses >= 50,
        rarity: 'rare',
        progress: { current: Math.min(totalUses, 50), total: 50 },
      },
      {
        id: 'super-user',
        name: 'Super User',
        description: 'Use tools 200 times total',
        icon: Sparkles,
        unlocked: totalUses >= 200,
        rarity: 'epic',
        progress: { current: Math.min(totalUses, 200), total: 200 },
      },
      // Stack Score
      {
        id: 'score-50',
        name: 'Balanced',
        description: 'Achieve 50% Stack Score',
        icon: Target,
        unlocked: stackScore >= 50,
        rarity: 'common',
        progress: { current: Math.min(stackScore, 50), total: 50 },
      },
      {
        id: 'score-80',
        name: 'Optimizer',
        description: 'Achieve 80% Stack Score',
        icon: TrendingUp,
        unlocked: stackScore >= 80,
        rarity: 'rare',
        progress: { current: Math.min(stackScore, 80), total: 80 },
      },
      {
        id: 'score-100',
        name: 'Perfectionist',
        description: 'Achieve 100% Stack Score',
        icon: Trophy,
        unlocked: stackScore === 100 && tools.length > 0,
        rarity: 'legendary',
        progress: { current: stackScore, total: 100 },
      },
      // Investment
      {
        id: 'investor-100',
        name: 'Investor',
        description: 'Invest $100 in tools',
        icon: DollarSign,
        unlocked: totalInvestment >= 100,
        rarity: 'common',
        progress: { current: Math.min(totalInvestment, 100), total: 100 },
      },
      {
        id: 'investor-500',
        name: 'Big Spender',
        description: 'Invest $500 in tools',
        icon: Star,
        unlocked: totalInvestment >= 500,
        rarity: 'rare',
        progress: { current: Math.min(totalInvestment, 500), total: 500 },
      },
      {
        id: 'investor-1000',
        name: 'Whale',
        description: 'Invest $1,000 in tools',
        icon: Crown,
        unlocked: totalInvestment >= 1000,
        rarity: 'epic',
        progress: { current: Math.min(totalInvestment, 1000), total: 1000 },
      },
      // Categories
      {
        id: 'diverse',
        name: 'Diverse',
        description: 'Have tools in 5+ categories',
        icon: Calendar,
        unlocked: categories.size >= 5,
        rarity: 'rare',
        progress: { current: Math.min(categories.size, 5), total: 5 },
      },
      // Special
      {
        id: 'no-graveyard',
        name: 'No Ghosts',
        description: 'Have no unused tools',
        icon: Ghost,
        unlocked: tools.length > 0 && usedTools.length === tools.length,
        rarity: 'epic',
      },
    ];
  }, [tools, totalInvestment, stackScore]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const unlockedPercentage = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Achievements</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {unlockedCount}/{achievements.length} ({unlockedPercentage}%)
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${unlockedPercentage}%` }}
        />
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-4">
        {achievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            size="sm"
            showProgress
          />
        ))}
      </div>
    </div>
  );
}
