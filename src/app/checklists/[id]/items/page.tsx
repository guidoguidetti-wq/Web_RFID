'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Pencil, Trash2, Plus, X, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ColInfo { column_name: string; data_type: string; }

const PK = 'chi_id';
const FK = 'chi_chk_id';

export default function ChecklistItemsPage() {
  const params = useParams();
  const checklistId = params.id as string;

  const [columns,     setColumns]     = useState<ColInfo[]>([]);
  const [items,       setItems]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem,     setNewItem]     = useState<any>(null);

  useEffect(() => { fetchAll(); }, [checklistId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/checklists/${checklistId}/items`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Errore caricamento');
        return;
      }
      setColumns(data.columns || []);
      setItems(data.items || []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Editable columns: all except PK
  const editableCols = columns.filter(c => c.column_name !== PK);
  // Display columns: all except FK (we know it from the URL)
  const displayCols = columns.filter(c => c.column_name !== FK);

  const handleSave = async (item: any, isNew: boolean) => {
    try {
      const res = await fetch(`/api/checklists/${checklistId}/items`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        await fetchAll();
        setEditingItem(null);
        setNewItem(null);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Errore nel salvataggio');
      }
    } catch (e) {
      alert('Errore di rete');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questo record?')) return;
    const res = await fetch(`/api/checklists/${checklistId}/items?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchAll();
    else alert('Errore nella cancellazione');
  };

  const cellInput = (col: ColInfo, item: any, setItem: (v: any) => void) => {
    const isNumeric = ['integer', 'bigint', 'numeric', 'real', 'double precision'].includes(col.data_type);
    const isDate = col.data_type.startsWith('timestamp') || col.data_type === 'date';
    return (
      <input
        type={isDate ? 'datetime-local' : isNumeric ? 'number' : 'text'}
        className="w-full px-1 py-0 border border-blue-300 rounded text-xs"
        value={item[col.column_name] ?? ''}
        onChange={e => setItem({ ...item, [col.column_name]: e.target.value === '' ? null : e.target.value })}
      />
    );
  };

  const FormCells = ({ item, setItem, isNew }: { item: any; setItem: (v: any) => void; isNew: boolean }) => (
    <>
      {displayCols.map(col =>
        col.column_name === PK ? (
          <td key={col.column_name} className="px-1 py-0 text-xs text-gray-400">{item[PK] || '—'}</td>
        ) : (
          <td key={col.column_name} className="px-1 py-0">{cellInput(col, item, setItem)}</td>
        )
      )}
      <td className="px-1 py-0 text-right">
        <div className="flex justify-end gap-1">
          <button onClick={() => handleSave(item, isNew)} className="text-green-600 hover:text-green-800">
            <Save size={14} />
          </button>
          <button onClick={() => isNew ? setNewItem(null) : setEditingItem(null)} className="text-red-600 hover:text-red-800">
            <X size={14} />
          </button>
        </div>
      </td>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="flex items-center gap-3 mb-3">
        <Link href="/checklists" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Checklist Items — #{checklistId}</h1>
        <div className="ml-auto">
          <button
            onClick={() => setNewItem({ [FK]: checklistId })}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition text-sm"
          >
            <Plus size={16} /> Aggiungi
          </button>
        </div>
      </div>

      {error && <div className="mb-3 p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {displayCols.map(col => (
                  <th key={col.column_name} className="px-2 py-1 text-xs font-semibold text-gray-600 whitespace-nowrap">
                    {col.column_name}
                  </th>
                ))}
                <th className="px-2 py-1 text-xs font-semibold text-gray-600 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {newItem && (
                <tr className="bg-blue-50">
                  <FormCells item={newItem} setItem={setNewItem} isNew={true} />
                </tr>
              )}
              {items.map(item => (
                <tr key={item[PK]} className="hover:bg-gray-50">
                  {editingItem?.[PK] === item[PK] ? (
                    <FormCells item={editingItem} setItem={setEditingItem} isNew={false} />
                  ) : (
                    <>
                      {displayCols.map(col => (
                        <td key={col.column_name} className="px-2 py-0.5 text-xs text-gray-700 whitespace-nowrap">
                          {item[col.column_name] ?? '—'}
                        </td>
                      ))}
                      <td className="px-2 py-0.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEditingItem({ ...item })} className="text-blue-600 hover:text-blue-800">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(item[PK])} className="text-red-600 hover:text-red-800">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="p-6 text-center text-gray-500 text-xs">Caricamento...</div>}
        {!loading && items.length === 0 && !newItem && !error && (
          <div className="p-6 text-center text-gray-500 text-xs">Nessun record trovato.</div>
        )}
      </div>
    </div>
  );
}
