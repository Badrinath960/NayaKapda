'use client';

import { useState } from 'react';

type Photo = {
  id: string;
  url: string;
  altText?: string | null;
  sortOrder?: number;
};

type Props = {
  photos: Photo[];
  productName: string;
  categoryName?: string;
  gsm?: number | null;
};

export function ProductGallery({ photos, productName, categoryName, gsm }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activePhoto = photos[selectedIndex] || photos[0];

  return (
    <div className="space-y-4">
      {/* Main Image Stage */}
      <div className="aspect-square bg-white card border border-slate-200 shadow-sm p-4 sm:p-6 flex items-center justify-center relative overflow-hidden group rounded-2xl">
        {activePhoto ? (
          <img
            src={activePhoto.url}
            alt={activePhoto.altText || productName}
            className="max-w-full max-h-full w-auto h-auto object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-center p-8">
            <span className="text-6xl mb-3 block">👕</span>
            <p className="text-sm font-bold text-slate-700">{productName}</p>
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end pointer-events-none">
          {categoryName && (
            <span className="badge-orange text-xs font-bold shadow-xs">{categoryName}</span>
          )}
          {gsm && (
            <span className="badge-gray text-xs font-bold shadow-xs">{gsm} GSM</span>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 sm:gap-3">
          {photos.map((p, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={p.id || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`aspect-square rounded-xl bg-white border p-1.5 flex items-center justify-center overflow-hidden transition-all cursor-pointer ${
                  isSelected
                    ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-orange-300 opacity-70 hover:opacity-100'
                }`}
                title={p.altText || `${productName} photo ${idx + 1}`}
              >
                <img
                  src={p.url}
                  alt={p.altText || `${productName} thumbnail`}
                  className="max-w-full max-h-full object-contain"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
