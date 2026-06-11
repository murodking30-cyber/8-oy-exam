'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../../lib/api/products';
import { getCategories } from '../../../lib/api/categories';
import type { Product, Category } from '../../../types';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const schema = z.object({
  name: z.string().min(1, 'Nomi kiritilishi shart'),
  description: z.string().optional(),
  price: z.number().positive('Narx musbat bo\'lishi kerak'),
  stock: z.number().int().min(0, 'Zaxira manfiy bo\'lishi mumkin emas'),
  unit: z.string().optional(),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const load = async () => {
    try {
      const [p, c] = await Promise.all([getProducts(), getCategories()]);
      setProducts(p);
      setCategories(c);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setSaveError('');
    reset({ unit: 'dona', stock: 0, price: 0 });
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setSaveError('');
    reset({
      name: p.name,
      description: p.description ?? '',
      price: p.price,
      stock: p.stock,
      unit: p.unit,
      sku: p.sku ?? '',
      categoryId: p.categoryId ? String(p.categoryId) : '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        name: data.name,
        description: data.description?.trim() || undefined,
        price: data.price,
        stock: data.stock,
        unit: data.unit?.trim() || 'dona',
        sku: data.sku?.trim() || undefined,
        categoryId: data.categoryId ? parseInt(data.categoryId, 10) : undefined,
      };
      if (editing) await updateProduct(editing.id, payload);
      else await createProduct(payload);
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
      await deleteProduct(deleteId);
      setDeleteId(null);
      await load();
    } catch { /* empty */ }
    finally { setDeleting(false); }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mahsulotlarni qidirish..." className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 w-64 transition-all" />
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" />Mahsulot qo&apos;shish</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
                  {['Nomi', 'Katalog raqami', 'Kategoriya', 'Narx', 'Zaxira', 'Amallar'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-500">Mahsulotlar topilmadi</td></tr>
                )}
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{p.sku ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">${Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${p.stock === 0 ? 'text-red-600' : p.stock <= 10 ? 'text-orange-600' : 'text-green-600'}`}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">{filtered.length} / {products.length} ta mahsulot</div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Mahsulotni tahrirlash' : 'Mahsulot qo\'shish'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nomi *" placeholder="Mahsulot nomi" error={errors.name?.message} {...register('name')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Narx *" type="number" step="0.01" placeholder="0.00" error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
            <Input label="Zaxira *" type="number" placeholder="0" error={errors.stock?.message} {...register('stock', { valueAsNumber: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="O'lchov birligi" placeholder="dona, qop, kg..." {...register('unit')} />
            <Input label="Katalog raqami" placeholder="SKU kodi" {...register('sku')} />
          </div>
          <Select label="Kategoriya" {...register('categoryId')}>
            <option value="">Kategoriyasiz</option>
            {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </Select>
          <Textarea label="Tavsif" placeholder="Mahsulot tavsifi..." {...register('description')} />
          {saveError && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
              <p className="text-sm text-red-700 dark:text-red-400">{saveError}</p>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit" loading={saving}>{editing ? "O'zgarishlarni saqlash" : 'Qo\'shish'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={onDelete} loading={deleting} title="Mahsulotni o'chirish" message="Haqiqatan ham bu mahsulotni o'chirmoqchimisiz?" />
    </div>
  );
}
