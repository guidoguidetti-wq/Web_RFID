'use client';

import ManagementTable from '@/components/ManagementTable';

const columns = [
  { key: 'chk_id', label: 'ID', isId: true },
  { key: 'chk_code', label: 'Codice' },
  { key: 'chk_place', label: 'Place' },
  { key: 'chk_zone', label: 'Zone' },
  { key: 'chk_notes', label: 'Note' },
  { key: 'chk_creationdate', label: 'Data Creazione' },
];

export default function ChecklistsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ManagementTable
        title="Gestione CheckLists"
        columns={columns}
        apiEndpoint="/api/checklists"
      />
    </div>
  );
}
