/**
 * Email notification helpers for NayaKapda.
 * All functions are non-blocking — they log errors but never throw,
 * so a failed email never breaks the user-facing flow.
 */
import { resend } from '@/lib/resend';

const FROM_ADDRESS = 'NayaKapda Orders <orders@nayakapda.in>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nayakapda.vercel.app';

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
                <p style="margin:0; font-size:13px; color:#64748b">Order ID</p>
                <p style="margin:4px 0 0; font-size:18px; font-weight:bold; color:#0f172a">#${shortId}</p>
              </div>
              
              <table style="width:100%; border-collapse:collapse; margin-bottom:24px">
                <thead>
                  <tr>
                    <th style="text-align:left; padding:8px 0; font-size:12px; color:#64748b; border-bottom:2px solid #e2e8f0">Product</th>
                    <th style="text-align:center; padding:8px 0; font-size:12px; color:#64748b; border-bottom:2px solid #e2e8f0">Qty</th>
                    <th style="text-align:right; padding:8px 0; font-size:12px; color:#64748b; border-bottom:2px solid #e2e8f0">Amount</th>
                  </tr>
                </thead>
                <tbody>${itemRows}</tbody>
              </table>
              
              <div style="display:flex; justify-content:space-between; align-items:center; border-top:2px solid #0f172a; padding-top:16px">
                <span style="font-weight:bold; color:#0f172a">Total</span>
                <span style="font-size:20px; font-weight:bold; color:#f97316">₹${totalAmount.toLocaleString('en-IN')}</span>
              </div>
              
              <p style="margin:16px 0 0; font-size:13px; color:#64748b">
                Payment: <strong>${paymentMode === 'COD' ? 'Cash on Delivery' : paymentMode === 'PREPAID' ? 'Prepaid' : 'Credit Line'}</strong>
              </p>
              
              <div style="margin-top:32px; text-align:center">
                <a href="${APP_URL}/account/orders" 
                   style="background:#f97316; color:#fff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:14px">
                  Track Your Order →
                </a>
              </div>
            </div>
            <div style="padding:24px 32px; background:#f8fafc; text-align:center">
              <p style="margin:0; font-size:12px; color:#94a3b8">
                NayaKapda · Wholesale T-shirts · 
                <a href="${APP_URL}" style="color:#f97316; text-decoration:none">nayakapda.in</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (err) {
    console.error('[Resend] Order confirmation email failed:', err);
    // Non-blocking — never throw
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
