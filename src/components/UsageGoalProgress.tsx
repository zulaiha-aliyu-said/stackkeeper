import { Tool } from '@/types/tool';
import { Target, Check, TrendingUp } from 'lucide-react';
import { startOfWeek, startOfMonth, isAfter } from 'date-fns';
import { Progress } from '@/components/ui/progress';

interface UsageGoalProgressProps {
  tool: Tool;
  compact?: boolean;
}

export function UsageGoalProgress({ tool, compact = false }: UsageGoalProgressProps) {
  if (!tool.usageGoal || !tool.usageGoalPeriod) return null;

  const periodStart = tool.usageGoalPeriod === 'weekly' 
    ? startOfWeek(new Date(), { weekStartsOn: 1 })
    : startOfMonth(new Date());

  const usageInPeriod = (tool.usageHistory || []).filter(entry => 
    isAfter(new Date(entry.timestamp), periodStart)
  ).length;

  const progress = Math.min((usageInPeriod / tool.usageGoal) * 100, 100);
  const isComplete = usageInPeriod >= tool.usageGoal;
  const periodLabel = tool.usageGoalPeriod === 'weekly' ? 'week' : 'month';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Target className={`h-3 w-3 ${isComplete ? 'text-success' : 'text-muted-foreground'}`} />
        <span className={`text-xs ${isComplete ? 'text-success' : 'text-muted-foreground'}`}>
          {usageInPeriod}/{tool.usageGoal}
        </span>
        {isComplete && <Check className="h-3 w-3 text-success" />}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className={`h-4 w-4 ${isComplete ? 'text-success' : 'text-primary'}`} />
          <span className="text-sm font-medium text-foreground">
            {tool.usageGoalPeriod === 'weekly' ? 'Weekly' : 'Monthly'} Goal
          </span>
        </div>
        <span className={`text-sm font-semibold ${isComplete ? 'text-success' : 'text-foreground'}`}>
          {usageInPeriod} / {tool.usageGoal}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {isComplete ? (
          <span className="flex items-center gap-1 text-success">
            <Check className="h-3 w-3" /> Goal reached this {periodLabel}!
          </span>
        ) : (
          `${tool.usageGoal - usageInPeriod} more uses needed this ${periodLabel}`
        )}
      </p>
    </div>
  );
}

interface GoalsOverviewProps {
  tools: Tool[];
}

export function GoalsOverview({ tools }: GoalsOverviewProps) {
  const toolsWithGoals = tools.filter(t => t.usageGoal && t.usageGoalPeriod);
  
  if (toolsWithGoals.length === 0) return null;

  const completedGoals = toolsWithGoals.filter(tool => {
    const periodStart = tool.usageGoalPeriod === 'weekly' 
      ? startOfWeek(new Date(), { weekStartsOn: 1 })
      : startOfMonth(new Date());
    
    const usageInPeriod = (tool.usageHistory || []).filter(entry => 
      isAfter(new Date(entry.timestamp), periodStart)
    ).length;
    
    return usageInPeriod >= (tool.usageGoal || 0);
  });

  const completionRate = Math.round((completedGoals.length / toolsWithGoals.length) * 100);

  return (
    <div className="metric-card">
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Usage Goals</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{toolsWithGoals.length}</p>
          <p className="text-xs text-muted-foreground">Tools with goals</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-success">{completedGoals.length}</p>
          <p className="text-xs text-muted-foreground">Goals met</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
          <p className="text-xs text-muted-foreground">Completion rate</p>
        </div>
      </div>

      <div className="space-y-3">
        {toolsWithGoals.slice(0, 4).map(tool => {
          const periodStart = tool.usageGoalPeriod === 'weekly' 
            ? startOfWeek(new Date(), { weekStartsOn: 1 })
            : startOfMonth(new Date());
          
          const usageInPeriod = (tool.usageHistory || []).filter(entry => 
            isAfter(new Date(entry.timestamp), periodStart)
          ).length;
          
          const progress = Math.min((usageInPeriod / (tool.usageGoal || 1)) * 100, 100);
          const isComplete = usageInPeriod >= (tool.usageGoal || 0);

          return (
            <div key={tool.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{tool.name}</p>
                <Progress value={progress} className="h-1.5 mt-1" />
              </div>
              <span className={`text-xs font-medium ${isComplete ? 'text-success' : 'text-muted-foreground'}`}>
                {usageInPeriod}/{tool.usageGoal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
