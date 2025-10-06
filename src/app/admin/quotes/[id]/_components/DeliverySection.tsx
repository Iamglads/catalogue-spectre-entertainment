import { Truck } from 'lucide-react';

type DeliveryAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
};

type DeliverySectionProps = {
  method?: 'pickup' | 'delivery';
  address?: DeliveryAddress;
  onChange: (method: 'pickup' | 'delivery') => void;
  onAddressChange: (field: keyof DeliveryAddress, value: string) => void;
};

export default function DeliverySection({ method, address, onChange, onAddressChange }: DeliverySectionProps) {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">
        Livraison
      </h2>
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              className="text-blue-600 cursor-pointer"
              checked={method === 'pickup'}
              onChange={() => onChange('pickup')}
            />
            <span className="text-sm font-medium text-gray-700">Ramassage</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              className="text-blue-600 cursor-pointer"
              checked={method === 'delivery'}
              onChange={() => onChange('delivery')}
            />
            <span className="text-sm font-medium text-gray-700">Livraison</span>
          </label>
        </div>

        {method === 'delivery' && (
          <div className="space-y-3 pt-2 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                className="input w-full"
                value={address?.line1 || ''}
                onChange={(e) => onAddressChange('line1', e.target.value)}
                placeholder="123 Rue Principale"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appartement / Bureau</label>
              <input
                type="text"
                className="input w-full"
                value={address?.line2 || ''}
                onChange={(e) => onAddressChange('line2', e.target.value)}
                placeholder="App. 4"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  className="input w-full"
                  value={address?.city || ''}
                  onChange={(e) => onAddressChange('city', e.target.value)}
                  placeholder="Montréal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                <input
                  type="text"
                  className="input w-full"
                  value={address?.province || ''}
                  onChange={(e) => onAddressChange('province', e.target.value)}
                  placeholder="QC"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
              <input
                type="text"
                className="input w-full"
                value={address?.postalCode || ''}
                onChange={(e) => onAddressChange('postalCode', e.target.value)}
                placeholder="H1A 2B3"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

