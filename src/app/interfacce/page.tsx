'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Upload, Wifi, WifiOff, Play, Square, ClipboardList, X, RefreshCw } from 'lucide-react';

const STORAGE_KEY = 'interfacce_config';
const CRON_KEY    = 'interfacce_cron';

interface FtpConfig {
  host: string;
  port: string;
  user: string;
  password: string;
}

interface ImporterSection {
  filePrefix: string;
  timingMs: string;
}

interface Config {
  ftp: FtpConfig;
  cronIntervalSec: string;
  products: ImporterSection;
  items: ImporterSection;
  checklists: ImporterSection;
}

const defaultConfig: Config = {
  ftp: { host: '', port: '21', user: '', password: '' },
  cronIntervalSec: '60',
  products:   { filePrefix: 'PRO_', timingMs: '0' },
  items:      { filePrefix: 'EPC_', timingMs: '0' },
  checklists: { filePrefix: 'CHK_', timingMs: '0' },
};

const templateMap: Record<keyof Omit<Config, 'ftp' | 'cronIntervalSec'>, string> = {
  products:   '/Templates/PRO_.csv',
  items:      '/Templates/EPC_.csv',
  checklists: '/Templates/CHK_.csv',
};

const sectionLabels: Record<keyof Omit<Config, 'ftp' | 'cronIntervalSec'>, string> = {
  products:   'Products',
  items:      'Items',
  checklists: 'Checklists',
};

interface LogEntry { time: string; msg: string; ok: boolean; }

