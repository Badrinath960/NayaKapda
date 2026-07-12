import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'FAQ — Frequently Asked Questions', description: 'Answers to common questions about bulk ordering, pricing, delivery, and more.' };

export default async function FAQPage() {
  const faqs = await prisma.fAQEntry.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="page-container py-16 max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-3 text-center">Frequently Asked Questions</h1>
          <p className="text-gray-500 text-center mb-12">Everything you need to know about ordering from NayaKapda.</p>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.id} className="card group">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="font-medium pr-4">{faq.question}</span>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">{faq.answer}</div>
              </details>
            ))}
          </div>

          <div className="mt-12 glass-orange p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Still have questions?</h2>
            <p className="text-gray-400 mb-6 text-sm">Our team typically responds within 2 hours on WhatsApp.</p>
            <a href="https://wa.me/919999999901" target="_blank" rel="noopener noreferrer" className="btn-primary">
              💬 Chat on WhatsApp
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
