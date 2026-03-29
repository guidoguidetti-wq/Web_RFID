'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, BookOpen, Eye, Download,
  ShieldCheck, ShieldAlert, FileText, Lock,
} from 'lucide-react';

interface FileEntry {
  att_id:       number;
  att_filename: string;
  att_url:      string;
  att_mime:     string | null;
  att_size:     number | null;
  att_seen:     string | null;
  att_down:     string | null;
}

interface ConfirmState {
  att_id:   number;
  action:   'seen' | 'down';
  url:      string;
  filename: string;
}

/* ── formato bytes leggibile ── */
function fmtSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Popup di accettazione ── */
function AcceptancePopup({
  onAccept,
  onRefuse,
}: {
  onAccept: () => void;
  onRefuse: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111827] border border-white/15 rounded-2xl max-w-sm w-full p-6 flex flex-col gap-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <ShieldAlert size={22} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-white/85 text-sm leading-relaxed">
            Attenzione, la visualizzazione o il download dei files di Manualistica,
            implica la presa visione e l&rsquo;accettazione delle norme di sicurezza
            in essi contenuti.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onRefuse}
            className="flex-1 py-3 rounded-xl border border-white/15 text-white/60 text-sm font-semibold hover:bg-white/5 active:scale-95 transition-all"
          >
            RIFIUTA
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-3 rounded-xl bg-[#00aeef] text-white text-sm font-bold hover:bg-[#00aeef]/90 active:scale-95 transition-all shadow-lg shadow-[#00aeef]/20"
          >
            ACCETTA
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Singola riga file ── */
function FileRow({
  file,
  warrantyActive,
  onAction,
}: {
  file:            FileEntry;
  warrantyActive:  boolean;
  onAction:        (att_id: number, action: 'seen' | 'down', url: string, filename: string) => void;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 flex flex-col gap-3">
      {/* nome + dimensione */}
      <div className="flex items-start gap-3">
        <FileText size={20} className="text-[#00aeef] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/90 break-all leading-snug">
            {file.att_filename}
          </p>
          {file.att_size && (
            <p className="text-[10px] text-white/30 mt-0.5">{fmtSize(file.att_size)}</p>
          )}
        </div>
      </div>

      {/* tracciamento */}
      {(file.att_seen || file.att_down) && (
        <div className="flex flex-col gap-0.5 pl-8">
          {file.att_seen && (
            <p className="text-[10px] text-emerald-400/70">{file.att_seen}</p>
          )}
          {file.att_down && (
            <p className="text-[10px] text-[#00aeef]/70">{file.att_down}</p>
          )}
        </div>
      )}

      {/* pulsanti */}
      {warrantyActive ? (
        <div className="flex gap-2 pl-0">
          <button
            onClick={() => onAction(file.att_id, 'seen', file.att_url, file.att_filename)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all rounded-xl py-2.5 text-xs font-semibold text-white/80"
          >
            <Eye size={14} className="text-emerald-400" /> Visualizza
          </button>
          <button
            onClick={() => onAction(file.att_id, 'down', file.att_url, file.att_filename)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all rounded-xl py-2.5 text-xs font-semibold text-white/80"
          >
            <Download size={14} className="text-[#00aeef]" /> Scarica
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 pl-0 opacity-50">
          <Lock size={13} className="text-white/40" />
          <span className="text-[11px] text-white/40">Attiva la garanzia per accedere</span>
        </div>
      )}
    </div>
  );
}

/* ── Pagina principale ── */
function ManualiContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const uid          = searchParams.get('UID') ?? searchParams.get('uid') ?? '';

  const [epc, setEpc]         = useState<string | null>(undefined as any);
  const [files, setFiles]     = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    fetch(`/api/bett/manuali?uid=${encodeURIComponent(uid)}`)
      .then(r => r.json())
      .then(d => {
        setEpc(d.epc ?? null);
        setFiles(d.files ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid]);

  const warrantyActive = epc !== null && epc !== undefined && (epc as any) !== undefined;

  /* Aggiorna riga file localmente dopo POST */
  function patchFile(att_id: number, patch: Partial<FileEntry>) {
    setFiles(prev => prev.map(f => f.att_id === att_id ? { ...f, ...patch } : f));
  }

  /* Chiamata API per tracciare azione */
  async function trackAction(att_id: number, action: 'seen' | 'down', url: string, filename: string) {
    try {
      const res  = await fetch('/api/bett/manuali', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ att_id, action }),
      });
      const data = await res.json();
      if (data.ok) {
        patchFile(att_id, { att_seen: data.att_seen, att_down: data.att_down });
      }
    } catch {}

    /* Esegui azione */
    if (action === 'seen') {
      /* Viewer interno → back button funziona su iOS */
      router.push(`/bett/manuali/viewer?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`);
    } else {
      /* Download: window.location.href compatibile iOS */
      window.location.href = url;
    }
  }

  /* Handler pulsante – controlla se mostrare popup */
  function handleAction(att_id: number, action: 'seen' | 'down', url: string, filename: string) {
    const file = files.find(f => f.att_id === att_id);
    if (!file) return;

    const alreadyTracked =
      (action === 'seen' && file.att_seen !== null) ||
      (action === 'down' && file.att_down !== null);

    if (alreadyTracked) {
      /* già accettato in precedenza → vai diretto */
      if (action === 'seen') {
        router.push(`/bett/manuali/viewer?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`);
      } else {
        const a = document.createElement('a');
        window.location.href = url;
      }
    } else {
      setConfirm({ att_id, action, url, filename });
    }
  }

  function onAccept() {
    if (!confirm) return;
    const { att_id, action, url, filename } = confirm;
    setConfirm(null);
    trackAction(att_id, action, url, filename);
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col font-sans">

      {/* popup */}
      {confirm && <AcceptancePopup onAccept={onAccept} onRefuse={() => setConfirm(null)} />}

      {/* ── HEADER ── */}
      <header className="flex flex-col items-center gap-1 pt-8 pb-4 px-6">
        <img src="/Logo_Bett.png" alt="Bett Sistemi" className="h-12 w-auto drop-shadow-lg" />
        <p className="text-[#00aeef] text-[11px] font-semibold tracking-[0.25em] uppercase mt-1">
          Manuali &amp; Documenti
        </p>
      </header>

      {/* ── BACK ── */}
      <div className="px-5 pt-1">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
        >
          <ArrowLeft size={14} /> Torna al prodotto
        </button>
      </div>

      {/* ── CONTENT ── */}
      <main className="flex-1 flex flex-col px-5 gap-4 py-5 max-w-md mx-auto w-full">

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={36} className="animate-spin text-[#00aeef]" />
          </div>
        )}

        {!loading && (
          <>
            {/* Stato garanzia */}
            <div className={`border rounded-2xl px-4 py-3 flex items-center gap-3 ${
              warrantyActive
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              {warrantyActive ? (
                <ShieldCheck size={18} className="text-green-400 shrink-0" />
              ) : (
                <Lock size={18} className="text-red-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] uppercase tracking-widest font-semibold mb-0.5 ${
                  warrantyActive ? 'text-green-400/70' : 'text-red-400/70'
                }`}>
                  {warrantyActive ? 'Garanzia Attiva' : 'Garanzia non attivata'}
                </p>
                {warrantyActive ? (
                  <p className="text-green-300 text-xs font-bold break-words">{epc}</p>
                ) : (
                  <p className="text-red-400/70 text-xs">
                    Attiva la garanzia per accedere ai manuali
                  </p>
                )}
              </div>
            </div>

            {/* Lista file */}
            {files.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-white/30">
                <BookOpen size={40} strokeWidth={1} />
                <p className="text-sm">Nessun manuale disponibile</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {files.map(file => (
                  <FileRow
                    key={file.att_id}
                    file={file}
                    warrantyActive={warrantyActive}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="text-center py-4 text-[10px] text-white/20 tracking-widest uppercase border-t border-white/5">
        Powered by Bett Sistemi &mdash; RFID NFC Technology
      </footer>
    </div>
  );
}

export default function ManualiPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-[#00aeef]" />
      </div>
    }>
      <ManualiContent />
    </Suspense>
  );
}
