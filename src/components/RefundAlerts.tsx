import { AlertTriangle, Clock } from 'lucide-react';
import { Tool } from '@/types/tool';

interface RefundAlertsProps {
  alerts: { tool: Tool; daysRemaining: number }[];
}

export function RefundAlerts({ alerts }: RefundAlertsProps) {
  if (alerts.length === 0) {
    return (
      <div className="metric-card animate-fade-in">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Clock className="h-5 w-5" />
          <span>All clear! No urgent refunds.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="alert-warning animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <h3 className="font-semibold text-warning">Refund Window Closing Soon</h3>
      </div>
      <div className="space-y-3">
        {alerts.map(({ tool, daysRemaining }) => (
          <div 
            key={tool.id}
            className="flex items-center justify-between rounded-lg bg-background/50 p-3"
          >
            <div>
              <p className="font-medium text-foreground">{tool.name}</p>
              <p className="text-sm text-muted-foreground">${tool.price} • {tool.platform}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-warning">{daysRemaining}</p>
              <p className="text-xs text-muted-foreground">days left</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
