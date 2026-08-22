/**
 * SMS notification helpers for Indian mobile numbers.
 * Supports 2Factor.in and Fast2SMS with non-blocking fail-safe execution.
 */

export async function sendSmsOtp({
  phone,
  otp,
}: {
  phone: string;
  otp: string;
}): Promise<boolean> {
  const twoFactorKey = process.env.TWOFACTOR_API_KEY;
  const fast2smsKey = process.env.FAST2SMS_API_KEY;

  // 1. Primary: 2Factor.in (Specialized Indian OTP Gateway)
  if (twoFactorKey) {
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      // Explicitly specify OTP1 (2Factor's standard transactional SMS template)
      const url = `https://2factor.in/API/V1/${twoFactorKey}/SMS/${cleanPhone}/${otp}/OTP1`;
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();
      if (data.Status === 'Success') {
        console.log(`[SMS] 2Factor OTP sent successfully to +91 ${cleanPhone}`);
        return true;
      }
      console.warn(`[SMS] 2Factor dispatch warning:`, data.Details || data);
    } catch (err) {
      console.error('[SMS] 2Factor dispatch failed:', err);
    }
  }

  // 2. Fallback: Fast2SMS if configured
  if (fast2smsKey) {
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&route=otp&variables_values=${otp}&numbers=${cleanPhone}`;
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();
      if (data.return) {
        console.log(`[SMS] Fast2SMS OTP sent to +91 ${cleanPhone}`);
        return true;
      }
      console.warn(`[SMS] Fast2SMS error:`, data.message);
    } catch (err) {
      console.error('[SMS] Fast2SMS dispatch failed:', err);
    }
  }

  return false;
}
