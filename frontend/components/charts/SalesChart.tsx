'use client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DailyStats, MonthlyStats } from '../../types';

type Props =
  | { type: 'daily'; data: DailyStats[] }
  | { type: 'monthly'; data: MonthlyStats[] };

const fmtVal = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1000
    ? `${(v / 1000).toFixed(0)}K`
    : String(v);

export default function SalesChart({ type, data }: Props) {
  const chartData = data.map((d) => ({
    label: type === 'daily' ? (d as DailyStats).date.slice(5) : (d as MonthlyStats).month,
    Sotuv: Number(d.sales) || 0,
    Kirim: Number(d.purchases) || 0,
    Foyda: Number(d.profit) || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorSotuv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorKirim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorFoyda" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={fmtVal}
          width={40}
        />
        <Tooltip
          formatter={(v, name) => [`${Number(v ?? 0).toLocaleString('uz-UZ')} so'm`, String(name)]}
          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: '12px' }}
          cursor={{ fill: '#f1f5f9' }}
        />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
        <Area type="monotone" dataKey="Sotuv" stroke="#10b981" strokeWidth={2} fill="url(#colorSotuv)" dot={false} />
        <Area type="monotone" dataKey="Kirim" stroke="#6366f1" strokeWidth={2} fill="url(#colorKirim)" dot={false} />
        <Area type="monotone" dataKey="Foyda" stroke="#f59e0b" strokeWidth={2} fill="url(#colorFoyda)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
