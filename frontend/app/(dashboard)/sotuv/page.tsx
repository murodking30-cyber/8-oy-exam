'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, ArrowUpCircle, ShoppingCart, CalendarDays } from 'lucide-react';
import { getStockOuts, createStockOut, deleteStockOut } from '../../../lib/api/stock-out';
import { getProducts } from '../../../lib/api/products';
import type { StockOut, Product } from '../../../types';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const fmt = (n: number | string) =>
  Number(n).toLocaleString('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const today = () => new Date().toISOString().split('T')[0];

const inputCls = 'rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 w-full';

export default function SotuvPage() {
  const [records, setRecords] = useState<StockOut[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [date, setDate] = useState(today());
  const [customer, setCustomer] = useState('');
  const [note, setNote] = useState('');

  const load = async () => {
    try {
      const [r, p] = await Promise.all([getStockOuts(), getProducts()]);
      setRecords(r);
      setProducts(p);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setSaveError('');
    setProductId('');
    setQuantity('');
    setSalePrice('');
    setDate(today());
    setCustomer('');
    setNote('');
    setModalOpen(true);
  };

  const selectedProduct = products.find((p) => p.id === parseInt(productId));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!productId || !quantity || !date) {
      setSaveError('Mahsulot, miqdor va sana kiritilishi shart');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await createStockOut({
        productId: parseInt(productId),
        quantity: parseFloat(quantity),
        unit: selectedProduct?.unit,
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
        date,
        customer: customer.trim() || undefined,
        note: note.trim() || undefined,
      });
      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setSaveError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Xatolik yuz berdi'));
    } finally { setSaving(false); }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteStockOut(deleteId);
      setDeleteId(null);
      await load();
    } catch { /* empty */ } finally { setDeleting(false); }
  };

  const totalToday = records
    .filter((r) => r.date === today())
    .reduce((s, r) => s + Number(r.totalAmount), 0);

  const totalAll = records.reduce((s, r) => s + Number(r.totalAmount), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 shadow-md text-white">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Jami yozuvlar</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold">{records.length}</p>
          <p className="text-xs mt-1 opacity-70">ta sotuv</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-5 shadow-md text-white">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Bugungi sotuv</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-xl font-bold">{fmt(totalToday)} so&apos;m</p>
          <p className="text-xs mt-1 opacity-70">bugun</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hidden lg:block">
          <p className="text-xs text-slate-500 mb-1 uppercase font-semibold tracking-wider">Jami sotuv summasi</p>
          <p className="text-xl font-bold text-emerald-600">{fmt(totalAll)} so&apos;m</p>
          <p className="text-xs text-slate-400 mt-1">barcha vaqt</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Sotuv qo&apos;shish
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
                  {['Sana', 'Mahsulot', 'Miqdor', 'Sotuv narxi', 'Jami', 'Xaridor', 'Izoh', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {records.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">Sotuv yozuvlari yo&apos;q</td></tr>
                )}
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 tabular-nums">
                      <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-mono">{r.date}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{r.product?.name ?? `#${r.productId}`}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">{fmt(r.quantity)}</span> <span className="text-slate-400 text-xs">{r.unit}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400">{fmt(r.salePrice)} so&apos;m</td>
                    <td className="px-4 py-3 font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{fmt(r.totalAmount)} so&apos;m</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.customer ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate text-xs">{r.note ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {records.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
              {records.length} ta yozuv
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Sotuv qo'shish">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mahsulot *</label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const p = products.find((x) => x.id === parseInt(e.target.value));
                if (p) setSalePrice(String(p.salePrice || ''));
              }}
              className={inputCls}
            >
              <option value="">Mahsulot tanlang...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                  {p.name} (zaxira: {p.stock} {p.unit}){p.stock <= 0 ? ' — TUGAGAN' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Miqdor * {selectedProduct && <span className="text-slate-400">({selectedProduct.unit}, max: {selectedProduct.stock})</span>}
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                max={selectedProduct?.stock}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sotuv narxi (so&apos;m)</label>
              <input type="number" step="1" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0" className={inputCls} />
            </div>
          </div>
          {quantity && salePrice && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Jami: <strong className="text-lg">{fmt(parseFloat(quantity || '0') * parseFloat(salePrice || '0'))} so&apos;m</strong>
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sana *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Xaridor ismi</label>
              <input type="text" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Xaridor ismi..." className={inputCls} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Izoh</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Qo'shimcha ma'lumot..." rows={2} className={`${inputCls} resize-none`} />
          </div>
          {saveError && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
              <p className="text-sm text-red-700 dark:text-red-400">{saveError}</p>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit" loading={saving}>
              <ArrowUpCircle className="w-4 h-4" />
              Sotuvni saqlash
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Sotuvni o'chirish"
        message="Bu sotuv yozuvi o'chiriladi va mahsulot zaxirasi tikladi. Davom etasizmi?"
      />
    </div>
  );
}
