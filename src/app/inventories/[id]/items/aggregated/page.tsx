'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';

export default function AggregatedInventoryItemsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{[key: string]: string}>({});
  const [draftFilters, setDraftFilters] = useState<{[key: string]: string}>({});
  const [viewMode, setViewMode] = useState<'All' | 'Expected' | 'Unexpected' | 'Lost'>('All');

  const columns = ['Product ID', 'fld01', 'fld02', 'fld03', 'fldd01', 'fldd02', 'Qty'];

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const getLabel = (key: string) => {
    const labelObj = labels.find(l => l.pr_fld === key);
    return labelObj ? (labelObj.pr_lab || labelObj.pr_des || key) : key;
  };

  const getDisplayedQty = (item: any) => {
    if (viewMode === 'All')        return item.Qty;
    if (viewMode === 'Expected')   return item['Expected Qty'];
    if (viewMode === 'Unexpected') return item['Unexpected Qty'];
    if (viewMode === 'Lost')       return item['Lost Qty'];
    return 0;
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const qtyForMode =
        viewMode === 'All'        ? item.Qty :
        viewMode === 'Expected'   ? item['Expected Qty'] :
        viewMode === 'Unexpected' ? item['Unexpected Qty'] :
                                    item['Lost Qty'];

      if (qtyForMode === 0 && viewMode !== 'All') return false;

      return Object.keys(filters).every(key => {
        if (!filters[key]) return true;
        const val = key === 'Qty'
          ? String(qtyForMode)
          : String(item[key] || item[getLabel(key)] || '').toLowerCase();
        return val.includes(filters[key].toLowerCase());
      });
    });
  }, [items, filters, viewMode, labels]);

  const fetchData = async () => {
    try {
      const [itemsRes, labelsRes, invRes] = await Promise.all([
        fetch(`/api/inventories/${id}/items/aggregated`),
        fetch('/api/products/labels'),
        fetch(`/api/inventories?id=${id}`)
      ]);

      if (itemsRes.ok && labelsRes.ok && invRes.ok) {
        const itemsData = await itemsRes.json();
        const labelsData = await labelsRes.json();
        const invData = await invRes.json();
        setItems(itemsData);
        setLabels(labelsData);
        if (invData && invData.length > 0) setInventory(invData[0]);
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDraftChange = (key: string, value: string) => {
    setDraftFilters(prev => ({ ...prev, [key]: value }));
  };

  const commitFilter = (key: string) => {
    setFilters(prev => ({ ...prev, [key]: draftFilters[key] ?? '' }));
  };

  const totalQty = filteredItems.reduce((acc, curr) => acc + (Number(getDisplayedQty(curr)) || 0), 0);

  const exportCSV = () => {
    if (filteredItems.length === 0) return;
    const allColumns = ['Product ID', 'fld01', 'fld02', 'fld03', 'fldd01', 'fldd02', 'Qty'];
    const headers = allColumns.map(col => getLabel(col)).join(';');
    const rows = filteredItems.map(item =>
      allColumns.map(col => {
        const val = col === 'Qty' ? getDisplayedQty(item) : (item[col] || item[getLabel(col)]);
        return `"${String(val || '').replaceAll('"', '""')}"`;
      }).join(';')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_${id}_aggregated_${viewMode.toLowerCase()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Caricamento dati aggregati...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-800">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dettaglio Inventario (Aggregato)</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <span>ID: <span className="font-semibold text-gray-800">{id}</span></span>
              {inventory && <span>Nome: <span className="font-semibold text-gray-800">{inventory.inv_name}</span></span>}
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                Total References: {filteredItems.length}
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                Total Qty ({viewMode}): {totalQty}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download size={20} /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        {/* View mode buttons */}
        <div className="flex border-b border-gray-200 bg-gray-50 p-2 gap-2">
          {(['All', 'Expected', 'Unexpected', 'Lost'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                {columns.map(col => (
                  <th key={col} className="px-3 py-3 text-xs font-bold text-gray-700 align-top">
                    <div className="flex flex-col gap-1.5">
                      <span>{getLabel(col)}</span>
                      <input
                        type="text"
                        placeholder="Filtra"
                        className="text-xs font-normal px-1.5 py-0.5 border border-gray-300 rounded w-full"
                        value={draftFilters[col] ?? ''}
                        onChange={e => handleDraftChange(col, e.target.value)}
                        onBlur={() => commitFilter(col)}
                        onKeyDown={e => { if (e.key === 'Enter') { commitFilter(col); (e.target as HTMLInputElement).blur(); } }}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columns.map(col => (
                    <td key={col} className="px-3 py-1 text-xs text-gray-700">
                      {col === 'Qty' ? getDisplayedQty(item) : (item[col] || item[getLabel(col)] || '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
