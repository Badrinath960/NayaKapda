'use client';

import Link from 'next/link';
import { formatINR } from '@/lib/utils';

type Props = {
  id: string;
  name: string;
  slug: string;
  gsm: number | null;
  fabricComposition: string | null;
  basePrice: number;
  priceFrom: number;
  category: { name: string; slug: string; qtyMultiple: number };
  photo: { url: string; altText: string | null } | null;
  variantCount: number;
};

export function ProductCard({ name, slug, gsm, fabricComposition, priceFrom, category, photo, variantCount }: Props) {
  return (
    <Link href={`/products/${slug}`} className="group card-hover overflow-hidden flex flex-col bg-white">
      {/* Image */}
      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden border-b border-slate-100">
        {photo ? (
          <img
            src={photo.url}
            alt={photo.altText ?? name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <span className="text-5xl">
              {category.slug === 'tshirts' ? '👕' : category.slug === 'hoodies' ? '🧥' : '👔'}
            </span>
            <span className="text-xs text-slate-500 font-medium mt-2">{name}</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="badge-orange text-xs font-semibold">{category.name}</span>
        </div>
        {gsm && (
          <div className="absolute top-3 left-3">
            <span className="badge-gray text-xs font-semibold">{gsm} GSM</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-2.5 flex-1">
        <div>
          <h3 className="font-bold text-base text-slate-900 leading-tight group-hover:text-orange-600 transition-colors">{name}</h3>
          {fabricComposition && <p className="text-xs text-slate-500 mt-1 font-medium">{fabricComposition}</p>}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {variantCount} variant{variantCount !== 1 ? 's' : ''} • Min. {category.qtyMultiple} pcs
        </div>

        <div className="flex items-end justify-between mt-auto pt-3 border-t border-slate-100">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">From</p>
            <p className="text-lg font-black text-orange-600">
              {formatINR(priceFrom)}
              <span className="text-xs text-slate-500 font-normal">/pc</span>
            </p>
          </div>
          <span className="btn-secondary py-2 px-3 text-xs font-semibold group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all">
            Order Now →
          </span>
        </div>
      </div>
    </Link>
  );
}
