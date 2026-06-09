'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getPayments, createPayment, updatePayment, deletePayment } from '../../../lib/api/payments';
import { getOrders } from '../../../lib/api/orders';
import type { Payment, Order } from '../../../types';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const schema = z.object({
  orderId: z.string().min(1, 'Buyurtma tanlang'),
  amount: z.number().positive('Miqdor musbat bo\'lishi kerak'),
  method: z.enum(['cash', 'card', 'bank_transfer', 'check']),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'completed', label: 'Tugallangan' },
  { value: 'failed', label: 'Muvaffaqiyatsiz' },
  { value: 'refunded', label: 'Qaytarilgan' },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusModal, setStatusModal] = useState<Payment | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { method: 'cash' },
  });

  const load = async () => {
    try {
      const [p, o] = await Promise.all([getPayments(), getOrders()]);
      setPayments(p);
      setOrders(o);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await createPayment({
        orderId: parseInt(data.orderId, 10),
        amount: data.amount,
        method: data.method,
        transactionId: data.transactionId,
        notes: data.notes,
      });
      setModalOpen(false);
      reset({ method: 'cash' });
      await load();
    } catch { /* empty */ }
    finally { setSaving(false); }
  };

  const onUpdateStatus = async () => {
    if (!statusModal || !newStatus) return;
    setSaving(true);
    try {
      await updatePayment(statusModal.id, { status: newStatus });
      setStatusModal(null);
      await load();
    } catch { /* empty */ }
    finally { setSaving(false); }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deletePayment(deleteId);
      setDeleteId(null);
      await load();
    } catch { /* empty */ }
    finally { setDeleting(false); }
  };

  const totalRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Jami yig&apos;ilgan</p>
          <p className="text-2xl font-bold text-green-600 mt-1">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Kutilmoqda</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{payments.filter((p) => p.status === 'pending').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Jami to&apos;lovlar</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{payments.length}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => { reset({ method: 'cash' }); setModalOpen(true); }}><Plus className="w-4 h-4" />To&apos;lov qo&apos;shish</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
                  {['Buyurtma', 'Miqdor', 'Usul', 'Holat', 'Tranzaksiya ID', "To'langan sana", 'Amallar'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {payments.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-500">Hali to&apos;lovlar yo&apos;q</td></tr>
                )}
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {orders.find((o) => o.id === p.orderId)?.orderNumber ?? `#${p.orderId}`}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">${Number(p.amount).toFixed(2)}</td>
                    <td className="px-4 py-3"><Badge value={p.method} /></td>
                    <td className="px-4 py-3"><Badge value={p.status} /></td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.transactionId ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('uz-UZ') : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setStatusModal(p); setNewStatus(p.status); }} className="text-xs px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors font-medium">Holat</button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="To'lov qo'shish">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Buyurtma *" error={errors.orderId?.message} {...register('orderId')}>
            <option value="">Buyurtma tanlang</option>
            {orders.filter((o) => o.status !== 'cancelled').map((o) => (
              <option key={o.id} value={String(o.id)}>{o.orderNumber} — ${Number(o.total).toFixed(2)}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Miqdor *" type="number" step="0.01" placeholder="0.00" error={errors.amount?.message} {...register('amount', { valueAsNumber: true })} />
            <Select label="To'lov usuli *" error={errors.method?.message} {...register('method')}>
              <option value="cash">Naqd pul</option>
              <option value="card">Karta</option>
              <option value="bank_transfer">Bank o&apos;tkazmasi</option>
              <option value="check">Chek</option>
            </Select>
          </div>
          <Input label="Tranzaksiya ID" placeholder="TXN-123456" {...register('transactionId')} />
          <Textarea label="Izohlar" placeholder="To'lov izohlari..." {...register('notes')} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit" loading={saving}>Saqlash</Button>
          </div>
        </form>
      </Modal>

      <Modal open={statusModal !== null} onClose={() => setStatusModal(null)} title="To'lov holatini o'zgartirish" size="sm">
        <div className="space-y-4">
          <Select label="Holat" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            {PAYMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setStatusModal(null)}>Bekor qilish</Button>
            <Button onClick={onUpdateStatus} loading={saving}>Saqlash</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={onDelete} loading={deleting} title="To'lovni o'chirish" message="Haqiqatan ham bu to'lov yozuvini o'chirmoqchimisiz?" />
    </div>
  );
}
