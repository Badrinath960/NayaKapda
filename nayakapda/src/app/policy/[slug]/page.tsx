import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { formatDate } from '@/lib/utils';

const policyContent: Record<string, { title: string; content: string; updatedAt: string }> = {
  privacy: {
    title: 'Privacy Policy',
    updatedAt: '2024-01-01',
    content: `
## 1. Information We Collect
We collect information you provide directly to us, such as when you create an account, place an order, or contact us for support.

**Personal Information:**
- Name, phone number, and email address
- Delivery address details (state, city, pincode)
- Order and transaction history
- Payment confirmation details (we do not store card details)

**Automatically Collected:**
- IP address and browser type
- Pages visited and time spent
- Referral source

## 2. How We Use Your Information
We use the information we collect to:
- Process and fulfill your orders
- Send order confirmations and shipping updates via WhatsApp/SMS
- Respond to your queries and provide customer support
- Improve our platform and product offerings
- Send promotional communications (with your consent)
- Prevent fraud and ensure platform security

## 3. Information Sharing
We do not sell or rent your personal information to third parties. We may share your information with:
- **Courier partners** (name, address, phone for delivery)
- **Payment processors** (Razorpay) for secure payment handling
- **Legal authorities** when required by law

## 4. Data Security
We implement industry-standard security measures including:
- SSL/TLS encryption for all data transmission
- Encrypted storage of passwords (bcrypt)
- Regular security audits

## 5. Cookies
We use cookies to maintain your session, remember your cart, and improve your experience. You may disable cookies in your browser, though this may affect functionality.

## 6. Your Rights
You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your account and data
- Opt out of marketing communications

To exercise these rights, contact us at support@nayakapda.com.

## 7. Contact Us
For privacy-related concerns, email us at **support@nayakapda.com** or WhatsApp us at **+91 9999999901**.
    `.trim(),
  },
  shipping: {
    title: 'Shipping Policy',
    updatedAt: '2024-01-01',
    content: `
## Shipping Overview
NayaKapda ships bulk orders across all 29 states and Union Territories of India. We work with trusted courier partners to ensure timely and safe delivery of your apparel.

## Dispatch Timeline
- **Orders confirmed before 2:00 PM IST**: Same-day dispatch (Monday–Saturday)
- **Orders confirmed after 2:00 PM IST**: Next business day dispatch
- **Sundays and Public Holidays**: No dispatch; orders queued for next business day

## Delivery Timeframes
| Zone | Estimated Delivery |
|------|-------------------|
| Mumbai (local) | 1–2 business days |
| Maharashtra | 2–3 business days |
| Major metros | 3–4 business days |
| Rest of India | 4–7 business days |
| Remote areas | 7–10 business days |

## Shipping Charges
Shipping charges are calculated at checkout based on:
- Your delivery pincode
- Total number of pieces ordered

Use our **Shipping Calculator** to get an estimate before placing your order.

## Free Shipping
Free shipping may be offered on selected products or during promotional periods. Check the product page for current offers.

## Tracking
Once your order is dispatched, you will receive a tracking number via WhatsApp/SMS. You can track your shipment on the courier's website.

## Damaged or Lost Shipments
If your order arrives damaged or is lost in transit, please contact us within **48 hours of delivery** with photos. We will arrange a replacement or refund as applicable.

## Contact
For shipping queries: WhatsApp **+91 9999999901** or email **support@nayakapda.com**
    `.trim(),
  },
  returns: {
    title: 'Returns & Refunds Policy',
    updatedAt: '2024-01-01',
    content: `
## Returns Policy
We accept returns for genuine quality issues. As a bulk apparel business, we understand that consistency matters for your printing business.

## Eligible Returns
We accept returns for:
- **Manufacturing defects** (holes, stitching errors, fabric irregularities)
- **Wrong items shipped** (incorrect size, color, or product)
- **Quantity short-shipment** (fewer pieces than ordered)

## Non-Eligible Returns
We do not accept returns for:
- Change of mind
- Incorrect size ordered
- Items already printed/processed
- Orders older than 7 days from delivery

## Return Process
1. **Contact us within 7 days** of delivery via WhatsApp or email
2. Provide your **Order ID** and **photo/video evidence** of the defect
3. Our team will review within 24–48 business hours
4. If approved, we will provide a **return shipping label** or arrange pickup
5. Replacement dispatched or refund processed within 5–7 business days after receiving the return

## Refunds
- Refunds are processed to the **original payment method**
- COD orders: Refund via bank transfer (NEFT/UPI) — please share bank details
- Processing time: 5–7 business days after approval

## Contact for Returns
WhatsApp: **+91 9999999901**
Email: **support@nayakapda.com**
    `.trim(),
  },
  terms: {
    title: 'Terms of Service',
    updatedAt: '2024-01-01',
    content: `
## 1. Acceptance of Terms
By accessing or using NayaKapda (nayakapda.com), you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.

## 2. Eligibility
NayaKapda is a **B2B (business-to-business) platform** intended for:
- Screen printers and DTF printers
- Embroidery businesses
- Wholesale resellers and distributors
- T-shirt and apparel retailers

You must be at least 18 years of age and represent a legitimate business to use our platform.

## 3. Account Registration
- You are responsible for maintaining the confidentiality of your login credentials
- You must provide accurate and complete information during registration
- Notify us immediately of any unauthorized account access

## 4. Orders and Pricing
- All prices are in Indian Rupees (INR) inclusive of applicable taxes
- Prices may change without notice; the price at time of order confirmation is final
- Minimum order quantities apply as specified per product
- We reserve the right to cancel orders in case of stock unavailability or pricing errors

## 5. Payment
- We accept prepaid payment via Razorpay (credit/debit cards, UPI, net banking)
- Cash on Delivery (COD) is available for eligible orders
- Credit Line facility is available for approved customers

## 6. Intellectual Property
All content on NayaKapda — including logos, product descriptions, and pricing data — is proprietary to NayaKapda. You may not reproduce or distribute our content without written permission.

## 7. Limitation of Liability
NayaKapda shall not be liable for indirect, incidental, or consequential damages arising from use of our platform. Our maximum liability is limited to the value of the disputed order.

## 8. Governing Law
These terms are governed by the laws of **Maharashtra, India**. Disputes shall be subject to the exclusive jurisdiction of courts in **Mumbai, Maharashtra**.

## 9. Changes to Terms
We may update these terms at any time. Continued use of the platform constitutes acceptance of updated terms.

## 10. Contact
For questions about these terms: **support@nayakapda.com**
    `.trim(),
  },
  disclaimer: {
    title: 'Disclaimer',
    updatedAt: '2024-01-01',
    content: `
## General Disclaimer
The information provided on NayaKapda (nayakapda.com) is for general informational purposes only. While we strive to keep information accurate and up to date, we make no warranties of any kind, express or implied, about the completeness or accuracy of the information.

## Product Information
- Product colors displayed on screen may vary from actual products due to monitor calibration differences
- GSM and fabric specifications are provided by our suppliers and may have minor manufacturing tolerances
- Size charts are indicative; actual measurements may vary by ±0.5 cm

## Pricing
- Prices are subject to change without prior notice
- Promotional pricing is valid only for the specified period
- Bulk pricing tiers are automatically applied at checkout based on total quantity

## Stock Availability
- Stock levels shown on the platform are updated in real-time but may not reflect the exact real-world inventory
- Orders are confirmed on a first-come, first-served basis
- In case of stock unavailability after order placement, we will offer an alternative or full refund

## External Links
Our platform may contain links to third-party websites. We are not responsible for the content or privacy practices of those websites.

## No Warranty
The platform and its content are provided "as is" without warranty of any kind. NayaKapda disclaims all warranties to the fullest extent permitted by applicable law.

## Contact
For any queries or concerns, contact us at **support@nayakapda.com**
    `.trim(),
  },
};

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const policy = policyContent[params.slug];
  if (!policy) return {};
  return {
    title: `${policy.title} — NayaKapda`,
    description: `Read NayaKapda's ${policy.title}.`,
  };
}

