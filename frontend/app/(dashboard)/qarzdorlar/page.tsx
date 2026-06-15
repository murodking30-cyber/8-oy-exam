'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Phone, X, Search, Users, AlertCircle,
  Calendar, Package, CreditCard, CheckCircle2, CalendarDays,
} from 'lucide-react';
import {
  getDebtors, createDebtor, updateDebtor, deleteDebtor, addPayment,
} from '../../../lib/api/debtors';
import type { Debtor } from '../../../types';

const inputCls =
  'w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

function fmt(n: number) {
  return n.toLocaleString('uz-UZ') + " so'm";
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function monthPrefix() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

type DateFilter = 'all' | 'today' | 'month' | 'custom';

const emptyForm = () => ({
  name: '', phone: '', product: '', quantity: '', totalAmount: '',
  paidAmount: '', debtDate: todayStr(), note: '',
});

export default function QarzdorlarPage() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDate, setCustomDate] = useState('');

  // Add / Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Debtor | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Payment modal
  const [payTarget, setPayTarget] = useState<Debtor | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', paymentDate: todayStr(), note: '' });
  const [payError, setPayError] = useState('');
  const [payingSaving, setPayingSaving] = useState(false);

  const load = async () => {
    try {
      const data = await getDebtors();
      setDebtors(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = debtors;

    // Date filter
    if (dateFilter === 'today') {
      const t = todayStr();
      list = list.filter((d) => d.debtDate === t);
    } else if (dateFilter === 'month') {
      const mp = monthPrefix();
      list = list.filter((d) => d.debtDate?.startsWith(mp));
    } else if (dateFilter === 'custom' && customDate) {
      list = list.filter((d) => d.debtDate === customDate);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.phone ?? '').includes(q) ||
          (d.product ?? '').toLowerCase().includes(q),
      );
    }

    return list;
  }, [debtors, dateFilter, customDate, search]);

  const totalDebt = filtered.reduce((s, d) => s + Math.max(0, Number(d.totalAmount) - Number(d.paidAmount)), 0);
  const activeCount = filtered.filter((d) => Number(d.totalAmount) > Number(d.paidAmount)).length;
  const paidCount = filtered.filter((d) => Number(d.totalAmount) <= Number(d.paidAmount)).length;

  // === Add / Edit ===
  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setError('');
    setShowModal(true);
  };

  const openEdit = (d: Debtor) => {
    setEditing(d);
    setForm({
      name: d.name,
      phone: d.phone ?? '',
      product: d.product ?? '',
      quantity: d.quantity != null ? String(d.quantity) : '',
      totalAmount: String(d.totalAmount),
      paidAmount: String(d.paidAmount),
      debtDate: d.debtDate ?? todayStr(),
      note: d.note ?? '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError('F.I.O kiritilishi shart');
    if (!form.debtDate) return setError('Qarz olingan sana kiritilishi shart');
    const totalAmount = Number(form.totalAmount);
    const paidAmount = Number(form.paidAmount || 0);
    if (isNaN(totalAmount) || totalAmount <= 0) return setError("Jami summa noto'g'ri");
    if (paidAmount < 0 || paidAmount > totalAmount) return setError("To'langan summa jami summadan oshib ketdi");
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        product: form.product.trim() || undefined,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        totalAmount,
        paidAmount,
        debtDate: form.debtDate,
        note: form.note.trim() || undefined,
      };
      if (editing) {
        await updateDebtor(editing.id, payload);
      } else {
        await createDebtor(payload);
      }
      setShowModal(false);
      load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Qarzdorni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await deleteDebtor(id);
      load();
    } catch { /* ignore */ }
  };

  // === Payment ===
  const openPayment = (d: Debtor) => {
    setPayTarget(d);
    setPayForm({ amount: '', paymentDate: todayStr(), note: '' });
    setPayError('');
  };

  const handlePay = async () => {
    if (!payTarget) return;
    const amount = Number(payForm.amount);
    const remaining = Number(payTarget.totalAmount) - Number(payTarget.paidAmount);
    if (!payForm.amount || isNaN(amount) || amount <= 0) return setPayError("Summa noto'g'ri");
    if (amount > remaining + 0.01) return setPayError(`Qolgan qarz: ${fmt(remaining)}`);
    if (!payForm.paymentDate) return setPayError('Sana kiritilishi shart');
    setPayingSaving(true);
    setPayError('');
    try {
      await addPayment(payTarget.id, {
        amount,
        paymentDate: payForm.paymentDate,
        note: payForm.note || undefined,
      });
      setPayTarget(null);
      load();
    } catch (err: unknown) {
      setPayError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Xatolik yuz berdi');
    } finally {
      setPayingSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
          <p className="text-red-100 text-xs font-medium">Qolgan qarz</p>
          <p className="text-2xl font-bold mt-1">{totalDebt.toLocaleString('uz-UZ')}</p>
          <p className="text-red-200 text-xs mt-0.5">so'm</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <p className="text-orange-100 text-xs font-medium">Faol qarzdorlar</p>
          <p className="text-2xl font-bold mt-1">{activeCount}</p>
          <p className="text-orange-200 text-xs mt-0.5">kishi</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <p className="text-emerald-100 text-xs font-medium">Qarz yopildi</p>
          <p className="text-2xl font-bold mt-1">{paidCount}</p>
          <p className="text-emerald-200 text-xs mt-0.5">kishi</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Qarzdorlar</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Qarz qo&apos;shish
        </button>
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([
          { key: 'all', label: 'Barchasi' },
          { key: 'today', label: 'Bugungi' },
          { key: 'month', label: 'Shu oy' },
          { key: 'custom', label: 'Sana bo\'yicha' },
        ] as { key: DateFilter; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setDateFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              dateFilter === key
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {key === 'custom' && <CalendarDays className="w-3.5 h-3.5 inline mr-1" />}
            {label}
          </button>
        ))}
        {dateFilter === 'custom' && (
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Ismi, telefon yoki mahsulot bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} pl-9`}
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">Qarzdorlar topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Mijoz</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Mahsulot</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Qarz olingan</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Jami</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">To&apos;langan</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Qolgan qarz</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Oxirgi to&apos;lov</th>
                  <th className="w-28 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map((d) => {
                  const remaining = Math.max(0, Number(d.totalAmount) - Number(d.paidAmount));
                  const isPaid = remaining <= 0;
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">{d.name}</div>
                        {d.phone && (
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />{d.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {d.product ? (
                          <div>
                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              <Package className="w-3.5 h-3.5 text-slate-400" />
                              <span>{d.product}</span>
                            </div>
                            {d.quantity != null && (
                              <div className="text-xs text-slate-400 mt-0.5">{Number(d.quantity)} birlik</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {d.debtDate ? (
                          <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md text-xs font-mono">
                            <Calendar className="w-3 h-3" />{d.debtDate}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-medium">{fmt(Number(d.totalAmount))}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{fmt(Number(d.paidAmount))}</td>
                      <td className="px-4 py-3 text-right">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            Yopildi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold text-xs">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {fmt(remaining)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {d.lastPaymentDate ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{d.lastPaymentDate}</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {!isPaid && (
                            <button
                              onClick={() => openPayment(d)}
                              title="To'lov qo'shish"
                              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(d)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {editing ? 'Qarzni tahrirlash' : "Qarz qo'shish"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Mijoz F.I.O *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ahmadov Jasur Baxtiyorovich"
                  className={inputCls}
                  autoFocus
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Telefon</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+998901234567"
                  className={inputCls}
                />
              </div>

              {/* Product + Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mahsulot</label>
                  <input
                    type="text"
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    placeholder="Sement M500"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Miqdor</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="2.5"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Debt date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Qarz olingan sana *
                </label>
                <input
                  type="date"
                  value={form.debtDate}
                  onChange={(e) => setForm({ ...form, debtDate: e.target.value })}
                  className={inputCls}
                />
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Jami summa *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.totalAmount}
                    onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                    placeholder="500000"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">To&apos;langan</label>
                  <input
                    type="number"
                    min="0"
                    value={form.paidAmount}
                    onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Qolgan qarz preview */}
              {form.totalAmount && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Qolgan qarz:</span>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {fmt(Math.max(0, Number(form.totalAmount) - Number(form.paidAmount || 0)))}
                  </span>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Izoh</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Qo'shimcha ma'lumot"
                  className={inputCls}
                />
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Bekor
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm font-medium text-white disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">To&apos;lov qo&apos;shish</h2>
              <button
                onClick={() => setPayTarget(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-4">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">{payTarget.name}</p>
              <p className="text-sm font-bold text-red-700 dark:text-red-300 mt-0.5">
                Qolgan qarz: {fmt(Math.max(0, Number(payTarget.totalAmount) - Number(payTarget.paidAmount)))}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  To&apos;lov miqdori (so&apos;m) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  placeholder="50000"
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  To&apos;lov sanasi *
                </label>
                <input
                  type="date"
                  value={payForm.paymentDate}
                  onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Izoh</label>
                <input
                  type="text"
                  value={payForm.note}
                  onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                  placeholder="Naqd to'lov"
                  className={inputCls}
                />
              </div>

              {payError && <p className="text-sm text-red-600 dark:text-red-400">{payError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setPayTarget(null)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Bekor
                </button>
                <button
                  onClick={handlePay}
                  disabled={payingSaving}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-medium text-white disabled:opacity-60 transition-colors"
                >
                  {payingSaving ? 'Saqlanmoqda...' : 'To\'lovni saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
