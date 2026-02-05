'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function MovementsPage() {
  const router = useRouter();
  const [movements, setMovements] = useState<any[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    epc: '',
    date: '',
    place: '',
    zone: '',
    user: '',
    ref: ''
  });

  useEffect(() => {
    fetchMovements();
  }, []);

  useEffect(() => {
    if (movements.length > 0) {
      const filtered = movements.filter(mov => {
        const epcMatch = (mov.mov_epc || '').toLowerCase().includes(filters.epc.toLowerCase());
        const dateMatch = formatDate(mov.mov_timestamp).toLowerCase().includes(filters.date.toLowerCase());
        const placeMatch = (mov.Place || '').toLowerCase().includes(filters.place.toLowerCase());
        const zoneMatch = (mov.Zone || '').toLowerCase().includes(filters.zone.toLowerCase());
        const userMatch = (mov.mov_user || '').toLowerCase().includes(filters.user.toLowerCase());
        const refMatch = (mov.mov_ref || '').toLowerCase().includes(filters.ref.toLowerCase());
        return epcMatch && dateMatch && placeMatch && zoneMatch && userMatch && refMatch;
      });
      setFilteredMovements(filtered);
    } else {
      setFilteredMovements([]);
    }
  }, [movements, filters]);

  const fetchMovements = async () => {
    try {
      const res = await fetch('/api/movements');
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

  if (loading) return <div className="p-10 text-center text-gray-500 text-xs">Caricamento movimenti...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/menu')} className="text-gray-600 hover:text-gray-800">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Tutti i Movimenti</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse table-auto min-w-max md:min-w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-3 py-3 text-[10px] sm:text-xs font-bold text-gray-700 align-top uppercase tracking-wider">
                    <div className="flex flex-col gap-2">
                      <span>EPC</span>
                      <input 
                        type="text" 
                        placeholder="Filtra..." 
                        className="text-[10px] font-normal p-1 border border-gray-300 rounded w-full"
                        value={filters.epc}
                        onChange={(e) => handleFilterChange('epc', e.target.value)}
                      />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-[10px] sm:text-xs font-bold text-gray-700 align-top uppercase tracking-wider">
                    <div className="flex flex-col gap-2">
                      <span>Data/Ora</span>
                      <input 
                        type="text" 
                        placeholder="Filtra..." 
                        className="text-[10px] font-normal p-1 border border-gray-300 rounded w-full"
                        value={filters.date}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                      />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-[10px] sm:text-xs font-bold text-gray-700 align-top uppercase tracking-wider">
                    <div className="flex flex-col gap-2">
                      <span>Luogo (Place)</span>
                      <input 
                        type="text" 
                        placeholder="Filtra..." 
                        className="text-[10px] font-normal p-1 border border-gray-300 rounded w-full"
                        value={filters.place}
                        onChange={(e) => handleFilterChange('place', e.target.value)}
                      />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-[10px] sm:text-xs font-bold text-gray-700 align-top uppercase tracking-wider">
                    <div className="flex flex-col gap-2">
                      <span>Zona (Zone)</span>
                      <input 
                        type="text" 
                        placeholder="Filtra..." 
                        className="text-[10px] font-normal p-1 border border-gray-300 rounded w-full"
                        value={filters.zone}
                        onChange={(e) => handleFilterChange('zone', e.target.value)}
                      />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-[10px] sm:text-xs font-bold text-gray-700 align-top uppercase tracking-wider">
                    <div className="flex flex-col gap-2">
                      <span>Utente</span>
                      <input 
                        type="text" 
                        placeholder="Filtra..." 
                        className="text-[10px] font-normal p-1 border border-gray-300 rounded w-full"
                        value={filters.user}
                        onChange={(e) => handleFilterChange('user', e.target.value)}
                      />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-[10px] sm:text-xs font-bold text-gray-700 align-top uppercase tracking-wider">
                    <div className="flex flex-col gap-2">
                      <span>Riferimento</span>
                      <input 
                        type="text" 
                        placeholder="Filtra..." 
                        className="text-[10px] font-normal p-1 border border-gray-300 rounded w-full"
                        value={filters.ref}
                        onChange={(e) => handleFilterChange('ref', e.target.value)}
                      />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-[10px] sm:text-xs font-bold text-gray-700 align-top uppercase tracking-wider">
                     <div className="flex flex-col gap-2 pt-1">
                      <span>Read Count</span>
                     </div>
                  </th>
                  <th className="px-3 py-3 text-[10px] sm:text-xs font-bold text-gray-700 align-top uppercase tracking-wider">
                     <div className="flex flex-col gap-2 pt-1">
                      <span>RSSI Avg</span>
                     </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMovements.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-500 text-xs">Nessun movimento corrispondente ai filtri.</td></tr>
                ) : (
                  filteredMovements.map((mov, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-[10px] sm:text-xs text-gray-700 whitespace-nowrap font-mono">{mov.mov_epc}</td>
                      <td className="px-3 py-2 text-[10px] sm:text-xs text-gray-700 whitespace-nowrap">{formatDate(mov.mov_timestamp)}</td>
                      <td className="px-3 py-2 text-[10px] sm:text-xs text-gray-700 whitespace-nowrap">{mov.Place || '-'}</td>
                      <td className="px-3 py-2 text-[10px] sm:text-xs text-gray-700 whitespace-nowrap">{mov.Zone || '-'}</td>
                      <td className="px-3 py-2 text-[10px] sm:text-xs text-gray-700 whitespace-nowrap">{mov.mov_user}</td>
                      <td className="px-3 py-2 text-[10px] sm:text-xs text-gray-700 whitespace-nowrap">{mov.mov_ref}</td>
                      <td className="px-3 py-2 text-[10px] sm:text-xs text-gray-700 whitespace-nowrap">{mov.mov_readcount}</td>
                      <td className="px-3 py-2 text-[10px] sm:text-xs text-gray-700 whitespace-nowrap">{mov.mov_rssiavg}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}
