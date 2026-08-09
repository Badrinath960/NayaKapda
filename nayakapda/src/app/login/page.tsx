'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';

  const [form, setForm] = useState({ phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn('credentials', {
      phone: form.phone,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid phone number or password. Please try again.');
    } else {
      router.push(redirect);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 text-slate-900">
      <div className="w-full max-w-md">
        {/* Logo — Image logo only */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="NayaKapda.com" className="h-20 sm:h-24 w-auto mx-auto object-contain" />
          </Link>
          <p className="text-slate-500 mt-2 text-xs font-semibold">Bulk Apparel Platform</p>
        </div>

        <div className="card p-8 bg-white border-slate-200 shadow-sm">
          <h1 className="text-2xl font-black mb-6 text-center text-slate-900">Welcome Back</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Phone Number</label>
              <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 bg-white">
                <span className="flex items-center px-3.5 bg-slate-100 border-r border-slate-200 text-slate-600 text-sm font-bold select-none">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none bg-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm font-bold mt-2 shadow-md">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6 font-medium">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-orange-600 hover:text-orange-700 font-bold">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-semibold text-sm">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
