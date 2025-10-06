import Link from 'next/link';
import { Save, Send, Trash2, FileDown } from 'lucide-react';

type QuoteHeaderProps = {
  statusInfo: { bg: string; text: string; border: string; label: string };
  createdAt?: string | Date;
  sentAt?: string | Date;
  readyToSend: boolean;
  saving: boolean;
  sending: boolean;
  onSave: () => void;
  onSend: () => void;
  onDownloadPdf: () => void;
  onDelete: () => void;
};

export default function QuoteHeader({
  statusInfo,
  createdAt,
  sentAt,
  readyToSend,
  saving,
  sending,
  onSave,
  onSend,
  onDownloadPdf,
  onDelete
}: QuoteHeaderProps) {
  const fmtDate = (d?: string | Date) => d ? new Date(d).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' }) : undefined;

  return (
    <div className="mb-6">
      <Link href="/admin/quotes" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 group">
        <svg className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour à la liste
      </Link>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Soumission</h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
              {statusInfo.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            {fmtDate(createdAt) && (
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Créée: {fmtDate(createdAt)}
              </div>
            )}
            {fmtDate(sentAt) && (
              <div className="flex items-center gap-1.5 text-green-700">
                <Send className="h-4 w-4" />
                Envoyée: {fmtDate(sentAt)}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer font-medium text-sm"
            onClick={onDownloadPdf}
          >
            <FileDown className="h-4 w-4" />
            PDF
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 shadow-sm hover:shadow transition-all cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onSend}
            disabled={!readyToSend || sending}
          >
            <Send className="h-4 w-4" />
            {sending ? 'Envoi…' : 'Envoyer au client'}
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm hover:shadow-md transition-all cursor-pointer font-medium"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