export default function PolicyPage({ params }: { params: { slug: string } }) {
  const policy = policyContent[params.slug];
  if (!policy) notFound();

  // Simple markdown-like rendering: split on ## and ### headers, ** bold, and newlines
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return (
          <h2
            key={i}
            style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f9fafb', marginTop: '2rem', marginBottom: '0.75rem' }}
          >
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3
            key={i}
            style={{ fontSize: '1rem', fontWeight: 600, color: '#e5e7eb', marginTop: '1.25rem', marginBottom: '0.5rem' }}
          >
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('| ')) {
        return (
          <div key={i} style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#d1d5db', padding: '0.25rem 0' }}>
            {line}
          </div>
        );
      }
      if (line.startsWith('- ')) {
        const text = line.replace('- ', '');
        return (
          <li key={i} style={{ color: '#9ca3af', marginBottom: '0.375rem', lineHeight: 1.7 }}>
            <span dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#d1d5db">$1</strong>') }} />
          </li>
        );
      }
      if (line === '') return <br key={i} />;
      return (
        <p key={i} style={{ color: '#9ca3af', lineHeight: 1.8, marginBottom: '0.25rem' }}>
          <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#d1d5db">$1</strong>') }} />
        </p>
      );
    });
  };

  const slugToLinks = Object.keys(policyContent).map((s) => ({
    slug: s,
    title: policyContent[s].title,
  }));

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.06) 0%, transparent 50%)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            padding: '3.5rem 0 2.5rem',
          }}
        >
          <div className="page-container">
            <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#f9fafb', margin: '0 0 0.5rem' }}>
              {policy.title}
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
              Last updated: {formatDate(policy.updatedAt)}
            </p>
          </div>
        </div>

        <div className="page-container" style={{ paddingTop: '3rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '3rem', alignItems: 'flex-start' }}>
            {/* Sidebar nav */}
            <aside
              className="glass"
              style={{ padding: '1rem', position: 'sticky', top: '5rem' }}
            >
              <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', margin: '0 0 0.75rem', padding: '0 0.5rem', fontWeight: 600 }}>
                Legal Pages
              </p>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                {slugToLinks.map((l) => (
                  <a
                    key={l.slug}
                    href={`/policy/${l.slug}`}
                    style={{
                      display: 'block',
                      padding: '0.5rem 0.625rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      color: l.slug === params.slug ? '#f97316' : '#9ca3af',
                      background: l.slug === params.slug ? 'rgba(249,115,22,0.08)' : 'transparent',
                      textDecoration: 'none',
                      fontWeight: l.slug === params.slug ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {l.title}
                  </a>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <article className="card" style={{ padding: '2rem' }}>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem' }}>
                {renderContent(policy.content)}
              </ul>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
