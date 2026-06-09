'use client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  data: { month: string; revenue: string | number }[];
}

export default function RevenueChart({ data }: Props) {
  const chartData = data.map((d) => ({
    month: d.month,
    revenue: parseFloat(String(d.revenue)) || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          width={45}
        />
        <Tooltip
          formatter={(v) => [`$${Number(v ?? 0).toFixed(2)}`, 'Revenue']}
          contentStyle={{
            borderRadius: '10px',
            border: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            fontSize: '12px',
          }}
          cursor={{ fill: '#f1f5f9' }}
        />
        <Bar dataKey="revenue" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
