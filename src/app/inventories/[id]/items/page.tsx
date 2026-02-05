'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Layers, Download, CheckCircle, AlertTriangle, XCircle, Filter } from 'lucide-react';

export default function InventoryItemsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{[key: string]: string}>({});

  // Status Filter States (true = filter for true, false/null = no filter)
  // Or 3-state? Let's implement simple On/Off as requested (Show Only True vs Show All).
  const [statusFilters, setStatusFilters] = useState({
    inv_expected: false,
    inv_unexpected: false,
    inv_lost: false
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (items.length > 0) {
      const filtered = items.filter(item => {
        // Status Filters (OR logic)
        const isAnyStatusFilterActive = statusFilters.inv_expected || statusFilters.inv_unexpected || statusFilters.inv_lost;
        if (isAnyStatusFilterActive) {
          const matchesStatus = 
            (statusFilters.inv_expected && item.inv_expected) ||
            (statusFilters.inv_unexpected && item.inv_unexpected) ||
            (statusFilters.inv_lost && item.inv_lost);
          
          if (!matchesStatus) return false;
        }

        // Text Filters
        return Object.keys(filters).every(key => {
          if (!filters[key]) return true;
          const val = String(item[key] || item[getLabel(key)] || '').toLowerCase();
          return val.includes(filters[key].toLowerCase());
        });
      });
      setFilteredItems(filtered);
    } else {
      setFilteredItems([]);
    }
  }, [items, filters, statusFilters]);

  const fetchData = async () => {
    try {
      const [itemsRes, labelsRes, invRes] = await Promise.all([
        fetch(`/api/inventories/${id}/items`),
        fetch('/api/products/labels'),
        fetch(`/api/inventories?id=${id}`)
      ]);

      if (itemsRes.ok && labelsRes.ok && invRes.ok) {
        const itemsData = await itemsRes.json();
        const labelsData = await labelsRes.json();
        const invData = await invRes.json();
        
        setItems(itemsData);
        setLabels(labelsData);
        setFilteredItems(itemsData);
        if (invData && invData.length > 0) {
            setInventory(invData[0]);
        }
      } else {
        console.error("Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (key: string) => {
    const labelObj = labels.find(l => l.pr_fld === key);
    return labelObj ? (labelObj.pr_lab || labelObj.pr_des || key) : key;
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleStatusFilter = (key: 'inv_expected' | 'inv_unexpected' | 'inv_lost') => {
    setStatusFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const exportCSV = () => {
    if (filteredItems.length === 0) return;

    const allColumns = ['EPC', 'Product ID', 'fld01', 'fld02', 'fld03', 'fldd01', 'fldd02', 'inv_expected', 'inv_unexpected', 'inv_lost'];
    const headers = allColumns.map(col => {
        if (col === 'inv_expected') return 'Exp';
        if (col === 'inv_unexpected') return 'UnExp';
        if (col === 'inv_lost') return 'Lost';
        return getLabel(col);
    }).join(';');

    const rows = filteredItems.map(item => {
        return allColumns.map(col => {
            let val = item[col] || item[getLabel(col)];
            if (col === 'inv_expected' || col === 'inv_unexpected' || col === 'inv_lost') {
                val = val ? '1' : '0';
            }
            return `"${String(val || '').replaceAll('"', '""')}"`;
        }).join(';');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_${id}_items.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = ['EPC', 'Product ID', 'fld01', 'fld02', 'fld03', 'fldd01', 'fldd02'];

  if (loading) return <div className="p-10 text-center text-gray-500">Caricamento dettagli inventario...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-800">
            <ArrowLeft size={24} />
            </button>
            <div>
            <h1 className="text-2xl font-bold text-gray-800">Dettaglio Inventario</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-1">
                <span>ID: <span className="font-semibold text-gray-800">{id}</span></span>
                {inventory && <span>Nome: <span className="font-semibold text-gray-800">{inventory.inv_name}</span></span>}
                <div className="flex gap-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium" title="Totale Items">
                        Tot: {items.length}
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium" title="Expected">
                        Exp: {items.filter(i => i.inv_expected).length}
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium" title="Unexpected">
                        UnExp: {items.filter(i => i.inv_unexpected).length}
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium" title="Lost">
                        Lost: {items.filter(i => i.inv_lost).length}
                    </span>
                </div>
            </div>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={exportCSV}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
                <Download size={20} /> Export CSV
            </button>
            <button 
                onClick={() => router.push(`/inventories/${id}/items/aggregated`)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
                <Layers size={20} /> Vista Aggregata
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                {columns.map(col => (
                  <th key={col} className="px-4 py-4 text-sm font-bold text-gray-700 align-top">
                     <div className="flex flex-col gap-2">
                      <span>{getLabel(col)}</span>
                      <input 
                        type="text" 
                        placeholder="Filtra" 
                        className="text-xs font-normal p-1 border border-gray-300 rounded w-full"
                        value={filters[col] || ''}
                        onChange={(e) => handleFilterChange(col, e.target.value)}
                      />
                    </div>
                  </th>
                ))}
                
                {/* Status Headers with Toggle Buttons */}
                <th className="px-4 py-4 text-sm font-bold text-gray-700 w-16 text-center align-top">
                   <div className="flex flex-col gap-2 items-center">
                      <span className="text-green-600">Exp</span>
                      <button 
                        onClick={() => toggleStatusFilter('inv_expected')}
                        className={`p-1 rounded-full border transition-colors ${ 
                            statusFilters.inv_expected 
                            ? 'bg-green-100 border-green-500 text-green-600 shadow-inner' 
                            : 'bg-white border-gray-300 text-gray-400 hover:bg-gray-50'
                        }`}
                        title={statusFilters.inv_expected ? "Filtro Attivo: Mostra solo Expected" : "Clicca per filtrare"}
                      >
                        <CheckCircle size={20} fill={statusFilters.inv_expected ? "currentColor" : "none"} />
                      </button>
                   </div>
                </th>
                <th className="px-4 py-4 text-sm font-bold text-gray-700 w-16 text-center align-top">
                   <div className="flex flex-col gap-2 items-center">
                      <span className="text-yellow-600">UnExp</span>
                      <button 
                        onClick={() => toggleStatusFilter('inv_unexpected')}
                        className={`p-1 rounded-full border transition-colors ${ 
                            statusFilters.inv_unexpected 
                            ? 'bg-yellow-100 border-yellow-500 text-yellow-600 shadow-inner' 
                            : 'bg-white border-gray-300 text-gray-400 hover:bg-gray-50'
                        }`}
                        title={statusFilters.inv_unexpected ? "Filtro Attivo: Mostra solo Unexpected" : "Clicca per filtrare"}
                      >
                        <AlertTriangle size={20} fill={statusFilters.inv_unexpected ? "currentColor" : "none"} />
                      </button>
                   </div>
                </th>
                <th className="px-4 py-4 text-sm font-bold text-gray-700 w-16 text-center align-top">
                   <div className="flex flex-col gap-2 items-center">
                      <span className="text-red-600">Lost</span>
                      <button 
                        onClick={() => toggleStatusFilter('inv_lost')}
                        className={`p-1 rounded-full border transition-colors ${ 
                            statusFilters.inv_lost 
                            ? 'bg-red-100 border-red-500 text-red-600 shadow-inner' 
                            : 'bg-white border-gray-300 text-gray-400 hover:bg-gray-50'
                        }`}
                        title={statusFilters.inv_lost ? "Filtro Attivo: Mostra solo Lost" : "Clicca per filtrare"}
                      >
                        <XCircle size={20} fill={statusFilters.inv_lost ? "currentColor" : "none"} />
                      </button>
                   </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item, idx) => (
                <tr key={idx}>
                   {columns.map(col => (
                      <td key={col} className="px-4 py-2 text-sm text-gray-700">
                        {item[col] || item[getLabel(col)] || '-'}
                      </td>
                   ))}
                   <td className="px-4 py-2 text-center">
                      {item.inv_expected ? <CheckCircle size={18} className="text-green-500 mx-auto" /> : <span className="text-gray-200">-</span>}
                   </td>
                   <td className="px-4 py-2 text-center">
                      {item.inv_unexpected ? <AlertTriangle size={18} className="text-yellow-500 mx-auto" /> : <span className="text-gray-200">-</span>}
                   </td>
                   <td className="px-4 py-2 text-center">
                      {item.inv_lost ? <XCircle size={18} className="text-red-500 mx-auto" /> : <span className="text-gray-200">-</span>}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
