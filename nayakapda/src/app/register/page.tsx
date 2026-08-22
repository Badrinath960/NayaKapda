'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OtpInputModal } from '@/components/auth/OtpInputModal';
import { getOrCreateDeviceId, getDeviceName } from '@/lib/clientDevice';

type RegisterStep = 'DETAILS' | 'OTP';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<RegisterStep>('DETAILS');
  const [form, setForm] = useState({ phone: '', password: '', name: '', email: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverOtp, setServerOtp] = useState<string | undefined>();

  // Step 1: Submit details and initiate OTP
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          purpose: 'REGISTER',
          email: form.email?.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to send OTP. Please try again.');
        setLoading(false);
        return;
      }

      if (data.debugOtp) {
        setServerOtp(data.debugOtp);
      }

      // Transition to OTP verification step
      setStep('OTP');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and complete account creation
  const handleVerifyOtp = async (otp: string) => {
    setError(null);
    setLoading(true);

    const deviceHash = getOrCreateDeviceId();
    const deviceName = getDeviceName();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          otp,
          deviceHash,
          deviceName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msgs = data.errors?.fieldErrors;
        const first = msgs ? Object.values(msgs).flat()[0] : data.message || data.error || 'Registration failed';
        setError(first as string);
        setLoading(false);
        return;
      }

      // Auto-login upon successful verification
      const loginResult = await signIn('credentials', {
        phone: form.phone,
        password: form.password,
        redirect: false,
      });

      if (loginResult?.error) {
        // Fallback: redirect to login if auto-signin fails
        router.push('/login?registered=true');
      } else {
        router.push('/products');
        router.refresh();
      }
    } catch {
      setError('Registration failed. Please try again.');
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError(null);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          purpose: 'REGISTER',
          email: form.email?.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to resend OTP');
      } else if (data.debugOtp) {
        setServerOtp(data.debugOtp);
      }
    } catch {
      setError('Network error resending OTP.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 text-slate-900 py-10">
      <div className="w-full max-w-md">
        {/* Logo — Image logo only */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="NayaKapda.com" className="h-20 sm:h-24 w-auto mx-auto object-contain" />
          </Link>
          <p className="text-slate-500 mt-2 text-xs font-semibold">Bulk Apparel Platform</p>
        </div>

        <div className="card p-8 bg-white border-slate-200 shadow-sm transition-all">
          {step === 'DETAILS' ? (
            <>
              <h1 className="text-2xl font-black mb-6 text-center text-slate-900">Create Account</h1>

              <form onSubmit={handleDetailsSubmit} className="space-y-4">
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
                  <label className="label">Mobile Number <span className="text-rose-600">*</span></label>
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
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">We will send a 6-digit OTP to verify this number.</p>
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
                  <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 animate-fade-in-up">
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
                      Sending OTP...
                    </span>
                  ) : (
                    'Verify Mobile & Register →'
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-slate-500 mt-6 font-medium">
                Already have an account?{' '}
                <Link href="/login" className="text-orange-600 hover:text-orange-700 font-bold">Sign in</Link>
              </p>
            </>
          ) : (
            <OtpInputModal
              phone={form.phone}
              purpose="REGISTER"
              title="Verify Mobile Number"
              description={`Enter the 6-digit OTP sent to +91 ${form.phone} to complete registration.`}
              demoOtp={serverOtp}
              loading={loading}
              error={error}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onBack={() => {
                setStep('DETAILS');
                setError(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
