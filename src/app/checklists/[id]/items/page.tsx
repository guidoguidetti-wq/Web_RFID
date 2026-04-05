'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Pencil, Trash2, Plus, X, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const PK = 'ckp_id';
const FK = 'ckp_chl_id';

interface Item {
  ckp_id: number;
  ckp_chl_id: number;
  ckp_epc_id: string | null;
  ckp_qta: number | null;
  ckp_qta_exp: number | null;
  ckp_qta_unexp: number | null;
  ckp_qta_missing: number | null;
  item_product_id: string | null;
  product_fld01: string | null;
  product_fld02: string | null;
  product_fld03: string | null;
  product_fldd01: number | null;
}

function productDescription(item: Item): string {
  return [item.product_fld01, item.product_fld02, item.product_fld03, item.product_fldd01]
    .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
    .join(' - ');
}

export default function ChecklistItemsPage() {
  const params  = useParams();
  const chkId   = params.id as string;

  const [items,       setItems]       = useState<Item[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [newItem,     setNewItem]     = useState<Partial<Item> | null>(null);

  useEffect(() => { fetchAll(); }, [chkId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`/api/checklists/${chkId}/items`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || data.error || 'Errore caricamento'); return; }
      setItems(data.items || []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (item: any, isNew: boolean) => {
    const res = await fetch(`/api/checklists/${chkId}/items`, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (res.ok) { await fetchAll(); setEditingItem(null); setNewItem(null); }
    else { const e = await res.json().catch(() => ({})); alert(e.detail || e.error || 'Errore'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questo record?')) return;
    const res = await fetch(`/api/checklists/${chkId}/items?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchAll();
    else alert('Errore nella cancellazione');
  };

  const numInput = (field: keyof Item, item: any, setItem: (v: any) => void) => (
    <input
      type="number"
      className="w-full px-1 py-0 border border-blue-300 rounded text-xs"
      value={item[field] ?? ''}
      onChange={e => setItem({ ...item, [field]: e.target.value === '' ? null : Number(e.target.value) })}
    />
  );

  const FormRow = ({ item, setItem, isNew }: { item: any; setItem: (v: any) => void; isNew: boolean }) => (
    <>
      <td className="px-2 py-0.5 text-xs text-gray-400">{item[PK] || '—'}</td>
      <td className="px-1 py-0.5">
        <input
          type="text"
          className="w-full px-1 py-0 border border-blue-300 rounded text-xs"
          placeholder="EPC"
          value={item.ckp_epc_id ?? ''}
          onChange={e => setItem({ ...item, ckp_epc_id: e.target.value || null })}
        />
      </td>
      <td className="px-2 py-0.5 text-xs text-gray-400">{item.item_product_id ?? '—'}</td>
      <td className="px-2 py-0.5 text-xs text-gray-400">{productDescription(item) || '—'}</td>
      <td className="px-1 py-0.5">{numInput('ckp_qta',         item, setItem)}</td>
      <td className="px-1 py-0.5">{numInput('ckp_qta_exp',     item, setItem)}</td>
      <td className="px-1 py-0.5">{numInput('ckp_qta_unexp',   item, setItem)}</td>
      <td className="px-1 py-0.5">{numInput('ckp_qta_missing', item, setItem)}</td>
      <td className="px-1 py-0.5 text-right">
        <div className="flex justify-end gap-1">
          <button onClick={() => handleSave(item, isNew)} className="text-green-600 hover:text-green-800"><Save size={14} /></button>
          <button onClick={() => isNew ? setNewItem(null) : setEditingItem(null)} className="text-red-600 hover:text-red-800"><X size={14} /></button>
        </div>
      </td>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="flex items-center gap-3 mb-3">
        <Link href="/checklists" className="text-gray-500 hover:text-gray-700"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-gray-800">Checklist Items — #{chkId}</h1>
        <div className="ml-auto">
          <button
            onClick={() => setNewItem({ [FK]: Number(chkId) })}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition text-sm"
          >
            <Plus size={16} /> Aggiungi
          </button>
        </div>
      </div>

      {error && <div className="mb-3 p-3 bg-red-50 border border-red-300 rounded text-red-700 text-xs font-mono">{error}</div>}

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-2 py-1 text-xs font-semibold text-gray-600">ID</th>
                <th className="px-2 py-1 text-xs font-semibold text-gray-600">EPC</th>
                <th className="px-2 py-1 text-xs font-semibold text-gray-600">ID Prodotto</th>
                <th className="px-2 py-1 text-xs font-semibold text-gray-600">Descrizione Prodotto</th>
                <th className="px-2 py-1 text-xs font-semibold text-gray-600 text-center">Qtà</th>
                <th className="px-2 py-1 text-xs font-semibold text-green-700 text-center">Qtà Exp</th>
                <th className="px-2 py-1 text-xs font-semibold text-orange-600 text-center">Qtà Unexp</th>
                <th className="px-2 py-1 text-xs font-semibold text-red-600 text-center">Qtà Missing</th>
                <th className="px-2 py-1 text-xs font-semibold text-gray-600 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {newItem && (
                <tr className="bg-blue-50">
                  <FormRow item={newItem} setItem={setNewItem} isNew={true} />
                </tr>
              )}
              {items.map(item => (
                <tr key={item[PK]} className="hover:bg-gray-50">
                  {editingItem?.[PK] === item[PK] ? (
                    <FormRow item={editingItem} setItem={setEditingItem as any} isNew={false} />
                  ) : (
                    <>
                      <td className="px-2 py-0.5 text-xs text-gray-400 font-mono">{item.ckp_id}</td>
                      <td className="px-2 py-0.5 text-xs text-gray-700 font-mono">{item.ckp_epc_id ?? '—'}</td>
                      <td className="px-2 py-0.5 text-xs text-gray-500">{item.item_product_id ?? '—'}</td>
                      <td className="px-2 py-0.5 text-xs text-gray-700">{productDescription(item) || '—'}</td>
                      <td className="px-2 py-0.5 text-xs text-gray-700 text-center">{item.ckp_qta ?? '—'}</td>
                      <td className="px-2 py-0.5 text-xs text-green-700 text-center">{item.ckp_qta_exp ?? '—'}</td>
                      <td className="px-2 py-0.5 text-xs text-orange-600 text-center">{item.ckp_qta_unexp ?? '—'}</td>
                      <td className="px-2 py-0.5 text-xs text-red-600 text-center">{item.ckp_qta_missing ?? '—'}</td>
                      <td className="px-2 py-0.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEditingItem({ ...item })} className="text-blue-600 hover:text-blue-800"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(item.ckp_id)} className="text-red-600 hover:text-red-800"><Trash2 size={13} /></button>
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
