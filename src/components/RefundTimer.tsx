import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Tool, getPlatformLabel } from '@/types/tool';
import { differenceInDays, differenceInHours, differenceInMinutes, addDays, parseISO } from 'date-fns';

interface RefundTimerProps {
  alerts: { tool: Tool; daysRemaining: number }[];
  onViewTool?: (tool: Tool) => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
}

function getTimeRemaining(purchaseDate: string, refundWindowDays: number = 60): TimeRemaining {
  const deadline = addDays(parseISO(purchaseDate), refundWindowDays);
  const now = new Date();
  
  const totalMinutes = differenceInMinutes(deadline, now);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  
  return { days: Math.max(0, days), hours: Math.max(0, hours), minutes: Math.max(0, minutes) };
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-secondary rounded-lg px-3 py-2 min-w-[48px]">
        <span className="text-xl font-bold font-mono text-foreground">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

export function RefundTimer({ alerts, onViewTool }: RefundTimerProps) {
  const [, setTick] = useState(0);
  
  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

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

  // Sort by urgency and take top 3
  const urgentAlerts = [...alerts]
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 3);

  return (
    <div className="metric-card border-warning/30 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-lg bg-warning/10 p-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Refund Countdown</h3>
          <p className="text-sm text-muted-foreground">
            {alerts.length} tool{alerts.length !== 1 ? 's' : ''} with refund window closing soon
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        {urgentAlerts.map(({ tool }) => {
          const time = getTimeRemaining(tool.purchaseDate);
          const isUrgent = time.days <= 3;
          
          return (
            <div 
              key={tool.id}
              className={`rounded-xl p-4 transition-all cursor-pointer hover:scale-[1.01] ${
                isUrgent 
                  ? 'bg-gradient-to-r from-warning/10 to-destructive/10 border border-warning/30' 
                  : 'bg-secondary/50 hover:bg-secondary'
              }`}
              onClick={() => onViewTool?.(tool)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isUrgent && <span className="animate-pulse">🔥</span>}
                    <p className="font-semibold text-foreground truncate">{tool.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">${tool.price} • {getPlatformLabel(tool.platform)}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <TimeUnit value={time.days} label="Days" />
                  <span className="text-xl font-bold text-muted-foreground pb-4">:</span>
                  <TimeUnit value={time.hours} label="Hours" />
                  <span className="text-xl font-bold text-muted-foreground pb-4">:</span>
                  <TimeUnit value={time.minutes} label="Mins" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {alerts.length > 3 && (
        <p className="text-sm text-muted-foreground text-center mt-4 pt-4 border-t border-border">
          +{alerts.length - 3} more tools with closing refund windows
        </p>
      )}
    </div>
  );
}