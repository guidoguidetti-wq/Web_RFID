'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  ShieldX,
  BookOpen,
  Loader2,
  MapPin,
  Hash,
  Package,
  AlertTriangle,
  FileText,
  ChevronRight,
} from 'lucide-react';

const PAGE_TITLE      = process.env.NEXT_PUBLIC_BETT_PAGE_TITLE      ?? 'RFID NFC Authenticator Page';
const UID_LABEL       = process.env.NEXT_PUBLIC_BETT_UID_LABEL        ?? 'Unique Product Identifier Scanned';
const SCANNED_IN      = process.env.NEXT_PUBLIC_BETT_SCANNED_IN_LABEL ?? 'Scanned in';
const LOT_LABEL       = process.env.NEXT_PUBLIC_BETT_LOT_LABEL        ?? 'Lot/Supply';
const PROD_CODE_LABEL = process.env.NEXT_PUBLIC_BETT_PRODUCT_CODE_LABEL ?? 'Product Code';
const FAKE_MESSAGE    = process.env.NEXT_PUBLIC_BETT_FAKE_MESSAGE      ?? 'Probably Fake Product - Please Contact US';
const WARRANTY_LABEL  = process.env.NEXT_PUBLIC_BETT_WARRANTY_LABEL   ?? 'Warranty Activation/View';
const MANUALS_LABEL   = process.env.NEXT_PUBLIC_BETT_MANUALS_LABEL    ?? 'Manuals & Documents';

interface BettData {
  found: boolean;
  item?: Record<string, any>;
  product?: Record<string, any>;
}

function BettContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get('UID') ?? searchParams.get('uid') ?? '';

  const [data, setData] = useState<BettData | null>(null);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState<string>('');

  // Fetch item data
  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    fetch(`/api/bett?uid=${encodeURIComponent(uid)}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ found: false }))
      .finally(() => setLoading(false));
  }, [uid]);

  // Detect country from IP
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => setCountry(d.country_name ?? ''))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col">

      {/* ── HEADER ── */}
      <header className="bg-[#00aeef] shadow-lg px-4 py-4 flex flex-col items-center gap-2">
        <img
          src="/Logo_Bett.png"
          alt="Bett Sistemi"
          className="h-14 w-auto drop-shadow"
        />
        <p className="text-white text-sm font-semibold tracking-wide text-center">
          {PAGE_TITLE}
        </p>
      </header>

      {/* ── BODY ── */}
      <main className="flex-1 px-4 py-6 flex flex-col gap-5 max-w-md mx-auto w-full">

        {/* UID card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">{UID_LABEL}</p>
          {uid ? (
            <div className="flex items-center gap-2">
              <Hash size={16} className="text-sky-500 shrink-0" />
              <span className="text-xs text-gray-500 break-all">UID=</span>
              <span className="font-mono font-bold text-sky-700 text-sm break-all">{uid}</span>
            </div>
          ) : (
            <p className="text-red-500 text-sm">Nessun UID rilevato nell&apos;URL.</p>
          )}

          {/* Scanned-in */}
          {country && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <MapPin size={15} className="text-green-500 shrink-0" />
              <span className="text-xs text-gray-500">{SCANNED_IN}</span>
              <span className="text-sm font-semibold text-gray-800">{country}</span>
            </div>
          )}
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-10 text-gray-400">
            <Loader2 size={36} className="animate-spin text-sky-400" />
            <span className="text-sm">Verifica autenticità in corso…</span>
          </div>
        )}

        {/* ── FAKE ── */}
        {!loading && data && !data.found && (
          <div className="bg-red-50 border-2 border-red-400 rounded-2xl shadow-md p-6 flex flex-col items-center gap-4">
            {/* Fake badge SVG */}
            <div className="w-24 h-24 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="46" fill="#fef2f2" stroke="#ef4444" strokeWidth="4" />
                <line x1="25" y1="25" x2="75" y2="75" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
                <line x1="75" y1="25" x2="25" y2="75" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
                <circle cx="50" cy="50" r="46" fill="none" stroke="#ef4444" strokeWidth="4" />
              </svg>
            </div>
            <AlertTriangle size={28} className="text-red-500" />
            <p className="text-red-700 font-bold text-lg text-center">{FAKE_MESSAGE}</p>
            <p className="text-red-500 text-xs text-center">
              UID: <span className="font-mono font-bold">{uid}</span>
            </p>
          </div>
        )}

        {/* ── FOUND ── */}
        {!loading && data?.found && data.item && (
          <>
            {/* Authenticated badge */}
            <div className="flex items-center gap-3 bg-green-50 border border-green-300 rounded-2xl px-4 py-3 shadow-sm">
              <ShieldCheck size={28} className="text-green-500 shrink-0" />
              <div>
                <p className="text-green-700 font-bold text-sm">Prodotto Autentico</p>
                <p className="text-green-600 text-xs">Autenticità verificata con successo</p>
              </div>
            </div>

            {/* Lot / Supply */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-sky-500" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{LOT_LABEL}</span>
              </div>
              <p className="text-base font-semibold text-gray-800 ml-6">
                {data.item.lotto ?? <span className="text-gray-400 italic text-sm">N/D</span>}
              </p>
            </div>

            {/* Product info */}
            {data.product && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 flex flex-col gap-3">
                {/* Product Code */}
                <div>
                  <p className="text-xs text-gray-400 font-medium">{PROD_CODE_LABEL}</p>
                  <p className="text-base font-bold text-gray-800 mt-0.5">{data.item.item_product_id}</p>
                </div>

                {/* fld02 */}
                {data.product.fld02 && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 font-medium">Descrizione</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{data.product.fld02}</p>
                  </div>
                )}

                {/* fldd01 */}
                {data.product.fldd01 && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 font-medium">Info</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{data.product.fldd01}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-1">
              {/* Warranty */}
              <button
                onClick={() => {/* sarà implementato */}}
                className="flex items-center justify-between bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl px-5 py-4 shadow-md active:scale-95 transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-xl p-2">
                    <ShieldCheck size={22} />
                  </div>
                  <span className="font-semibold text-sm">{WARRANTY_LABEL}</span>
                </div>
                <ChevronRight size={20} className="opacity-70" />
              </button>

              {/* Manuals */}
              <button
                onClick={() => {/* sarà implementato */}}
                className="flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl px-5 py-4 shadow-md active:scale-95 transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-xl p-2">
                    <BookOpen size={22} />
                  </div>
                  <span className="font-semibold text-sm">{MANUALS_LABEL}</span>
                </div>
                <ChevronRight size={20} className="opacity-70" />
              </button>
            </div>
          </>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-100">
        Powered by Bett Sistemi &mdash; RFID NFC Technology
      </footer>
    </div>
  );
}

export default function BettPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-sky-400" />
      </div>
    }>
      <BettContent />
    </Suspense>
  );
}
