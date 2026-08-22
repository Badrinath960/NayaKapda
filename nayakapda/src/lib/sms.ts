/**
 * SMS notification helpers for Indian mobile numbers.
 * Supports Fast2SMS and 2Factor with non-blocking fail-safe execution.
 */

export async function sendSmsOtp({
  phone,
  otp,
}: {
  phone: string;
  otp: string;
}): Promise<boolean> {
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  const twoFactorKey = process.env.TWOFACTOR_API_KEY;

  // 1. Try Fast2SMS if configured
  if (fast2smsKey) {
    try {
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&route=otp&variables_values=${otp}&numbers=${phone}`;
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();
      if (data.return) {
        console.log(`[SMS] Fast2SMS OTP sent to +91 ${phone}`);
        return true;
      }
      console.warn(`[SMS] Fast2SMS error:`, data.message);
    } catch (err) {
      console.error('[SMS] Fast2SMS dispatch failed:', err);
    }
  }

  // 2. Try 2Factor if configured
  if (twoFactorKey) {
    try {
      const url = `https://2factor.in/API/V1/${twoFactorKey}/SMS/${phone}/${otp}/NayaKapdaOTP`;
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();
      if (data.Status === 'Success') {
        console.log(`[SMS] 2Factor OTP sent to +91 ${phone}`);
        return true;
      }
      console.warn(`[SMS] 2Factor error:`, data.Details);
    } catch (err) {
      console.error('[SMS] 2Factor dispatch failed:', err);
    }
  }

  return false;
}
