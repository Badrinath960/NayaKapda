'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ phone: '', password: '', name: '', email: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      const msgs = data.errors?.fieldErrors;
      const first = msgs ? Object.values(msgs).flat()[0] : data.error ?? 'Registration failed';
      setError(first as string);
      setLoading(false);
      return;
    }

    // Auto-login
    await signIn('credentials', { phone: form.phone, password: form.password, redirect: false });
    router.push('/products');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 text-slate-900 py-10">
      <div className="w-full max-w-md">
        {/* Logo — Image logo only */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="NayaKapda.com" className="h-14 w-auto mx-auto object-contain" />
          </Link>
          <p className="text-slate-500 mt-2 text-xs font-semibold">Bulk Apparel Platform</p>
        </div>

        <div className="card p-8 bg-white border-slate-200 shadow-sm">
          <h1 className="text-2xl font-black mb-6 text-center text-slate-900">Create Account</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Business / Your Name <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="text"
                placeholder="Ravi Printers"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Phone Number <span className="text-rose-600">*</span></label>
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
              <label className="label">Email <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Password <span className="text-rose-600">*</span></label>
              <input
                type="password"
                placeholder="Min. 6 characters"
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6 font-medium">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-600 hover:text-orange-700 font-bold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
