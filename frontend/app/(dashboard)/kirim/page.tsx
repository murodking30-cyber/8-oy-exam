'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, ArrowDownCircle, Receipt, CalendarDays } from 'lucide-react';
import { getStockIns, createStockIn, deleteStockIn } from '../../../lib/api/stock-in';
import { getProducts } from '../../../lib/api/products';
import type { StockIn, Product } from '../../../types';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const fmt = (n: number | string) =>
  Number(n).toLocaleString('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const today = () => new Date().toISOString().split('T')[0];

const inputCls = 'rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 w-full';

export default function KirimPage() {
  const [records, setRecords] = useState<StockIn[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');

  const load = async () => {
    try {
      const [r, p] = await Promise.all([getStockIns(), getProducts()]);
      setRecords(r);
      setProducts(p);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setSaveError('');
    setProductId('');
    setQuantity('');
    setPurchasePrice('');
    setDate(today());
    setNote('');
    setModalOpen(true);
  };

  const selectedProduct = products.find((p) => p.id === parseInt(productId));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity || !date) {
      setSaveError('Mahsulot, miqdor va sana kiritilishi shart');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await createStockIn({
        productId: parseInt(productId),
        quantity: parseFloat(quantity),
        unit: selectedProduct?.unit,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        date,
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
      await deleteStockIn(deleteId);
      setDeleteId(null);
      await load();
    } catch { /* empty */ }
    finally { setDeleting(false); }
  };

  const totalToday = records
    .filter((r) => r.date === today())
    .reduce((s, r) => s + Number(r.totalCost), 0);

  const totalAll = records.reduce((s, r) => s + Number(r.totalCost), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 shadow-md text-white">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Jami yozuvlar</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20">
              <Receipt className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold">{records.length}</p>
          <p className="text-xs mt-1 opacity-70">ta kirim</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 shadow-md text-white">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Bugungi kirim</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-xl font-bold">{fmt(totalToday)} so&apos;m</p>
          <p className="text-xs mt-1 opacity-70">bugun</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hidden lg:block">
          <p className="text-xs text-slate-500 mb-1 uppercase font-semibold tracking-wider">Jami kirim summasi</p>
          <p className="text-xl font-bold text-indigo-600">{fmt(totalAll)} so&apos;m</p>
          <p className="text-xs text-slate-400 mt-1">barcha vaqt</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Kirim qo&apos;shish
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
                  {['Sana', 'Mahsulot', 'Miqdor', 'Kirim narxi', 'Jami', 'Izoh', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {records.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">Kirim yozuvlari yo&apos;q</td></tr>
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
                    <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400">{fmt(r.purchasePrice)} so&apos;m</td>
                    <td className="px-4 py-3 font-bold tabular-nums text-indigo-600 dark:text-indigo-400">{fmt(r.totalCost)} so&apos;m</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate text-xs">{r.note ?? '—'}</td>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Kirim qo'shish">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mahsulot *</label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const p = products.find((x) => x.id === parseInt(e.target.value));
                if (p) setPurchasePrice(String(p.purchasePrice || ''));
              }}
              className={inputCls}
            >
              <option value="">Mahsulot tanlang...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (zaxira: {p.stock} {p.unit})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Miqdor * {selectedProduct && <span className="text-slate-400">({selectedProduct.unit})</span>}
              </label>
              <input type="number" step="0.001" min="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kirim narxi (so&apos;m)</label>
              <input type="number" step="1" min="0" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0" className={inputCls} />
            </div>
          </div>
          {quantity && purchasePrice && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3">
              <p className="text-sm text-indigo-700 dark:text-indigo-400">
                Jami: <strong className="text-lg">{fmt(parseFloat(quantity || '0') * parseFloat(purchasePrice || '0'))} so&apos;m</strong>
              </p>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sana *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
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
              <ArrowDownCircle className="w-4 h-4" />
              Kirimni saqlash
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Kirimni o'chirish"
        message="Bu kirim yozuvi o'chiriladi va mahsulot zaxirasi kamayadi. Davom etasizmi?"
      />
    </div>
  );
}
