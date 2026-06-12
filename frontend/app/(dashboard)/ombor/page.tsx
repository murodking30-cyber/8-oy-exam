'use client';
import { useEffect, useState } from 'react';
import { Search, AlertTriangle, Image as ImageIcon, Package, Warehouse, TrendingDown, XCircle } from 'lucide-react';
import { getProducts } from '../../../lib/api/products';
import type { Product } from '../../../types';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const fmt = (n: number | string) =>
  Number(n).toLocaleString('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function OmborPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'empty'>('all');

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'empty') return p.stock === 0;
    if (filter === 'low') return p.stock > 0 && p.stock <= (p.lowStockLimit ?? 10);
    return true;
  });

  const totalValue = products.reduce((sum, p) => sum + Number(p.purchasePrice) * Number(p.stock), 0);
  const emptyCount = products.filter((p) => p.stock === 0).length;
  const lowCount = products.filter((p) => p.stock > 0 && p.stock <= (p.lowStockLimit ?? 10)).length;

  const stockLevel = (p: Product) => {
    if (p.stock === 0) return { label: 'Tugagan', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    if (p.stock <= (p.lowStockLimit ?? 10)) return { label: 'Kam', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' };
    return { label: 'Yetarli', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  };

  const stats = [
    { label: 'Jami mahsulotlar', value: products.length, sub: 'ta tur', icon: Package, grad: 'from-indigo-500 to-indigo-600' },
    { label: 'Ombor qiymati', value: `${fmt(totalValue)} so'm`, sub: 'kirim narxida', icon: Warehouse, grad: 'from-blue-500 to-blue-600' },
    { label: 'Kam zaxira', value: lowCount, sub: 'ta mahsulot', icon: TrendingDown, grad: 'from-orange-500 to-orange-600' },
    { label: 'Tugagan', value: emptyCount, sub: 'ta mahsulot', icon: XCircle, grad: 'from-red-500 to-red-600' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, grad }) => (
          <div key={label} className={`bg-gradient-to-br ${grad} rounded-xl p-5 shadow-md text-white`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20">
                <Icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs mt-1 opacity-70">{sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mahsulot qidirish..."
            className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 w-64 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'low', 'empty'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              {f === 'all' ? 'Barchasi' : f === 'low' ? 'Kam zaxira' : 'Tugagan'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
                  {['Mahsulot', 'Birlik', 'Zaxira', 'Kirim narxi', 'Sotuv narxi', 'Ombor qiymati', 'Holat'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">Mahsulotlar topilmadi</td></tr>
                )}
                {filtered.map((p) => {
                  const level = stockLevel(p);
                  const value = Number(p.purchasePrice) * Number(p.stock);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                            {p.category && <p className="text-xs text-slate-400">{p.category.name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">{p.unit}</td>
                      <td className="px-4 py-3 font-bold tabular-nums">
                        <span className={p.stock === 0 ? 'text-red-600' : p.stock <= (p.lowStockLimit ?? 10) ? 'text-orange-600' : 'text-emerald-600'}>
                          {p.stock}
                        </span>
                        {p.stock <= (p.lowStockLimit ?? 10) && p.stock > 0 && (
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-500 inline ml-1" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 tabular-nums">{fmt(p.purchasePrice)} so&apos;m</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white tabular-nums">{fmt(p.salePrice)} so&apos;m</td>
                      <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-semibold tabular-nums">{fmt(value)} so&apos;m</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${level.cls}`}>{level.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
            {filtered.length} / {products.length} ta mahsulot ko&apos;rsatilmoqda
          </div>
        </div>
      )}
    </div>
  );
}
