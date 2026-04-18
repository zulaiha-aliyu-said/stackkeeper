import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Award, AlertCircle, Calendar } from 'lucide-react';
import { Tool } from '@/types/tool';
import { startOfWeek, endOfWeek, isWithinInterval, subWeeks, parseISO } from 'date-fns';
import { StreakBadge } from './StreakBadge';
import { calculateStreak, getTopStreakTools } from '@/lib/streaks';

interface WeeklyUsageSummaryProps {
  tools: Tool[];
}

export function WeeklyUsageSummary({ tools }: WeeklyUsageSummaryProps) {
  const summary = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const lastWeekEnd = subWeeks(thisWeekEnd, 1);

    // Count sessions this week vs last week
    let thisWeekSessions = 0;
    let lastWeekSessions = 0;
    const thisWeekUsedTools = new Set<string>();
    const toolUsageThisWeek: Record<string, number> = {};

    tools.forEach(tool => {
      (tool.usageHistory || []).forEach(entry => {
        const entryDate = parseISO(entry.timestamp);
        
        if (isWithinInterval(entryDate, { start: thisWeekStart, end: thisWeekEnd })) {
          thisWeekSessions++;
          thisWeekUsedTools.add(tool.id);
          toolUsageThisWeek[tool.id] = (toolUsageThisWeek[tool.id] || 0) + 1;
        } else if (isWithinInterval(entryDate, { start: lastWeekStart, end: lastWeekEnd })) {
          lastWeekSessions++;
        }
      });
    });

    // Find most used tool this week
    let mostUsedTool: Tool | null = null;
    let mostUsedCount = 0;
    Object.entries(toolUsageThisWeek).forEach(([toolId, count]) => {
      if (count > mostUsedCount) {
        mostUsedCount = count;
        mostUsedTool = tools.find(t => t.id === toolId) || null;
      }
    });

    // Find tools not used this week
    const unusedThisWeek = tools.filter(t => !thisWeekUsedTools.has(t.id));

    // Calculate active days this week
    const activeDaysSet = new Set<string>();
    tools.forEach(tool => {
      (tool.usageHistory || []).forEach(entry => {
        const entryDate = parseISO(entry.timestamp);
        if (isWithinInterval(entryDate, { start: thisWeekStart, end: thisWeekEnd })) {
          activeDaysSet.add(entryDate.toDateString());
        }
      });
    });

    // Get top streak tool
    const topStreaks = getTopStreakTools(tools);
    const streakChampion = topStreaks[0] || null;

    // Calculate change percentage
    const changePercent = lastWeekSessions > 0 
      ? Math.round(((thisWeekSessions - lastWeekSessions) / lastWeekSessions) * 100)
      : thisWeekSessions > 0 ? 100 : 0;

    return {
      thisWeekSessions,
      lastWeekSessions,
      changePercent,
      activeDays: activeDaysSet.size,
      mostUsedTool,
      mostUsedCount,
      unusedThisWeek,
      streakChampion,
    };
  }, [tools]);

  const isPositiveChange = summary.changePercent >= 0;

  return (
    <div className="metric-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-lg bg-success/10 p-2">
          <Calendar className="h-5 w-5 text-success" />
        </div>
        <h3 className="font-semibold text-foreground">This Week's Usage</h3>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 rounded-lg bg-secondary">
          <p className="text-3xl font-bold text-foreground">{summary.thisWeekSessions}</p>
          <p className="text-xs text-muted-foreground">Sessions</p>
          <div className={`flex items-center justify-center gap-1 mt-1 text-sm ${isPositiveChange ? 'text-success' : 'text-destructive'}`}>
            {isPositiveChange ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{isPositiveChange ? '+' : ''}{summary.changePercent}%</span>
          </div>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-secondary">
          <p className="text-3xl font-bold text-foreground">{summary.activeDays}</p>
          <p className="text-xs text-muted-foreground">Active Days</p>
          <p className="text-xs text-muted-foreground mt-1">out of 7</p>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-secondary">
          <p className="text-3xl font-bold text-foreground">{tools.length - summary.unusedThisWeek.length}</p>
          <p className="text-xs text-muted-foreground">Tools Used</p>
          <p className="text-xs text-muted-foreground mt-1">of {tools.length}</p>
        </div>
      </div>

      {/* Most Used Tool */}
      {summary.mostUsedTool && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Most Used This Week</span>
          </div>
          <p className="text-lg font-bold text-foreground">{summary.mostUsedTool.name}</p>
          <p className="text-sm text-muted-foreground">{summary.mostUsedCount} sessions</p>
        </div>
      )}

      {/* Streak Champion */}
      {summary.streakChampion && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Streak Champion</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-foreground">{summary.streakChampion.tool.name}</p>
            <StreakBadge streak={summary.streakChampion.streak.currentStreak} size="md" />
          </div>
        </div>
      )}

      {/* Unused Tools Warning */}
      {summary.unusedThisWeek.length > 0 && (
        <div className="p-4 rounded-lg bg-warning/5 border border-warning/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium text-warning">Haven't Used This Week</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.unusedThisWeek.slice(0, 5).map(tool => (
              <span key={tool.id} className="px-2 py-1 text-xs rounded-full bg-background text-muted-foreground">
                {tool.name}
              </span>
            ))}
            {summary.unusedThisWeek.length > 5 && (
              <span className="px-2 py-1 text-xs text-muted-foreground">
                +{summary.unusedThisWeek.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
