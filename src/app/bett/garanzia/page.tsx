'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';

function GaranziaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const uid = searchParams.get('UID') ?? searchParams.get('uid') ?? '';

  const [epc, setEpc]                   = useState<string | null>(undefined as any);
  const [dateCreation, setDateCreation] = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [activating, setActivating]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    fetch(`/api/bett/garanzia?uid=${encodeURIComponent(uid)}`)
      .then(r => r.json())
      .then(d => {
        setEpc(d.epc ?? null);
        setDateCreation(d.date_creation ?? null);
      })
      .catch(() => setError('Errore caricamento dati'))
      .finally(() => setLoading(false));
  }, [uid]);

  async function handleAttiva() {
    setActivating(true);
    setError(null);
    try {
      const res = await fetch('/api/bett/garanzia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Errore durante l\'attivazione');
      } else {
        setEpc(data.epc);
      }
    } catch {
      setError('Errore di rete');
    } finally {
      setActivating(false);
    }
  }

  const formattedDate = dateCreation
    ? new Date(dateCreation).toLocaleDateString('it-IT', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col font-sans">

      {/* ── HEADER ── */}
      <header className="relative z-10 flex flex-col items-center gap-1 pt-8 pb-4 px-6">
        <img src="/Logo_Bett.png" alt="Bett Sistemi" className="h-12 w-auto drop-shadow-lg" />
        <p className="text-[#00aeef] text-[11px] font-semibold tracking-[0.25em] uppercase mt-1">
          Certificato di Garanzia
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
      <main className="flex-1 flex flex-col items-center px-6 gap-6 py-6 max-w-md mx-auto w-full">

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={36} className="animate-spin text-[#00aeef]" />
          </div>
        )}

        {!loading && (
          <>
            {/* Immagine garanzia */}
            <img
              src="/Garanzia.jpg"
              alt="Certificato di Garanzia Bett Sistemi"
              className="w-full max-w-xs object-contain drop-shadow-xl"
            />

            {/* Data registrazione prodotto */}
            {formattedDate && (
              <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center w-full">
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Data registrazione prodotto</p>
                <p className="text-sm font-bold text-white/80">{formattedDate}</p>
              </div>
            )}

            {/* Stato garanzia */}
            {epc !== null ? (
              /* Garanzia già attivata */
              <div className="bg-red-500/10 border border-red-500/40 rounded-2xl px-5 py-4 w-full flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-red-400 shrink-0" />
                  <span className="text-[11px] text-red-400/80 uppercase tracking-widest font-semibold">Stato Garanzia</span>
                </div>
                <p className="text-red-400 font-bold text-sm break-words">{epc}</p>
              </div>
            ) : (
              /* Garanzia non ancora attivata */
              <div className="flex flex-col gap-3 w-full">
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-center">
                  <p className="text-white/50 text-sm">Garanzia non ancora attivata</p>
                  <p className="text-white/30 text-xs mt-1">Premi il pulsante per attivare la garanzia del prodotto</p>
                </div>
                <button
                  onClick={handleAttiva}
                  disabled={activating}
                  className="w-full flex items-center justify-center gap-2 bg-[#00aeef] hover:bg-[#00aeef]/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-2xl py-4 font-bold text-white text-sm tracking-wide shadow-lg shadow-[#00aeef]/20"
                >
                  {activating ? (
                    <><Loader2 size={18} className="animate-spin" /> Attivazione in corso…</>
                  ) : (
                    <><ShieldCheck size={18} /> Attiva Garanzia</>
                  )}
                </button>
              </div>
            )}

            {/* Errore */}
            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
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

export default function GaranziaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-[#00aeef]" />
      </div>
    }>
      <GaranziaContent />
    </Suspense>
  );
}
