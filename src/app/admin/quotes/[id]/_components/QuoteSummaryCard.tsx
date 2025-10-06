import { User, Mail, Phone, DollarSign } from 'lucide-react';

type QuoteSummaryCardProps = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  subtotal: number;
  tps: number;
  tvq: number;
  total: number;
};

export default function QuoteSummaryCard({
  customerName,
  customerEmail,
  customerPhone,
  subtotal,
  tps,
  tvq,
  total
}: QuoteSummaryCardProps) {
  return (
    <div className="card p-6 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Client
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-gray-400" />
              <span className="font-medium text-gray-900">{customerName || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-600">{customerEmail || '—'}</span>
            </div>
            {customerPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-600">{customerPhone}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Totaux
          </h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Sous-total</span>
              <span className="font-mono font-semibold text-gray-900">{subtotal.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-xs">TPS (5%)</span>
              <span className="font-mono text-gray-600 text-xs">{tps.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-xs">TVQ (9,975%)</span>
              <span className="font-mono text-gray-600 text-xs">{tvq.toFixed(2)} $</span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-mono text-xl font-bold text-gray-900">{total.toFixed(2)} $</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

