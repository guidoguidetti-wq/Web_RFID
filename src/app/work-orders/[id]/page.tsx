'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X,
  Loader2, AlertTriangle, CheckCircle2, Package,
  Printer, Hash, CheckCheck,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface WorkOrder {
  wo_id: number;
  wo_number: string;
  wo_title: string;
  wo_description: string | null;
  wo_status: string;
  wo_priority: string;
  wo_assigned_to: string | null;
  wo_due_date: string | null;
}

interface Raw {
  wor_id: number;
  wor_wo_id: number;
  wor_sku: string;
  wor_qta: number;
  wor_printed: number;
  sku_description: string | null;
  sku_info: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  'APERTO':    'bg-blue-100 text-blue-700',
  'IN CORSO':  'bg-amber-100 text-amber-700',
  'CHIUSO':    'bg-green-100 text-green-700',
  'ANNULLATO': 'bg-gray-200 text-gray-500',
};
const PRIORITY_STYLE: Record<string, string> = {
  'BASSA':   'bg-gray-100 text-gray-500',
  'NORMALE': 'bg-sky-100 text-sky-700',
  'ALTA':    'bg-orange-100 text-orange-700',
  'URGENTE': 'bg-red-100 text-red-700',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [wo, setWo]               = useState<WorkOrder | null>(null);
  const [raws, setRaws]           = useState<Raw[]>([]);
  const [loading, setLoading]     = useState(true);
  const [rawsLoading, setRawsLoading] = useState(true);
  const [error, setError]         = useState('');

  // Add-row form state
  const [addSku, setAddSku]           = useState('');
  const [addQta, setAddQta]           = useState<number>(1);
  const [addPrinted, setAddPrinted]   = useState<number>(0);
  const [addError, setAddError]       = useState('');
  const [addSaving, setAddSaving]     = useState(false);

  // Inline-edit state: wor_id → field → value
  const [editing, setEditing] = useState<Record<number, { wor_sku?: string; wor_qta?: number; wor_printed?: number }>>({});
  const [savingRow, setSavingRow] = useState<number | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ── Load work order ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/work-orders?filter_wo_id=`);
      // Fetch single WO via generic list endpoint isn't ideal – use direct query
      const res2 = await fetch(`/api/work-orders?page=1&limit=1&filter_wo_number=`);
      // Actually: load all and filter, or add single-WO endpoint
      // Better: get list and find by id from a large page
      const r = await fetch(`/api/work-orders?page=1&limit=9999`);
      if (r.ok) {
        const data = await r.json();
        const found = data.workOrders?.find((w: WorkOrder) => w.wo_id === Number(id));
        if (found) setWo(found);
        else setError('Work order non trovato.');
      } else {
        setError('Errore nel caricamento work order.');
      }
      setLoading(false);
    })();
  }, [id]);

  // ── Load raws ───────────────────────────────────────────────────────────────
  const fetchRaws = async () => {
    setRawsLoading(true);
    const res = await fetch(`/api/work-orders/raws?wo_id=${id}`);
    if (res.ok) setRaws(await res.json());
    setRawsLoading(false);
  };

  useEffect(() => { fetchRaws(); }, [id]);

  // ── Add row ─────────────────────────────────────────────────────────────────
  const addRow = async () => {
    if (!addSku.trim()) { setAddError('SKU obbligatorio'); return; }
    setAddSaving(true);
    setAddError('');
    const res = await fetch('/api/work-orders/raws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wor_wo_id: Number(id), wor_sku: addSku.trim(), wor_qta: addQta, wor_printed: addPrinted }),
    });
    const data = await res.json();
    if (!res.ok) { setAddError(data.error ?? 'Errore'); }
    else {
      setRaws(prev => [...prev, data]);
      setAddSku('');
      setAddQta(1);
      setAddPrinted(0);
    }
    setAddSaving(false);
  };

  // ── Inline edit ─────────────────────────────────────────────────────────────
  const startEdit = (raw: Raw) => {
    setEditing(prev => ({
      ...prev,
      [raw.wor_id]: { wor_sku: raw.wor_sku, wor_qta: raw.wor_qta, wor_printed: raw.wor_printed },
    }));
  };
  const cancelEdit = (id: number) => {
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
  };
  const saveEdit = async (wor_id: number) => {
    setSavingRow(wor_id);
    const fields = editing[wor_id];
    const res = await fetch('/api/work-orders/raws', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wor_id, ...fields }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRaws(prev => prev.map(r => r.wor_id === wor_id ? updated : r));
      cancelEdit(wor_id);
    }
    setSavingRow(null);
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/work-orders/raws?id=${deleteId}`, { method: 'DELETE' });
    setRaws(prev => prev.filter(r => r.wor_id !== deleteId));
    setDeleteId(null);
  };

  // ── Totals ───────────────────────────────────────────────────────────────────
  const totalQta     = raws.reduce((s, r) => s + r.wor_qta, 0);
  const totalPrinted = raws.reduce((s, r) => s + r.wor_printed, 0);

  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      <Loader2 size={28} className="animate-spin mr-2" /> Caricamento…
    </div>
  );

  if (error || !wo) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
      <AlertTriangle size={36} className="text-red-400" />
      <p>{error || 'Work order non trovato.'}</p>
      <button onClick={() => router.push('/work-orders')} className="text-blue-500 underline text-sm">← Torna alla lista</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">

      {/* ── Back + Header ── */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => router.push('/work-orders')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
        >
          <ArrowLeft size={15} /> Lista WO
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          {wo.wo_number} — <span className="font-normal text-gray-600">{wo.wo_title}</span>
        </h1>
      </div>

      {/* ── WO Summary card ── */}
      <div className="bg-white rounded-xl shadow border border-gray-200 px-5 py-4 mb-5 flex flex-wrap gap-4 items-start">
        <div className="flex flex-col gap-1 min-w-[120px]">
          <span className="text-xs text-gray-400">Stato</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${STATUS_STYLE[wo.wo_status] ?? 'bg-gray-100 text-gray-600'}`}>
            {wo.wo_status}
          </span>
        </div>
        <div className="flex flex-col gap-1 min-w-[120px]">
          <span className="text-xs text-gray-400">Priorità</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${PRIORITY_STYLE[wo.wo_priority] ?? 'bg-gray-100 text-gray-600'}`}>
            {wo.wo_priority}
          </span>
        </div>
        {wo.wo_assigned_to && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Assegnato a</span>
            <span className="text-sm font-semibold text-gray-700">{wo.wo_assigned_to}</span>
          </div>
        )}
        {wo.wo_due_date && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Scadenza</span>
            <span className="text-sm font-semibold text-gray-700">
              {new Date(wo.wo_due_date).toLocaleDateString('it-IT')}
            </span>
          </div>
        )}
        {wo.wo_description && (
          <div className="flex flex-col gap-1 w-full">
            <span className="text-xs text-gray-400">Descrizione</span>
            <span className="text-sm text-gray-700">{wo.wo_description}</span>
          </div>
        )}
      </div>

      {/* ── Raws table ── */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">

        {/* Table header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Package size={16} className="text-violet-500" />
            Righe Prodotto
          </h2>
          {raws.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Hash size={11} /> Tot. qtà: <strong className="text-gray-700">{totalQta}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Printer size={11} /> Stampate: <strong className="text-gray-700">{totalPrinted}</strong>
              </span>
              <span className="flex items-center gap-1">
                <CheckCheck size={11} /> Rimanenti: <strong className={totalQta - totalPrinted > 0 ? 'text-orange-600' : 'text-green-600'}>
                  {totalQta - totalPrinted}
                </strong>
              </span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-2 text-xs font-bold text-gray-600 w-[160px]">SKU (Product ID)</th>
                <th className="px-4 py-2 text-xs font-bold text-gray-600">Descrizione</th>
                <th className="px-4 py-2 text-xs font-bold text-gray-600 text-center w-[100px]">Qtà Ordine</th>
                <th className="px-4 py-2 text-xs font-bold text-gray-600 text-center w-[100px]">Stampate</th>
                <th className="px-4 py-2 text-xs font-bold text-gray-600 text-center w-[100px]">Rimanenti</th>
                <th className="px-4 py-2 text-xs font-bold text-gray-600 w-[90px]">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rawsLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                    <Loader2 size={16} className="animate-spin inline mr-2" />Caricamento righe…
                  </td>
                </tr>
              ) : raws.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                    Nessuna riga ancora aggiunta.
                  </td>
                </tr>
              ) : raws.map(raw => {
                const isEditing = !!editing[raw.wor_id];
                const ed = editing[raw.wor_id] ?? {};
                const remaining = raw.wor_qta - raw.wor_printed;

                return (
                  <tr key={raw.wor_id} className={`hover:bg-gray-50 ${isEditing ? 'bg-blue-50' : ''}`}>

                    {/* SKU */}
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <input
                          value={ed.wor_sku ?? raw.wor_sku}
                          onChange={e => setEditing(p => ({ ...p, [raw.wor_id]: { ...p[raw.wor_id], wor_sku: e.target.value } }))}
                          className="border border-gray-300 rounded px-2 py-1 text-xs font-mono w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      ) : (
                        <span className="text-xs font-mono font-semibold text-gray-800">{raw.wor_sku}</span>
                      )}
                    </td>

                    {/* Description */}
                    <td className="px-4 py-2">
                      <span className="text-xs text-gray-700">{raw.sku_description ?? '—'}</span>
                      {raw.sku_info && <span className="block text-[10px] text-gray-400">{raw.sku_info}</span>}
                    </td>

                    {/* Qtà Ordine */}
                    <td className="px-4 py-2 text-center">
                      {isEditing ? (
                        <input
                          type="number" min={0}
                          value={ed.wor_qta ?? raw.wor_qta}
                          onChange={e => setEditing(p => ({ ...p, [raw.wor_id]: { ...p[raw.wor_id], wor_qta: Number(e.target.value) } }))}
                          className="border border-gray-300 rounded px-2 py-1 text-xs text-center w-20 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      ) : (
                        <span className="text-sm font-bold text-gray-800">{raw.wor_qta}</span>
                      )}
                    </td>

                    {/* Stampate */}
                    <td className="px-4 py-2 text-center">
                      {isEditing ? (
                        <input
                          type="number" min={0}
                          value={ed.wor_printed ?? raw.wor_printed}
                          onChange={e => setEditing(p => ({ ...p, [raw.wor_id]: { ...p[raw.wor_id], wor_printed: Number(e.target.value) } }))}
                          className="border border-gray-300 rounded px-2 py-1 text-xs text-center w-20 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      ) : (
                        <span className={`text-sm font-bold ${raw.wor_printed > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {raw.wor_printed}
                        </span>
                      )}
                    </td>

                    {/* Rimanenti */}
                    <td className="px-4 py-2 text-center">
                      <span className={`text-sm font-bold ${remaining > 0 ? 'text-orange-500' : remaining === 0 && raw.wor_qta > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {remaining > 0 ? remaining : remaining === 0 && raw.wor_qta > 0 ? <CheckCircle2 size={16} className="inline" /> : '—'}
                      </span>
                    </td>

                    {/* Azioni */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        {isEditing ? (
                          <>
                            <button onClick={() => saveEdit(raw.wor_id)} disabled={savingRow === raw.wor_id}
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50" title="Salva">
                              {savingRow === raw.wor_id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            </button>
                            <button onClick={() => cancelEdit(raw.wor_id)}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100" title="Annulla">
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(raw)}
                              className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50" title="Modifica">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setDeleteId(raw.wor_id)}
                              className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50" title="Elimina">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Add row form ── */}
        <div className="border-t border-gray-200 bg-gray-50/50 px-4 py-3">
          <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
            <Plus size={12} /> Aggiungi riga
          </p>
          {addError && (
            <p className="text-xs text-red-600 mb-2 flex items-center gap-1">
              <AlertTriangle size={11} /> {addError}
            </p>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-500 font-semibold">SKU / Product ID</label>
              <input
                value={addSku}
                onChange={e => setAddSku(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addRow(); }}
                placeholder="es. PROD-001"
                className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-mono w-40 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-500 font-semibold">Qtà Ordine</label>
              <input
                type="number" min={1} value={addQta}
                onChange={e => setAddQta(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-center w-24 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-500 font-semibold">Stampate</label>
              <input
                type="number" min={0} value={addPrinted}
                onChange={e => setAddPrinted(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-center w-24 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <button
              onClick={addRow}
              disabled={addSaving}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-60"
            >
              {addSaving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Aggiungi
            </button>
          </div>
        </div>
      </div>

      {/* ── Delete confirm modal ── */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col items-center gap-4">
            <AlertTriangle size={32} className="text-red-500" />
            <p className="text-sm font-semibold text-gray-800 text-center">Eliminare questa riga?</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Annulla
              </button>
              <button onClick={confirmDelete}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
