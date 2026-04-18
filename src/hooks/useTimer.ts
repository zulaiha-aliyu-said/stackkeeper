import { useState, useEffect, useCallback, useRef } from 'react';

const TIMER_STORAGE_KEY = 'stackvault_active_timers';

interface ActiveTimer {
  toolId: string;
  toolName: string;
  startTime: number;
}

interface TimerState {
  activeTimers: Map<string, ActiveTimer>;
  elapsedTimes: Map<string, number>;
}

export function useTimer() {
  const [state, setState] = useState<TimerState>({
    activeTimers: new Map(),
    elapsedTimes: new Map(),
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load persisted timers on mount
  useEffect(() => {
    const stored = localStorage.getItem(TIMER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as [string, ActiveTimer][];
        const timers = new Map(parsed);
        const elapsed = new Map<string, number>();
        
        timers.forEach((timer, id) => {
          elapsed.set(id, Math.floor((Date.now() - timer.startTime) / 1000));
        });
        
        setState({ activeTimers: timers, elapsedTimes: elapsed });
      } catch (e) {
        console.error('Failed to parse stored timers:', e);
      }
    }
  }, []);

  // Persist active timers
  useEffect(() => {
    const timersArray = Array.from(state.activeTimers.entries());
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timersArray));
  }, [state.activeTimers]);

  // Update elapsed times every second
  useEffect(() => {
    if (state.activeTimers.size > 0) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          const newElapsed = new Map<string, number>();
          prev.activeTimers.forEach((timer, id) => {
            newElapsed.set(id, Math.floor((Date.now() - timer.startTime) / 1000));
          });
          return { ...prev, elapsedTimes: newElapsed };
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.activeTimers.size]);

  const startTimer = useCallback((toolId: string, toolName: string) => {
    setState(prev => {
      const newTimers = new Map(prev.activeTimers);
      const newElapsed = new Map(prev.elapsedTimes);
      
      newTimers.set(toolId, {
        toolId,
        toolName,
        startTime: Date.now(),
      });
      newElapsed.set(toolId, 0);
      
      return { activeTimers: newTimers, elapsedTimes: newElapsed };
    });
  }, []);

  const stopTimer = useCallback((toolId: string): number => {
    const timer = state.activeTimers.get(toolId);
    const duration = timer ? Math.floor((Date.now() - timer.startTime) / 1000) : 0;
    
    setState(prev => {
      const newTimers = new Map(prev.activeTimers);
      const newElapsed = new Map(prev.elapsedTimes);
      
      newTimers.delete(toolId);
      newElapsed.delete(toolId);
      
      return { activeTimers: newTimers, elapsedTimes: newElapsed };
    });
    
    return duration;
  }, [state.activeTimers]);

  const isTimerRunning = useCallback((toolId: string): boolean => {
    return state.activeTimers.has(toolId);
  }, [state.activeTimers]);

  const getElapsedTime = useCallback((toolId: string): number => {
    return state.elapsedTimes.get(toolId) || 0;
  }, [state.elapsedTimes]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getActiveTimers = useCallback((): ActiveTimer[] => {
    return Array.from(state.activeTimers.values());
  }, [state.activeTimers]);

  return {
    startTimer,
    stopTimer,
    isTimerRunning,
    getElapsedTime,
    formatTime,
    getActiveTimers,
    activeTimersCount: state.activeTimers.size,
  };
}
