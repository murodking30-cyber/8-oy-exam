'use client';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'red';
  sub?: string;
}

const colors = {
  blue:   { icon: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',     border: 'border-blue-100 dark:border-blue-900/30' },
  green:  { icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/30' },
  purple: { icon: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',   border: 'border-violet-100 dark:border-violet-900/30' },
  orange: { icon: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',   border: 'border-orange-100 dark:border-orange-900/30' },
  indigo: { icon: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',   border: 'border-indigo-100 dark:border-indigo-900/30' },
  red:    { icon: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',             border: 'border-red-100 dark:border-red-900/30' },
};

export default function StatCard({ title, value, icon: Icon, color, sub }: Props) {
  const c = colors[color];
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${c.icon} ${c.border}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{sub}</p>}
    </div>
  );
}
