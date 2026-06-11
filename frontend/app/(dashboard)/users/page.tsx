'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Shield, CheckCircle, XCircle } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from '../../../lib/api/users';
import type { User } from '../../../types';
import { useAuthStore } from '../../../store/authStore';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Badge from '../../../components/ui/Badge';

interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}

const emptyForm: UserForm = { firstName: '', lastName: '', email: '', password: '', role: 'employee' };

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try { setUsers(await getUsers()); }
    catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) load(); else setLoading(false); }, [isAdmin]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.firstName.trim()) { setFormError("Ism kiritilishi shart"); return; }
    if (!form.lastName.trim()) { setFormError("Familiya kiritilishi shart"); return; }
    if (!form.email.trim()) { setFormError("Email kiritilishi shart"); return; }
    if (!editing && form.password.length < 6) { setFormError("Parol kamida 6 belgi"); return; }

    setSaving(true);
    try {
      if (editing) {
        const payload: Record<string, string> = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          role: form.role,
        };
        if (form.password) payload.password = form.password;
        await updateUser(editing.id, payload);
      } else {
        await createUser({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        });
      }
      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      await updateUser(u.id, { isActive: !u.isActive });
      await load();
    } catch { /* silent */ }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await deleteUser(deleteId); setDeleteId(null); await load(); }
    catch { /* silent */ }
    finally { setDeleting(false); }
  };

  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const set = (k: keyof UserForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <Shield className="w-7 h-7 text-red-500" />
      </div>
      <p className="font-semibold text-slate-800 dark:text-white text-lg">Ruxsat yo&apos;q</p>
      <p className="text-slate-400 text-sm mt-1">Bu sahifa faqat administrator va menejerlar uchun</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Foydalanuvchilarni qidirish..."
            className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:border-indigo-500 w-64 transition-all"
          />
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" />Foydalanuvchi qo&apos;shish</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
                  {['Foydalanuvchi', 'Email', 'Telefon', 'Lavozim', 'Holat', 'Tasdiqlangan', 'Amallar'].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-16 text-slate-400">Foydalanuvchilar topilmadi</td></tr>
                )}
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                          {u.firstName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{u.firstName} {u.lastName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{u.phone ?? '—'}</td>
                    <td className="px-4 py-3.5"><Badge value={u.role} /></td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50 hover:bg-emerald-100'
                            : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {u.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.isActive ? 'Faol' : 'Nofaol'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" /> Ha
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <XCircle className="w-3.5 h-3.5" /> Yo&apos;q
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-600 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            {filtered.length} / {users.length} foydalanuvchi
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Foydalanuvchini tahrirlash' : "Yangi foydalanuvchi qo'shish"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ism *" placeholder="Ali" value={form.firstName} onChange={set('firstName')} />
            <Input label="Familiya *" placeholder="Valiyev" value={form.lastName} onChange={set('lastName')} />
          </div>
          <Input label="Email *" type="email" placeholder="ali@example.com" value={form.email} onChange={set('email')} />
          <Input
            label={editing ? 'Yangi parol (ixtiyoriy)' : 'Parol *'}
            type="password"
            placeholder={editing ? "O'zgartirmasangiz bo'sh qoldiring" : 'Kamida 6 belgi'}
            value={form.password}
            onChange={set('password')}
          />
          <Select label="Lavozim" value={form.role} onChange={set('role')}>
            <option value="employee">Xodim</option>
            <option value="manager">Menejer</option>
            <option value="admin">Administrator</option>
          </Select>

          {formError && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
              <p className="text-sm text-red-700 dark:text-red-400">{formError}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Bekor qilish</Button>
            <Button type="button" loading={saving} onClick={handleSave}>
              {editing ? "O'zgarishlarni saqlash" : "Qo'shish"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Foydalanuvchini o'chirish"
        message="Haqiqatan ham bu foydalanuvchini o'chirmoqchimisiz?"
      />
    </div>
  );
}
