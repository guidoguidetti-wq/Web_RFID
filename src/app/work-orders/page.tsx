'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, Paperclip, X, Upload,
  FileText, Image as ImageIcon, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, CheckCircle2, Clock, ZapOff,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface WorkOrder {
  wo_id: number;
  wo_number: string;
  wo_title: string;
  wo_description: string | null;
  wo_status: string;
  wo_priority: string;
  wo_item_id: string | null;
  wo_assigned_to: string | null;
  wo_due_date: string | null;
  wo_notes: string | null;
  wo_created_at: string;
  wo_updated_at: string;
  attach_count: number;
}

interface Attachment {
  att_id: number;
  att_wo_id: number;
  att_filename: string;
  att_type: 'image' | 'file';
  att_mime: string;
  att_size: number;
  att_url: string;
  att_created_at: string;
}

const STATUSES   = ['APERTO', 'IN CORSO', 'CHIUSO', 'ANNULLATO'];
const PRIORITIES = ['BASSA', 'NORMALE', 'ALTA', 'URGENTE'];

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

const STATUS_ICON: Record<string, React.ReactNode> = {
  'APERTO':    <Clock size={12} />,
  'IN CORSO':  <Loader2 size={12} className="animate-spin" />,
  'CHIUSO':    <CheckCircle2 size={12} />,
  'ANNULLATO': <ZapOff size={12} />,
};

