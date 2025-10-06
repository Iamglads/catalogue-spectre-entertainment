import { Plus, Minus, X } from 'lucide-react';

export type QuoteItem = { 
  id: string; 
  name: string; 
  quantity: number; 
  unitPrice?: number; 
  image?: string; 
  stockQty?: number 
};

type QuoteItemRowProps = {
  item: QuoteItem;
  onQuantityChange: (quantity: number) => void;
  onPriceChange: (price: number | undefined) => void;
  onRemove: () => void;
  parsePriceInput: (v: any) => number | undefined;
};

export default function QuoteItemRow({ 
  item, 
  onQuantityChange, 
  onPriceChange, 
  onRemove,
  parsePriceInput 
}: QuoteItemRowProps) {
  const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : undefined;
  const lineTotal = typeof unitPrice === 'number' ? unitPrice * item.quantity : undefined;

  const handleIncrement = () => {
    const current = item.quantity;
    const next = current + 1;
    const maxQty = typeof item.stockQty === 'number' ? item.stockQty : undefined;
    const clamped = typeof maxQty === 'number' ? Math.min(next, maxQty) : next;
    onQuantityChange(clamped);
  };

  const handleDecrement = () => {
    const next = Math.max(1, item.quantity - 1);
    onQuantityChange(next);
  };

  const handleQuantityInputChange = (val: number) => {
    const maxQty = typeof item.stockQty === 'number' ? item.stockQty : undefined;
    const clamped = typeof maxQty === 'number' ? Math.min(val, maxQty) : val;
    onQuantityChange(Math.max(1, clamped));
  };

  const canIncrease = typeof item.stockQty === 'number' ? item.quantity < item.stockQty : true;

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors space-y-4">
      <div className="flex items-start gap-4">
        {item.image && (
          <img
            src={item.image}
            alt={item.name}
            className="w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900">{item.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">ID: {item.id}</div>
        </div>

        <button 
          className="h-8 w-8 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer transition-colors flex items-center justify-center flex-shrink-0" 
          onClick={onRemove}
          title="Retirer cet article"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Prix unitaire</label>
          <div className="relative">
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 pl-2 pr-6 py-1.5 text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              value={typeof unitPrice === 'number' ? unitPrice.toFixed(2) : ''}
              onChange={(e) => {
                const parsed = parsePriceInput(e.target.value);
                onPriceChange(parsed);
              }}
              placeholder="0.00"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">$</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Quantité
            {typeof item.stockQty === 'number' && (
              <span className="ml-1 text-xs text-gray-500">(max: {item.stockQty})</span>
            )}
          </label>
          <div className="flex items-center gap-1">
            <button 
              className="h-8 w-8 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium cursor-pointer transition-colors" 
              onClick={handleDecrement}
            >
              <Minus className="h-3 w-3 mx-auto" />
            </button>
            <input 
              type="number" 
              min={1}
              max={item.stockQty}
              className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={item.quantity || 1} 
              onChange={(e) => handleQuantityInputChange(Number(e.target.value) || 1)}
            />
            <button 
              className="h-8 w-8 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={!canIncrease}
              onClick={handleIncrement}
            >
              <Plus className="h-3 w-3 mx-auto" />
            </button>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-xs font-medium text-gray-600 mb-1">Total ligne</div>
          <div className="text-base font-bold text-gray-900 tabular-nums">
            {Number.isFinite(lineTotal) ? `${lineTotal!.toFixed(2)} $` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

