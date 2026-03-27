import { Tool } from '@/types/tool';
import { TrendingUp, TrendingDown, Star, Ghost, BarChart3 } from 'lucide-react';

interface DashboardInsightsProps {
  tools: Tool[];
  totalInvestment: number;
}

export function DashboardInsights({ tools, totalInvestment }: DashboardInsightsProps) {
  if (tools.length === 0) return null;

  const usedTools = tools.filter(t => t.lastUsed !== null);
  const unusedTools = tools.filter(t => t.lastUsed === null);
  const mostUsed = [...tools].sort((a, b) => (b.timesUsed || 0) - (a.timesUsed || 0)).slice(0, 5);
  const wastedSpend = unusedTools.reduce((s, t) => s + (Number(t.price) || 0), 0);

  // Category with most spend
  const categorySpend: Record<string, number> = {};
  tools.forEach(t => {
    categorySpend[t.category] = (categorySpend[t.category] || 0) + (Number(t.price) || 0);
  });
  const topCategory = Object.entries(categorySpend).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Most Used Tools */}
      <div className="metric-card">
        <div className="flex items-center gap-3 mb-4">
          <Star className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-foreground">Most Used Tools</h3>
        </div>
        {mostUsed.filter(t => t.timesUsed > 0).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No tools have been used yet. Start tracking!</p>
        ) : (
          <div className="space-y-3">
            {mostUsed.filter(t => t.timesUsed > 0).map((tool, idx) => (
              <div key={tool.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground text-sm">{tool.name}</p>
                    <p className="text-xs text-muted-foreground">{tool.category}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground">{tool.timesUsed}×</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Insights */}
      <div className="metric-card">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Quick Insights</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Active tools</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {usedTools.length} of {tools.length}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2">
              <Ghost className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Unused tools value</span>
            </div>
            <span className="text-sm font-semibold text-destructive">
              ${wastedSpend.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Avg cost per tool</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              ${tools.length > 0 ? Math.round(totalInvestment / tools.length).toLocaleString() : 0}
            </span>
          </div>

          {topCategory && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Top category</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {topCategory[0]} (${topCategory[1].toLocaleString()})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
