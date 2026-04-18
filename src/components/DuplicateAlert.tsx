import { Tool, Category } from '@/types/tool';
import { AlertTriangle, Check, X } from 'lucide-react';
import { calculateROI } from '@/lib/roi';

interface DuplicateCluster {
  category: Category;
  tools: Tool[];
}

interface DuplicateAlertProps {
  duplicates: DuplicateCluster[];
  onDismiss?: () => void;
  onViewTool?: (tool: Tool) => void;
}

function getRecommendation(tools: Tool[]): { message: string; keep: Tool | null } {
  const usedTools = tools.filter(t => t.timesUsed > 0);
  const unusedTools = tools.filter(t => t.timesUsed === 0);
  
  if (usedTools.length === 0) {
    return { 
      message: 'None being used - consider refunding all before deadline', 
      keep: null 
    };
  }
  
  // Find the tool with highest usage
  const sorted = [...tools].sort((a, b) => b.timesUsed - a.timesUsed);
  const topTool = sorted[0];
  
  if (topTool.timesUsed >= 10 && sorted[1]?.timesUsed < topTool.timesUsed / 2) {
    return { 
      message: `Keep ${topTool.name}, consider refunding or selling the others`, 
      keep: topTool 
    };
  }
  
  if (usedTools.length > 1) {
    return { 
      message: `Compare features of ${usedTools.map(t => t.name).join(' & ')} to decide which to keep`, 
      keep: null 
    };
  }
  
  return { 
    message: `Keep using ${topTool.name}, refund unused tools`, 
    keep: topTool 
  };
}

export function DuplicateAlert({ duplicates, onDismiss, onViewTool }: DuplicateAlertProps) {
  if (duplicates.length === 0) return null;

  // Sort by most wasteful (highest unused spend)
  const sortedDuplicates = [...duplicates].sort((a, b) => {
    const aUnused = a.tools.filter(t => t.timesUsed === 0).reduce((sum, t) => sum + t.price, 0);
    const bUnused = b.tools.filter(t => t.timesUsed === 0).reduce((sum, t) => sum + t.price, 0);
    return bUnused - aUnused;
  });

  const topCluster = sortedDuplicates[0];
  const totalInvested = topCluster.tools.reduce((sum, t) => sum + t.price, 0);
  const wastedSpend = topCluster.tools.filter(t => t.timesUsed === 0).reduce((sum, t) => sum + t.price, 0);
  const recommendation = getRecommendation(topCluster.tools);

  return (
    <div className="rounded-xl border-2 border-info/50 bg-info/10 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-info/20 p-2">
            <AlertTriangle className="h-5 w-5 text-info" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Duplicate Tools Detected</h3>
            <p className="text-sm text-muted-foreground">
              You own {topCluster.tools.length} {topCluster.category} tools
            </p>
          </div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="p-1 rounded hover:bg-secondary">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {topCluster.tools
          .sort((a, b) => b.timesUsed - a.timesUsed)
          .map(tool => {
            const roi = calculateROI(tool);
            const isRecommended = recommendation.keep?.id === tool.id;
            
            return (
              <button
                key={tool.id}
                onClick={() => onViewTool?.(tool)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                  isRecommended ? 'bg-success/20 border border-success/50' : 'bg-secondary/50 hover:bg-secondary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{roi.statusEmoji}</span>
                  <div>
                    <p className="font-medium text-foreground">{tool.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tool.timesUsed > 0 ? `Used ${tool.timesUsed}x` : 'Never used'} • ${tool.price}
                    </p>
                  </div>
                </div>
                {isRecommended && (
                  <span className="flex items-center gap-1 text-xs text-success font-medium">
                    <Check className="h-3 w-3" />
                    Keep
                  </span>
                )}
              </button>
            );
          })}
      </div>

      <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
        <div className="space-y-1">
          <p className="text-muted-foreground">
            Total invested: <span className="font-semibold text-foreground">${totalInvested}</span>
          </p>
          {wastedSpend > 0 && (
            <p className="text-warning">
              Wasted spend: <span className="font-semibold">${wastedSpend}</span> (unused tools)
            </p>
          )}
        </div>
      </div>

      <div className="bg-primary/10 rounded-lg p-3">
        <p className="text-sm">
          <span className="font-semibold text-primary">💡 Recommendation:</span>{' '}
          <span className="text-foreground">{recommendation.message}</span>
        </p>
      </div>

      {sortedDuplicates.length > 1 && (
        <p className="text-xs text-muted-foreground text-center">
          +{sortedDuplicates.length - 1} more category with duplicates
        </p>
      )}
    </div>
  );
}
