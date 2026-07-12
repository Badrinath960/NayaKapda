import { prisma } from '@/lib/prisma';

type WhatsAppSendParams = {
  templateName: string;
  phone: string;
  params: Record<string, string>;
  userId?: string;
  eventType?: string;
};

/**
 * Sends a WhatsApp message using the WhatsApp Business API.
 * Non-blocking — failures are logged to NotificationLog, never propagated.
 *
 * Requirements: 21.1, 21.2, 21.3, 21.6
 */
export async function sendWhatsAppMessage({
  templateName,
  phone,
  params,
  userId,
  eventType,
}: WhatsAppSendParams): Promise<void> {
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiToken || !phoneNumberId) {
    console.warn('[WhatsApp] API token or phone number ID not configured — skipping send');
    return;
  }

  // Load template from DB if configured
  let templateText = params.body ?? '';
  try {
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { name: templateName },
    });
    if (template) {
      templateText = template.template;
      // Simple variable substitution: replace {{key}} with params[key]
      Object.entries(params).forEach(([key, val]) => {
        templateText = templateText.replace(new RegExp(`{{${key}}}`, 'g'), val);
      });
    }
  } catch {
    console.error(`[WhatsApp] Failed to load template "${templateName}"`);
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: `91${phone}`, // India country code
    type: 'text',
    text: { body: templateText },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message ?? 'WhatsApp API error');
    }

    // Log success
    await prisma.notificationLog.create({
      data: {
        event: eventType ?? templateName,
        userId,
        phone,
        payload: payload as any,
        success: true,
      },
    });
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    // Log failure — never propagate
    try {
      await prisma.notificationLog.create({
        data: {
          event: eventType ?? templateName,
          userId,
          phone,
          payload: payload as any,
          errorCode,
          success: false,
        },
      });
    } catch {
      console.error('[WhatsApp] Failed to write notification log');
    }
    console.error(`[WhatsApp] Delivery failed for ${phone}:`, errorCode);
  }
}

// ─────────────────────────────────────────
// Convenience senders
// ─────────────────────────────────────────

export async function sendOrderConfirmation(
  phone: string,
  userId: string,
  params: { orderId: string; items: string; total: string; paymentMode: string }
) {
  await sendWhatsAppMessage({
    templateName: 'order_confirmation',
    phone,
    userId,
    eventType: 'ORDER_CONFIRMATION',
    params: {
      body: `Your order #${params.orderId} has been placed successfully!\n\nItems: ${params.items}\nTotal: ₹${params.total}\nPayment: ${params.paymentMode}\n\nThank you for shopping with NayaKapda!`,
      ...params,
    },
  });
}

export async function sendDispatchAlert(
  phone: string,
  userId: string,
  params: { orderId: string; trackingNumber: string; courierName: string }
) {
  await sendWhatsAppMessage({
    templateName: 'dispatch_alert',
    phone,
    userId,
    eventType: 'ORDER_DISPATCHED',
    params: {
      body: `Your order #${params.orderId} has been dispatched!\n\nCourier: ${params.courierName}\nTracking: ${params.trackingNumber}`,
      ...params,
    },
  });
}

export async function sendRestockAlert(
  phone: string,
  userId: string,
  params: { productName: string; size: string; color: string }
) {
  await sendWhatsAppMessage({
    templateName: 'stock_alert',
    phone,
    userId,
    eventType: 'STOCK_ALERT',
    params: {
      body: `Good news! ${params.productName} (${params.size} / ${params.color}) is back in stock on NayaKapda. Order now before it runs out!`,
      ...params,
    },
  });
}

export async function sendWelcomeMessage(phone: string, userId: string, name?: string) {
  await sendWhatsAppMessage({
    templateName: 'welcome',
    phone,
    userId,
    eventType: 'WELCOME',
    params: {
      body: `Welcome to NayaKapda${name ? `, ${name}` : ''}! 🎉\n\nYour account has been created. Start browsing our bulk apparel collection at nayakapda.com`,
    },
  });
}
