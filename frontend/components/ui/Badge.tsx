'use client';

interface BadgeConfig {
  cls: string;
  dot: string;
}

const variants: Record<string, BadgeConfig> = {
  pending:       { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',   dot: 'bg-amber-500' },
  confirmed:     { cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50',         dot: 'bg-blue-500' },
  processing:    { cls: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800/50', dot: 'bg-violet-500' },
  shipped:       { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50', dot: 'bg-indigo-500' },
  delivered:     { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50', dot: 'bg-emerald-500' },
  cancelled:     { cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50',               dot: 'bg-red-500' },
  completed:     { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50', dot: 'bg-emerald-500' },
  failed:        { cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50',               dot: 'bg-red-500' },
  refunded:      { cls: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',         dot: 'bg-slate-400' },
  cash:          { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50', dot: 'bg-emerald-500' },
  card:          { cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50',         dot: 'bg-blue-500' },
  bank_transfer: { cls: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800/50', dot: 'bg-violet-500' },
  check:         { cls: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50', dot: 'bg-orange-500' },
  admin:         { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50', dot: 'bg-indigo-500' },
  manager:       { cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50',         dot: 'bg-blue-500' },
  employee:      { cls: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',         dot: 'bg-slate-400' },
  staff:         { cls: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',         dot: 'bg-slate-400' },
};

const labels: Record<string, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  processing: 'Jarayonda',
  shipped: "Jo'natilgan",
  delivered: 'Yetkazilgan',
  cancelled: 'Bekor qilingan',
  completed: 'Tugallangan',
  failed: 'Muvaffaqiyatsiz',
  refunded: 'Qaytarilgan',
  cash: 'Naqd pul',
  card: 'Karta',
  bank_transfer: "Bank o'tkazmasi",
  check: 'Chek',
  admin: 'Administrator',
  manager: 'Menejer',
  employee: 'Xodim',
  staff: 'Xodim',
};

const defaultVariant: BadgeConfig = {
  cls: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  dot: 'bg-slate-400',
};

export default function Badge({ value }: { value: string }) {
  const { cls, dot } = variants[value] ?? defaultVariant;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {labels[value] ?? value.replace(/_/g, ' ')}
    </span>
  );
}
