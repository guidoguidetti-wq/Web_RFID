'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Trash2 } from 'lucide-react';

export default function ItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchItems(1);
  }, []);

  const fetchItems = async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      Object.keys(currentFilters).forEach(key => {
        if (currentFilters[key]) params.append(`filter_${key}`, currentFilters[key]);
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
      console.error('Error fetching items', error);
    } finally {
      setLoading(false);
    }
  };

  const commitFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchItems(1, newFilters);
  };

  const handleDeleteFiltered = async () => {
    const activeFilters = Object.values(filters).filter(v => v);
    const confirmMsg = activeFilters.length > 0
      ? `Eliminare tutti i ${pagination.total} items corrispondenti al filtro corrente e tutti i record correlati?`
      : `Eliminare TUTTI i ${pagination.total} items e tutti i record correlati? Operazione irreversibile!`;
    if (!confirm(confirmMsg)) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ bulk: 'true' });
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(`filter_${key}`, filters[key]);
      });
      const res = await fetch(`/api/items?${params.toString()}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        alert(`Eliminati ${data.deleted} items.`);
        fetchItems(1);
      } else {
        const err = await res.json();
        alert(err.error || 'Errore eliminazione');
      }
    } catch (error) {
      console.error('Delete filtered error', error);
      alert('Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (key: string) => {
    const labelObj = labels.find(l => l.pr_fld === key);
    return labelObj ? (labelObj.pr_lab || labelObj.pr_des || key) : key;
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString();
  };

  const columns: { key: string; label: string; renderKey?: string }[] = [
    { key: 'item_id',         label: 'EPC' },
    { key: 'item_product_id', label: 'ID Prodotto' },
    { key: 'fld01',           label: getLabel('fld01') },
    { key: 'fld02',           label: getLabel('fld02') },
    { key: 'fld03',           label: getLabel('fld03') },
    { key: 'lotto',           label: 'Prod.Lot.' },
    { key: 'fldd01',          label: getLabel('fldd01') },
    { key: 'date_creation',   label: 'Data Creazione' },
    { key: 'date_lastseen',   label: 'Ultima Lettura' },
    { key: 'place_last', renderKey: 'place_last_display', label: 'Ultimo Luogo' },
    { key: 'zone_last',  renderKey: 'zone_last_display',  label: 'Ultima Zona' },
  ];

  const colWidth: Record<string, string> = {
    item_id:         'min-w-[220px]',
    item_product_id: 'min-w-[80px]',
    fld01:           'min-w-[90px]',
    fld02:           'min-w-[90px]',
    fld03:           'min-w-[45px]',
    lotto:           'min-w-[80px]',
    fldd01:          'min-w-[90px]',
    date_creation:   'min-w-[120px]',
    date_lastseen:   'min-w-[120px]',
    place_last:      'min-w-[160px]',
    zone_last:       'min-w-[160px]',
  };

  if (loading) return <div className="p-10 text-center text-gray-500 text-xs">Caricamento items...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow border border-gray-200 mb-3">
        <div className="flex items-center gap-3">
          <img src="/RFID_System_Logo.png" alt="Logo" className="h-6 w-auto" />
          <h1 className="text-xl font-bold text-gray-800">Items</h1>
        </div>

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
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {pagination.page > 3 && (
                <>
                  <button onClick={() => fetchItems(1)} className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition text-xs">1</button>
                  {pagination.page > 4 && <span className="px-1 text-gray-500 text-xs">...</span>}
                </>
              )}

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

              {pagination.page < pagination.totalPages - 2 && (
                <>
                  {pagination.page < pagination.totalPages - 3 && <span className="px-1 text-gray-500 text-xs">...</span>}
                  <button onClick={() => fetchItems(pagination.totalPages)} className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition text-xs">
                    {pagination.totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => fetchItems(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-xs"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-600 whitespace-nowrap">
            Totale: {pagination.total} items
          </div>
          <button
            onClick={handleDeleteFiltered}
            className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs whitespace-nowrap"
            title="Elimina tutti gli items del filtro corrente"
          >
            <Trash2 size={12} /> Delete Filtered
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                {columns.map(col => (
                  <th key={col.key} className={`px-3 py-2 text-xs font-bold text-gray-700 align-top ${colWidth[col.key] ?? ''}`}>
                    <div className="flex flex-col gap-1.5">
                      <span className="whitespace-nowrap">{col.label}</span>
                      <input
                        type="text"
                        placeholder="Filter..."
                        className="text-xs font-normal px-1.5 py-0.5 border border-gray-300 rounded w-full"
                        defaultValue={filters[col.key] ?? ''}
                        onBlur={e => commitFilter(col.key, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            commitFilter(col.key, e.currentTarget.value);
                            e.currentTarget.blur();
                          }
                        }}
                      />
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2 text-xs font-bold text-gray-700 align-top">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="p-4 text-center text-gray-500 text-xs">Nessun item trovato.</td></tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {columns.map(col => {
                      const displayKey = col.renderKey ?? col.key;
                      const rawVal = item[displayKey] ?? item[col.key];
                      const displayVal = col.key.includes('date') ? formatDate(rawVal) : (rawVal || '-');
                      return (
                        <td
                          key={col.key}
                          className="px-3 py-1 text-xs text-gray-700 truncate overflow-hidden"
                          style={{ maxWidth: col.key === 'item_id' ? '220px' : '160px' }}
                          title={String(rawVal || '')}
                        >
                          {displayVal}
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
