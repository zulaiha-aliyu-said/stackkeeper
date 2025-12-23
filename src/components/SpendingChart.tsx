import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Tool } from '@/types/tool';
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface SpendingChartProps {
  tools: Tool[];
}

export function SpendingChart({ tools }: SpendingChartProps) {
  const chartData = useMemo(() => {
    if (tools.length === 0) return [];

    // Get the date range
    const dates = tools.map(t => parseISO(t.purchaseDate));
    const minDate = dates.reduce((min, d) => d < min ? d : min, dates[0]);
    const maxDate = new Date();

    // Ensure we show at least 6 months
    const startDate = subMonths(startOfMonth(maxDate), 5) < minDate 
      ? subMonths(startOfMonth(maxDate), 5) 
      : startOfMonth(minDate);

    // Generate all months in range
    const months = eachMonthOfInterval({ start: startDate, end: maxDate });

    // Calculate cumulative spending per month
    let cumulative = 0;
    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const monthlySpend = tools
        .filter(t => format(parseISO(t.purchaseDate), 'yyyy-MM') === monthStr)
        .reduce((sum, t) => sum + t.price, 0);
      
      cumulative += monthlySpend;

      return {
        month: format(month, 'MMM yyyy'),
        monthlySpend,
        cumulative,
      };
    });
  }, [tools]);

  if (tools.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        Add tools to see spending trends
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 20%)" vertical={false} />
        <XAxis 
          dataKey="month" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
          tickFormatter={(value) => `$${value}`}
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(222, 47%, 9%)',
            border: '1px solid hsl(217, 33%, 20%)',
            borderRadius: '8px',
            color: 'hsl(210, 40%, 98%)',
          }}
          labelStyle={{ color: 'hsl(215, 20%, 55%)' }}
          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cumulative']}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="hsl(160, 84%, 39%)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#spendingGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
