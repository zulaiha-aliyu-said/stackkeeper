import { useState } from 'react';
import { History, Clock, Play, MousePointer, CalendarCheck, Filter } from 'lucide-react';
import { Tool, UsageEntry } from '@/types/tool';
import { format, isToday, isYesterday, startOfDay, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UsageHistoryLogProps {
  tools: Tool[];
  maxItems?: number;
}

interface HistoryItem {
  entry: UsageEntry;
  tool: Tool;
}

const SOURCE_ICONS = {
  manual: MousePointer,
  timer: Clock,
  extension: Play,
  'daily-prompt': CalendarCheck,
};

const SOURCE_LABELS = {
  manual: 'Manual',
  timer: 'Timer',
  extension: 'Extension',
  'daily-prompt': 'Daily Check-in',
};

export function UsageHistoryLog({ tools, maxItems = 20 }: UsageHistoryLogProps) {
  const [filterTool, setFilterTool] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');

  // Aggregate all usage history from all tools
  const allHistory: HistoryItem[] = tools
    .flatMap(tool => 
      (tool.usageHistory || []).map(entry => ({ entry, tool }))
    )
    .sort((a, b) => new Date(b.entry.timestamp).getTime() - new Date(a.entry.timestamp).getTime());

  // Apply filters
  const filteredHistory = allHistory.filter(item => {
    if (filterTool !== 'all' && item.tool.id !== filterTool) return false;
    if (filterSource !== 'all' && item.entry.source !== filterSource) return false;
    return true;
  });

  // Group by date
  const groupedHistory = filteredHistory.slice(0, maxItems).reduce((groups, item) => {
    const date = startOfDay(parseISO(item.entry.timestamp));
    const key = date.toISOString();
    if (!groups[key]) {
      groups[key] = { date, items: [] };
    }
    groups[key].items.push(item);
    return groups;
  }, {} as Record<string, { date: Date; items: HistoryItem[] }>);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
  };

  if (allHistory.length === 0) {
    return (
      <div className="metric-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-primary/10 p-2">
            <History className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Usage History</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No usage history yet.</p>
          <p className="text-sm">Start using your tools to see activity here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <History className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Usage History</h3>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={filterTool} onValueChange={setFilterTool}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="All Tools" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tools</SelectItem>
              {tools.map(tool => (
                <SelectItem key={tool.id} value={tool.id}>{tool.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="timer">Timer</SelectItem>
              <SelectItem value="daily-prompt">Daily Check-in</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-6 max-h-[400px] overflow-y-auto">
        {Object.entries(groupedHistory).map(([key, group]) => (
          <div key={key}>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              {getDateLabel(group.date)}
            </h4>
            <div className="space-y-2">
              {group.items.map((item, idx) => {
                const Icon = SOURCE_ICONS[item.entry.source];
                return (
                  <div
                    key={`${item.entry.id}-${idx}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="p-2 rounded-full bg-background">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.tool.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(item.entry.timestamp), 'h:mm a')}
                        {' • '}
                        {SOURCE_LABELS[item.entry.source]}
                        {item.entry.duration && (
                          <span className="ml-2 text-primary">
                            ⏱ {formatDuration(item.entry.duration)}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="badge-category text-xs">{item.tool.category}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredHistory.length > maxItems && (
        <div className="text-center pt-4 text-sm text-muted-foreground">
          Showing {maxItems} of {filteredHistory.length} entries
        </div>
      )}
    </div>
  );
}
