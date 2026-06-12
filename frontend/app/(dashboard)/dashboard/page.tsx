'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Package, TrendingUp, TrendingDown, Sparkles,
  AlertTriangle, ArrowDownCircle, ArrowUpCircle, Warehouse,
} from 'lucide-react';
import StatCard from '../../../components/dashboard/StatCard';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { getInventoryStats } from '../../../lib/api/reports';
import type { InventoryStats } from '../../../types';

const SalesChart = dynamic(() => import('../../../components/charts/SalesChart'), { ssr: false });

const fmt = (n: number | string) =>
  Number(n).toLocaleString('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function DashboardPage() {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInventoryStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const m = stats?.thisMonth;
  const t = stats?.today;

  return (
    <div className="space-y-6">
      {/* Today stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Bugun</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard gradient title="Bugungi sotuv" value={`${fmt(t?.sales ?? 0)} so'm`} icon={ArrowUpCircle} color="green" sub="Chiqim summasi" />
          <StatCard gradient title="Bugungi kirim" value={`${fmt(t?.purchases ?? 0)} so'm`} icon={ArrowDownCircle} color="indigo" sub="Kirim summasi" />
          <StatCard gradient title="Bugungi foyda" value={`${fmt(t?.profit ?? 0)} so'm`} icon={Sparkles} color="purple" sub="Sotuv − kirim" />
          <StatCard gradient title="Sotilgan miqdor" value={`${fmt(t?.soldQuantity ?? 0)} birlik`} icon={Package} color="blue" sub="Bugungi chiqim" />
        </div>
      </div>

      {/* Month stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Bu oy</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Oylik sotuv" value={`${fmt(m?.sales ?? 0)} so'm`} icon={TrendingUp} color="green" sub="Jami sotuv" />
          <StatCard title="Oylik kirim" value={`${fmt(m?.purchases ?? 0)} so'm`} icon={TrendingDown} color="indigo" sub="Jami kirim" />
          <StatCard title="Oylik foyda" value={`${fmt(m?.profit ?? 0)} so'm`} icon={Sparkles} color="purple" sub="Sof foyda" />
          <StatCard title="Jami mahsulotlar" value={stats?.totalProducts ?? 0} icon={Warehouse} color="blue" sub={`Ombor: ${fmt(stats?.totalStockValue ?? 0)} so'm`} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Kunlik savdo (so&apos;nggi 30 kun)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Sotuv va kirim dinamikasi</p>
          </div>
          {(stats?.charts.daily?.length ?? 0) > 0 ? (
            <SalesChart data={stats!.charts.daily} type="daily" />
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-slate-400">
              <TrendingUp className="w-8 h-8 opacity-30" />
              <span className="text-sm">Hali ma&apos;lumotlar yo&apos;q</span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Oylik savdo</h2>
            <p className="text-xs text-slate-500 mt-0.5">Oylar bo&apos;yicha sotuv va foyda</p>
          </div>
          {(stats?.charts.monthly?.length ?? 0) > 0 ? (
            <SalesChart data={stats!.charts.monthly} type="monthly" />
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-slate-400">
              <TrendingUp className="w-8 h-8 opacity-30" />
              <span className="text-sm">Hali ma&apos;lumotlar yo&apos;q</span>
            </div>
          )}
        </div>
      </div>

      {/* Top products + Low stock */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Eng ko&apos;p sotilgan mahsulotlar</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mahsulot</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Miqdor</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {(stats?.topProducts?.length ?? 0) === 0 ? (
                  <tr><td colSpan={4} className="text-center text-slate-400 py-8 text-sm">Hali ma&apos;lumot yo&apos;q</td></tr>
                ) : (
                  stats!.topProducts.map((p, i) => (
                    <tr key={p.productId} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'}`}>
                          {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-900 dark:text-white font-medium">{p.productName}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600 dark:text-slate-400 tabular-nums">{fmt(p.totalQuantity)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {fmt(p.totalAmount)} so&apos;m
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Kam zaxira ogohlantirishi</h2>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {(stats?.lowStock?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
                <Package className="w-8 h-8 opacity-30" />
                <p className="text-sm">Barcha mahsulotlar yetarli</p>
              </div>
            ) : (
              stats!.lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div>
                    <p className="text-sm text-slate-900 dark:text-white font-medium">{p.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Chegara: {p.lowStockLimit} {p.unit}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold tabular-nums ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                      {p.stock} {p.unit}
                    </span>
                    {p.stock === 0 && <p className="text-[10px] text-red-400">Tugagan</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
