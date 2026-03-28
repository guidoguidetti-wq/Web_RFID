'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  BookOpen,
  Loader2,
  ShieldAlert,
  Phone,
  MessageSquare,
} from 'lucide-react';

const PAGE_TITLE      = process.env.NEXT_PUBLIC_BETT_PAGE_TITLE           ?? 'RFID NFC Authenticator';
const UID_LABEL       = process.env.NEXT_PUBLIC_BETT_UID_LABEL             ?? 'Unique Product Identifier';
const SCANNED_IN      = process.env.NEXT_PUBLIC_BETT_SCANNED_IN_LABEL     ?? 'Scanned in';
const LOT_LABEL       = process.env.NEXT_PUBLIC_BETT_LOT_LABEL             ?? 'Lot/Supply';
const PROD_CODE_LABEL = process.env.NEXT_PUBLIC_BETT_PRODUCT_CODE_LABEL   ?? 'Product Code';
const FAKE_MESSAGE    = process.env.NEXT_PUBLIC_BETT_FAKE_MESSAGE          ?? 'Prodotto Non Autentico';
const BETT_PHONE      = process.env.NEXT_PUBLIC_BETT_PHONE                 ?? '+393492284826';
const WARRANTY_LABEL  = process.env.NEXT_PUBLIC_BETT_WARRANTY_LABEL       ?? 'Garanzia';
const MANUALS_LABEL   = process.env.NEXT_PUBLIC_BETT_MANUALS_LABEL        ?? 'Manuali';

interface BettData {
  found: boolean;
  item?: Record<string, any>;
  product?: Record<string, any>;
  productImage?: string | null;
}

/* ─── compact label + value ─── */
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#00aeef]/70">{label}</span>
      <span className="text-sm font-bold text-white leading-snug">{value}</span>
    </div>
  );
}

function BettContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get('UID') ?? searchParams.get('uid') ?? '';

  const [data, setData] = useState<BettData | null>(null);
  const [loading, setLoading] = useState(true);
  const [country, setCountry]         = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('');

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    fetch(`/api/bett?uid=${encodeURIComponent(uid)}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ found: false }))
      .finally(() => setLoading(false));
  }, [uid]);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => {
        setCountry(d.country_name ?? '');
        setCountryCode(d.country_code ?? '');
      })
      .catch(() => {});
  }, []);

  const item    = data?.item;
  const product = data?.product;
  const isFound = !loading && data?.found;
  const isFake  = !loading && data && !data.found;

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col font-sans">

      {/* ── HEADER ── */}
      <header className="relative z-10 flex flex-col items-center gap-1 pt-8 pb-4 px-6">
        <img
          src="/Logo_Bett.png"
          alt="Bett Sistemi"
          className="h-12 w-auto drop-shadow-lg"
        />
        <p className="text-[#00aeef] text-[11px] font-semibold tracking-[0.25em] uppercase mt-1">
          {PAGE_TITLE}
        </p>
      </header>

      {/* ── LOADING ── */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/40">
          <Loader2 size={40} className="animate-spin text-[#00aeef]" />
          <span className="text-sm tracking-wide">Verifica autenticità…</span>
        </div>
      )}

      {/* ── FAKE ── */}
      {isFake && (
        <main className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="w-28 h-28 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
            <ShieldAlert size={52} className="text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-red-400 font-bold text-xl tracking-wide">{FAKE_MESSAGE}</p>
            <p className="text-red-500/70 text-xs mt-2">Contattare il produttore</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center">
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{UID_LABEL}</p>
            <p className="font-mono text-xs text-white/60 break-all">{uid}</p>
          </div>

          {/* Contact buttons */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <a
              href={`tel:${BETT_PHONE}`}
              className="flex flex-col items-center justify-center gap-2 bg-[#00aeef]/15 border border-[#00aeef]/30 rounded-2xl aspect-square active:scale-95 transition-transform hover:bg-[#00aeef]/25"
            >
              <div className="w-10 h-10 rounded-xl bg-[#00aeef]/20 flex items-center justify-center">
                <Phone size={22} className="text-[#00aeef]" />
              </div>
              <span className="text-xs font-semibold text-white/80 text-center px-2 leading-tight">Chiama Bett Sistemi</span>
            </a>

            <a
              href={`sms:${BETT_PHONE}`}
              className="flex flex-col items-center justify-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl aspect-square active:scale-95 transition-transform hover:bg-emerald-500/25"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <MessageSquare size={22} className="text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-white/80 text-center px-2 leading-tight">Invia SMS a Bett Sistemi</span>
            </a>
          </div>
        </main>
      )}

      {/* ── FOUND ── */}
      {isFound && item && (
        <main className="flex-1 flex flex-col max-w-md mx-auto w-full">

          {/* Product image – half height (aspect-[2/1]) */}
          {data?.productImage ? (
            <div className="w-full aspect-[2/1] relative overflow-hidden">
              <img
                src={data.productImage}
                alt="Prodotto"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/10 to-transparent" />
            </div>
          ) : (
            <div className="w-full aspect-[2/1] bg-gradient-to-br from-[#00aeef]/10 to-[#0a0e1a] flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#00aeef]/10 flex items-center justify-center">
                <ShieldCheck size={32} className="text-[#00aeef]/40" />
              </div>
            </div>
          )}

          <div className="px-5 flex flex-col gap-4 pb-8 mt-4 relative z-10">

            {/* ── AUTHENTIC BADGE (includes UID + country) ── */}
            <div className="bg-green-500/15 border border-green-500/40 rounded-2xl px-4 py-3 backdrop-blur-sm flex flex-col gap-3">
              {/* top row: shield + label */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} className="text-green-400" />
                </div>
                <div>
                  <p className="text-green-300 font-bold text-sm tracking-wide">PRODOTTO AUTENTICO</p>
                  <p className="text-green-400/70 text-xs">Autenticità verificata con successo</p>
                </div>
              </div>

              {/* divider */}
              <div className="border-t border-green-500/20" />

              {/* UID */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-green-400/50 mb-0.5">{UID_LABEL}</p>
                <p className="font-mono text-[11px] text-white/60 break-all">{uid}</p>
              </div>

              {/* Country with flag */}
              {country && (
                <div className="flex items-center gap-2">
                  {countryCode && (
                    <img
                      src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`}
                      alt={country}
                      className="w-5 h-auto rounded-sm shrink-0"
                    />
                  )}
                  <span className="text-[11px] text-white/40">{SCANNED_IN}</span>
                  <span className="text-[11px] font-semibold text-white/70">{country}</span>
                </div>
              )}
            </div>

            {/* ── PRODUCT INFO BLOCK ── */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoRow label={LOT_LABEL}       value={item.lotto} />
              <InfoRow label={PROD_CODE_LABEL} value={item.item_product_id} />
              <InfoRow label="Variant"         value={product?.fld02} />
              <InfoRow label="Info"            value={product?.fldd01} />
            </div>

            {/* ── ACTION BUTTONS 2×2 grid ── */}
            <div className="grid grid-cols-2 gap-3 mt-1">
              {/* Warranty */}
              <button
                onClick={() => {/* implementare */}}
                className="flex flex-col items-center justify-center gap-2 bg-[#00aeef]/15 border border-[#00aeef]/30 rounded-2xl aspect-square active:scale-95 transition-transform hover:bg-[#00aeef]/25"
              >
                <div className="w-10 h-10 rounded-xl bg-[#00aeef]/20 flex items-center justify-center">
                  <ShieldCheck size={22} className="text-[#00aeef]" />
                </div>
                <span className="text-xs font-semibold text-white/80 text-center px-2 leading-tight">{WARRANTY_LABEL}</span>
              </button>

              {/* Manuals */}
              <button
                onClick={() => {/* implementare */}}
                className="flex flex-col items-center justify-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl aspect-square active:scale-95 transition-transform hover:bg-emerald-500/25"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <BookOpen size={22} className="text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-white/80 text-center px-2 leading-tight">{MANUALS_LABEL}</span>
              </button>
            </div>

          </div>
        </main>
      )}

      {/* ── FOOTER ── */}
      {!loading && (
        <footer className="text-center py-4 text-[10px] text-white/20 tracking-widest uppercase border-t border-white/5">
          Powered by Bett Sistemi &mdash; RFID NFC Technology
        </footer>
      )}
    </div>
  );
}

export default function BettPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-[#00aeef]" />
      </div>
    }>
      <BettContent />
    </Suspense>
  );
}
