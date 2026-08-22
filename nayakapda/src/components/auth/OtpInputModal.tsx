'use client';

import { useState, useEffect, useRef } from 'react';

interface OtpInputModalProps {
  phone: string;
  purpose: 'REGISTER' | 'LOGIN_2FA' | 'RESET_PASSWORD';
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  onVerify: (otp: string) => void;
  onResend: () => Promise<void>;
  onBack?: () => void;
}

export function OtpInputModal({
  phone,
  purpose,
  title = 'Verify Your Phone Number',
  description,
  loading = false,
  error = null,
  onVerify,
  onResend,
  onBack,
}: OtpInputModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState<number>(60);
  const [resending, setResending] = useState<boolean>(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    // Only accept numeric characters
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newDigits = [...digits];

    // If pasted multiple digits
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);

      const nextIndex = Math.min(pasted.length, 5);
      inputsRef.current[nextIndex]?.focus();

      if (pasted.length === 6) {
        onVerify(pasted.join(''));
      }
      return;
    }

    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-verify when 6 digits are complete
    if (cleanVal && index === 5) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        onVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 5);
    inputsRef.current[nextIndex]?.focus();

    if (pasted.length === 6) {
      onVerify(pasted);
    }
  };

  const handleResendClick = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await onResend();
      setCooldown(60);
      setDigits(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setResending(false);
    }
  };

  const isComplete = digits.join('').length === 6;

  const phoneMasked =
    phone.length === 10
      ? `+91 ${phone.slice(0, 2)}••••••${phone.slice(-2)}`
      : `+91 ${phone}`;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto mb-3 text-xl shadow-xs">
          💬
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">{title}</h2>
        <p className="text-slate-500 text-xs mt-1.5 font-medium max-w-sm mx-auto">
          {description || (
            <>
              Enter the 6-digit verification code sent via SMS to{' '}
              <strong className="text-slate-800 font-bold">{phoneMasked}</strong>
            </>
          )}
        </p>
      </div>

      {/* 6-Digit Inputs */}
      <div className="flex justify-center items-center gap-2 sm:gap-3 my-4">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            disabled={loading}
            className={`w-11 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-xl border transition-all outline-none ${
              digit
                ? 'border-orange-500 bg-orange-50/40 text-orange-700 ring-2 ring-orange-500/20'
                : 'border-slate-300 bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 text-center animate-fade-in-up">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onVerify(digits.join(''))}
          disabled={!isComplete || loading}
          className="btn-primary w-full py-3 text-sm font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Verifying Code...
            </span>
          ) : (
            'Verify & Continue'
          )}
        </button>

        {/* Resend & Back Row */}
        <div className="flex items-center justify-between text-xs px-1">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="text-slate-500 hover:text-slate-800 font-semibold transition-colors flex items-center gap-1"
            >
              ← Edit Phone Number
            </button>
          ) : (
            <div />
          )}

          <div>
            {cooldown > 0 ? (
              <span className="text-slate-400 font-medium">
                Resend OTP in <strong className="text-slate-700 font-bold">{cooldown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendClick}
                disabled={resending || loading}
                className="text-orange-600 hover:text-orange-700 font-bold transition-colors disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
