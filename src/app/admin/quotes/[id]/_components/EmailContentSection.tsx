import { Mail } from 'lucide-react';

type EmailContentSectionProps = {
  subject?: string;
  intro?: string;
  footerNote?: string;
  onChange: (field: 'subject' | 'intro' | 'footerNote', value: string) => void;
};

export default function EmailContentSection({ subject, intro, footerNote, onChange }: EmailContentSectionProps) {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">
        Contenu courriel
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sujet du courriel</label>
          <input
            type="text"
            className="input w-full"
            value={subject || ''}
            onChange={(e) => onChange('subject', e.target.value)}
            placeholder="Votre soumission de Spectre"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Introduction</label>
          <textarea
            className="input w-full min-h-[100px]"
            value={intro || ''}
            onChange={(e) => onChange('intro', e.target.value)}
            placeholder="Bonjour, voici votre soumission..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note de bas de page</label>
          <textarea
            className="input w-full min-h-[80px]"
            value={footerNote || ''}
            onChange={(e) => onChange('footerNote', e.target.value)}
            placeholder="N'hésitez pas à nous contacter..."
          />
        </div>
      </div>
    </div>
  );
}

