'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Save, FileText } from 'lucide-react';
import Link from 'next/link';

interface Checklist {
  chk_id: number;
  chk_code: string;
  chk_place: string;
  chk_zone: string;
  chk_notes: string;
  chk_creationdate: string;
}

interface Place { place_id: number; place_name: string; }
interface Zone  { zone_id: number;  zone_name: string;  }

export default function ChecklistsPage() {
  const [data,         setData]         = useState<Checklist[]>([]);
  const [places,       setPlaces]       = useState<Place[]>([]);
  const [zones,        setZones]        = useState<Zone[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [editingItem,  setEditingItem]  = useState<any>(null);
  const [newItem,      setNewItem]      = useState<any>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [chkRes, plcRes, znsRes] = await Promise.all([
      fetch('/api/checklists'),
      fetch('/api/places'),
      fetch('/api/zones'),
    ]);
    const chkData = await chkRes.json();
    const plcData = await plcRes.json();
    const znsData = await znsRes.json();
    setData(Array.isArray(chkData) ? chkData : []);
    setPlaces(Array.isArray(plcData) ? plcData : []);
    setZones(Array.isArray(znsData) ? znsData : []);
    setLoading(false);
  };

  const handleSave = async (item: any, isNew: boolean) => {
    const res = await fetch('/api/checklists', {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (res.ok) { fetchAll(); setEditingItem(null); setNewItem(null); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questa checklist?')) return;
    const res = await fetch(`/api/checklists?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchAll();
  };

  const FormRow = ({ item, setItem, isNew }: { item: any; setItem: (v: any) => void; isNew: boolean }) => (
    <>
      <td className="px-4 py-2">
        <input
          className="w-full p-1.5 border border-blue-300 rounded text-sm"
          placeholder="Codice *"
          value={item.chk_code || ''}
          onChange={e => setItem({ ...item, chk_code: e.target.value })}
        />
      </td>
      <td className="px-4 py-2">
        <select
          className="w-full p-1.5 border border-blue-300 rounded text-sm"
          value={item.chk_place || ''}
          onChange={e => setItem({ ...item, chk_place: e.target.value })}
        >
          <option value="">-- Place --</option>
          {places.map(p => <option key={p.place_id} value={p.place_name}>{p.place_name}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <select
          className="w-full p-1.5 border border-blue-300 rounded text-sm"
          value={item.chk_zone || ''}
          onChange={e => setItem({ ...item, chk_zone: e.target.value })}
        >
          <option value="">-- Zone --</option>
          {zones.map(z => <option key={z.zone_id} value={z.zone_name}>{z.zone_name}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <input
          className="w-full p-1.5 border border-blue-300 rounded text-sm"
          placeholder="Note"
          value={item.chk_notes || ''}
          onChange={e => setItem({ ...item, chk_notes: e.target.value })}
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="date"
          className="w-full p-1.5 border border-blue-300 rounded text-sm"
          value={item.chk_creationdate || ''}
          onChange={e => setItem({ ...item, chk_creationdate: e.target.value })}
        />
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-2">
          <button onClick={() => handleSave(item, isNew)} className="text-green-600 hover:text-green-800">
            <Save size={18} />
          </button>
          <button onClick={() => isNew ? setNewItem(null) : setEditingItem(null)} className="text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </div>
      </td>
    </>
  );

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('it-IT') : '';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestione CheckLists</h1>
        <button
          onClick={() => setNewItem({ chk_creationdate: today })}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> Aggiungi
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">Codice</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">Place</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">Zone</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">Note</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">Data Creazione</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {newItem && (
              <tr className="bg-blue-50">
                <FormRow item={newItem} setItem={setNewItem} isNew={true} />
              </tr>
            )}
            {data.map(item => (
              <tr key={item.chk_id} className="hover:bg-gray-50 transition-colors">
                {editingItem?.chk_id === item.chk_id ? (
                  <FormRow item={editingItem} setItem={setEditingItem} isNew={false} />
                ) : (
                  <>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">{item.chk_code}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.chk_place}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.chk_zone}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.chk_notes}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(item.chk_creationdate)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/checklists/${item.chk_id}/products`}
                          className="text-purple-600 hover:text-purple-800"
                          title="Dettagli prodotti"
                        >
                          <FileText size={18} />
                        </Link>
                        <button onClick={() => setEditingItem({ ...item, chk_creationdate: item.chk_creationdate?.split('T')[0] ?? '' })} className="text-blue-600 hover:text-blue-800">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(item.chk_id)} className="text-red-600 hover:text-red-800">
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
        {loading && <div className="p-10 text-center text-gray-500">Caricamento...</div>}
        {!loading && data.length === 0 && !newItem && (
          <div className="p-10 text-center text-gray-500">Nessuna checklist trovata.</div>
        )}
      </div>
    </div>
  );
}
