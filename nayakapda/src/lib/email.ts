/**
 * Email notification helpers for NayaKapda.
 * All functions are non-blocking — they log errors but never throw,
 * so a failed email never breaks the user-facing flow.
 */
import { resend } from '@/lib/resend';

const FROM_ADDRESS = 'NayaKapda <onboarding@resend.dev>'; // Resend default test or custom domain
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nayakapda.vercel.app';

// ─── OTP Verification Email ──────────────────────────────────────────────────

export async function sendOtpEmail({
  to,
  otp,
  phone,
  purpose,
}: {
  to: string;
  otp: string;
  phone: string;
  purpose: 'REGISTER' | 'LOGIN_2FA' | 'RESET_PASSWORD';
}) {
  if (!to || !process.env.RESEND_API_KEY) return;

  const purposeText =
    purpose === 'REGISTER'
      ? 'Account Registration'
      : purpose === 'RESET_PASSWORD'
      ? 'Password Reset Request'
      : 'New Device Verification (2FA)';

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `🔐 Your NayaKapda OTP is ${otp}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background:#f8fafc; padding:40px 0; margin:0">
          <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1)">
            <div style="background:#f97316; padding:20px 28px">
              <h1 style="color:#fff; margin:0; font-size:20px">NayaKapda.com</h1>
              <p style="color:#fff; margin:4px 0 0; opacity:0.9; font-size:12px">B2B Bulk Apparel Platform</p>
            </div>
            <div style="padding:28px">
              <h2 style="color:#0f172a; margin:0 0 8px">${purposeText}</h2>
              <p style="color:#64748b; margin:0 0 20px; font-size:14px">
                Use the following 6-digit verification code for phone <strong>+91 ${phone}</strong>:
              </p>
              
              <div style="background:#fff7ed; border:2px dashed #f97316; border-radius:10px; padding:18px; text-align:center; margin-bottom:20px">
                <span style="font-size:32px; font-weight:900; letter-spacing:6px; color:#ea580c">${otp}</span>
              </div>

              <p style="color:#94a3b8; font-size:12px; margin:0">
                ⏱️ This code will expire in 10 minutes. If you did not request this code, please ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (err) {
    console.error('[Resend] OTP email dispatch failed:', err);
  }
}

// ─── Order Confirmation ────────────────────────────────────────────────────

export async function sendOrderConfirmationEmail({
  to,
  orderId,
  customerName,
  items,
  totalAmount,
  paymentMode,
}: {
  to: string;
  orderId: string;
  customerName: string;
  items: { name: string; qty: number; price: number }[];
  totalAmount: number;
  paymentMode: string;
}) {
  if (!to || !process.env.RESEND_API_KEY) return;

  const shortId = orderId.slice(-8).toUpperCase();
  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0; border-bottom:1px solid #f1f5f9">${item.name}</td>
          <td style="padding:8px 0; border-bottom:1px solid #f1f5f9; text-align:center">${item.qty}</td>
          <td style="padding:8px 0; border-bottom:1px solid #f1f5f9; text-align:right">₹${(item.price * item.qty).toLocaleString('en-IN')}</td>
        </tr>`
    )
    .join('');

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `✅ Order Confirmed #${shortId} — NayaKapda`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background:#f8fafc; padding:40px 0; margin:0">
          <div style="max-width:560px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1)">
            <div style="background:#f97316; padding:24px 32px">
              <h1 style="color:#fff; margin:0; font-size:22px">NayaKapda</h1>
              <p style="color:#fff; margin:4px 0 0; opacity:0.9; font-size:13px">Bulk T-shirt Wholesale</p>
            </div>
            <div style="padding:32px">
              <h2 style="color:#0f172a; margin:0 0 8px">Order Confirmed! 🎉</h2>
              <p style="color:#64748b; margin:0 0 24px">Hi ${customerName}, your order has been placed successfully.</p>
              
              <div style="background:#f8fafc; border-radius:8px; padding:16px; margin-bottom:24px">
                <table style="width:100%; font-size:14px; color:#334155; border-collapse:collapse">
                  <thead>
                    <tr style="color:#94a3b8; font-size:12px; text-transform:uppercase">
                      <th style="text-align:left; padding-bottom:8px">Item</th>
                      <th style="text-align:center; padding-bottom:8px">Qty</th>
                      <th style="text-align:right; padding-bottom:8px">Total</th>
                    </tr>
                  </thead>
                  <tbody>${itemRows}</tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" style="padding-top:12px; font-weight:bold">Total</td>
                      <td style="padding-top:12px; font-weight:bold; text-align:right; color:#ea580c">₹${totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="font-size:12px; color:#94a3b8">Payment Mode</td>
                      <td style="font-size:12px; color:#94a3b8; text-align:right">${paymentMode}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <a href="${APP_URL}/account/orders" style="display:inline-block; background:#f97316; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:14px">View Your Orders →</a>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (err) {
    console.error('[Resend] Order confirmation email failed:', err);
  }
}

// ─── Order Dispatched ─────────────────────────────────────────────────────

export async function sendOrderDispatchedEmail({
  to,
  customerName,
  orderId,
  courierName,
  trackingNumber,
}: {
  to: string;
  customerName: string;
  orderId: string;
  courierName?: string;
  trackingNumber?: string;
}) {
  if (!to || !process.env.RESEND_API_KEY) return;

  const shortId = orderId.slice(-8).toUpperCase();

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `🚚 Order #${shortId} Dispatched — NayaKapda`,
      html: `
        <div style="font-family:Arial,sans-serif; max-width:560px; margin:0 auto; padding:32px">
          <h2 style="color:#0f172a">Your order has been dispatched!</h2>
          <p>Hi ${customerName}, order <strong>#${shortId}</strong> is on its way.</p>
          ${courierName ? `<p>Courier: <strong>${courierName}</strong></p>` : ''}
          ${trackingNumber ? `<p>Tracking #: <strong>${trackingNumber}</strong></p>` : ''}
          <p><a href="${APP_URL}/account/orders" style="color:#f97316">View Order Details →</a></p>
          <p style="font-size:12px; color:#94a3b8">— Team NayaKapda</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[Resend] Dispatch email failed:', err);
  }
}
