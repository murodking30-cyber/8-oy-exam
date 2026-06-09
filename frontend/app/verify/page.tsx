'use client';
import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { HardHat, ShieldCheck } from 'lucide-react';
import { verifyCode, resendCode } from '../../lib/api/auth';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';

function VerifyContent() {
  const params = useSearchParams();
  const contact = params.get('contact') ?? '';
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Kod 6 xonali bo'lishi kerak");
      return;
    }
    try {
      setError('');
      setLoading(true);
      const res = await verifyCode(contact, code);
      setAuth(res.user, res.token);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Kod noto'g'ri yoki muddati tugagan.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setError('');
      setSuccess('');
      setResending(true);
      await resendCode(contact);
      setSuccess('Yangi tasdiqlash kodi yuborildi');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Kodni qayta yuborishda xatolik yuz berdi.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white text-lg">Qurilish CRM</span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-indigo-600" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hisobni tasdiqlash</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              6 xonali tasdiqlash kodi yuborildi:
            </p>
            <p className="text-indigo-600 font-medium text-sm mt-1 break-all">{contact}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Tasdiqlash kodi
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-2xl font-bold tracking-[0.5em] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
            {success && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
                <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full justify-center" size="lg">
              Tasdiqlash
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kod kelmadimi?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
              >
                {resending ? 'Yuborilmoqda...' : 'Qayta yuborish'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
