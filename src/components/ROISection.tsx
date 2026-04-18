import { Tool } from '@/types/tool';
import { calculateROI, getROIStatusColor, getROIBgColor } from '@/lib/roi';
import { TrendingUp, Target, Calendar, Activity } from 'lucide-react';

interface ROISectionProps {
  tool: Tool;
}

export function ROISection({ tool }: ROISectionProps) {
  const roi = calculateROI(tool);

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Return on Investment</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="h-4 w-4" />
            <span className="text-xs">Cost Per Use</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold ${getROIStatusColor(roi.status)}`}>
              {roi.costPerUse !== null ? `$${roi.costPerUse.toFixed(2)}` : 'N/A'}
            </span>
            <span className="text-lg">{roi.statusEmoji}</span>
          </div>
        </div>

        <div className="bg-secondary rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-xs">Total Uses</span>
          </div>
          <span className="text-xl font-bold text-foreground">{tool.timesUsed} times</span>
        </div>

        <div className="bg-secondary rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">Days Owned</span>
          </div>
          <span className="text-xl font-bold text-foreground">{roi.daysOwned} days</span>
        </div>

        <div className="bg-secondary rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Avg Uses/Month</span>
          </div>
          <span className="text-xl font-bold text-foreground">{roi.avgUsesPerMonth}x</span>
        </div>
      </div>

      <div className={`${getROIBgColor(roi.status)} rounded-lg p-4 text-center`}>
        <span className="text-2xl mr-2">{roi.statusEmoji}</span>
        <span className={`font-semibold ${getROIStatusColor(roi.status)}`}>
          {roi.statusLabel}
          {roi.costPerUse !== null && roi.costPerUse <= 5 && ' - Worth it!'}
          {roi.costPerUse !== null && roi.costPerUse > 10 && ' - Needs more usage'}
        </span>
      </div>
    </div>
  );
}
