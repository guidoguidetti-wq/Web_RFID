'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, X, Pencil, ArrowLeft } from 'lucide-react';

interface UserFunction {
  usr_f_usr_id: number;
  usr_f_fun_id: number;
  usr_f_prog: number;
  usr_f_label: string;
  usr_f_enabled: boolean;
}

export default function UserFunzioniPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [functions, setFunctions] = useState<UserFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFunId, setEditingFunId] = useState<number | null>(null);
  const [editingRow, setEditingRow] = useState<UserFunction | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFunctions();
  }, [id]);

  const fetchFunctions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user-functions?usr_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setFunctions(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento funzioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fn: UserFunction) => {
    setEditingFunId(fn.usr_f_fun_id);
    setEditingRow({ ...fn });
  };

  const handleCancel = () => {
    setEditingFunId(null);
    setEditingRow(null);
  };

  const handleSave = async () => {
    if (!editingRow) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user-functions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRow),
      });
      if (res.ok) {
        await fetchFunctions();
        setEditingFunId(null);
        setEditingRow(null);
      }
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/utenti')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Utenti</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          Funzioni Utente #{id}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Prog. Funzione</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Funzione</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Abilitata</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {functions.map((fn) => (
              <tr key={fn.usr_f_fun_id} className="hover:bg-gray-50 transition-colors">
                {editingFunId === fn.usr_f_fun_id && editingRow ? (
                  <>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        className="w-full p-2 border border-blue-300 rounded"
                        value={editingRow.usr_f_prog}
                        onChange={(e) => setEditingRow({ ...editingRow, usr_f_prog: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        className="w-full p-2 border border-blue-300 rounded"
                        value={editingRow.usr_f_label}
                        onChange={(e) => setEditingRow({ ...editingRow, usr_f_label: e.target.value })}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        className="w-5 h-5 cursor-pointer"
                        checked={editingRow.usr_f_enabled}
                        onChange={(e) => setEditingRow({ ...editingRow, usr_f_enabled: e.target.checked })}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                          <Save size={20} />
                        </button>
                        <button onClick={handleCancel} className="text-red-600 hover:text-red-800">
                          <X size={20} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-sm text-gray-700">{fn.usr_f_prog}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{fn.usr_f_label}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block w-5 h-5 rounded border-2 ${
                          fn.usr_f_enabled
                            ? 'bg-green-500 border-green-600'
                            : 'bg-white border-gray-300'
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(fn)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil size={18} />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-10 text-center text-gray-500">Caricamento in corso...</div>}
        {!loading && functions.length === 0 && (
          <div className="p-10 text-center text-gray-500">Nessuna funzione trovata.</div>
        )}
      </div>
    </div>
  );
}
