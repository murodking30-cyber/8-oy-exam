'use client';
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Search, Receipt, Zap, Truck, Users, Wifi, MoreHorizontal } from 'lucide-react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../../../lib/api/expenses';
import type { Expense, ExpenseCategory } from '../../../types';

const inputCls =
  'w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

const CATEGORIES: { value: ExpenseCategory; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'elektr', label: 'Elektr', icon: Zap, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'transport', label: 'Transport', icon: Truck, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'ish_haqi', label: 'Ishchi oyligi', icon: Users, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'internet', label: 'Internet', icon: Wifi, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'boshqa', label: 'Boshqa', icon: MoreHorizontal, color: 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-400' },
];

function getCat(val: ExpenseCategory) {
  return CATEGORIES.find((c) => c.value === val) ?? CATEGORIES[4];
}

function fmt(n: number) {
  return n.toLocaleString('uz-UZ') + " so'm";
}

export default function XarajatlarPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<ExpenseCategory | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<{ category: ExpenseCategory; amount: string; date: string; note: string }>({
    category: 'boshqa',
    amount: '',
    date: today,
    note: '',
  });

  const load = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalThisMonth = expenses
    .filter((e) => e.date.startsWith(today.slice(0, 7)))
    .reduce((s, e) => s + Number(e.amount), 0);

  const totalAll = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const openAdd = () => {
    setEditing(null);
    setForm({ category: 'boshqa', amount: '', date: today, note: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({ category: e.category, amount: String(e.amount), date: e.date, note: e.note ?? '' });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    const amount = Number(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) return setError("Summa noto'g'ri");
    if (!form.date) return setError('Sana kiritilishi shart');
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateExpense(editing.id, { category: form.category, amount, date: form.date, note: form.note || undefined });
      } else {
        await createExpense({ category: form.category, amount, date: form.date, note: form.note || undefined });
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
    if (!confirm("Xarajatni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await deleteExpense(id);
      load();
    } catch { /* ignore */ }
  };

  const filtered = expenses.filter((e) => {
    const matchCat = filterCat === 'all' || e.category === filterCat;
    const matchSearch = (e.note ?? '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-4 text-white">
          <p className="text-violet-100 text-xs font-medium">Bu oy xarajatlar</p>
          <p className="text-2xl font-bold mt-1">{totalThisMonth.toLocaleString('uz-UZ')}</p>
          <p className="text-violet-200 text-xs mt-0.5">so'm</p>
        </div>
        <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl p-4 text-white">
          <p className="text-slate-300 text-xs font-medium">Jami xarajatlar</p>
          <p className="text-2xl font-bold mt-1">{totalAll.toLocaleString('uz-UZ')}</p>
          <p className="text-slate-400 text-xs mt-0.5">so'm</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Xarajatlar</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Qo'shish
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCat === 'all' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          Barchasi
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilterCat(cat.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCat === cat.value ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Izoh bo'yicha qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} pl-9`} />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">Xarajatlar topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Kategoriya</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Sana</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Summa</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Izoh</th>
                  <th className="w-20 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map((e) => {
                  const cat = getCat(e.category);
                  const Icon = cat.icon;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cat.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {cat.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md text-xs font-mono">{e.date}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">{fmt(Number(e.amount))}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{e.note ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 transition-colors">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {editing ? 'Xarajatni tahrirlash' : "Xarajat qo'shish"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kategoriya</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })} className={inputCls}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Summa (so'm) *</label>
                  <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="150000" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Sana *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Izoh</label>
                <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Iyun oyi elektr hisobi" className={inputCls} />
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Bekor</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm font-medium text-white disabled:opacity-60 transition-colors">
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
