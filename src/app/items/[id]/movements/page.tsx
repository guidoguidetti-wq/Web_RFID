'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function ItemMovementsPage() {
  const params = useParams();
  const id = params.id as string; // This is the item_id (EPC)
  const router = useRouter();
  const [movements, setMovements] = useState<any[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: '',
    place: '',
    zone: '',
    user: '',
    ref: ''
  });

  useEffect(() => {
    if (id) {
      fetchMovements();
    }
  }, [id]);

  useEffect(() => {
    if (movements.length > 0) {
      const filtered = movements.filter(mov => {
        const dateMatch = formatDate(mov.mov_timestamp).toLowerCase().includes(filters.date.toLowerCase());
        const placeMatch = (mov.Place || '').toLowerCase().includes(filters.place.toLowerCase());
        const zoneMatch = (mov.Zone || '').toLowerCase().includes(filters.zone.toLowerCase());
        const userMatch = (mov.mov_user || '').toLowerCase().includes(filters.user.toLowerCase());
        const refMatch = (mov.mov_ref || '').toLowerCase().includes(filters.ref.toLowerCase());
        return dateMatch && placeMatch && zoneMatch && userMatch && refMatch;
      });
      setFilteredMovements(filtered);
    } else {
      setFilteredMovements([]);
    }
  }, [movements, filters]);

  const fetchMovements = async () => {
    try {
      // Decode ID if it contains special chars (though normally IDs in URL are fine or handled)
      const res = await fetch(`/api/items/${encodeURIComponent(id)}/movements`);
      if (res.ok) {
        const data = await res.json();
        setMovements(data);
        setFilteredMovements(data);
      } else {
          console.error("Failed to fetch movements");
      }
    } catch (error) {
      console.error("Error fetching movements", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

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
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 align-top">
                    <div className="flex flex-col gap-2">
                      <span>Data/Ora</span>
                      <input 
                        type="text" 
                        placeholder="Filtra..." 
                        className="text-xs font-normal p-1 border border-gray-300 rounded w-full"
                        value={filters.date}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 align-top">
                    <div className="flex flex-col gap-2">
                      <span>Luogo (Place)</span>
                      <input 
                        type="text" 
                        placeholder="Filtra..." 
                        className="text-xs font-normal p-1 border border-gray-300 rounded w-full"
                        value={filters.place}
                        onChange={(e) => handleFilterChange('place', e.target.value)}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 align-top">
                    <div className="flex flex-col gap-2">
                      <span>Zona (Zone)</span>
                      <input 
                        type="text" 
                        placeholder="Filtra..." 
                        className="text-xs font-normal p-1 border border-gray-300 rounded w-full"
                        value={filters.zone}
                        onChange={(e) => handleFilterChange('zone', e.target.value)}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 align-top">
                    <div className="flex flex-col gap-2">
                      <span>Utente</span>
                      <input 
                        type="text" 
                        placeholder="Filtra..." 
                        className="text-xs font-normal p-1 border border-gray-300 rounded w-full"
                        value={filters.user}
                        onChange={(e) => handleFilterChange('user', e.target.value)}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 align-top">
                    <div className="flex flex-col gap-2">
                      <span>Riferimento</span>
                      <input 
                        type="text" 
                        placeholder="Filtra..." 
                        className="text-xs font-normal p-1 border border-gray-300 rounded w-full"
                        value={filters.ref}
                        onChange={(e) => handleFilterChange('ref', e.target.value)}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 align-top">
                     <div className="flex flex-col gap-2 pt-1">
                      <span>Read Count</span>
                     </div>
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 align-top">
                     <div className="flex flex-col gap-2 pt-1">
                      <span>RSSI Avg</span>
                     </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMovements.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nessun movimento corrispondente ai filtri.</td></tr>
                ) : (
                  filteredMovements.map((mov, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">{formatDate(mov.mov_timestamp)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{mov.Place || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{mov.Zone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{mov.mov_user}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{mov.mov_ref}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{mov.mov_readcount}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{mov.mov_rssiavg}</td>
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
