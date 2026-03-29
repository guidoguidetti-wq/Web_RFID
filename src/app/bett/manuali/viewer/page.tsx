'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';

function ViewerContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const url      = searchParams.get('url') ?? '';
  const filename = searchParams.get('filename') ?? 'documento';

  return (
    <div className="h-screen bg-[#0a0e1a] flex flex-col">

      {/* ── TOPBAR ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0a0e1a] shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft size={18} /> Torna ai Manuali
        </button>

        <a
          href={url}
          download={filename}
          className="flex items-center gap-1.5 text-[#00aeef] text-sm font-semibold"
        >
          <Download size={16} /> Scarica
        </a>
      </div>

      {/* ── IFRAME VIEWER ── */}
      {url ? (
        <iframe
          src={url}
          title={filename}
          className="flex-1 w-full border-0"
          allow="fullscreen"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
          Nessun documento da visualizzare
        </div>
      )}
    </div>
  );
}

export default function ViewerPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#0a0e1a] flex items-center justify-center text-white/40 text-sm">
        Caricamento…
      </div>
    }>
      <ViewerContent />
    </Suspense>
  );
}
