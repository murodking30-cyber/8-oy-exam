'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, AlertTriangle, Sparkles, Package, ArrowDownCircle, ArrowUpCircle, Warehouse } from 'lucide-react';
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

  const summaryCards = [
    { label: 'Yillik sotuv', value: `${fmt(y?.sales ?? 0)} so'm`, icon: ArrowUpCircle, grad: 'from-emerald-500 to-emerald-600' },
    { label: 'Yillik kirim', value: `${fmt(y?.purchases ?? 0)} so'm`, icon: ArrowDownCircle, grad: 'from-indigo-500 to-indigo-600' },
    { label: 'Yillik foyda', value: `${fmt(y?.profit ?? 0)} so'm`, icon: Sparkles, grad: 'from-violet-500 to-violet-600' },
    { label: 'Sotilgan birlik', value: fmt(y?.soldQuantity ?? 0), icon: Package, grad: 'from-blue-500 to-blue-600' },
    { label: 'Jami mahsulot', value: stats?.totalProducts ?? 0, icon: Package, grad: 'from-slate-600 to-slate-700' },
    { label: 'Ombor qiymati', value: `${fmt(stats?.totalStockValue ?? 0)} so'm`, icon: Warehouse, grad: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="space-y-5">
      {/* Year summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, grad }) => (
          <div key={label} className={`bg-gradient-to-br ${grad} rounded-xl p-4 shadow-md text-white`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-white/20">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
            <p className="text-base font-bold mt-1 leading-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader icon={TrendingUp} title="Kunlik savdo (so'nggi 30 kun)" iconClass="text-indigo-500" />
          <div className="p-5">
            {(stats?.charts.daily?.length ?? 0) > 0
              ? <SalesChart data={stats!.charts.daily} type="daily" />
              : <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-slate-400"><TrendingUp className="w-8 h-8 opacity-30" /><span className="text-sm">Hali ma&apos;lumot yo&apos;q</span></div>
            }
          </div>
        </Card>
        <Card>
          <CardHeader icon={TrendingUp} title="Oylik savdo" iconClass="text-emerald-500" />
          <div className="p-5">
            {(stats?.charts.monthly?.length ?? 0) > 0
              ? <SalesChart data={stats!.charts.monthly} type="monthly" />
              : <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-slate-400"><TrendingUp className="w-8 h-8 opacity-30" /><span className="text-sm">Hali ma&apos;lumot yo&apos;q</span></div>
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
                      <td className="px-4 py-3 text-xs">{i < 3 ? ['🥇','🥈','🥉'][i] : <span className="text-slate-400 font-mono">{i + 1}</span>}</td>
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
          <CardHeader icon={Sparkles} title="Oylik hisobot jadvali" iconClass="text-violet-500" />
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
