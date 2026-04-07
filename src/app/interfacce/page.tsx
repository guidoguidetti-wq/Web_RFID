'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Upload, Wifi, WifiOff, Play } from 'lucide-react';

const STORAGE_KEY = 'interfacce_config';

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
  products: ImporterSection;
  items: ImporterSection;
  checklists: ImporterSection;
}

const defaultConfig: Config = {
  ftp: { host: '', port: '21', user: '', password: '' },
  products: { filePrefix: 'PRO_', timingMs: '0' },
  items: { filePrefix: 'EPC_', timingMs: '0' },
  checklists: { filePrefix: 'CHK_', timingMs: '0' },
};

const templateMap: Record<keyof Omit<Config, 'ftp'>, string> = {
  products: '/Templates/PRO_.csv',
  items: '/Templates/EPC_.csv',
  checklists: '/Templates/CHK_.csv',
};

const sectionLabels: Record<keyof Omit<Config, 'ftp'>, string> = {
  products: 'Products',
  items: 'Items',
  checklists: 'Checklists',
};

function useIntervalPoll(
  config: Config,
  sectionKey: keyof Omit<Config, 'ftp'>,
  onFilesFound: (files: string[], section: string) => void
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async (cfg: Config, key: keyof Omit<Config, 'ftp'>) => {
    const section = cfg[key];
    const ms = Number(section.timingMs);
    if (ms <= 0 || !cfg.ftp.host) return;

    try {
      const res = await fetch('/api/ftp/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: cfg.ftp.host,
          port: cfg.ftp.port,
          user: cfg.ftp.user,
          password: cfg.ftp.password,
          prefix: section.filePrefix,
          path: '/root/imports',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files && data.files.length > 0) {
          onFilesFound(data.files, sectionLabels[key]);
        }
      }
    } catch {
      // network error, ignore
    }
  }, [onFilesFound]);

  useEffect(() => {
    const ms = Number(config[sectionKey].timingMs);
    if (timerRef.current) clearInterval(timerRef.current);
    if (ms > 0 && config.ftp.host) {
      timerRef.current = setInterval(() => poll(config, sectionKey), ms);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [config, sectionKey, poll]);
}

export default function InterfaccePage() {
  const router = useRouter();
  const [protocol, setProtocol] = useState<'ftp' | 'sftp'>('ftp');
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [pollLog, setPollLog] = useState<{ time: string; msg: string }[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setConfig(JSON.parse(saved));
    } catch { /* noop */ }
  }, []);

  const saveConfig = (updated: Config) => {
    setConfig(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const setFtp = (field: keyof FtpConfig, value: string) => {
    saveConfig({ ...config, ftp: { ...config.ftp, [field]: value } });
  };

  const setSection = (key: keyof Omit<Config, 'ftp'>, field: keyof ImporterSection, value: string) => {
    saveConfig({ ...config, [key]: { ...config[key], [field]: value } });
  };

  const addLog = useCallback((files: string[], section: string) => {
    const time = new Date().toLocaleTimeString();
    setPollLog(prev => [
      { time, msg: `[${section}] Trovati: ${files.join(', ')}` },
      ...prev.slice(0, 49),
    ]);
  }, []);

  useIntervalPoll(config, 'products', addLog);
  useIntervalPoll(config, 'items', addLog);
  useIntervalPoll(config, 'checklists', addLog);

  const handleExportTemplate = (section: keyof Omit<Config, 'ftp'>) => {
    const a = document.createElement('a');
    a.href = templateMap[section];
    a.download = templateMap[section].split('/').pop() || 'template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportCsv = (section: keyof Omit<Config, 'ftp'>) => {
    // Placeholder — import logic to be defined
    alert(`Import CSV per ${sectionLabels[section]}: funzione da implementare`);
  };

  const sections = (['products', 'items', 'checklists'] as const);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Interfacce</h1>
        <button
          onClick={() => router.push('/interfacce/lettura')}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold shadow transition-colors"
        >
          <Play size={18} /> Start Lettura
        </button>
      </div>

      {/* Importers Section */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Importers</h2>

        {/* Protocol selector */}
        <div className="flex gap-4 mb-5">
          <button
            onClick={() => setProtocol('ftp')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-colors ${
              protocol === 'ftp'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            <Wifi size={16} />
            FTP
          </button>
          <button
            disabled
            title="Non disponibile"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border font-medium bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
          >
            <WifiOff size={16} />
            SFTP
            <span className="text-xs ml-1">(presto)</span>
          </button>
        </div>

        {/* FTP Config */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {(
            [
              { field: 'host' as const, label: 'Host' },
              { field: 'port' as const, label: 'Port' },
              { field: 'user' as const, label: 'User' },
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
        <div className="space-y-4">
          {sections.map(sectionKey => (
            <div
              key={sectionKey}
              className="border border-gray-100 rounded-lg p-4 bg-gray-50"
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {sectionLabels[sectionKey]}
              </h3>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">File Prefix</label>
                  <input
                    type="text"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                    value={config[sectionKey].filePrefix}
                    onChange={e => setSection(sectionKey, 'filePrefix', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Timing in Msec <span className="text-gray-400">(0 = disabilitato)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                    value={config[sectionKey].timingMs}
                    onChange={e => setSection(sectionKey, 'timingMs', e.target.value)}
                  />
                </div>
                <button
                  onClick={() => handleImportCsv(sectionKey)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  <Upload size={15} />
                  Import CSV
                </button>
                <button
                  onClick={() => handleExportTemplate(sectionKey)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                >
                  <Download size={15} />
                  Export Template CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Poll Log */}
      {pollLog.length > 0 && (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Log Polling FTP</h2>
          <div className="max-h-48 overflow-y-auto text-xs font-mono space-y-1">
            {pollLog.map((entry, i) => (
              <div key={i} className="text-gray-600">
                <span className="text-gray-400 mr-2">{entry.time}</span>
                {entry.msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
