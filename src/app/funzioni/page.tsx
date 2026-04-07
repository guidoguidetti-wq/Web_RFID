'use client';

import ManagementTable from '@/components/ManagementTable';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const columns = [
  { key: 'fun_id', label: 'ID', isId: true },
  { key: 'fun_label', label: 'Label Funzione' },
];

export default function FunzioniPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 pt-6">
        <button
          onClick={() => router.push('/utenti')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-2"
        >
          <ArrowLeft size={18} />
          <span>Utenti</span>
        </button>
      </div>
      <ManagementTable
        title="Gestione Funzioni"
        columns={columns}
        apiEndpoint="/api/functions"
      />
    </div>
  );
}
