'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.message ?? 'Invalid credentials');
      return;
    }

    router.push('/admin');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 text-slate-900">
      <div className="w-full max-w-sm">
        {/* Logo — Image logo only */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="NayaKapda.com" className="h-16 sm:h-20 w-auto mx-auto object-contain" />
          </Link>
          <p className="text-slate-500 mt-2 text-xs font-semibold">Admin Panel</p>
        </div>

        <div className="card p-8 bg-white border-slate-200 shadow-sm">
          <h1 className="text-xl font-black mb-6 text-center text-slate-900">Admin Sign In</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" placeholder="admin@nayakapda.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input" required minLength={6} />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-xs font-bold shadow-md">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4 font-medium">
          <Link href="/" className="hover:text-slate-900 font-semibold">← Back to Store</Link>
        </p>
      </div>
    </div>
  );
}
