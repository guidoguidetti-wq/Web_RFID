'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Tag } from 'lucide-react';
import ManagementTable from '@/components/ManagementTable';

const COLUMNS = [
  { key: 'pr_fld', label: 'Campo',     isId: true },
  { key: 'pr_lab', label: 'Etichetta' },
];

export default function ProductsLabelsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white px-4 py-2 shadow border-b border-gray-200">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Prodotti
        </button>
        <div className="h-4 w-px bg-gray-300" />
        <img src="/RFID_System_Logo.png" alt="Logo" className="h-6 w-auto" />
        <Tag size={18} className="text-blue-600" />
        <h1 className="text-lg font-bold text-gray-800">Etichette Prodotti</h1>
      </div>

      <ManagementTable
        title=""
        columns={COLUMNS}
        apiEndpoint="/api/products/labels"
      />
    </div>
  );
}
