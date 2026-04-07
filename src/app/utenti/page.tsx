'use client';

import ManagementTable from '@/components/ManagementTable';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, List } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'password' | 'select';
  isId?: boolean;
  options?: { label: string; value: any }[];
}

export default function UtentiPage() {
  const router = useRouter();

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
    { key: 'usr_def_place', label: 'Default Place', type: 'select', options: [] }
  ]);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await fetch('/api/places');
        if (res.ok) {
          const places = await res.json();
          const placeOptions = places.map((p: any) => ({
            label: p.place_name,
            value: p.place_id
          }));
          setColumns(prev => prev.map(col => {
            if (col.key === 'usr_def_place') {
              return { ...col, options: placeOptions };
            }
            return col;
          }));
        }
      } catch (error) {
        console.error('Failed to fetch places', error);
      }
    };

    fetchPlaces();
  }, []);

  const extraActions = [
    {
      icon: <Settings size={18} />,
      title: 'Funzioni',
      onClick: (item: any) => router.push(`/utenti/${item.usr_id}/funzioni`),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 pt-6 flex justify-end">
        <button
          onClick={() => router.push('/funzioni')}
          className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
        >
          <List size={16} />
          Gestione Funzioni
        </button>
      </div>
      <ManagementTable
        title="Gestione Utenti"
        columns={columns}
        apiEndpoint="/api/users"
        extraActions={extraActions}
      />
    </div>
  );
}
