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
  data: { product_name: string; totalRevenue: string | number }[];
}

export default function TopProductsChart({ data }: Props) {
  const chartData = data.slice(0, 6).map((d) => ({
    name: d.product_name.length > 12 ? d.product_name.slice(0, 12) + '…' : d.product_name,
    revenue: parseFloat(String(d.totalRevenue)) || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
          width={80}
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
        <Bar dataKey="revenue" fill="#10b981" radius={[0, 5, 5, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
