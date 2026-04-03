'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

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
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    fetchFunctions();
    fetchUserName();
  }, [id]);

  const fetchUserName = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const users = await res.json();
        const user = users.find((u: any) => String(u.usr_id) === String(id));
        if (user) setUserName(user.usr_name);
      }
    } catch {
      // noop
    }
  };

  const fetchFunctions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user-functions?usr_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento funzioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRow = async (row: UserFunction) => {
    try {
      await fetch('/api/user-functions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      });
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
    }
  };

  const handleChange = (funId: number, field: keyof UserFunction, value: any) => {
    setRows(prev => prev.map(r => r.usr_f_fun_id === funId ? { ...r, [field]: value } : r));
  };

  const handleBlur = (row: UserFunction) => {
    saveRow(row);
  };

  const handleCheckboxChange = (funId: number, checked: boolean) => {
    const updatedRows = rows.map(r => r.usr_f_fun_id === funId ? { ...r, usr_f_enabled: checked } : r);
    setRows(updatedRows);
    const row = updatedRows.find(r => r.usr_f_fun_id === funId);
    if (row) saveRow(row);
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
        <h1 className="text-xl font-bold text-gray-800">
          Funzioni Utente — {userName || `#${id}`}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-2 py-2 font-semibold text-gray-600 w-28">Prog. Funzione</th>
              <th className="px-2 py-2 font-semibold text-gray-600 text-center w-20">Abilitata</th>
              <th className="px-2 py-2 font-semibold text-gray-600">Funzione</th>
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
                    onBlur={() => handleBlur(row)}
                  />
                </td>
                <td className="px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer"
                    checked={row.usr_f_enabled}
                    onChange={(e) => handleCheckboxChange(row.usr_f_fun_id, e.target.checked)}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    className="w-full px-1 py-0.5 border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                    value={row.usr_f_label}
                    onChange={(e) => handleChange(row.usr_f_fun_id, 'usr_f_label', e.target.value)}
                    onBlur={() => handleBlur(row)}
                  />
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
