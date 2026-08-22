/**
 * SMS notification helpers for Indian mobile numbers.
 * Supports Fast2SMS (Smart OTP & Bulk V2) and 2Factor with non-blocking fail-safe execution.
 */

export async function sendSmsOtp({
  phone,
  otp,
}: {
  phone: string;
  otp: string;
}): Promise<boolean> {
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  const fast2smsOtpId = process.env.FAST2SMS_OTP_ID;
  const twoFactorKey = process.env.TWOFACTOR_API_KEY;

  // 1. Try Fast2SMS Smart OTP API (New endpoint)
  if (fast2smsKey && fast2smsOtpId) {
    try {
      const res = await fetch('https://www.fast2sms.com/dev/otp/send', {
        method: 'POST',
        headers: {
          authorization: fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp_id: fast2smsOtpId,
          mobile: phone,
          variables_values: otp,
        }),
      });
      const data = await res.json();
      if (data.return === true || data.status_code === 200) {
        console.log(`[SMS] Fast2SMS Smart OTP sent to +91 ${phone}`);
        return true;
      }
      console.warn(`[SMS] Fast2SMS Smart OTP response:`, data.message || data);
    } catch (err) {
      console.error('[SMS] Fast2SMS Smart OTP dispatch failed:', err);
    }
  }

  // 2. Try Fast2SMS Bulk V2 OTP Route (Classic endpoint)
  if (fast2smsKey) {
    try {
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&route=otp&variables_values=${otp}&numbers=${phone}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'cache-control': 'no-cache' },
      });
      const data = await res.json();
      if (data.return === true || data.status_code === 200) {
        console.log(`[SMS] Fast2SMS Bulk V2 OTP sent to +91 ${phone}`);
        return true;
      }
      console.warn(`[SMS] Fast2SMS Bulk V2 response status ${data.status_code}:`, data.message);
    } catch (err) {
      console.error('[SMS] Fast2SMS Bulk V2 dispatch failed:', err);
    }
  }

  // 3. Try 2Factor if configured
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
