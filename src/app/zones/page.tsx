'use client';

import ManagementTable from '@/components/ManagementTable';

const columns = [
  { key: 'zone_id', label: 'Zone ID', isId: true },
  { key: 'zone_name', label: 'Nome' },
  { key: 'zone_type', label: 'Tipo' },
];

export default function ZonesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ManagementTable 
        title="Gestione Zones" 
        columns={columns} 
        apiEndpoint="/api/zones" 
      />
    </div>
  );
}
