'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Square, CheckCircle, AlertTriangle, XCircle, Download, Layers } from 'lucide-react';

const TYPE_LABELS: Record<number, string> = {
  4: 'No Checklist',
  3: 'Checklist EPC',
  2: 'Checklist SKU',
};

interface ReadingItem {
  EPC: string;
  inv_expected: boolean;
  inv_unexpected: boolean;
  inv_lost: boolean;
  'Product ID': string | null;
  fld01: string | null;
  fld02: string | null;
  fld03: string | null;
  fldd01: string | null;
  fldd02: string | null;
}

type ViewMode = 'All' | 'Expected' | 'Unexpected' | 'Lost';

export default function LetturaPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [type, setType] = useState<2 | 3 | 4>(4);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [checklistId, setChecklistId] = useState<string>('');
  const [labels, setLabels] = useState<any[]>([]);

  const [running, setRunning] = useState(false);
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('All');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [statusFilters, setStatusFilters] = useState({ inv_expected: false, inv_unexpected: false, inv_lost: false });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load user from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUsername(JSON.parse(raw).name || '');
    } catch { /* noop */ }

    fetch('/api/checklists').then(r => r.json()).then(setChecklists).catch(() => {});
    fetch('/api/products/labels').then(r => r.json()).then(setLabels).catch(() => {});
  }, []);

  const getLabel = (key: string) => {
    const l = labels.find(x => x.pr_fld === key);
    return l ? (l.pr_lab || l.pr_des || key) : key;
  };

  const fetchItems = async () => {
    if (!username) return;
    try {
      const res = await fetch(`/api/reading/items?username=${encodeURIComponent(username)}`);
      if (res.ok) setItems(await res.json());
    } catch { /* noop */ }
  };

  const handleStart = async () => {
    if (!username) { alert('Utente non trovato. Effettua il login.'); return; }
    if ((type === 2 || type === 3) && !checklistId) { alert('Seleziona una checklist.'); return; }

    try {
      const res = await fetch('/api/reading/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, type, checklist_id: checklistId || null }),
      });
      if (!res.ok) { const e = await res.json(); alert('Errore avvio: ' + e.error); return; }
    } catch (err) {
      alert('Errore di connessione'); return;
    }

    setItems([]);
    setViewMode('All');
    setFilters({});
    setStatusFilters({ inv_expected: false, inv_unexpected: false, inv_lost: false });
    setRunning(true);

    // Fetch initial state (for pre-loaded lost items)
    await fetchItems();

    // Poll every 2 seconds
    pollRef.current = setInterval(fetchItems, 2000);
  };

  const handleStop = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setRunning(false);
    fetchItems(); // final refresh
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const counts = useMemo(() => ({
    total:      items.length,
    expected:   items.filter(i => i.inv_expected).length,
    unexpected: items.filter(i => i.inv_unexpected).length,
    lost:       items.filter(i => i.inv_lost).length,
  }), [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // View mode filter
      if (viewMode === 'Expected'   && !item.inv_expected)   return false;
      if (viewMode === 'Unexpected' && !item.inv_unexpected) return false;
      if (viewMode === 'Lost'       && !item.inv_lost)       return false;

      // Status toggle filters
      if (statusFilters.inv_expected || statusFilters.inv_unexpected || statusFilters.inv_lost) {
        const match =
          (statusFilters.inv_expected   && item.inv_expected)   ||
          (statusFilters.inv_unexpected && item.inv_unexpected) ||
          (statusFilters.inv_lost       && item.inv_lost);
        if (!match) return false;
      }

      // Column text filters
      return Object.keys(filters).every(key => {
        if (!filters[key]) return true;
        const val = String((item as any)[key] || '').toLowerCase();
        return val.includes(filters[key].toLowerCase());
      });
    });
  }, [items, viewMode, statusFilters, filters]);

  const commitFilter = (key: string, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const toggleStatusFilter = (key: 'inv_expected' | 'inv_unexpected' | 'inv_lost') =>
    setStatusFilters(prev => ({ ...prev, [key]: !prev[key] }));

  const exportCSV = () => {
    if (filteredItems.length === 0) return;
    const cols = ['EPC', 'Product ID', 'fld01', 'fld02', 'fld03', 'fldd01', 'fldd02'];
    const headers = [...cols, 'Exp', 'UnExp', 'Lost'].join(';');
    const rows = filteredItems.map(item =>
      [
        ...cols.map(c => `"${String((item as any)[c] || '').replaceAll('"', '""')}"`),
        item.inv_expected ? '1' : '0',
        item.inv_unexpected ? '1' : '0',
        item.inv_lost ? '1' : '0',
      ].join(';')
    );
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lettura_${username}_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const columns = ['EPC', 'Product ID', 'fld01', 'fld02', 'fld03', 'fldd01', 'fldd02'];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => { handleStop(); router.push('/interfacce'); }} className="text-gray-600 hover:text-gray-800">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Lettura RFID</h1>
        {running && (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full animate-pulse">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span> In corso
          </span>
        )}
      </div>

      {/* Config bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow p-4 mb-4 flex flex-wrap items-end gap-4">
        {/* Type selector */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
          <div className="flex gap-2">
            {([4, 3, 2] as const).map(t => (
              <button
                key={t}
                disabled={running}
                onClick={() => { setType(t); setChecklistId(''); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  type === t
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {t} – {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Checklist selector (types 2 and 3) */}
        {(type === 2 || type === 3) && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Checklist</label>
            <select
              disabled={running}
              value={checklistId}
              onChange={e => setChecklistId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 disabled:opacity-50"
            >
              <option value="">— seleziona —</option>
              {checklists.map(c => (
                <option key={c.chk_id} value={c.chk_id}>{c.chk_code}</option>
              ))}
            </select>
          </div>
        )}

        {/* Start / Stop */}
        <div className="ml-auto flex gap-2">
          {!running ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              <Play size={16} /> Start
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
            >
              <Square size={16} /> Stop
            </button>
          )}
          <button
            onClick={exportCSV}
            disabled={items.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            <Download size={16} /> CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Totale',      value: counts.total,      color: 'bg-blue-50 border-blue-200 text-blue-800' },
          { label: 'Expected',    value: counts.expected,   color: 'bg-green-50 border-green-200 text-green-800' },
          { label: 'Unexpected',  value: counts.unexpected, color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
          { label: 'Lost',        value: counts.lost,       color: 'bg-red-50 border-red-200 text-red-800' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">

        {/* View mode tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-2 py-2 gap-2">
          {(['All', 'Expected', 'Unexpected', 'Lost'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {mode}
              {mode !== 'All' && (
                <span className="ml-1.5 text-xs opacity-75">
                  ({mode === 'Expected' ? counts.expected : mode === 'Unexpected' ? counts.unexpected : counts.lost})
                </span>
              )}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400 self-center pr-1">{filteredItems.length} righe</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {columns.map(col => (
                  <th key={col} className={`px-3 py-2 font-bold text-gray-700 align-top ${col === 'EPC' ? 'min-w-[260px]' : 'min-w-[90px]'}`}>
                    <div className="flex flex-col gap-1">
                      <span>{col === 'EPC' ? 'EPC' : getLabel(col)}</span>
                      <input
                        type="text"
                        placeholder="Filtra"
                        className="font-normal px-1.5 py-0.5 border border-gray-300 rounded w-full"
                        defaultValue={filters[col] ?? ''}
                        onBlur={e => commitFilter(col, e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { commitFilter(col, e.currentTarget.value); e.currentTarget.blur(); } }}
                      />
                    </div>
                  </th>
                ))}
                {/* Status column headers with toggle filters */}
                {(
                  [
                    { key: 'inv_expected' as const,   label: 'Exp',   Icon: CheckCircle,   active: 'bg-green-100 border-green-500 text-green-600',  inactive: 'bg-white border-gray-300 text-gray-400' },
                    { key: 'inv_unexpected' as const, label: 'UnExp', Icon: AlertTriangle, active: 'bg-yellow-100 border-yellow-500 text-yellow-600', inactive: 'bg-white border-gray-300 text-gray-400' },
                    { key: 'inv_lost' as const,       label: 'Lost',  Icon: XCircle,       active: 'bg-red-100 border-red-500 text-red-600',         inactive: 'bg-white border-gray-300 text-gray-400' },
                  ] as const
                ).map(({ key, label, Icon, active, inactive }) => (
                  <th key={key} className="px-3 py-2 font-bold text-gray-700 w-14 text-center align-top">
                    <div className="flex flex-col gap-1 items-center">
                      <span className={
                        key === 'inv_expected' ? 'text-green-600' :
                        key === 'inv_unexpected' ? 'text-yellow-600' : 'text-red-600'
                      }>{label}</span>
                      <button
                        onClick={() => toggleStatusFilter(key)}
                        className={`p-1 rounded-full border transition-colors ${statusFilters[key] ? active : inactive}`}
                        title={statusFilters[key] ? 'Filtro attivo' : 'Filtra per ' + label}
                      >
                        <Icon size={16} fill={statusFilters[key] ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item, idx) => (
                <tr
                  key={idx}
                  className={
                    item.inv_lost       ? 'bg-red-50 hover:bg-red-100' :
                    item.inv_unexpected ? 'bg-yellow-50 hover:bg-yellow-100' :
                    item.inv_expected   ? 'hover:bg-green-50' :
                    'hover:bg-gray-50'
                  }
                >
                  {columns.map(col => (
                    <td key={col} className="px-3 py-1 text-gray-700">
                      {(item as any)[col] || '-'}
                    </td>
                  ))}
                  <td className="px-3 py-1 text-center">
                    {item.inv_expected   ? <CheckCircle  size={14} className="text-green-500 mx-auto" /> : <span className="text-gray-200">-</span>}
                  </td>
                  <td className="px-3 py-1 text-center">
                    {item.inv_unexpected ? <AlertTriangle size={14} className="text-yellow-500 mx-auto" /> : <span className="text-gray-200">-</span>}
                  </td>
                  <td className="px-3 py-1 text-center">
                    {item.inv_lost       ? <XCircle      size={14} className="text-red-500 mx-auto" /> : <span className="text-gray-200">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="p-10 text-center text-gray-400 text-sm">
              {running ? 'In attesa di letture...' : 'Premi Start per avviare la sessione di lettura'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
