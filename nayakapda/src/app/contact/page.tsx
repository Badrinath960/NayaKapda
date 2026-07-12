import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'Contact Us — NayaKapda',
  description: 'Get in touch with NayaKapda. WhatsApp, phone, or email — we\'re here to help with your bulk apparel orders.',
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
        {/* Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, transparent 60%)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            padding: '5rem 0 4rem',
            textAlign: 'center',
          }}
        >
          <div className="page-container">
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, margin: '0 0 1rem' }}>
              Get in{' '}
              <span className="gradient-text">Touch</span>
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '1.125rem', maxWidth: 500, margin: '0 auto' }}>
              Have questions about bulk orders, pricing, or shipping? We&apos;re happy to help.
            </p>
          </div>
        </div>

        <div className="page-container" style={{ paddingTop: '4rem' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {/* WhatsApp - Primary CTA */}
            <div
              className="glass-orange"
              style={{
                padding: '2.5rem',
                marginBottom: '2rem',
                textAlign: 'center',
                animation: 'fadeInUp 0.4s ease both',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f9fafb', marginBottom: '0.5rem' }}>
                Chat on WhatsApp
              </h2>
              <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
                The fastest way to reach us. Get answers about products, pricing, and orders instantly.
              </p>
              <a
                href="https://wa.me/919999999901"
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ fontSize: '1rem', padding: '0.875rem 2rem', background: '#25d366', borderRadius: '0.75rem' }}
              >
                <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Chat on WhatsApp — +91 99999 99901
              </a>
            </div>

            {/* Contact cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {/* Phone */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '0.75rem',
                    background: 'rgba(249,115,22,0.1)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    fontSize: '1.25rem',
                  }}
                >
                  📞
                </div>
                <p style={{ fontWeight: 600, color: '#f9fafb', margin: '0 0 0.25rem' }}>Phone</p>
                <a
                  href="tel:+919999999901"
                  style={{ color: '#f97316', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}
                >
                  +91 9999 999 901
                </a>
              </div>

              {/* Email */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '0.75rem',
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    fontSize: '1.25rem',
                  }}
                >
                  ✉️
                </div>
                <p style={{ fontWeight: 600, color: '#f9fafb', margin: '0 0 0.25rem' }}>Email</p>
                <a
                  href="mailto:support@nayakapda.com"
                  style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                  support@nayakapda.com
                </a>
              </div>

              {/* Business Hours */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '0.75rem',
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    fontSize: '1.25rem',
                  }}
                >
                  🕐
                </div>
                <p style={{ fontWeight: 600, color: '#f9fafb', margin: '0 0 0.25rem' }}>Business Hours</p>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>Mon–Sat, 9 AM – 6 PM IST</p>
              </div>

              {/* Address */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '0.75rem',
                    background: 'rgba(249,115,22,0.1)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    fontSize: '1.25rem',
                  }}
                >
                  📍
                </div>
                <p style={{ fontWeight: 600, color: '#f9fafb', margin: '0 0 0.25rem' }}>Location</p>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>Mumbai, Maharashtra, India</p>
              </div>
            </div>

            {/* FAQ CTA */}
            <div
              className="glass"
              style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}
            >
              <div>
                <p style={{ fontWeight: 600, color: '#f9fafb', margin: '0 0 0.25rem' }}>Have general questions?</p>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>Check our FAQ for quick answers.</p>
              </div>
              <a href="/faq" className="btn-secondary" style={{ flexShrink: 0 }}>
                Browse FAQ →
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
