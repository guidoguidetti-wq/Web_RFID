'use client';

import ManagementTable from '@/components/ManagementTable';
import { useState, useEffect } from 'react';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'password' | 'select';
  isId?: boolean;
  options?: { label: string; value: any }[];
}

export default function UtentiPage() {
  const [columns, setColumns] = useState<Column[]>([
    { key: 'usr_id', label: 'ID', isId: true },
    { key: 'usr_name', label: 'Username' },
    { key: 'usr_pwd', label: 'Password', type: 'password' },
    { 
      key: 'usr_role', 
      label: 'Ruolo', 
      type: 'select',
      options: [
        { label: 'Admin', value: 0 },
        { label: 'KeyUser', value: 1 },
        { label: 'User', value: 2 }
      ]
    },
    { key: 'usr_def_place', label: 'Default Place', type: 'select', options: [] } // Initial empty options
  ]);

  useEffect(() => {
    // Fetch places to populate the dropdown
    const fetchPlaces = async () => {
      try {
        const res = await fetch('/api/places');
        if (res.ok) {
          const places = await res.json();
          const placeOptions = places.map((p: any) => ({
            label: p.place_name,
            value: p.place_id // Assuming place_id is the value stored in usr_def_place
          }));
          
          setColumns(prev => prev.map(col => {
            if (col.key === 'usr_def_place') {
              return { ...col, options: placeOptions };
            }
            return col;
          }));
        }
      } catch (error) {
        console.error("Failed to fetch places", error);
      }
    };

    fetchPlaces();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <ManagementTable 
        title="Gestione Utenti" 
        columns={columns} 
        apiEndpoint="/api/users" 
      />
    </div>
  );
}