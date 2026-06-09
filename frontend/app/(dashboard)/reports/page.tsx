'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, Users, AlertTriangle, DollarSign, ShoppingCart } from 'lucide-react';
import { getSalesSummary, getTopProducts, getTopCustomers, getLowStockProducts, getRevenueByMonth, getOrdersByStatus } from '../../../lib/api/reports';
import type { SalesSummary } from '../../../types';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const RevenueChart = dynamic(() => import('../../../components/charts/RevenueChart'), { ssr: false });
const StatusChart = dynamic(() => import('../../../components/charts/StatusChart'), { ssr: false });
const TopProductsChart = dynamic(() => import('../../../components/charts/TopProductsChart'), { ssr: false });

interface TopProduct { product_id: number; product_name: string; totalSold: string; totalRevenue: string; }
interface TopCustomer { customer_id: number; customer_name: string; customer_email?: string; totalOrders: string; totalSpent: string; }
interface MonthRevenue { month: string; revenue: string; paymentCount: string; }
interface StatusCount { status: string; count: string; totalValue: string; }
interface LowStockItem { id: number; name: string; stock: number; unit: string; category?: { name: string }; }

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
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [revenue, setRevenue] = useState<MonthRevenue[]>([]);
  const [statuses, setStatuses] = useState<StatusCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, tp, tc, ls, r, st] = await Promise.all([
          getSalesSummary(), getTopProducts(10), getTopCustomers(10),
          getLowStockProducts(10), getRevenueByMonth(), getOrdersByStatus(),
        ]);
        setSummary(s); setTopProducts(tp); setTopCustomers(tc);
        setLowStock(ls); setRevenue(r); setStatuses(st);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Jami daromad', value: `$${Number(summary?.totalRevenue ?? 0).toLocaleString('en', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Jami buyurtmalar', value: summary?.totalOrders ?? 0, icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Kutilmoqda', value: summary?.pendingOrders ?? 0, icon: ShoppingCart, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Yetkazilgan', value: summary?.completedOrders ?? 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Bekor qilingan', value: summary?.cancelledOrders ?? 0, icon: ShoppingCart, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader icon={DollarSign} title="Oylik daromad" />
          <div className="p-5">
            {revenue.length > 0 ? <RevenueChart data={revenue} /> : <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Hali ma&apos;lumot yo&apos;q</div>}
          </div>
        </Card>
        <Card>
          <CardHeader icon={ShoppingCart} title="Holat bo'yicha buyurtmalar" />
          <div className="p-5">
            {statuses.length > 0 ? <StatusChart data={statuses} /> : <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Hali ma&apos;lumot yo&apos;q</div>}
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader icon={TrendingUp} title="Daromad bo'yicha eng yaxshi mahsulotlar" iconClass="text-indigo-500" />
          <div className="p-5">
            {topProducts.length > 0 ? <TopProductsChart data={topProducts} /> : <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Hali ma&apos;lumot yo&apos;q</div>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader icon={DollarSign} title="Oylik daromad jadvali" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 dark:bg-slate-700/30">
                {['Oy', "To'lovlar", 'Daromad'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {revenue.length === 0 ? <tr><td colSpan={3} className="text-center py-8 text-slate-400 text-sm">Ma&apos;lumot yo&apos;q</td></tr> :
                  revenue.map((r) => (
                    <tr key={r.month} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{r.month}</td>
                      <td className="px-4 py-3 text-right text-slate-500 tabular-nums">{r.paymentCount}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600 tabular-nums">${Number(r.revenue).toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader icon={ShoppingCart} title="Holat bo'yicha buyurtmalar jadvali" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 dark:bg-slate-700/30">
                {['Holat', 'Soni', 'Qiymat'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {statuses.length === 0 ? <tr><td colSpan={3} className="text-center py-8 text-slate-400 text-sm">Ma&apos;lumot yo&apos;q</td></tr> :
                  statuses.map((s) => (
                    <tr key={s.status} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3"><Badge value={s.status} /></td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{s.count}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">${Number(s.totalValue ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader icon={TrendingUp} title="Eng ko'p sotilgan mahsulotlar" iconClass="text-indigo-500" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 dark:bg-slate-700/30">
                {['#', 'Mahsulot', 'Sotilgan', 'Daromad'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {topProducts.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">Ma&apos;lumot yo&apos;q</td></tr> :
                  topProducts.map((p, i) => (
                    <tr key={p.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.product_name}</td>
                      <td className="px-4 py-3 text-right text-slate-500 tabular-nums">{p.totalSold}</td>
                      <td className="px-4 py-3 text-right font-semibold text-indigo-600 tabular-nums">${Number(p.totalRevenue).toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader icon={Users} title="Eng yaxshi mijozlar" iconClass="text-blue-500" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 dark:bg-slate-700/30">
                {['Mijoz', 'Buyurtmalar', 'Sarflagan'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {topCustomers.length === 0 ? <tr><td colSpan={3} className="text-center py-8 text-slate-400 text-sm">Ma&apos;lumot yo&apos;q</td></tr> :
                  topCustomers.map((c) => (
                    <tr key={c.customer_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{c.customer_name}</td>
                      <td className="px-4 py-3 text-right text-slate-500 tabular-nums">{c.totalOrders}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600 tabular-nums">${Number(c.totalSpent).toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader icon={AlertTriangle} title="Kam zaxiradagi mahsulotlar (≤ 10)" iconClass="text-orange-500" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 dark:bg-slate-700/30">
                {['Mahsulot', 'Kategoriya', 'Zaxira'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {lowStock.length === 0 ? <tr><td colSpan={3} className="text-center py-8 text-slate-400 text-sm">Barcha mahsulotlar yetarli</td></tr> :
                  lowStock.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                      <td className="px-4 py-3 text-slate-500">{p.category?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold tabular-nums ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>{p.stock} {p.unit}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
