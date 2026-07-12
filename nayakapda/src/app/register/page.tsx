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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black gradient-text">NayaKapda</Link>
          <p className="text-gray-500 mt-2 text-sm">Bulk Apparel Platform</p>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Business / Your Name <span className="text-gray-600">(optional)</span></label>
              <input
                type="text"
                placeholder="Ravi Printers"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Phone Number <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                  className="input pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Email <span className="text-gray-600">(optional)</span></label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Password <span className="text-red-400">*</span></label>
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
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
