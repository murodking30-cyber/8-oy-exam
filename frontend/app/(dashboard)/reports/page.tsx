'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, AlertTriangle, DollarSign, Package, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { getInventoryStats } from '../../../lib/api/reports';
import type { InventoryStats } from '../../../types';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const SalesChart = dynamic(() => import('../../../components/charts/SalesChart'), { ssr: false });

const fmt = (n: number | string) =>
  Number(n).toLocaleString('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, title, iconClass = 'text-slate-500' }: { icon: React.ElementType; title: string; iconClass?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-slate-700">
      <Icon className={`w-4 h-4 ${iconClass}`} />
      <h2 className="font-semibold text-slate-900 dark:text-white text-sm">{title}</h2>
    </div>
  );
}

export default function ReportsPage() {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInventoryStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  const y = stats?.thisYear;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Year summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Yillik sotuv', value: `${fmt(y?.sales ?? 0)} so'm`, icon: ArrowUpCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Yillik kirim', value: `${fmt(y?.purchases ?? 0)} so'm`, icon: ArrowDownCircle, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Yillik foyda', value: `${fmt(y?.profit ?? 0)} so'm`, icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
          { label: 'Sotilgan birlik', value: fmt(y?.soldQuantity ?? 0), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: "Jami mahsulot", value: stats?.totalProducts ?? 0, icon: Package, color: 'text-slate-700', bg: 'bg-slate-100 dark:bg-slate-700/40' },
          { label: 'Ombor qiymati', value: `${fmt(stats?.totalStockValue ?? 0)} so'm`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            <p className={`text-base font-bold mt-1 ${color} leading-tight`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader icon={TrendingUp} title="Kunlik savdo (so'nggi 30 kun)" />
          <div className="p-5">
            {(stats?.charts.daily?.length ?? 0) > 0
              ? <SalesChart data={stats!.charts.daily} type="daily" />
              : <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Hali ma&apos;lumot yo&apos;q</div>
            }
          </div>
        </Card>
        <Card>
          <CardHeader icon={TrendingUp} title="Oylik savdo" />
          <div className="p-5">
            {(stats?.charts.monthly?.length ?? 0) > 0
              ? <SalesChart data={stats!.charts.monthly} type="monthly" />
              : <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Hali ma&apos;lumot yo&apos;q</div>
            }
          </div>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader icon={TrendingUp} title="Eng ko'p sotilgan mahsulotlar" iconClass="text-indigo-500" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 dark:bg-slate-700/30">
                {['#', 'Mahsulot', 'Miqdor', 'Summa'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {(stats?.topProducts?.length ?? 0) === 0
                  ? <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">Ma&apos;lumot yo&apos;q</td></tr>
                  : stats!.topProducts.map((p, i) => (
                    <tr key={p.productId} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.productName}</td>
                      <td className="px-4 py-3 text-right text-slate-500 tabular-nums">{fmt(p.totalQuantity)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600 tabular-nums">{fmt(p.totalAmount)} so&apos;m</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader icon={AlertTriangle} title="Kam zaxiradagi mahsulotlar" iconClass="text-orange-500" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 dark:bg-slate-700/30">
                {['Mahsulot', 'Chegara', 'Zaxira'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {(stats?.lowStock?.length ?? 0) === 0
                  ? <tr><td colSpan={3} className="text-center py-8 text-slate-400 text-sm">Barcha mahsulotlar yetarli</td></tr>
                  : stats!.lowStock.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                      <td className="px-4 py-3 text-slate-500 tabular-nums">{p.lowStockLimit} {p.unit}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold tabular-nums ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>{p.stock} {p.unit}</span>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader icon={DollarSign} title="Oylik hisobot jadvali" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 dark:bg-slate-700/30">
                {['Oy', 'Sotuv', 'Kirim', 'Foyda'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {(stats?.charts.monthly?.length ?? 0) === 0
                  ? <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">Ma&apos;lumot yo&apos;q</td></tr>
                  : [...stats!.charts.monthly].reverse().map((r) => (
                    <tr key={r.month} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{r.month}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-semibold tabular-nums">{fmt(r.sales)} so&apos;m</td>
                      <td className="px-4 py-3 text-right text-indigo-600 tabular-nums">{fmt(r.purchases)} so&apos;m</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-violet-600">{fmt(r.profit)} so&apos;m</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
