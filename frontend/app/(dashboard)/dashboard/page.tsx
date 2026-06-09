'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Package, Users, ShoppingCart, DollarSign, AlertTriangle, Copy, Check, LogOut, Wifi } from 'lucide-react';
import StatCard from '../../../components/dashboard/StatCard';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Badge from '../../../components/ui/Badge';
import { getSalesSummary, getTopProducts, getLowStockProducts, getRevenueByMonth, getOrdersByStatus } from '../../../lib/api/reports';
import { getCustomers } from '../../../lib/api/customers';
import { getProducts } from '../../../lib/api/products';
import { getOrders } from '../../../lib/api/orders';
import { useAuthStore } from '../../../store/authStore';
import { useRouter } from 'next/navigation';
import type { SalesSummary, Order } from '../../../types';

const RevenueChart = dynamic(() => import('../../../components/charts/RevenueChart'), { ssr: false });
const StatusChart = dynamic(() => import('../../../components/charts/StatusChart'), { ssr: false });

interface TopProduct {
  product_id: number;
  product_name: string;
  totalSold: string;
  totalRevenue: string;
}

interface LowStockItem {
  id: number;
  name: string;
  stock: number;
  unit: string;
}

interface MonthRevenue {
  month: string;
  revenue: string;
}

interface StatusCount {
  status: string;
  count: string;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [customerCount, setCustomerCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [revenueData, setRevenueData] = useState<MonthRevenue[]>([]);
  const [statusData, setStatusData] = useState<StatusCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const { user, token, logout } = useAuthStore();
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

  useEffect(() => {
    const load = async () => {
      try {
        const [s, customers, products, orders, top, low, rev, stat] = await Promise.all([
          getSalesSummary(),
          getCustomers(),
          getProducts(),
          getOrders(),
          getTopProducts(5),
          getLowStockProducts(5),
          getRevenueByMonth(),
          getOrdersByStatus(),
        ]);
        setSummary(s);
        setCustomerCount(customers.length);
        setProductCount(products.length);
        setRecentOrders(orders.slice(0, 5));
        setTopProducts(top);
        setLowStock(low);
        setRevenueData(rev);
        setStatusData(stat);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Jami daromad"
          value={`$${Number(summary?.totalRevenue ?? 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="green"
          sub="Tugallangan to'lovlardan"
        />
        <StatCard
          title="Jami buyurtmalar"
          value={summary?.totalOrders ?? 0}
          icon={ShoppingCart}
          color="indigo"
          sub={`${summary?.pendingOrders ?? 0} ta kutilmoqda`}
        />
        <StatCard
          title="Jami mijozlar"
          value={customerCount}
          icon={Users}
          color="blue"
          sub="Ro'yxatdan o'tgan"
        />
        <StatCard
          title="Jami mahsulotlar"
          value={productCount}
          icon={Package}
          color="purple"
          sub="Inventarda"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Oylik daromad</h2>
            <p className="text-xs text-slate-500 mt-0.5">Oylar bo&apos;yicha to&apos;lov daromadi</p>
          </div>
          {revenueData.length > 0 ? (
            <RevenueChart data={revenueData} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
              Hali daromad ma&apos;lumotlari yo&apos;q
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Holat bo&apos;yicha buyurtmalar</h2>
            <p className="text-xs text-slate-500 mt-0.5">Barcha buyurtmalar taqsimoti</p>
          </div>
          {statusData.length > 0 ? (
            <StatusChart data={statusData} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
              Hali buyurtma ma&apos;lumotlari yo&apos;q
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">So&apos;nggi buyurtmalar</h2>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-slate-400 p-5 text-center">Hali buyurtmalar yo&apos;q</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white font-mono">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {order.customer?.name ?? `Mijoz #${order.customerId}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      ${Number(order.total).toFixed(2)}
                    </p>
                    <div className="mt-0.5 flex justify-end">
                      <Badge value={order.status} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Kam zaxira ogohlantirishi</h2>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {lowStock.length === 0 ? (
              <p className="text-sm text-slate-400 p-5 text-center">Barcha mahsulotlar yetarli</p>
            ) : (
              lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <p className="text-sm text-slate-900 dark:text-white">{p.name}</p>
                  <span className={`text-sm font-semibold tabular-nums ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                    {p.stock} {p.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm xl:col-span-2">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Eng ko&apos;p sotilgan mahsulotlar</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Mahsulot</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sotilgan</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Daromad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {topProducts.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-slate-400 py-8">Hali ma&apos;lumot yo&apos;q</td></tr>
                ) : (
                  topProducts.map((p, i) => (
                    <tr key={p.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 text-xs font-mono">{i + 1}</td>
                      <td className="px-5 py-3.5 text-slate-900 dark:text-white font-medium">{p.product_name}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600 dark:text-slate-400 tabular-nums">{p.totalSold}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        ${Number(p.totalRevenue).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Dasturchi ma&apos;lumotlari</h2>
          <span className="ml-auto text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full font-medium">
            Ulangan
          </span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Backend API manzili</p>
            <p className="text-sm font-mono text-slate-300 break-all">{apiUrl}</p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Autentifikatsiya holati</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <p className="text-sm text-slate-300">
                Kirgan: <span className="text-white font-medium">{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Lavozim</p>
            <Badge value={user?.role ?? 'staff'} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">JWT Token</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-emerald-400 bg-slate-800 dark:bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg truncate">
                {token ? `${token.slice(0, 40)}…` : 'Token yo\'q'}
              </code>
              <button
                onClick={copyToken}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-colors flex-shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Nusxalandi!' : 'Nusxalash'}
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 border border-red-900/50 text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Chiqish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
