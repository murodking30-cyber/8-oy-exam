'use client';
import { useEffect, useRef, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Image as ImageIcon, Package, Upload, X } from 'lucide-react';
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

const UNITS = ['tonna', 'kg', 'qop'];

const schema = z.object({
  name: z.string().min(1, 'Nomi kiritilishi shart'),
  description: z.string().optional(),
  purchasePrice: z.number().min(0, "Narx manfiy bo'lishi mumkin emas"),
  salePrice: z.number().positive("Sotuv narxi musbat bo'lishi kerak"),
  unit: z.string().min(1, 'Birlik tanlanishi shart'),
  lowStockLimit: z.number().int().min(0),
  categoryId: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const fmt = (n: number | string) =>
  Number(n).toLocaleString('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 3 });

function resizeImageToBase64(file: File, maxPx = 480, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > maxPx || h > maxPx) {
          if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
          else { w = Math.round(w * maxPx / h); h = maxPx; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setImagePreview(null);
    reset({ unit: 'tonna', purchasePrice: 0, salePrice: 0, lowStockLimit: 10 });
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setSaveError('');
    setImagePreview(p.image ?? null);
    reset({
      name: p.name,
      description: p.description ?? '',
      purchasePrice: Number(p.purchasePrice) || 0,
      salePrice: Number(p.salePrice) || Number(p.price) || 0,
      unit: p.unit || 'tonna',
      lowStockLimit: p.lowStockLimit ?? 10,
      categoryId: p.categoryId ? String(p.categoryId) : '',
    });
    setModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Rasm hajmi 5MB dan oshmasligi kerak");
      return;
    }
    const base64 = await resizeImageToBase64(file);
    setImagePreview(base64);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        name: data.name,
        description: data.description?.trim() || undefined,
        image: imagePreview ?? undefined,
        purchasePrice: data.purchasePrice,
        salePrice: data.salePrice,
        unit: data.unit,
        lowStockLimit: data.lowStockLimit,
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
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      alert(Array.isArray(msg) ? msg.join(', ') : (msg ?? "O'chirishda xatolik yuz berdi"));
    }
    finally { setDeleting(false); }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mahsulot qidirish..."
            className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 w-64 transition-all"
          />
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
                  {['Rasm', 'Nomi', 'Kategoriya', 'Kirim narxi', 'Sotuv narxi', 'Zaxira', 'Amallar'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Package className="w-10 h-10 opacity-30" />
                        <p className="text-sm">Mahsulotlar topilmadi</p>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      {p.category?.name ? (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium">{p.category.name}</span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 tabular-nums">{fmt(p.purchasePrice)} so&apos;m</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white tabular-nums">{fmt(p.salePrice)} so&apos;m</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        Number(p.stock) === 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : Number(p.stock) <= (p.lowStockLimit ?? 10)
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {fmt(p.stock)} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 hover:text-blue-700 transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
            {filtered.length} / {products.length} ta mahsulot
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Mahsulotni tahrirlash' : "Mahsulot qo'shish"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Image upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rasm</label>
            <div className="flex items-start gap-3">
              {/* Preview */}
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden flex-shrink-0 bg-slate-50 dark:bg-slate-700/30">
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Fayl tanlash
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Rasmni olib tashlash
                  </button>
                )}
                <p className="text-[11px] text-slate-400">JPEG, PNG, WEBP — max 5MB</p>
              </div>
            </div>
          </div>

          <Input label="Nomi *" placeholder="Mahsulot nomi" error={errors.name?.message} {...register('name')} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Kirim narxi (so'm)" type="number" step="1" placeholder="0" error={errors.purchasePrice?.message} {...register('purchasePrice', { valueAsNumber: true })} />
            <Input label="Sotuv narxi (so'm) *" type="number" step="1" placeholder="0" error={errors.salePrice?.message} {...register('salePrice', { valueAsNumber: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">O&apos;lchov birligi *</label>
              <select {...register('unit')} className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              {errors.unit && <p className="text-xs text-red-500">{errors.unit.message}</p>}
            </div>
            <Input label="Kam zaxira ogohlantirish" type="number" placeholder="10" {...register('lowStockLimit', { valueAsNumber: true })} />
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
            <Button type="submit" loading={saving}>{editing ? "O'zgarishlarni saqlash" : "Qo'shish"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Mahsulotni o'chirish"
        message="Haqiqatan ham bu mahsulotni o'chirmoqchimisiz? Bu mahsulotning barcha kirim/chiqim yozuvlari ham o'chiriladi."
      />
    </div>
  );
}
