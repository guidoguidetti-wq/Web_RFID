'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';

export default function ItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [localFilters, setLocalFilters] = useState<{ [key: string]: string }>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchItems(1);
  }, []);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const fetchItems = async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true);

      // Build query string with filters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');

      Object.keys(currentFilters).forEach(key => {
        if (currentFilters[key]) {
          params.append(`filter_${key}`, currentFilters[key]);
        }
      });

      const [itemsRes, labelsRes] = await Promise.all([
        fetch(`/api/items?${params.toString()}`),
        fetch('/api/products/labels')
      ]);

      if (itemsRes.ok && labelsRes.ok) {
        const itemsData = await itemsRes.json();
        const labelsData = await labelsRes.json();
        setItems(itemsData.items);
        setPagination(itemsData.pagination);
        setLabels(labelsData);
      }
    } catch (error) {
      console.error("Error fetching items", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer to call API after 500ms of no typing
    debounceTimer.current = setTimeout(() => {
      setFilters(newFilters);
      fetchItems(1, newFilters);
    }, 500);
  };

  const getLabel = (key: string) => {
    const labelObj = labels.find(l => l.pr_fld === key);
    return labelObj ? (labelObj.pr_lab || labelObj.pr_des || key) : key;
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString();
  };

  const columns = [
    { key: 'item_id', label: 'EPC' },
    { key: 'item_product_id', label: 'ID Prodotto' },
    { key: 'fld01', label: getLabel('fld01') },
    { key: 'fld02', label: getLabel('fld02') },
    { key: 'fld03', label: getLabel('fld03') },
    { key: 'fldd01', label: getLabel('fldd01') },
    { key: 'date_creation', label: 'Data Creazione' },
    { key: 'date_lastseen', label: 'Ultima Lettura' },
    { key: 'place_last', label: 'Ultimo Luogo' },
    { key: 'zone_last', label: 'Ultima Zona' },
  ];

  if (loading) return <div className="p-10 text-center text-gray-500 text-xs">Caricamento items...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Single Row Header with Everything */}
      <div className="flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow border border-gray-200 mb-3">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <img src="/RFID_System_Logo.png" alt="Logo" className="h-6 w-auto" />
          <h1 className="text-xl font-bold text-gray-800">Items</h1>
        </div>

        {/* Center: Pagination Info + Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-600 whitespace-nowrap">
              Pagina {pagination.page} di {pagination.totalPages}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchItems(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-xs"
                title="Precedente"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* First page */}
              {pagination.page > 3 && (
                <>
                  <button
                    onClick={() => fetchItems(1)}
                    className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition text-xs"
                  >
                    1
                  </button>
                  {pagination.page > 4 && <span className="px-1 text-gray-500 text-xs">...</span>}
                </>
              )}

              {/* Pages around current */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => p >= pagination.page - 1 && p <= pagination.page + 1)
                .map(p => (
                  <button
                    key={p}
                    onClick={() => fetchItems(p)}
                    className={`px-2 py-1 rounded border transition text-xs min-w-[28px] ${
                      p === pagination.page
                        ? 'bg-blue-600 border-blue-600 text-white font-bold'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}

              {/* Last page */}
              {pagination.page < pagination.totalPages - 2 && (
                <>
                  {pagination.page < pagination.totalPages - 3 && <span className="px-1 text-gray-500 text-xs">...</span>}
                  <button
                    onClick={() => fetchItems(pagination.totalPages)}
                    className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition text-xs"
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => fetchItems(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-xs"
                title="Successiva"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Right: Total Count */}
        <div className="text-xs text-gray-600 whitespace-nowrap">
          Totale: {pagination.total} items
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                {columns.map((col) => (
                  <th key={col.key} className="px-3 py-2 text-xs font-bold text-gray-700 align-top">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        {col.label}
                      </div>
                      <input
                        type="text"
                        placeholder={`Filter...`}
                        className="text-xs font-normal p-1 border border-gray-300 rounded w-full"
                        value={localFilters[col.key] || ''}
                        onChange={(e) => handleFilterChange(col.key, e.target.value)}
                      />
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2 text-xs font-bold text-gray-700 align-top">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="p-4 text-center text-gray-500 text-sm">Nessun item trovato.</td></tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx}>
                    {columns.map((col) => {
                      let cellClass = "px-3 py-1 text-xs text-gray-700 ";
                      let maxWidth = "";

                      if (col.key === 'item_id') {
                        maxWidth = "max-w-[100px]";
                      } else if (col.key === 'item_product_id') {
                        maxWidth = "max-w-[80px]";
                      } else if (col.key === 'fld01' || col.key === 'fld02') {
                        maxWidth = "max-w-[90px]";
                      } else if (col.key === 'fld03') {
                        maxWidth = "max-w-[60px]";
                      } else if (col.key === 'fldd01') {
                        maxWidth = "max-w-[150px]";
                      } else if (col.key.includes('date')) {
                        maxWidth = "max-w-[120px]";
                      } else {
                        maxWidth = "max-w-[100px]";
                      }

                      cellClass += maxWidth + " truncate overflow-hidden";

                      return (
                        <td
                          key={col.key}
                          className={cellClass}
                          title={col.key.includes('date') ? formatDate(item[col.key]) : String(item[col.key] || '')}
                        >
                          {col.key.includes('date') ? formatDate(item[col.key]) : (item[col.key] || '-')}
                        </td>
                      );
                    })}
                    <td className="px-3 py-1">
                      <button
                        onClick={() => router.push(`/items/${encodeURIComponent(item.item_id)}/movements`)}
                        className="text-blue-600 hover:text-blue-800 p-0.5 rounded hover:bg-blue-100 transition"
                        title="Storico Movimenti"
                      >
                        <Activity size={14} />
                      </button>
                    </td>
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
