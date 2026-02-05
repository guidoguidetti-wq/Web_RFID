'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Save } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'password' | 'select';
  isId?: boolean;
  options?: { label: string; value: any }[];
}

interface ManagementTableProps {
  title: string;
  columns: Column[];
  apiEndpoint: string;
}

export default function ManagementTable({ title, columns, apiEndpoint }: ManagementTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(apiEndpoint);
      const result = await response.json();
      setData(result);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleSave = async (item: any, isNew: boolean) => {
    try {
      const method = isNew ? 'POST' : 'PUT';
      const response = await fetch(apiEndpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (response.ok) {
        fetchData();
        setEditingItem(null);
        setNewItem(null);
      }
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Sei sicuro di voler eliminare questo elemento?')) return;
    try {
      const response = await fetch(`${apiEndpoint}?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        </div>
        <button
          onClick={() => setNewItem({})}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> Aggiungi
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-bottom border-gray-200">
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4 text-sm font-semibold text-gray-600">
                  {col.label}
                </th>
              ))}
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {newItem && (
              <tr className="bg-blue-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4">
                    {col.type === 'select' ? (
                      <select
                        className="w-full p-2 border border-blue-300 rounded"
                        onChange={(e) => setNewItem({ ...newItem, [col.key]: e.target.value })}
                        defaultValue=""
                      >
                        <option value="" disabled>Seleziona {col.label}</option>
                        {col.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={col.type || 'text'}
                        className="w-full p-2 border border-blue-300 rounded"
                        placeholder={col.label}
                        onChange={(e) => setNewItem({ ...newItem, [col.key]: e.target.value })}
                      />
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => handleSave(newItem, true)} className="text-green-600 hover:text-green-800">
                    <Save size={20} />
                  </button>
                  <button onClick={() => setNewItem(null)} className="text-red-600 hover:text-red-800">
                    <X size={20} />
                  </button>
                </td>
              </tr>
            )}
            {data.map((item) => (
              <tr key={item[columns.find(c => c.isId)?.key || 'id']} className="hover:bg-gray-50 transition-colors">
                {editingItem && editingItem[columns.find(c => c.isId)?.key || 'id'] === item[columns.find(c => c.isId)?.key || 'id'] ? (
                  <>
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4">
                        {col.type === 'select' ? (
                          <select
                            className="w-full p-2 border border-blue-300 rounded"
                            value={editingItem[col.key] || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, [col.key]: e.target.value })}
                          >
                            <option value="" disabled>Seleziona {col.label}</option>
                            {col.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={col.type || 'text'}
                            className="w-full p-2 border border-blue-300 rounded"
                            value={editingItem[col.key] || ''}
                            disabled={col.isId}
                            onChange={(e) => setEditingItem({ ...editingItem, [col.key]: e.target.value })}
                          />
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleSave(editingItem, false)} className="text-green-600 hover:text-green-800">
                        <Save size={20} />
                      </button>
                      <button onClick={() => setEditingItem(null)} className="text-red-600 hover:text-red-800">
                        <X size={20} />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 text-sm text-gray-700">
                        {col.type === 'password' ? '********' : (
                          col.type === 'select' 
                            ? col.options?.find(o => String(o.value) === String(item[col.key]))?.label || item[col.key]
                            : item[col.key]
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setEditingItem(item)} className="text-blue-600 hover:text-blue-800">
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item[columns.find(c => c.isId)?.key || 'id'])} 
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-10 text-center text-gray-500">Caricamento in corso...</div>}
        {!loading && data.length === 0 && !newItem && (
          <div className="p-10 text-center text-gray-500">Nessun dato trovato.</div>
        )}
      </div>
    </div>
  );
}
