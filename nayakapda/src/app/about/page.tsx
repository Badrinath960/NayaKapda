import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'About NayaKapda — Bulk Apparel for Printers & Resellers',
  description: 'Learn about NayaKapda — India\'s trusted bulk T-shirt and apparel platform for screen printers, DTF printers, and resellers.',
};

const stats = [
  { value: '500+', label: 'Products Sold / Month' },
  { value: '100+', label: 'Happy Customers' },
  { value: '5+', label: 'Years in Business' },
  { value: '29', label: 'States Served' },
];

const values = [
  {
    icon: '🎯',
    title: 'Quality First',
    desc: 'We source only premium GSM fabrics that hold prints perfectly and wash well, so your customers keep coming back.',
  },
  {
    icon: '💰',
    title: 'Bulk Pricing',
    desc: 'Our tiered pricing rewards volume. The more you order, the more you save — designed specifically for trade buyers.',
  },
  {
    icon: '⚡',
    title: 'Fast Dispatch',
    desc: 'Same-day dispatch for orders confirmed before 2 PM. Because your print shop can\'t afford delays.',
  },
  {
    icon: '🤝',
    title: 'Trade Focused',
    desc: 'We are not a B2C brand. We exist solely to serve printers, embroiderers, and resellers across India.',
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
        {/* Hero */}
        <div
          style={{
            background: 'linear-gradient(160deg, rgba(249,115,22,0.12) 0%, rgba(251,191,36,0.04) 40%, transparent 70%)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            padding: '5rem 0 4rem',
          }}
        >
          <div className="page-container" style={{ textAlign: 'center' }}>
            <span
              className="badge-orange"
              style={{ marginBottom: '1.5rem', display: 'inline-flex', padding: '0.375rem 1rem', borderRadius: '9999px', fontSize: '0.8rem' }}
            >
              Est. 2019 · Made in India 🇮🇳
            </span>
            <h1
              style={{
                fontSize: 'clamp(2.25rem, 6vw, 4rem)',
                fontWeight: 900,
                margin: '0 0 1.25rem',
                lineHeight: 1.1,
              }}
            >
              About{' '}
              <span className="gradient-text">NayaKapda</span>
            </h1>
            <p
              style={{
                color: '#9ca3af',
                fontSize: '1.125rem',
                maxWidth: 600,
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              India's dedicated bulk apparel platform built for screen printers, DTF printers, embroiderers, and resellers who need consistent quality at trade prices.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '3rem 0' }}>
          <div className="page-container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '2rem',
                textAlign: 'center',
              }}
            >
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p
                    className="gradient-text"
                    style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 0.25rem', lineHeight: 1 }}
                  >
                    {stat.value}
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Story */}
        <div className="section">
          <div className="page-container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '3rem',
                alignItems: 'center',
              }}
            >
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f9fafb', marginBottom: '1rem', lineHeight: 1.2 }}>
                  Our Story
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#9ca3af', lineHeight: 1.8 }}>
                  <p>
                    NayaKapda was born out of frustration. Our founders ran a screen printing shop and kept running into the same problem: sourcing quality blank T-shirts in bulk, at consistent quality, at fair prices — was a nightmare.
                  </p>
                  <p>
                    In 2019, we decided to solve this ourselves. We built direct relationships with fabric mills in Tiruppur and Surat, and created NayaKapda — a platform designed exclusively for trade buyers who need reliability above everything else.
                  </p>
                  <p>
                    Today, we supply blank apparel to over 100 printers and resellers across India, dispatching thousands of pieces every month with same-day processing and pan-India delivery.
                  </p>
                </div>
              </div>

              {/* Visual */}
              <div className="glass-orange" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👕</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    '100% ring-spun cotton options',
                    'GSM range: 160 to 240',
                    'Sizes XS to 5XL available',
                    'Minimum 10 pieces per SKU',
                    'Pantone-matched colors',
                  ].map((feature) => (
                    <div
                      key={feature}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#d1d5db',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ color: '#f97316', flexShrink: 0 }}>✓</span>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div style={{ background: 'rgba(17,24,39,0.5)', padding: '4rem 0' }}>
          <div className="page-container">
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#f9fafb',
                textAlign: 'center',
                marginBottom: '2.5rem',
              }}
            >
              Why Choose NayaKapda
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {values.map((val) => (
                <div
                  key={val.title}
                  className="card"
                  style={{ padding: '1.75rem', transition: 'border-color 0.2s, transform 0.2s' }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{val.icon}</div>
                  <h3 style={{ fontWeight: 700, color: '#f9fafb', margin: '0 0 0.5rem', fontSize: '1rem' }}>
                    {val.title}
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.7, margin: 0 }}>{val.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mission */}
        <div className="section">
          <div className="page-container" style={{ textAlign: 'center' }}>
            <div className="glass" style={{ padding: '3rem', maxWidth: 700, margin: '0 auto' }}>
              <p style={{ fontSize: '0.75rem', color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: 600 }}>
                Our Mission
              </p>
              <blockquote
                style={{
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.375rem)',
                  fontWeight: 700,
                  color: '#f9fafb',
                  lineHeight: 1.6,
                  margin: '0 0 1.5rem',
                  fontStyle: 'italic',
                }}
              >
                &quot;To make premium blank apparel accessible to every printer and reseller in India — without minimum order anxiety, without quality surprises.&quot;
              </blockquote>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/products" className="btn-primary">
                  Browse Products
                </a>
                <a href="/contact" className="btn-secondary">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
