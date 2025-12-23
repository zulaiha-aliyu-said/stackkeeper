import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Tool } from '@/types/tool';

interface UsageChartProps {
  tools: Tool[];
}

export function UsageChart({ tools }: UsageChartProps) {
  const chartData = useMemo(() => {
    return [...tools]
      .sort((a, b) => b.timesUsed - a.timesUsed)
      .slice(0, 8)
      .map(tool => ({
        name: tool.name.length > 12 ? tool.name.substring(0, 12) + '...' : tool.name,
        fullName: tool.name,
        uses: tool.timesUsed,
        price: tool.price,
      }));
  }, [tools]);

  if (tools.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        Add tools to see usage stats
      </div>
    );
  }

  const maxUses = Math.max(...chartData.map(d => d.uses), 1);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 20%)" horizontal={false} />
        <XAxis 
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
          width={100}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(222, 47%, 9%)',
            border: '1px solid hsl(217, 33%, 20%)',
            borderRadius: '8px',
            color: 'hsl(210, 40%, 98%)',
          }}
          formatter={(value: number, name: string, props: any) => [
            `${value} uses ($${props.payload.price})`,
            props.payload.fullName
          ]}
          labelFormatter={() => ''}
        />
        <Bar dataKey="uses" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.uses === 0 
                ? 'hsl(217, 33%, 25%)' 
                : `hsl(160, 84%, ${30 + (entry.uses / maxUses) * 20}%)`
              } 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
