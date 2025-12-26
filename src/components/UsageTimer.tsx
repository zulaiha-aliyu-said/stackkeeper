import { Play, Square, Clock } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UsageTimerProps {
  toolId: string;
  toolName: string;
  onStopTimer: (toolId: string, duration: number) => void;
  compact?: boolean;
}

export function UsageTimer({ toolId, toolName, onStopTimer, compact = false }: UsageTimerProps) {
  const { startTimer, stopTimer, isTimerRunning, getElapsedTime, formatTime } = useTimer();
  
  const isRunning = isTimerRunning(toolId);
  const elapsed = getElapsedTime(toolId);

  const handleToggle = () => {
    if (isRunning) {
      const duration = stopTimer(toolId);
      onStopTimer(toolId, duration);
    } else {
      startTimer(toolId, toolName);
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isRunning ? 'destructive' : 'outline'}
              size="sm"
              onClick={handleToggle}
              className={`gap-1 ${isRunning ? 'animate-pulse' : ''}`}
            >
              {isRunning ? (
                <>
                  <Square className="h-3 w-3" />
                  <span className="font-mono text-xs">{formatTime(elapsed)}</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  <span>Timer</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isRunning ? 'Stop timer and log usage' : 'Start usage timer'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${isRunning ? 'border-destructive bg-destructive/5' : 'border-border bg-secondary/50'}`}>
      <div className={`p-2 rounded-full ${isRunning ? 'bg-destructive/10' : 'bg-primary/10'}`}>
        <Clock className={`h-4 w-4 ${isRunning ? 'text-destructive' : 'text-primary'}`} />
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          {isRunning ? 'Session Active' : 'Track Usage'}
        </p>
        {isRunning && (
          <p className="font-mono text-lg text-destructive">{formatTime(elapsed)}</p>
        )}
      </div>
      
      <Button
        variant={isRunning ? 'destructive' : 'default'}
        size="sm"
        onClick={handleToggle}
        className="gap-2"
      >
        {isRunning ? (
          <>
            <Square className="h-4 w-4" />
            Stop & Log
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Start Timer
          </>
        )}
      </Button>
    </div>
  );
}

// Global timer indicator for active sessions
export function ActiveTimersIndicator() {
  const { getActiveTimers, formatTime, getElapsedTime, stopTimer } = useTimer();
  const activeTimers = getActiveTimers();

  if (activeTimers.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {activeTimers.map(timer => (
        <div
          key={timer.toolId}
          className="flex items-center gap-3 px-4 py-2 rounded-full bg-destructive text-destructive-foreground shadow-lg animate-pulse"
        >
          <Clock className="h-4 w-4" />
          <span className="font-medium">{timer.toolName}</span>
          <span className="font-mono">{formatTime(getElapsedTime(timer.toolId))}</span>
          <button
            onClick={() => stopTimer(timer.toolId)}
            className="p-1 hover:bg-destructive-foreground/20 rounded"
          >
            <Square className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