export default function InterfaccePage() {
  const [protocol, setProtocol] = useState<'ftp' | 'sftp'>('ftp');
  const [config, setConfig]     = useState<Config>(defaultConfig);
  const [cronActive, setCronActive] = useState(false);
  const [lastRun, setLastRun]       = useState<string>('');
  const [importing, setImporting]   = useState(false);
  const [log, setLog]               = useState<LogEntry[]>([]);
  const [dbLogOpen, setDbLogOpen]   = useState(false);
  const [dbLog, setDbLog]           = useState<any[]>([]);
  const [dbLogLoading, setDbLogLoading] = useState(false);

  const cronRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // keep a ref in sync so the interval callback always sees fresh config
  const configRef = useRef<Config>(config);
  useEffect(() => { configRef.current = config; }, [config]);

  // ─── Persist / restore ────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // migrate: add cronIntervalSec if missing from old saved config
        setConfig({ ...defaultConfig, ...parsed, ftp: { ...defaultConfig.ftp, ...parsed.ftp } });
      }
    } catch { /* noop */ }

    // restore cron state
    try {
      const cronSaved = localStorage.getItem(CRON_KEY);
      if (cronSaved) {
        const { active } = JSON.parse(cronSaved);
        if (active) {
          // small delay so configRef is populated first
          setTimeout(() => startCronInternal(), 200);
        }
      }
    } catch { /* noop */ }
  }, []);

  // ─── Config helpers ───────────────────────────────────────────────────────

  const saveConfig = useCallback((updated: Config) => {
    setConfig(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const setFtp = (field: keyof FtpConfig, value: string) =>
    saveConfig({ ...configRef.current, ftp: { ...configRef.current.ftp, [field]: value } });

  const setSection = (key: keyof Omit<Config, 'ftp' | 'cronIntervalSec'>, field: keyof ImporterSection, value: string) =>
    saveConfig({ ...configRef.current, [key]: { ...configRef.current[key], [field]: value } });

  const setCronSec = (value: string) =>
    saveConfig({ ...configRef.current, cronIntervalSec: value });

  // ─── Import logic ─────────────────────────────────────────────────────────

  const addLog = (msg: string, ok: boolean) => {
    const time = new Date().toLocaleTimeString('it-IT');
    setLog(prev => [{ time, msg, ok }, ...prev.slice(0, 99)]);
    // persist to DB — fire and forget
    try {
      const userStr = localStorage.getItem('user');
      const logUser = userStr ? (JSON.parse(userStr)?.name ?? 'system') : 'system';
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_user: logUser, log_section: 'Importers', log_text: msg }),
      }).catch(() => { /* noop */ });
    } catch { /* noop */ }
  };

  const runImport = useCallback(async (prefix?: string) => {
    const cfg = configRef.current;
    if (!cfg.ftp.host) {
      addLog('Host FTP non configurato', false);
      return;
    }
    setImporting(true);
    const now = new Date().toLocaleTimeString('it-IT');
    setLastRun(now);
    localStorage.setItem(CRON_KEY, JSON.stringify({ active: cronRef.current !== null }));

    try {
      const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
      const res = await fetch('/api/ftp/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host:     cfg.ftp.host,
          port:     cfg.ftp.port,
          user:     cfg.ftp.user,
          password: cfg.ftp.password,
          prefix:   prefix ?? null,
          logUser:  storedUser?.name ?? 'system',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addLog(`Errore FTP: ${data.error || res.statusText}`, false);
        return;
      }

      if (data.message) {
        addLog(data.message, true);
        return;
      }

      for (const r of data.results ?? []) {
        const ok = !r.status.startsWith('errore');
        const movedInfo = r.moved ? ` → ${r.moved}` : '';
        addLog(`[${r.file}] ${r.rows} righe — ${r.status}${movedInfo}`, ok);
        for (const err of r.errors ?? []) {
          addLog(`  ↳ ${err}`, false);
        }
      }
    } catch (e: any) {
      addLog(`Errore di rete: ${e.message}`, false);
    } finally {
      setImporting(false);
    }
  }, []);

  // ─── Cron ─────────────────────────────────────────────────────────────────

  const startCronInternal = useCallback(() => {
    if (cronRef.current) clearInterval(cronRef.current);
    const sec = Number(configRef.current.cronIntervalSec) || 60;
    runImport(); // fire immediately
    cronRef.current = setInterval(() => runImport(), sec * 1000);
    setCronActive(true);
    localStorage.setItem(CRON_KEY, JSON.stringify({ active: true }));
  }, [runImport]);

  const handleStartCron = () => {
    if (!configRef.current.ftp.host) {
      addLog('Configura prima l\'host FTP', false);
      return;
    }
    startCronInternal();
  };

  const handleStopCron = useCallback(() => {
    if (cronRef.current) { clearInterval(cronRef.current); cronRef.current = null; }
    setCronActive(false);
    localStorage.setItem(CRON_KEY, JSON.stringify({ active: false }));
    addLog('Cron disattivato', true);
  }, []);

  // cleanup on unmount
  useEffect(() => () => { if (cronRef.current) clearInterval(cronRef.current); }, []);

  // ─── DB Log viewer ───────────────────────────────────────────────────────

  const fetchDbLog = async () => {
    setDbLogLoading(true);
    try {
      const res = await fetch('/api/log?limit=200');
      if (res.ok) setDbLog(await res.json());
    } catch { /* noop */ } finally {
      setDbLogLoading(false);
    }
  };

  const openDbLog = () => {
    setDbLogOpen(true);
    fetchDbLog();
  };

  // ─── Template export ──────────────────────────────────────────────────────

  const handleExportTemplate = (section: keyof Omit<Config, 'ftp' | 'cronIntervalSec'>) => {
    const a = document.createElement('a');
    a.href = templateMap[section];
    a.download = templateMap[section].split('/').pop() || 'template.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const sections = (['products', 'items', 'checklists'] as const);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Interfacce</h1>
        <button
          onClick={openDbLog}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
        >
          <ClipboardList size={15} /> Log DB
        </button>
      </div>

      {/* Importers card */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Importers</h2>

        {/* ── Header bar: protocol + cron controls ── */}
        <div className="flex flex-wrap items-center gap-3 mb-5 pb-4 border-b border-gray-100">

          {/* Protocol buttons */}
          <button
            onClick={() => setProtocol('ftp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              protocol === 'ftp'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            <Wifi size={14} /> FTP
          </button>
          <button
            disabled
            title="Non disponibile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
          >
            <WifiOff size={14} /> SFTP <span className="text-xs">(presto)</span>
          </button>

          <span className="text-gray-200">|</span>

          {/* Cron Start / Stop */}
          <button
            onClick={handleStartCron}
            disabled={cronActive || importing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={14} /> Start Cron
          </button>
          <button
            onClick={handleStopCron}
            disabled={!cronActive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Square size={14} /> Stop Cron
          </button>

          {/* Interval input */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 whitespace-nowrap">ogni</span>
            <input
              type="number"
              min={5}
              className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:border-blue-400"
              value={config.cronIntervalSec}
              onChange={e => setCronSec(e.target.value)}
            />
            <span className="text-xs text-gray-500">sec</span>
          </div>

          {/* Status */}
          <div className="ml-auto flex flex-col items-end text-xs leading-tight">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cronActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
              <span className={cronActive ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {cronActive
                  ? `Timer attivo ogni ${config.cronIntervalSec} sec`
                  : 'Cron inattivo'}
              </span>
            </div>
            {lastRun && (
              <span className="text-gray-400 mt-0.5">Ultima att.: {lastRun}</span>
            )}
          </div>
        </div>

        {/* FTP Config */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {(
            [
              { field: 'host'     as const, label: 'Host' },
              { field: 'port'     as const, label: 'Port' },
              { field: 'user'     as const, label: 'User' },
              { field: 'password' as const, label: 'Password' },
            ] as const
          ).map(({ field, label }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <input
                type={field === 'password' ? 'password' : 'text'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                value={config.ftp[field]}
                onChange={e => setFtp(field, e.target.value)}
                placeholder={field === 'port' ? '21' : label}
              />
            </div>
          ))}
        </div>

        {/* Section rows */}
        <div className="space-y-3">
          {sections.map(sectionKey => (
            <div key={sectionKey} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{sectionLabels[sectionKey]}</h3>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">File Prefix</label>
                  <input
                    type="text"
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                    value={config[sectionKey].filePrefix}
                    onChange={e => setSection(sectionKey, 'filePrefix', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Timing (sec) <span className="text-gray-400">(ref.)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                    value={config[sectionKey].timingMs}
                    onChange={e => setSection(sectionKey, 'timingMs', e.target.value)}
                  />
                </div>
                <button
                  onClick={() => runImport(config[sectionKey].filePrefix)}
                  disabled={importing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Upload size={14} />
                  {importing ? 'Import...' : 'Import CSV'}
                </button>
                <button
                  onClick={() => handleExportTemplate(sectionKey)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                >
                  <Download size={14} />
                  Export Template CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DB Log modal */}
      {dbLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-slate-600" />
                <span className="font-semibold text-gray-800">Log DB</span>
                <span className="text-xs text-gray-400">({dbLog.length} righe)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchDbLog}
                  disabled={dbLogLoading}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50"
                  title="Aggiorna"
                >
                  <RefreshCw size={13} className={dbLogLoading ? 'animate-spin' : ''} /> Aggiorna
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('Eliminare tutti i record del log?')) return;
                    await fetch('/api/log', { method: 'DELETE' });
                    setDbLog([]);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  <X size={13} /> Svuota Log
                </button>
                <button onClick={() => setDbLogOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1">
              {dbLogLoading && !dbLog.length ? (
                <div className="p-10 text-center text-gray-400 text-sm">Caricamento...</div>
              ) : dbLog.length === 0 ? (
                <div className="p-10 text-center text-gray-400 text-sm">Nessun record nel log</div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {Object.keys(dbLog[0]).map(col => (
                        <th key={col} className="px-4 py-2 font-semibold text-gray-500 whitespace-nowrap border-b border-gray-200">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dbLog.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-4 py-1.5 text-gray-700 whitespace-nowrap max-w-xs truncate">
                            {val === null ? <span className="text-gray-300">—</span> : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Log */}
      {log.length > 0 && (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-gray-600">Import Log</h2>
            <button onClick={() => setLog([])} className="text-xs text-gray-400 hover:text-red-500">Svuota</button>
          </div>
          <div className="max-h-52 overflow-y-auto space-y-0.5 font-mono text-xs">
            {log.map((entry, i) => (
              <div key={i} className={`flex gap-2 py-0.5 ${entry.ok ? 'text-gray-700' : 'text-red-600'}`}>
                <span className="text-gray-400 shrink-0">{entry.time}</span>
                <span>{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
