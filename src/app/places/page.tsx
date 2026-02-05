'use client';

import ManagementTable from '@/components/ManagementTable';

const columns = [
  { key: 'place_id', label: 'Place ID', isId: true },
  { key: 'place_name', label: 'Nome' },
  { key: 'place_type', label: 'Tipo' },
];

export default function PlacesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ManagementTable 
        title="Gestione Places" 
        columns={columns} 
        apiEndpoint="/api/places" 
      />
    </div>
  );
}
