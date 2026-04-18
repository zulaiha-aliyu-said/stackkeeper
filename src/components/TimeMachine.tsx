import { useState, useMemo } from 'react';
import { Tool } from '@/types/tool';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, DollarSign, Package, TrendingUp, Rewind, FastForward } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, isBefore, isAfter } from 'date-fns';

interface TimeMachineProps {
  tools: Tool[];
}

export function TimeMachine({ tools }: TimeMachineProps) {
  // Calculate date range from tools
  const dateRange = useMemo(() => {
    if (tools.length === 0) return { start: new Date(), end: new Date(), months: [] };
    
    const dates = tools.map(t => new Date(t.purchaseDate));
    const start = startOfMonth(new Date(Math.min(...dates.map(d => d.getTime()))));
    const end = endOfMonth(new Date());
    
    const months = eachMonthOfInterval({ start, end });
    return { start, end, months };
  }, [tools]);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(dateRange.months.length - 1);
  const selectedDate = dateRange.months[selectedMonthIndex] || new Date();

  // Filter tools that exist at the selected date
  const toolsAtDate = useMemo(() => {
    return tools.filter(tool => {
      const purchaseDate = new Date(tool.purchaseDate);
      return isBefore(purchaseDate, endOfMonth(selectedDate)) || 
             format(purchaseDate, 'yyyy-MM') === format(selectedDate, 'yyyy-MM');
    });
  }, [tools, selectedDate]);

  // Calculate stats at selected date
  const stats = useMemo(() => {
    const totalSpent = toolsAtDate.reduce((sum, t) => sum + t.price, 0);
    const usedCount = toolsAtDate.filter(t => {
      if (!t.lastUsed) return false;
      return isBefore(new Date(t.lastUsed), endOfMonth(selectedDate)) ||
             format(new Date(t.lastUsed), 'yyyy-MM') === format(selectedDate, 'yyyy-MM');
    }).length;
    
    return {
      toolCount: toolsAtDate.length,
      totalSpent,
      usedCount,
      unusedCount: toolsAtDate.length - usedCount,
      avgPrice: toolsAtDate.length > 0 ? Math.round(totalSpent / toolsAtDate.length) : 0,
    };
  }, [toolsAtDate, selectedDate]);

  // Get tools added in the selected month
  const newToolsThisMonth = useMemo(() => {
    return tools.filter(tool => 
      format(new Date(tool.purchaseDate), 'yyyy-MM') === format(selectedDate, 'yyyy-MM')
    );
  }, [tools, selectedDate]);

  const isCurrentMonth = format(selectedDate, 'yyyy-MM') === format(new Date(), 'yyyy-MM');
  const isPast = selectedMonthIndex < dateRange.months.length - 1;

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardHeader className="border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/20 p-2">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Time Machine</CardTitle>
              <p className="text-sm text-muted-foreground">Travel through your stack history</p>
            </div>
          </div>
          <Badge variant={isCurrentMonth ? "default" : "secondary"} className="text-sm">
            {isCurrentMonth ? "Present" : isPast ? "Past" : "Future"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Timeline Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Rewind className="h-4 w-4" />
              <span>{format(dateRange.start, 'MMM yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              <span>{format(selectedDate, 'MMMM yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{format(dateRange.end, 'MMM yyyy')}</span>
              <FastForward className="h-4 w-4" />
            </div>
          </div>

          <Slider
            value={[selectedMonthIndex]}
            onValueChange={([value]) => setSelectedMonthIndex(value)}
            min={0}
            max={dateRange.months.length - 1}
            step={1}
            className="w-full"
          />

          {/* Month markers */}
          <div className="flex justify-between text-xs text-muted-foreground">
            {dateRange.months.filter((_, i) => i % Math.max(1, Math.floor(dateRange.months.length / 6)) === 0).map((month, i) => (
              <span key={i}>{format(month, 'MMM')}</span>
            ))}
          </div>
        </div>

        {/* Stats at Selected Date */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-secondary/50 rounded-lg p-4 text-center transition-all duration-300">
            <Package className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.toolCount}</div>
            <div className="text-xs text-muted-foreground">Tools Owned</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 text-center transition-all duration-300">
            <DollarSign className="h-5 w-5 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">${stats.totalSpent.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Spent</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 text-center transition-all duration-300">
            <TrendingUp className="h-5 w-5 text-info mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.usedCount}</div>
            <div className="text-xs text-muted-foreground">Tools Used</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 text-center transition-all duration-300">
            <DollarSign className="h-5 w-5 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">${stats.avgPrice}</div>
            <div className="text-xs text-muted-foreground">Avg Price</div>
          </div>
        </div>

        {/* New Tools This Month */}
        {newToolsThisMonth.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="text-lg">✨</span>
              Added in {format(selectedDate, 'MMMM yyyy')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {newToolsThisMonth.map(tool => (
                <Badge 
                  key={tool.id} 
                  variant="outline" 
                  className="py-1.5 px-3 text-sm animate-fade-in"
                >
                  {tool.name} - ${tool.price}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Visual Timeline */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Stack Evolution</h4>
          <div className="flex items-end gap-1 h-24">
            {dateRange.months.map((month, index) => {
              const monthTools = tools.filter(t => 
                isBefore(new Date(t.purchaseDate), endOfMonth(month)) ||
                format(new Date(t.purchaseDate), 'yyyy-MM') === format(month, 'yyyy-MM')
              );
              const height = (monthTools.length / tools.length) * 100;
              const isSelected = index === selectedMonthIndex;
              
              return (
                <div
                  key={index}
                  className={`flex-1 rounded-t cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'bg-primary' 
                      : 'bg-primary/30 hover:bg-primary/50'
                  }`}
                  style={{ height: `${Math.max(height, 5)}%` }}
                  onClick={() => setSelectedMonthIndex(index)}
                  title={`${format(month, 'MMM yyyy')}: ${monthTools.length} tools`}
                />
              );
            })}
          </div>
        </div>

        {/* Comparison with Present */}
        {!isCurrentMonth && (
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <p className="text-sm text-foreground">
              {isPast ? (
                <>
                  <span className="font-medium">Looking back:</span> You had{' '}
                  <span className="font-bold text-primary">{stats.toolCount} tools</span> worth{' '}
                  <span className="font-bold text-success">${stats.totalSpent.toLocaleString()}</span>.
                  Since then, you've added{' '}
                  <span className="font-bold text-info">{tools.length - stats.toolCount} more tools</span>!
                </>
              ) : (
                <>This is the present moment in your stack journey.</>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
