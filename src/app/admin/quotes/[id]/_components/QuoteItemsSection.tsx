import { useState, useEffect } from 'react';
import { Package, Search, Plus } from 'lucide-react';
import QuoteItemRow, { QuoteItem } from './QuoteItemRow';

type ProductSearchResult = {
  _id: string;
  name: string;
  images?: string[];
  regularPrice?: number;
  salePrice?: number;
};

type QuoteItemsSectionProps = {
  items: QuoteItem[];
  onItemUpdate: (index: number, field: 'quantity' | 'unitPrice', value: any) => void;
  onItemRemove: (index: number) => void;
  onItemAdd: (product: ProductSearchResult) => void;
  parsePriceInput: (v: any) => number | undefined;
};

export default function QuoteItemsSection({ 
  items, 
  onItemUpdate, 
  onItemRemove, 
  onItemAdd,
  parsePriceInput 
}: QuoteItemsSectionProps) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const id = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(search)}&pageSize=10`);
        if (res.ok) {
          const j = await res.json();
          setSearchResults(j.items || []);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const handleAddProduct = (product: ProductSearchResult) => {
    onItemAdd(product);
    setSearch('');
    setSearchResults([]);
  };

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">
        Articles
      </h2>

      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="input w-full pl-10"
              placeholder="Rechercher un produit à ajouter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {searchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {searchResults.map((p) => {
                const price = typeof p.salePrice === 'number' ? p.salePrice : (typeof p.regularPrice === 'number' ? p.regularPrice : undefined);
                return (
                  <button
                    key={p._id}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3 cursor-pointer"
                    onClick={() => handleAddProduct(p)}
                  >
                    {p.images?.[0] && (
                      <img src={p.images[0]} alt="" className="w-12 h-12 object-cover rounded border border-gray-200" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{p.name}</div>
                      {typeof price === 'number' && (
                        <div className="text-sm text-gray-500 font-mono">{price.toFixed(2)} $</div>
                      )}
                    </div>
                    <Plus className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Items list */}
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              Aucun article. Recherchez et ajoutez des produits ci-dessus.
            </div>
          )}
          {items.map((item, idx) => (
            <QuoteItemRow
              key={`${item.id}-${idx}`}
              item={item}
              onQuantityChange={(quantity) => onItemUpdate(idx, 'quantity', quantity)}
              onPriceChange={(price) => onItemUpdate(idx, 'unitPrice', price)}
              onRemove={() => onItemRemove(idx)}
              parsePriceInput={parsePriceInput}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

