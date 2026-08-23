import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'FAQ — Frequently Asked Questions', description: 'Answers to common questions about bulk ordering, pricing, delivery, and more.' };

export default async function FAQPage() {
  const faqs = await prisma.fAQEntry.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-grow">
        <div className="page-container content-wrapper max-w-3xl mx-auto">
          <h1 className="text-4xl font-black mb-2 text-center text-slate-900">Frequently Asked Questions</h1>
          <p className="text-slate-600 text-sm text-center mb-10 font-medium">Everything you need to know about ordering from NayaKapda.</p>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.id} className="card group bg-white border-slate-200 shadow-sm">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none text-slate-900 font-bold text-sm">
                  <span className="pr-4">{faq.question}</span>
                  <svg className="w-5 h-5 text-slate-400 flex-shrink-0 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed font-medium border-t border-slate-100 pt-3">{faq.answer}</div>
              </details>
            ))}
          </div>

          <div className="mt-12 card p-8 text-center bg-gradient-to-r from-orange-50 via-white to-orange-50 border-orange-200 shadow-xs space-y-4">
            <h2 className="text-xl font-black text-slate-900">Still have questions?</h2>
            <p className="text-slate-600 text-xs font-medium">Our team is available on WhatsApp for quick responses.</p>
            <a
              href="https://wa.me/918735045268"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary py-2.5 px-6 text-xs font-bold shadow-xs inline-flex items-center gap-2"
            >
              <span>💬</span> Chat on WhatsApp (+91 87350 45268)
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
