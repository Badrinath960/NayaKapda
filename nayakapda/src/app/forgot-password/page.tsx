'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OtpInputModal } from '@/components/auth/OtpInputModal';

type ResetStep = 'PHONE' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ResetStep>('PHONE');
  const [phone, setPhone] = useState('');
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP to Phone
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'RESET_PASSWORD' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to send OTP. Please check your phone number.');
        setLoading(false);
        return;
      }

      setStep('OTP');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP input
  const handleVerifyOtp = (otp: string) => {
    setError(null);
    setVerifiedOtp(otp);
    setStep('NEW_PASSWORD');
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError(null);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'RESET_PASSWORD' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch {
      setError('Network error resending OTP.');
    }
  };

  // Step 3: Set New Password & Submit
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otp: verifiedOtp,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to reset password. Please try again.');
        setLoading(false);
        return;
      }

      setStep('SUCCESS');
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 2000);
    } catch {
      setError('Network error resetting password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 text-slate-900 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="NayaKapda.com" className="h-20 sm:h-24 w-auto mx-auto object-contain" />
          </Link>
          <p className="text-slate-500 mt-2 text-xs font-semibold">Bulk Apparel Platform</p>
        </div>

        <div className="card p-8 bg-white border-slate-200 shadow-sm transition-all">
          {step === 'PHONE' && (
            <>
              <h1 className="text-2xl font-black mb-2 text-center text-slate-900">Reset Password</h1>
              <p className="text-xs text-slate-500 text-center mb-6">
                Enter your registered mobile number to receive a 6-digit verification code.
              </p>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="label">Registered Mobile Number <span className="text-rose-600">*</span></label>
                  <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 bg-white">
                    <span className="flex items-center px-3.5 bg-slate-100 border-r border-slate-200 text-slate-600 text-sm font-bold select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none bg-transparent"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 animate-fade-in-up">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || phone.length !== 10}
                  className="btn-primary w-full py-3 text-sm font-bold shadow-md disabled:opacity-50"
                >
                  {loading ? 'Sending Code...' : 'Send Verification Code →'}
                </button>
              </form>

              <p className="text-center text-xs text-slate-500 mt-6 font-medium">
                Remember your password?{' '}
                <Link href="/login" className="text-orange-600 hover:text-orange-700 font-bold">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {step === 'OTP' && (
            <OtpInputModal
              phone={phone}
              purpose="RESET_PASSWORD"
              title="Verify Reset Code"
              description={`Enter the 6-digit OTP sent via SMS to +91 ${phone} to reset your password.`}
              loading={loading}
              error={error}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onBack={() => {
                setStep('PHONE');
                setError(null);
              }}
            />
          )}

          {step === 'NEW_PASSWORD' && (
            <>
              <h1 className="text-2xl font-black mb-2 text-center text-slate-900">Set New Password</h1>
              <p className="text-xs text-slate-500 text-center mb-6">
                Create a strong password for your account.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="label">New Password <span className="text-rose-600">*</span></label>
                  <input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                    required
                    minLength={6}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label">Confirm New Password <span className="text-rose-600">*</span></label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-sm font-bold shadow-md"
                >
                  {loading ? 'Updating Password...' : 'Save New Password & Continue'}
                </button>
              </form>
            </>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>
              <h2 className="text-2xl font-black text-slate-900">Password Reset!</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
                Your password has been updated successfully. Redirecting you to sign in...
              </p>
              <Link href="/login" className="btn-primary inline-block px-6 py-2.5 text-xs font-bold shadow-md">
                Sign In Now →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
