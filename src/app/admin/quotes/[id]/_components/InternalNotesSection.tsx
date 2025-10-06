import { Clipboard } from 'lucide-react';

type InternalNotesSectionProps = {
  notes?: string;
  onChange: (notes: string) => void;
};

export default function InternalNotesSection({ notes, onChange }: InternalNotesSectionProps) {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">
        Notes internes
      </h2>
      <textarea
        className="input w-full min-h-[120px]"
        value={notes || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Notes privées (non visibles par le client)..."
      />
    </div>
  );
}

