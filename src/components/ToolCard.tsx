import { Tool } from '@/types/tool';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Zap } from 'lucide-react';

interface ToolCardProps {
  tool: Tool;
  onViewDetails: (tool: Tool) => void;
  onMarkAsUsed: (id: string) => void;
}

export function ToolCard({ tool, onViewDetails, onMarkAsUsed }: ToolCardProps) {
  const usageText = tool.timesUsed > 0 
    ? `Used ${tool.timesUsed}x` 
    : 'Never used';

  return (
    <div className="tool-card animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{tool.name}</h3>
          <div className="flex flex-wrap gap-2">
            <span className="badge-category">{tool.category}</span>
            <span className="badge-platform">{tool.platform}</span>
          </div>
        </div>
        <span className={tool.lastUsed ? 'badge-used' : 'badge-unused'}>
          {usageText}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Price Paid</span>
          <span className="font-semibold text-foreground">${tool.price}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Purchased</span>
          <span className="text-foreground">
            {formatDistanceToNow(new Date(tool.purchaseDate), { addSuffix: true })}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(tool)}
          className="btn-secondary flex-1 flex items-center justify-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Details
        </button>
        <button
          onClick={() => onMarkAsUsed(tool.id)}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <Zap className="h-4 w-4" />
          Used Today
        </button>
      </div>
    </div>
  );
}