const EMPTY_FORM = {
  wo_number: '', wo_title: '', wo_description: '',
  wo_status: 'APERTO', wo_priority: 'NORMALE',
  wo_item_id: '', wo_assigned_to: '', wo_due_date: '', wo_notes: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT');
}
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WorkOrdersPage() {
  const [orders, setOrders]       = useState<WorkOrder[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filters, setFilters]     = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(true);

  // Modal add/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<WorkOrder | null>(null);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  // Attachments panel
  const [attachWo, setAttachWo]         = useState<WorkOrder | null>(null);
  const [attachments, setAttachments]   = useState<Attachment[]>([]);
  const [attachLoading, setAttachLoading] = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState('');
  const [lightbox, setLightbox]         = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ── Fetch work orders ───────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (page = 1, currentFilters = filters) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '50' });
      Object.entries(currentFilters).forEach(([k, v]) => { if (v) p.append(`filter_${k}`, v); });
      const res = await fetch(`/api/work-orders?${p}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.workOrders);
        setPagination(data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchOrders(1); }, []);

  const commitFilter = (key: string, value: string) => {
    const f = { ...filters, [key]: value };
    setFilters(f);
    fetchOrders(1, f);
  };

  // ── Modal helpers ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
    setModalOpen(true);
  };
  const openEdit = (wo: WorkOrder) => {
    setEditing(wo);
    setForm({
      wo_number:     wo.wo_number,
      wo_title:      wo.wo_title,
      wo_description: wo.wo_description ?? '',
      wo_status:     wo.wo_status,
      wo_priority:   wo.wo_priority,
      wo_item_id:    wo.wo_item_id ?? '',
      wo_assigned_to: wo.wo_assigned_to ?? '',
      wo_due_date:   wo.wo_due_date ? wo.wo_due_date.slice(0, 10) : '',
      wo_notes:      wo.wo_notes ?? '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const saveForm = async () => {
    if (!form.wo_number.trim() || !form.wo_title.trim()) {
      setFormError('Numero e Titolo sono obbligatori.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const method = editing ? 'PUT' : 'POST';
      const body   = editing ? { wo_id: editing.wo_id, ...form } : form;
      const res    = await fetch('/api/work-orders', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(`${data.error ?? 'Errore'}${data.detail ? ` — ${data.detail}` : ''}`); return; }
      setModalOpen(false);
      fetchOrders(pagination.page);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/work-orders?id=${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    fetchOrders(pagination.page);
  };

  // ── Attachments ─────────────────────────────────────────────────────────────
  const openAttach = async (wo: WorkOrder) => {
    setAttachWo(wo);
    setUploadError('');
    setAttachLoading(true);
    const res = await fetch(`/api/work-orders/attach?wo_id=${wo.wo_id}`);
    if (res.ok) setAttachments(await res.json());
    setAttachLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !attachWo) return;
    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('wo_id', String(attachWo.wo_id));
      const res = await fetch('/api/work-orders/attach', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error ?? 'Errore upload'); return; }
      setAttachments(prev => [...prev, data]);
      // refresh attach_count in table
      setOrders(prev => prev.map(o =>
        o.wo_id === attachWo.wo_id ? { ...o, attach_count: o.attach_count + 1 } : o
      ));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteAttach = async (att: Attachment) => {
    await fetch(`/api/work-orders/attach?id=${att.att_id}`, { method: 'DELETE' });
    setAttachments(prev => prev.filter(a => a.att_id !== att.att_id));
    setOrders(prev => prev.map(o =>
      o.wo_id === attachWo?.wo_id ? { ...o, attach_count: Math.max(0, o.attach_count - 1) } : o
    ));
  };

  const images = attachments.filter(a => a.att_type === 'image');
  const files  = attachments.filter(a => a.att_type === 'file');

  // ── Filter columns def ──────────────────────────────────────────────────────
  const cols: { key: string; label: string; w: string }[] = [
    { key: 'wo_number',     label: 'N° WO',      w: 'min-w-[110px]' },
    { key: 'wo_title',      label: 'Titolo',      w: 'min-w-[180px]' },
    { key: 'wo_status',     label: 'Stato',       w: 'min-w-[110px]' },
    { key: 'wo_priority',   label: 'Priorità',    w: 'min-w-[100px]' },
    { key: 'wo_assigned_to',label: 'Assegnato a', w: 'min-w-[140px]' },
    { key: 'wo_item_id',    label: 'Item (EPC)',  w: 'min-w-[140px]' },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between bg-white px-4 py-2 rounded-lg shadow border border-gray-200 mb-3">
        <h1 className="text-xl font-bold text-gray-800">Work Orders</h1>
        <div className="flex items-center gap-3">
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchOrders(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40"
              ><ChevronLeft size={14} /></button>
              <span className="text-xs text-gray-600">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchOrders(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40"
              ><ChevronRight size={14} /></button>
            </div>
          )}
          <span className="text-xs text-gray-500">Totale: {pagination.total}</span>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition"
          >
            <Plus size={16} /> Nuova WO
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                {cols.map(col => (
                  <th key={col.key} className={`px-3 py-2 text-xs font-bold text-gray-700 align-top ${col.w}`}>
                    <div className="flex flex-col gap-1.5">
                      <span>{col.label}</span>
                      <input
                        type="text"
                        placeholder="Filtra..."
                        className="text-xs font-normal px-1.5 py-0.5 border border-gray-300 rounded w-full"
                        defaultValue={filters[col.key] ?? ''}
                        onBlur={e => commitFilter(col.key, e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { commitFilter(col.key, e.currentTarget.value); e.currentTarget.blur(); } }}
                      />
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2 text-xs font-bold text-gray-700 align-top min-w-[80px]">Scadenza</th>
                <th className="px-3 py-2 text-xs font-bold text-gray-700 align-top min-w-[70px]">Allegati</th>
                <th className="px-3 py-2 text-xs font-bold text-gray-700 align-top min-w-[90px]">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="py-10 text-center text-gray-400 text-xs">
                  <Loader2 size={20} className="animate-spin inline-block mr-2" />Caricamento…
                </td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="py-8 text-center text-gray-400 text-xs">Nessuna work order trovata.</td></tr>
              ) : orders.map(wo => (
                <tr key={wo.wo_id} className="hover:bg-gray-50 group">
                  <td className="px-3 py-1.5 text-xs font-mono font-semibold text-gray-800">{wo.wo_number}</td>
                  <td className="px-3 py-1.5 text-xs text-gray-800 max-w-[220px] truncate" title={wo.wo_title}>{wo.wo_title}</td>
                  <td className="px-3 py-1.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[wo.wo_status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_ICON[wo.wo_status]} {wo.wo_status}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[wo.wo_priority] ?? 'bg-gray-100 text-gray-600'}`}>
                      {wo.wo_priority}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-xs text-gray-700">{wo.wo_assigned_to || '—'}</td>
                  <td className="px-3 py-1.5 text-xs font-mono text-gray-500 max-w-[140px] truncate">{wo.wo_item_id || '—'}</td>
                  <td className="px-3 py-1.5 text-xs text-gray-600">{formatDate(wo.wo_due_date)}</td>
                  <td className="px-3 py-1.5">
                    <button
                      onClick={() => openAttach(wo)}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      <Paperclip size={13} />
                      {wo.attach_count > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-0">{wo.attach_count}</span>
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(wo)} className="text-blue-500 hover:text-blue-700 p-0.5 rounded hover:bg-blue-50" title="Modifica">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteId(wo.wo_id)} className="text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-50" title="Elimina">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL – Add / Edit Work Order
      ════════════════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">
                {editing ? `Modifica WO #${editing.wo_number}` : 'Nuova Work Order'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3">
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-700 text-xs px-3 py-2 rounded-lg">
                  <AlertTriangle size={14} /> {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">N° WO *</label>
                  <input value={form.wo_number} onChange={e => setForm(f => ({ ...f, wo_number: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="WO-2024-001" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Assegnato a</label>
                  <input value={form.wo_assigned_to} onChange={e => setForm(f => ({ ...f, wo_assigned_to: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nome tecnico" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Titolo *</label>
                <input value={form.wo_title} onChange={e => setForm(f => ({ ...f, wo_title: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Descrizione breve dell'intervento" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Descrizione</label>
                <textarea value={form.wo_description} onChange={e => setForm(f => ({ ...f, wo_description: e.target.value }))}
                  rows={3} className="border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Dettagli dell'intervento…" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Stato</label>
                  <select value={form.wo_status} onChange={e => setForm(f => ({ ...f, wo_status: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Priorità</label>
                  <select value={form.wo_priority} onChange={e => setForm(f => ({ ...f, wo_priority: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Scadenza</label>
                  <input type="date" value={form.wo_due_date} onChange={e => setForm(f => ({ ...f, wo_due_date: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Item (EPC)</label>
                  <input value={form.wo_item_id} onChange={e => setForm(f => ({ ...f, wo_item_id: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="EPC tag RFID" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Note</label>
                <textarea value={form.wo_notes} onChange={e => setForm(f => ({ ...f, wo_notes: e.target.value }))}
                  rows={2} className="border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Note aggiuntive…" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700">
                Annulla
              </button>
              <button onClick={saveForm} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? 'Salva modifiche' : 'Crea Work Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          DELETE CONFIRM
      ════════════════════════════════════════════════════════════════════════ */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col items-center gap-4">
            <AlertTriangle size={36} className="text-red-500" />
            <p className="text-sm font-semibold text-gray-800 text-center">
              Eliminare questa Work Order?<br />
              <span className="text-red-500 text-xs">Gli allegati verranno cancellati definitivamente.</span>
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Annulla
              </button>
              <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          ATTACHMENTS PANEL (right drawer)
      ════════════════════════════════════════════════════════════════════════ */}
      {attachWo && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/30" onClick={() => setAttachWo(null)} />

          {/* Drawer */}
          <div className="bg-white w-full max-w-md shadow-2xl flex flex-col h-full overflow-hidden">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <p className="text-xs text-gray-500">Allegati —</p>
                <p className="text-sm font-bold text-gray-800">{attachWo.wo_number} · {attachWo.wo_title}</p>
              </div>
              <button onClick={() => setAttachWo(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Upload bar */}
            <div className="px-5 py-3 border-b border-gray-100 bg-white">
              {uploadError && (
                <p className="text-xs text-red-600 mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> {uploadError}
                </p>
              )}
              <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition
                ${uploading ? 'border-gray-200 text-gray-300' : 'border-blue-300 text-blue-500 hover:bg-blue-50 hover:border-blue-400'}`}>
                {uploading
                  ? <><Loader2 size={16} className="animate-spin" /> Caricamento…</>
                  : <><Upload size={16} /> Carica immagine / PDF</>
                }
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
              {attachLoading ? (
                <div className="flex justify-center pt-10 text-gray-400">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : (
                <>
                  {/* ── IMAGES ── */}
                  {images.length > 0 && (
                    <section>
                      <h3 className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                        <ImageIcon size={13} /> Immagini ({images.length})
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {images.map(att => (
                          <div key={att.att_id} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={att.att_url}
                              alt={att.att_filename}
                              className="w-full h-full object-cover cursor-pointer transition group-hover:brightness-90"
                              onClick={() => setLightbox(att.att_url)}
                            />
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 flex flex-col justify-end p-1.5 opacity-0 group-hover:opacity-100 transition bg-gradient-to-t from-black/50 to-transparent">
                              <p className="text-white text-[9px] truncate leading-tight">{att.att_filename}</p>
                              <p className="text-white/70 text-[9px]">{formatSize(att.att_size)}</p>
                            </div>
                            {/* Delete button */}
                            <button
                              onClick={() => deleteAttach(att)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition hover:bg-red-700"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* ── FILES (PDF) ── */}
                  {files.length > 0 && (
                    <section>
                      <h3 className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                        <FileText size={13} /> Documenti ({files.length})
                      </h3>
                      <div className="flex flex-col gap-2">
                        {files.map(att => (
                          <div key={att.att_id}
                            className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 hover:bg-gray-100 transition">
                            {/* PDF icon */}
                            <div className="shrink-0 w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                              <FileText size={18} className="text-red-600" />
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{att.att_filename}</p>
                              <p className="text-[10px] text-gray-400">{formatSize(att.att_size)} · {formatDate(att.att_created_at)}</p>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={att.att_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                                title="Apri/Scarica"
                              >
                                <FileText size={14} />
                              </a>
                              <button
                                onClick={() => deleteAttach(att)}
                                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                title="Elimina"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {attachments.length === 0 && (
                    <p className="text-center text-gray-400 text-sm pt-6">Nessun allegato ancora caricato.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          LIGHTBOX (image fullscreen preview)
      ════════════════════════════════════════════════════════════════════════ */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="preview"
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition"
          >
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  );
}
