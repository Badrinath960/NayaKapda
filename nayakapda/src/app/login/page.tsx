'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { OtpInputModal } from '@/components/auth/OtpInputModal';
import { getOrCreateDeviceId, getDeviceName } from '@/lib/clientDevice';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const registered = searchParams.get('registered');

  const [form, setForm] = useState({ phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 2FA state for new/unrecognized devices
  const [showOtp, setShowOtp] = useState(false);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [phoneMasked, setPhoneMasked] = useState<string>('');
  const [serverOtp, setServerOtp] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const deviceHash = getOrCreateDeviceId();
    const deviceName = getDeviceName();

    try {
      // 1. Check credentials and device recognition status
      const checkRes = await fetch('/api/auth/login-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          password: form.password,
          deviceHash,
          deviceName,
        }),
      });

      const checkData = await checkRes.json();

      if (!checkRes.ok) {
        setError(checkData.message || 'Invalid phone number or password.');
        setLoading(false);
        return;
      }

      // 2. Recognized / Trusted Device — proceed directly to standard login
      if (checkData.status === 'TRUSTED') {
        const result = await signIn('credentials', {
          phone: form.phone,
          password: form.password,
          redirect: false,
        });

        setLoading(false);

        if (result?.error) {
          setError('Sign in failed. Please check your credentials.');
        } else {
          router.push(redirect);
          router.refresh();
        }
        return;
      }

      // 3. New / Unrecognized Device — trigger 2FA OTP verification
      if (checkData.status === 'NEW_DEVICE' && checkData.requiresOtp) {
        setChallengeToken(checkData.challengeToken);
        setPhoneMasked(checkData.phoneMasked || `+91 ${form.phone}`);
        if (checkData.debugOtp) {
          setServerOtp(checkData.debugOtp);
        }
        setShowOtp(true);
        setLoading(false);
      }
    } catch {
      setError('An error occurred during sign in. Please try again.');
      setLoading(false);
    }
  };

  // 2FA OTP verification on new device
  const handleVerify2faOtp = async (otp: string) => {
    if (!challengeToken) return;

    setError(null);
    setLoading(true);

    const deviceHash = getOrCreateDeviceId();
    const deviceName = getDeviceName();

    try {
      const res = await fetch('/api/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          otp,
          challengeToken,
          deviceHash,
          deviceName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Invalid or expired OTP.');
        setLoading(false);
        return;
      }

      // 2FA OTP verified! Complete NextAuth sign-in using verified token
      const result = await signIn('credentials', {
        phone: form.phone,
        password: '2fa-verified',
        verifiedToken: data.verifiedToken,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        setError('Authentication error completing login.');
      } else {
        router.push(redirect);
        router.refresh();
      }
    } catch {
      setError('Verification failed. Please try again.');
      setLoading(false);
    }
  };

  // Resend 2FA OTP
  const handleResend2faOtp = async () => {
    setError(null);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, purpose: 'LOGIN_2FA' }),
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 text-slate-900">
      <div className="w-full max-w-md">
        {/* Logo — Image logo only */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="NayaKapda.com" className="h-20 sm:h-24 w-auto mx-auto object-contain" />
          </Link>
          <p className="text-slate-500 mt-2 text-xs font-semibold">Bulk Apparel Platform</p>
        </div>

        <div className="card p-8 bg-white border-slate-200 shadow-sm transition-all">
          {registered && !showOtp && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 text-center animate-fade-in-up">
              ✓ Account created successfully! Please sign in.
            </div>
          )}

          {!showOtp ? (
            <>
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
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-slate-500 mt-6 font-medium">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-orange-600 hover:text-orange-700 font-bold">
                  Create one
                </Link>
              </p>
            </>
          ) : (
            <OtpInputModal
              phone={form.phone}
              purpose="LOGIN_2FA"
              title="New Device Verification"
              description={`New device detected. Enter the 6-digit OTP sent to ${phoneMasked} to verify and trust this device.`}
              demoOtp={serverOtp}
              loading={loading}
              error={error}
              onVerify={handleVerify2faOtp}
              onResend={handleResend2faOtp}
              onBack={() => {
                setShowOtp(false);
                setChallengeToken(null);
                setError(null);
              }}
            />
          )}
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
