'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, XCircle, Eye } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getOrders, createOrder, updateOrder, cancelOrder, deleteOrder } from '../../../lib/api/orders';
import { getCustomers } from '../../../lib/api/customers';
import { getProducts } from '../../../lib/api/products';
import type { Order, Customer, Product } from '../../../types';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const itemSchema = z.object({
  productId: z.string().min(1, 'Mahsulot tanlang'),
  quantity: z.number().int().positive('Miqdor musbat bo\'lishi kerak'),
});

const schema = z.object({
  customerId: z.string().min(1, 'Mijoz tanlang'),
  items: z.array(itemSchema).min(1, 'Kamida bitta mahsulot qo\'shing'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const ORDER_STATUSES = [
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'confirmed', label: 'Tasdiqlangan' },
  { value: 'processing', label: 'Jarayonda' },
  { value: 'shipped', label: "Jo'natilgan" },
  { value: 'delivered', label: 'Yetkazilgan' },
  { value: 'cancelled', label: 'Bekor qilingan' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusModal, setStatusModal] = useState<Order | null>(null);
  const [viewModal, setViewModal] = useState<Order | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { items: [{ productId: '', quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const load = async () => {
    try {
      const [o, c, p] = await Promise.all([getOrders(), getCustomers(), getProducts()]);
      setOrders(o);
      setCustomers(c);
      setProducts(p);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    reset({ items: [{ productId: '', quantity: 1 }], notes: '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await createOrder({
        customerId: parseInt(data.customerId, 10),
        items: data.items.map((item) => ({
          productId: parseInt(item.productId, 10),
          quantity: item.quantity,
        })),
        notes: data.notes,
      });
      setModalOpen(false);
      await load();
    } catch { /* empty */ }
    finally { setSaving(false); }
  };

  const onUpdateStatus = async () => {
    if (!statusModal || !newStatus) return;
    setSaving(true);
    try {
      await updateOrder(statusModal.id, { status: newStatus });
      setStatusModal(null);
      await load();
    } catch { /* empty */ }
    finally { setSaving(false); }
  };

  const onCancel = async (id: number) => {
    try { await cancelOrder(id); await load(); } catch { /* empty */ }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteOrder(deleteId);
      setDeleteId(null);
      await load();
    } catch { /* empty */ }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="w-4 h-4" />Yangi buyurtma</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
                  {['Buyurtma #', 'Mijoz', 'Mahsulotlar', 'Jami', 'Holat', 'Sana', 'Amallar'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-500">Hali buyurtmalar yo&apos;q</td></tr>
                )}
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{o.orderNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{o.customer?.name ?? `#${o.customerId}`}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{o.items?.length ?? 0} ta</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">${Number(o.total).toFixed(2)}</td>
                    <td className="px-4 py-3"><Badge value={o.status} /></td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString('uz-UZ')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setViewModal(o)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 transition-colors" title="Ko'rish"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { setStatusModal(o); setNewStatus(o.status); }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors" title="Holat o'zgartirish"><Pencil className="w-4 h-4" /></button>
                        {o.status !== 'cancelled' && (
                          <button onClick={() => onCancel(o.id)} className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 transition-colors" title="Bekor qilish"><XCircle className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => setDeleteId(o.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors" title="O'chirish"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">{orders.length} ta buyurtma</div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Yangi buyurtma" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Mijoz *" error={errors.customerId?.message} {...register('customerId')}>
            <option value="">Mijoz tanlang</option>
            {customers.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </Select>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Buyurtma mahsulotlari *</label>
              <button type="button" onClick={() => append({ productId: '', quantity: 1 })} className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Mahsulot qo&apos;shish</button>
            </div>
            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Select {...register(`items.${i}.productId`)}>
                      <option value="">Mahsulot tanlang</option>
                      {products.map((p) => <option key={p.id} value={String(p.id)}>{p.name} (Zaxira: {p.stock})</option>)}
                    </Select>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min={1}
                      {...register(`items.${i}.quantity`, { valueAsNumber: true })}
                      placeholder="Miqdor"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(i)} className="mt-0.5 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
            {errors.items && <p className="text-xs text-red-500 mt-1">Kamida bitta mahsulot qo&apos;shing</p>}
          </div>

          <Textarea label="Izohlar" placeholder="Yetkazish ko'rsatmalari..." {...register('notes')} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit" loading={saving}>Buyurtma yaratish</Button>
          </div>
        </form>
      </Modal>

      <Modal open={statusModal !== null} onClose={() => setStatusModal(null)} title="Buyurtma holatini o'zgartirish" size="sm">
        <div className="space-y-4">
          <Select label="Holat" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setStatusModal(null)}>Bekor qilish</Button>
            <Button onClick={onUpdateStatus} loading={saving}>Saqlash</Button>
          </div>
        </div>
      </Modal>

      {viewModal && (
        <Modal open={viewModal !== null} onClose={() => setViewModal(null)} title={`Buyurtma ${viewModal.orderNumber}`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Mijoz:</span> <span className="font-medium ml-1">{viewModal.customer?.name}</span></div>
              <div><span className="text-gray-500">Holat:</span> <span className="ml-1"><Badge value={viewModal.status} /></span></div>
              <div><span className="text-gray-500">Jami:</span> <span className="font-bold text-lg ml-1">${Number(viewModal.total).toFixed(2)}</span></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mahsulotlar</p>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 dark:bg-gray-800"><th className="text-left px-3 py-2 text-xs text-gray-500">Mahsulot</th><th className="text-right px-3 py-2 text-xs text-gray-500">Miqdor</th><th className="text-right px-3 py-2 text-xs text-gray-500">Narx</th><th className="text-right px-3 py-2 text-xs text-gray-500">Jami</th></tr></thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {viewModal.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">{item.product?.name ?? `#${item.productId}`}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-semibold">${Number(item.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {viewModal.notes && <div><p className="text-xs text-gray-500">Izoh: {viewModal.notes}</p></div>}
          </div>
        </Modal>
      )}

      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={onDelete} loading={deleting} title="Buyurtmani o'chirish" message="Haqiqatan ham bu buyurtmani o'chirmoqchimisiz?" />
    </div>
  );
}
