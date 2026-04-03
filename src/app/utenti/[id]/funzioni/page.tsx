'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';

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
  const [rows, setRows] = useState<UserFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirtyRows, setDirtyRows] = useState<Set<number>>(new Set());
  const [savingRows, setSavingRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchFunctions();
  }, [id]);

  const fetchFunctions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user-functions?usr_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data);
        setDirtyRows(new Set());
      }
    } catch (error) {
      console.error('Errore nel caricamento funzioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (funId: number, field: keyof UserFunction, value: any) => {
    setRows(prev => prev.map(r => r.usr_f_fun_id === funId ? { ...r, [field]: value } : r));
    setDirtyRows(prev => new Set(prev).add(funId));
  };

  const handleSave = async (row: UserFunction) => {
    setSavingRows(prev => new Set(prev).add(row.usr_f_fun_id));
    try {
      const res = await fetch('/api/user-functions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      });
      if (res.ok) {
        setDirtyRows(prev => {
          const next = new Set(prev);
          next.delete(row.usr_f_fun_id);
          return next;
        });
      }
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
    } finally {
      setSavingRows(prev => {
        const next = new Set(prev);
        next.delete(row.usr_f_fun_id);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => router.push('/utenti')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Utenti</span>
        </button>
        <h1 className="text-xl font-bold text-gray-800">Funzioni Utente #{id}</h1>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-2 py-2 font-semibold text-gray-600 w-28">Prog. Funzione</th>
              <th className="px-2 py-2 font-semibold text-gray-600">Funzione</th>
              <th className="px-2 py-2 font-semibold text-gray-600 text-center w-20">Abilitata</th>
              <th className="px-2 py-2 font-semibold text-gray-600 text-right w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.usr_f_fun_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-2 py-1">
                  <input
                    type="number"
                    className="w-full px-1 py-0.5 border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                    value={row.usr_f_prog}
                    onChange={(e) => handleChange(row.usr_f_fun_id, 'usr_f_prog', Number(e.target.value))}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    className="w-full px-1 py-0.5 border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                    value={row.usr_f_label}
                    onChange={(e) => handleChange(row.usr_f_fun_id, 'usr_f_label', e.target.value)}
                  />
                </td>
                <td className="px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer"
                    checked={row.usr_f_enabled}
                    onChange={(e) => handleChange(row.usr_f_fun_id, 'usr_f_enabled', e.target.checked)}
                  />
                </td>
                <td className="px-2 py-1 text-right">
                  {dirtyRows.has(row.usr_f_fun_id) && (
                    <button
                      onClick={() => handleSave(row)}
                      disabled={savingRows.has(row.usr_f_fun_id)}
                      className="text-green-600 hover:text-green-800 disabled:opacity-40"
                      title="Salva"
                    >
                      <Save size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-6 text-center text-gray-500">Caricamento in corso...</div>}
        {!loading && rows.length === 0 && (
          <div className="p-6 text-center text-gray-500">Nessuna funzione trovata.</div>
        )}
      </div>
    </div>
  );
}
