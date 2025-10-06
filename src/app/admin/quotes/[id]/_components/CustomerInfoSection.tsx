import { User } from 'lucide-react';

type CustomerInfoSectionProps = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  onChange: (field: 'name' | 'email' | 'phone' | 'company', value: string) => void;
};

export default function CustomerInfoSection({ name, email, phone, company, onChange }: CustomerInfoSectionProps) {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">
        Client
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input
            type="text"
            className="input w-full"
            value={name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Nom du client"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Courriel</label>
          <input
            type="email"
            className="input w-full"
            value={email || ''}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="client@exemple.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input
            type="tel"
            className="input w-full"
            value={phone || ''}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="(514) 555-1234"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
          <input
            type="text"
            className="input w-full"
            value={company || ''}
            onChange={(e) => onChange('company', e.target.value)}
            placeholder="Nom de l'entreprise"
          />
        </div>
      </div>
    </div>
  );
}

