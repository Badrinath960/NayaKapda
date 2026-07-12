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
    <Link href={`/products/${slug}`} className="group card-hover overflow-hidden flex flex-col">
      {/* Image */}
      <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
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
            <span className="text-xs text-gray-600 mt-2">{name}</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="badge-orange text-xs">{category.name}</span>
        </div>
        {gsm && (
          <div className="absolute top-3 left-3">
            <span className="badge-gray text-xs">{gsm} GSM</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-semibold leading-tight group-hover:text-orange-400 transition-colors">{name}</h3>
          {fabricComposition && <p className="text-xs text-gray-500 mt-1">{fabricComposition}</p>}
        </div>

        <div className="text-xs text-gray-600">
          {variantCount} variant{variantCount !== 1 ? 's' : ''} • Min. {category.qtyMultiple} pcs
        </div>

        <div className="flex items-end justify-between mt-auto pt-2 border-t border-gray-800">
          <div>
            <p className="text-xs text-gray-500">From</p>
            <p className="text-xl font-bold gradient-text">
              {formatINR(priceFrom)}
              <span className="text-sm text-gray-400 font-normal">/pc</span>
            </p>
          </div>
          <span className="btn-secondary py-2 px-3 text-xs group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all">
            Order Now →
          </span>
        </div>
      </div>
    </Link>
  );
}
