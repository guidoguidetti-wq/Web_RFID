'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function ItemMovementsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', place: '', zone: '', user: '', ref: '' });

  useEffect(() => {
    if (id) fetchMovements();
  }, [id]);

  const fetchMovements = async () => {
    try {
      const res = await fetch(`/api/items/${encodeURIComponent(id)}/movements`);
      if (res.ok) setMovements(await res.json());
      else console.error('Failed to fetch movements');
    } catch (error) {
      console.error('Error fetching movements', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = useMemo(() => {
    return movements.filter(mov => {
      return (
        formatDate(mov.mov_timestamp).toLowerCase().includes(filters.date.toLowerCase()) &&
        (mov.Place || '').toLowerCase().includes(filters.place.toLowerCase()) &&
        (mov.Zone  || '').toLowerCase().includes(filters.zone.toLowerCase()) &&
        (mov.mov_user || '').toLowerCase().includes(filters.user.toLowerCase()) &&
        (mov.mov_ref  || '').toLowerCase().includes(filters.ref.toLowerCase())
      );
    });
  }, [movements, filters]);

  const commitFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString();
  };

  const filterInput = (key: string) => (
    <input
      type="text"
      placeholder="Filtra..."
      className="text-xs font-normal px-1.5 py-0.5 border border-gray-300 rounded w-full"
      defaultValue={filters[key as keyof typeof filters]}
      onBlur={e => commitFilter(key, e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') { commitFilter(key, e.currentTarget.value); e.currentTarget.blur(); } }}
    />
  );

  if (loading) return <div className="p-10 text-center text-gray-500">Caricamento movimenti...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-800">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Storico Movimenti</h1>
          <p className="text-sm text-gray-500">Item: {decodeURIComponent(id)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        {movements.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Nessun movimento trovato per questo item.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 align-top min-w-[140px]">
                    <div className="flex flex-col gap-1.5"><span>Data/Ora</span>{filterInput('date')}</div>
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 align-top min-w-[180px]">
                    <div className="flex flex-col gap-1.5"><span>Luogo (Place)</span>{filterInput('place')}</div>
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 align-top min-w-[180px]">
                    <div className="flex flex-col gap-1.5"><span>Zona (Zone)</span>{filterInput('zone')}</div>
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 align-top min-w-[100px]">
                    <div className="flex flex-col gap-1.5"><span>Utente</span>{filterInput('user')}</div>
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 align-top min-w-[120px]">
                    <div className="flex flex-col gap-1.5"><span>Riferimento</span>{filterInput('ref')}</div>
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 align-top">
                    <span>Read Count</span>
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 align-top">
                    <span>RSSI Avg</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMovements.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500 text-sm">Nessun movimento corrispondente ai filtri.</td></tr>
                ) : (
                  filteredMovements.map((mov, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-1 text-xs text-gray-700">{formatDate(mov.mov_timestamp)}</td>
                      <td className="px-4 py-1 text-xs text-gray-700">{mov.Place || '-'}</td>
                      <td className="px-4 py-1 text-xs text-gray-700">{mov.Zone  || '-'}</td>
                      <td className="px-4 py-1 text-xs text-gray-700">{mov.mov_user}</td>
                      <td className="px-4 py-1 text-xs text-gray-700">{mov.mov_ref}</td>
                      <td className="px-4 py-1 text-xs text-gray-700">{mov.mov_readcount}</td>
                      <td className="px-4 py-1 text-xs text-gray-700">{mov.mov_rssiavg}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
