'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ChecklistProduct {
  ckp_id: number;
  ckp_chl_id: number;
  ckp_product_id: number;
  ckp_qta: number | null;
  ckp_qta_exp: number | null;
  ckp_qta_unexp: number | null;
  ckp_qta_missing: number | null;
  product_name: string;
}

interface Product { product_id: number; fld01: string; }
interface Checklist { chk_id: number; chk_code: string; chk_place: string; chk_zone: string; }

export default function ChecklistProductsPage() {
  const params = useParams();
  const checklistId = params.id as string;

  const [checklist,    setChecklist]    = useState<Checklist | null>(null);
  const [data,         setData]         = useState<ChecklistProduct[]>([]);
  const [products,     setProducts]     = useState<Product[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [editingItem,  setEditingItem]  = useState<any>(null);
  const [newItem,      setNewItem]      = useState<any>(null);

  useEffect(() => { fetchAll(); }, [checklistId]);

  const fetchAll = async () => {
    const [ckpRes, prdRes, chkRes] = await Promise.all([
      fetch(`/api/checklists/${checklistId}/products`),
      fetch('/api/products?limit=9999'),
      fetch('/api/checklists'),
    ]);
    setData(await ckpRes.json());
    const prdData = await prdRes.json();
    setProducts(prdData.products || []);
    const allChk: Checklist[] = await chkRes.json();
    setChecklist(allChk.find(c => String(c.chk_id) === checklistId) ?? null);
    setLoading(false);
  };

  const handleSave = async (item: any, isNew: boolean) => {
    const url = `/api/checklists/${checklistId}/products`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (res.ok) { fetchAll(); setEditingItem(null); setNewItem(null); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questo prodotto dalla checklist?')) return;
    const res = await fetch(`/api/checklists/${checklistId}/products?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchAll();
  };

  const numInput = (field: string, item: any, setItem: (v: any) => void) => (
    <input
      type="number"
      min={0}
      className="w-full p-1.5 border border-blue-300 rounded text-sm"
      placeholder="0"
      value={item[field] ?? ''}
      onChange={e => setItem({ ...item, [field]: e.target.value === '' ? null : Number(e.target.value) })}
    />
  );

  const FormRow = ({ item, setItem, isNew }: { item: any; setItem: (v: any) => void; isNew: boolean }) => (
    <>
      <td className="px-4 py-2">
        <select
          className="w-full p-1.5 border border-blue-300 rounded text-sm"
          value={item.ckp_product_id || ''}
          onChange={e => setItem({ ...item, ckp_product_id: Number(e.target.value) })}
        >
          <option value="">-- Prodotto --</option>
          {products.map(p => (
            <option key={p.product_id} value={p.product_id}>
              {p.product_id} - {p.fld01}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2">{numInput('ckp_qta',         item, setItem)}</td>
      <td className="px-4 py-2">{numInput('ckp_qta_exp',     item, setItem)}</td>
      <td className="px-4 py-2">{numInput('ckp_qta_unexp',   item, setItem)}</td>
      <td className="px-4 py-2">{numInput('ckp_qta_missing', item, setItem)}</td>
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link href="/checklists" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={22} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Prodotti Checklist</h1>
          {checklist && (
            <p className="text-sm text-gray-500 mt-0.5">
              {checklist.chk_code}
              {checklist.chk_place && ` · ${checklist.chk_place}`}
              {checklist.chk_zone  && ` · ${checklist.chk_zone}`}
            </p>
          )}
        </div>
        <button
          onClick={() => setNewItem({})}
          className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> Aggiungi
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200 mt-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">Prodotto</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Qtà</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Qtà Exp</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Qtà Unexp</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Qtà Missing</th>
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
              <tr key={item.ckp_id} className="hover:bg-gray-50 transition-colors">
                {editingItem?.ckp_id === item.ckp_id ? (
                  <FormRow item={editingItem} setItem={setEditingItem} isNew={false} />
                ) : (
                  <>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                      {item.ckp_product_id} - {item.product_name ?? ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center">{item.ckp_qta ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center">{item.ckp_qta_exp ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center">{item.ckp_qta_unexp ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center">{item.ckp_qta_missing ?? '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setEditingItem({ ...item })} className="text-blue-600 hover:text-blue-800">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(item.ckp_id)} className="text-red-600 hover:text-red-800">
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
          <div className="p-10 text-center text-gray-500">Nessun prodotto nella checklist.</div>
        )}
      </div>
    </div>
  );
}
