import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Tool } from '@/types/tool';

interface CategoryChartProps {
  tools: Tool[];
}

const COLORS = [
  'hsl(160, 84%, 39%)',  // primary
  'hsl(217, 91%, 60%)',  // info
  'hsl(25, 95%, 53%)',   // warning
  'hsl(280, 65%, 60%)',  // purple
  'hsl(340, 75%, 55%)',  // pink
  'hsl(45, 93%, 47%)',   // yellow
  'hsl(180, 60%, 45%)',  // teal
  'hsl(10, 78%, 54%)',   // red
  'hsl(200, 70%, 50%)',  // cyan
];

export function CategoryChart({ tools }: CategoryChartProps) {
  const chartData = useMemo(() => {
    const breakdown: Record<string, { count: number; spend: number }> = {};
    
    tools.forEach(tool => {
      if (!breakdown[tool.category]) {
        breakdown[tool.category] = { count: 0, spend: 0 };
      }
      breakdown[tool.category].count++;
      breakdown[tool.category].spend += tool.price;
    });

    return Object.entries(breakdown)
      .map(([name, data]) => ({
        name,
        value: data.spend,
        count: data.count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [tools]);

  if (tools.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        Add tools to see category breakdown
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(222, 47%, 9%)',
            border: '1px solid hsl(217, 33%, 20%)',
            borderRadius: '8px',
            color: 'hsl(210, 40%, 98%)',
          }}
          formatter={(value: number, name: string, props: any) => [
            `$${value.toFixed(0)} (${props.payload.count} tools)`,
            name
          ]}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          iconSize={10}
          formatter={(value) => (
            <span style={{ color: 'hsl(210, 40%, 98%)', fontSize: '12px' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
