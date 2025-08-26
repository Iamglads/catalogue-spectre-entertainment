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
    <div className="flex items-center gap-3 rounded-md border bg-white p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.images?.[0] || ''} alt="" className="h-14 w-18 rounded object-cover bg-gray-100" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{product.name}</div>
        {product.shortDescription && <div className="text-xs text-gray-500 truncate">{product.shortDescription}</div>}
      </div>
      <div className="flex items-center gap-2">
        <button className="h-7 w-7 rounded border text-sm" onClick={onDecrease} aria-label="Diminuer">−</button>
        <input
          className="w-14 rounded border px-2 py-1 text-sm text-center"
          value={quantity}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) && n > 0 ? n : 1);
          }}
        />
        <button className="h-7 w-7 rounded border text-sm" onClick={onIncrease} aria-label="Augmenter">+</button>
        <button className="ml-3 inline-flex items-center gap-1 text-xs text-red-600 hover:underline" onClick={onRemove} aria-label="Retirer">
          <Trash2 className="h-3.5 w-3.5" />
      
        </button>
      </div>
    </div>
  );
}


