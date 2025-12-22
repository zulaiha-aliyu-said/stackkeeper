import { Tool } from '@/types/tool';
import { calculateROI, getROIStatusColor } from '@/lib/roi';
import { Trophy, TrendingDown } from 'lucide-react';

interface ROILeaderboardProps {
  tools: Tool[];
  onViewTool?: (tool: Tool) => void;
}

export function ROILeaderboard({ tools, onViewTool }: ROILeaderboardProps) {
  const toolsWithROI = tools.map(tool => ({
    tool,
    roi: calculateROI(tool),
  }));

  // Best ROI - lowest cost per use (only used tools)
  const usedTools = toolsWithROI.filter(t => t.roi.costPerUse !== null);
  const bestROI = [...usedTools]
    .sort((a, b) => (a.roi.costPerUse ?? Infinity) - (b.roi.costPerUse ?? Infinity))
    .slice(0, 5);

  // Worst ROI - never used or highest cost per use
  const neverUsed = toolsWithROI.filter(t => t.tool.timesUsed === 0);
  const highCostPerUse = [...usedTools]
    .sort((a, b) => (b.roi.costPerUse ?? 0) - (a.roi.costPerUse ?? 0))
    .slice(0, 3);
  const worstROI = [...neverUsed, ...highCostPerUse].slice(0, 5);

  if (tools.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Best ROI */}
      <div className="metric-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-success/20 p-2">
            <Trophy className="h-5 w-5 text-success" />
          </div>
          <h3 className="font-semibold text-foreground">Best ROI</h3>
        </div>

        {bestROI.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Use some tools to see ROI!</p>
        ) : (
          <div className="space-y-2">
            {bestROI.map(({ tool, roi }, index) => (
              <button
                key={tool.id}
                onClick={() => onViewTool?.(tool)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground w-6">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{tool.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tool.timesUsed} uses • ${tool.price}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${getROIStatusColor(roi.status)}`}>
                    ${roi.costPerUse?.toFixed(2)}/use
                  </p>
                  <p className="text-xs">{roi.statusEmoji}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Worst ROI */}
      <div className="metric-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-destructive/20 p-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
          </div>
          <h3 className="font-semibold text-foreground">Needs Attention</h3>
        </div>

        {worstROI.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">All tools performing well!</p>
        ) : (
          <div className="space-y-2">
            {worstROI.map(({ tool, roi }) => (
              <button
                key={tool.id}
                onClick={() => onViewTool?.(tool)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{roi.statusEmoji}</span>
                  <div>
                    <p className="font-medium text-foreground">{tool.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tool.timesUsed > 0 ? `${tool.timesUsed} uses` : 'Never used'} • ${tool.price}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${getROIStatusColor(roi.status)}`}>
                    {roi.costPerUse !== null ? `$${roi.costPerUse.toFixed(2)}/use` : 'N/A'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
