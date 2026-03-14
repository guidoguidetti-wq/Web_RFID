'use client';

import { useState, useEffect, useMemo } from 'react';
import { Pencil, Trash2, Plus, X, Save, ArrowLeft, Download } from 'lucide-react';
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
  product_fld01: string | null;
  product_fld02: string | null;
  product_fld03: string | null;
  product_fldd01: number | null;
}

interface Product { product_id: number; fld01: string; }
interface Checklist { chk_id: number; chk_code: string; chk_place: string; chk_zone: string; }

type FilterMode = 'all' | 'expected' | 'unexpected';

function productDescription(item: ChecklistProduct): string {
  return [item.product_fld01, item.product_fld02, item.product_fld03, item.product_fldd01]
    .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
    .join(' - ');
}

function calcMissing(item: ChecklistProduct): number | null {
  if (item.ckp_qta === null) return null;
  const exp   = item.ckp_qta_exp   ?? 0;
  const unexp = item.ckp_qta_unexp ?? 0;
  return item.ckp_qta - (exp + unexp);
}

export default function ChecklistProductsPage() {
  const params = useParams();
  const checklistId = params.id as string;

  const [checklist,   setChecklist]   = useState<Checklist | null>(null);
  const [data,        setData]        = useState<ChecklistProduct[]>([]);
  const [products,    setProducts]    = useState<Product[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem,     setNewItem]     = useState<any>(null);
  const [filterText,  setFilterText]  = useState('');
  const [filterMode,  setFilterMode]  = useState<FilterMode>('all');

  useEffect(() => { fetchAll(); }, [checklistId]);

  const fetchAll = async () => {
    try {
      const [ckpRes, prdRes, chkRes] = await Promise.all([
        fetch(`/api/checklists/${checklistId}/products`, { cache: 'no-store' }),
        fetch('/api/products?limit=9999',                { cache: 'no-store' }),
        fetch('/api/checklists',                         { cache: 'no-store' }),
      ]);
      const ckpData = await ckpRes.json();
      setData(Array.isArray(ckpData) ? ckpData : []);
      const prdData = await prdRes.json();
      setProducts(Array.isArray(prdData.products) ? prdData.products : []);
      const allChk = await chkRes.json();
      setChecklist(Array.isArray(allChk) ? (allChk.find((c: Checklist) => String(c.chk_id) === checklistId) ?? null) : null);
    } catch (e) {
      console.error('fetchAll error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (item: any, isNew: boolean) => {
    try {
      const res = await fetch(`/api/checklists/${checklistId}/products`, {
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
      console.error('handleSave error:', e);
      alert('Errore di rete');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questo prodotto dalla checklist?')) return;
    const res = await fetch(`/api/checklists/${checklistId}/products?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchAll();
  };

  const filteredData = useMemo(() => {
    let rows = data;
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      rows = rows.filter(r =>
        (`${r.ckp_product_id} ${productDescription(r)}`).toLowerCase().includes(q)
      );
    }
    if (filterMode === 'expected')   rows = rows.filter(r => (r.ckp_qta_exp   ?? 0) > 0);
    if (filterMode === 'unexpected') rows = rows.filter(r => (r.ckp_qta_unexp ?? 0) > 0);
    return rows;
  }, [data, filterText, filterMode]);

  const handleExportCSV = () => {
    const headers = ['ID Prodotto', 'Descrizione Prodotto', 'Qtà', 'Qtà Exp', 'Qtà Unexp', 'Qtà Missing'];
    const rows = filteredData.map(r => {
      const missing = calcMissing(r);
      return [
        r.ckp_product_id,
        productDescription(r),
        r.ckp_qta        ?? '',
        r.ckp_qta_exp    ?? '',
        r.ckp_qta_unexp  ?? '',
        missing          ?? '',
      ];
    });
    const csv = [headers, ...rows].map(row => row.join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `checklist_${checklistId}_products.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const numInput = (field: string, item: any, setItem: (v: any) => void) => (
    <input
      type="number"
      min={0}
      className="w-full px-1 py-0.5 border border-blue-300 rounded text-xs"
      placeholder="0"
      value={item[field] ?? ''}
      onChange={e => setItem({ ...item, [field]: e.target.value === '' ? null : Number(e.target.value) })}
    />
  );

  const FormRow = ({ item, setItem, isNew }: { item: any; setItem: (v: any) => void; isNew: boolean }) => (
    <>
      <td className="px-2 py-1 text-xs text-gray-500">{item.ckp_product_id || '—'}</td>
      <td className="px-2 py-1">
        <select
          className="w-full px-1 py-0.5 border border-blue-300 rounded text-xs"
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
      <td className="px-2 py-1">{numInput('ckp_qta',       item, setItem)}</td>
      <td className="px-2 py-1">{numInput('ckp_qta_exp',   item, setItem)}</td>
      <td className="px-2 py-1">{numInput('ckp_qta_unexp', item, setItem)}</td>
      <td className="px-2 py-1 text-xs text-red-500 text-center">—</td>
      <td className="px-2 py-1 text-right">
        <div className="flex justify-end gap-1">
          <button onClick={() => handleSave(item, isNew)} className="text-green-600 hover:text-green-800">
            <Save size={15} />
          </button>
          <button onClick={() => isNew ? setNewItem(null) : setEditingItem(null)} className="text-red-600 hover:text-red-800">
            <X size={15} />
          </button>
        </div>
      </td>
    </>
  );

  // Filter mode button styles
  const modeBtn = (mode: FilterMode, label: string, activeClass: string, inactiveClass: string) => {
    const active = filterMode === mode;
    return (
      <button
        onClick={() => setFilterMode(mode)}
        className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
          active ? activeClass : inactiveClass
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-3">
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
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download size={16} /> CSV
          </button>
          <button
            onClick={() => setNewItem({})}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus size={18} /> Aggiungi
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <input
          type="text"
          placeholder="Filtra prodotto..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <div className="flex items-center gap-1">
          {modeBtn('all',        'Tutti',
            'bg-gray-500 text-white border-gray-500',
            'bg-white text-gray-600 border-gray-300 hover:bg-gray-100')}
          {modeBtn('expected',   'Expected > 0',
            'bg-green-600 text-white border-green-600',
            'bg-white text-green-700 border-green-400 hover:bg-green-50')}
          {modeBtn('unexpected', 'Unexpected > 0',
            'bg-orange-500 text-white border-orange-500',
            'bg-white text-orange-600 border-orange-400 hover:bg-orange-50')}
        </div>
        <span className="text-xs text-gray-400">{filteredData.length} righe</span>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-xs font-semibold text-gray-600">ID Prodotto</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-600">Descrizione Prodotto</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-600 text-center">Qtà</th>
              <th className="px-3 py-2 text-xs font-semibold text-green-700 text-center">Qtà Exp</th>
              <th className="px-3 py-2 text-xs font-semibold text-orange-600 text-center">Qtà Unexp</th>
              <th className="px-3 py-2 text-xs font-semibold text-red-600 text-center">Qtà Missing</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-600 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {newItem && (
              <tr className="bg-blue-50">
                <FormRow item={newItem} setItem={setNewItem} isNew={true} />
              </tr>
            )}
            {filteredData.map(item => {
              const missing = calcMissing(item);
              return (
                <tr key={item.ckp_id} className="hover:bg-gray-50 transition-colors">
                  {editingItem?.ckp_id === item.ckp_id ? (
                    <FormRow item={editingItem} setItem={setEditingItem} isNew={false} />
                  ) : (
                    <>
                      <td className="px-3 py-1 text-xs text-gray-500 font-mono">{item.ckp_product_id}</td>
                      <td className="px-3 py-1 text-xs text-gray-700 font-medium">{productDescription(item)}</td>
                      <td className="px-3 py-1 text-xs text-gray-700 text-center">{item.ckp_qta ?? '-'}</td>
                      <td className="px-3 py-1 text-xs text-green-700 text-center font-medium">{item.ckp_qta_exp ?? '-'}</td>
                      <td className="px-3 py-1 text-xs text-orange-600 text-center font-medium">{item.ckp_qta_unexp ?? '-'}</td>
                      <td className="px-3 py-1 text-xs text-red-600 text-center font-bold">{missing ?? '-'}</td>
                      <td className="px-3 py-1 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingItem({ ...item })} className="text-blue-600 hover:text-blue-800">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(item.ckp_id)} className="text-red-600 hover:text-red-800">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <div className="p-8 text-center text-gray-500 text-sm">Caricamento...</div>}
        {!loading && filteredData.length === 0 && !newItem && (
          <div className="p-8 text-center text-gray-500 text-sm">Nessun prodotto trovato.</div>
        )}
      </div>
    </div>
  );
}
