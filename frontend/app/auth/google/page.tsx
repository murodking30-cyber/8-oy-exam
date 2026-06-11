'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/axios';
import type { AuthResponse } from '../../../types';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

function GoogleCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      router.replace('/login?error=google_failed');
      return;
    }

    api.get<AuthResponse['user']>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        setAuth(res.data, token);
        router.replace('/dashboard');
      })
      .catch(() => {
        router.replace('/login?error=google_failed');
      });
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-slate-500 text-sm">Google orqali kirilmoqda...</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <GoogleCallbackInner />
    </Suspense>
  );
}
