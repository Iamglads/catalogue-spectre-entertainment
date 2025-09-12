"use client";
import React from "react";
import { Trash2 } from "lucide-react";

export type ProductLite = {
  _id: string;
  name: string;
  shortDescription?: string;
  images?: string[];
};

type Props = {
  product: ProductLite;
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onChange: (value: number) => void;
  onRemove: () => void;
};

export default function ListItemRow({ product, quantity, onDecrease, onIncrease, onChange, onRemove }: Props) {
  return (
    <div className="card p-4 flex items-center gap-4 hover-lift animate-fade-in">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.images?.[0] || ''} alt="" className="h-16 w-20 rounded-lg object-cover bg-gray-100 border" />
      <div className="flex-1 min-w-0">
        <div className="text-title truncate">{product.name}</div>
        {product.shortDescription && <div className="text-caption truncate mt-1">{product.shortDescription}</div>}
      </div>
      <div className="flex items-center gap-3">
        <button className="h-8 w-8 rounded-lg border hover:bg-gray-50 text-sm font-medium transition-colors" onClick={onDecrease} aria-label="Diminuer">−</button>
        <input
          className="w-16 rounded-lg border px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={quantity}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) && n > 0 ? n : 1);
          }}
        />
        <button className="h-8 w-8 rounded-lg border hover:bg-gray-50 text-sm font-medium transition-colors" onClick={onIncrease} aria-label="Augmenter">+</button>
        <button className="ml-2 inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-colors" onClick={onRemove} aria-label="Retirer">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}


