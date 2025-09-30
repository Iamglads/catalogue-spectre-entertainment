"use client";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  itemName?: string;
  autoHideMs?: number;
};

export default function ListCTA({ open, onClose, itemName, autoHideMs = 6000 }: Props) {
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(onClose, autoHideMs);
    return () => clearTimeout(id);
  }, [open, autoHideMs, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="glass rounded-xl shadow-lg border px-4 py-3 flex items-center gap-3">
        <div className="text-sm">
          <span className="font-medium">Ajouté à votre liste</span>
          {itemName ? <span className="text-gray-600"> · {itemName}</span> : null}
        </div>
        <Link href="/liste" className="btn btn-primary whitespace-nowrap">
          Demander une soumission
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
        <button
          aria-label="Fermer"
          onClick={onClose}
          className="ml-1 rounded-full p-1 hover:bg-gray-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}



