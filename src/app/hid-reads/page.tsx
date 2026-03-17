'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Trash2, Save } from 'lucide-react';

interface ReadResult {
  epc: string;
  status: 'valid' | 'unknown';
  fld01: string | null;
  fld02: string | null;
  fld03: string | null;
  fldd01: string | null;
}

const EPC_LENGTH = 24;

export default function HidReadsPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferRef = useRef('');
  const [inputValue, setInputValue] = useState('');
  const [readings, setReadings] = useState<ReadResult[]>([]);
  const [started, setStarted] = useState(false);

  const focusInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleStart = () => {
    setStarted(true);
    focusInput();
  };

  const handleClear = () => {
    setReadings([]);
    bufferRef.current = '';
    setInputValue('');
    focusInput();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    bufferRef.current = e.target.value;
    setInputValue(e.target.value);
  };

  const fetchEpc = async (epc: string): Promise<ReadResult> => {
    try {
      const res = await fetch(`/api/hid-reads?epc=${encodeURIComponent(epc)}`);
      if (res.ok) return await res.json();
    } catch {
      // fall through to unknown
    }
    return { epc, status: 'unknown', fld01: null, fld02: null, fld03: null, fldd01: null };
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    const raw = bufferRef.current.trim();
    bufferRef.current = '';
    setInputValue('');

    if (!raw) {
      focusInput();
      return;
    }

    // Split into 24-char EPCs if multiple tags were read simultaneously
    const epcs: string[] = [];
    if (raw.length >= EPC_LENGTH && raw.length % EPC_LENGTH === 0) {
      for (let i = 0; i < raw.length; i += EPC_LENGTH) {
        epcs.push(raw.substring(i, i + EPC_LENGTH));
      }
    } else {
      epcs.push(raw);
    }

    const results = await Promise.all(epcs.map(fetchEpc));
    setReadings(prev => {
      const existingEpcs = new Set(prev.map(r => r.epc));
      const newResults = results.filter(r => !existingEpcs.has(r.epc));
      return [...newResults, ...prev];
    });
    focusInput();
  };

  const validCount = readings.filter(r => r.status === 'valid').length;
  const unknownCount = readings.filter(r => r.status === 'unknown').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.push('/menu')} className="text-gray-600 hover:text-gray-800 shrink-0">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-gray-800">Letture HID</h1>

        {/* Counters */}
        {readings.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
              Tot: {readings.length}
            </span>
            {validCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                ✓ {validCount}
              </span>
            )}
            {unknownCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                ? {unknownCount}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 p-3 sm:p-5 flex flex-col gap-3">
        {/* Toolbar + Input */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-sm font-semibold rounded-lg shadow transition-colors"
            >
              <Play size={15} />
              START
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white text-sm font-semibold rounded-lg shadow transition-colors"
            >
              <Trash2 size={15} />
              CLEAR
            </button>
            <button
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition-colors"
            >
              <Save size={15} />
              SAVE
            </button>
          </div>

          {/* EPC input — hidden visually on mobile but always focusable */}
          <input
            ref={inputRef}
            type="text"
            inputMode="none"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={started ? 'In attesa di lettura EPC...' : 'Premi START per iniziare'}
            disabled={!started}
            className="w-full border-2 border-blue-300 focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-mono outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        {/* Grid — table su desktop, cards su mobile */}
        {readings.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm text-center px-4">
            Nessuna lettura. Premi START e avvicina un tag RFID.
          </div>
        ) : (
          <>
            {/* Desktop table (md+) */}
            <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-3 py-2.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider w-8">#</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider">EPC</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider">Stato</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider">fld01</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider">fld02</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider">fld03</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider">fldd01</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {readings.map((r, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-gray-50 transition-colors ${r.status === 'unknown' ? 'bg-red-50 hover:bg-red-100' : ''}`}
                      >
                        <td className="px-3 py-2 text-[10px] text-gray-400">{readings.length - idx}</td>
                        <td className="px-3 py-2 text-xs font-mono text-gray-800 whitespace-nowrap">{r.epc}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {r.status === 'valid'
                            ? <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">valid</span>
                            : <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800">unknown</span>
                          }
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{r.fld01 || '-'}</td>
                        <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{r.fld02 || '-'}</td>
                        <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{r.fld03 || '-'}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{r.fldd01 || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards (< md) */}
            <div className="flex md:hidden flex-col gap-2">
              {readings.map((r, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-xl border shadow-sm p-3 ${r.status === 'unknown' ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-semibold text-gray-800 break-all">{r.epc}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-gray-400">#{readings.length - idx}</span>
                      {r.status === 'valid'
                        ? <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">valid</span>
                        : <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800">unknown</span>
                      }
                    </div>
                  </div>
                  {r.status === 'valid' && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                      {r.fld01 && (
                        <div><span className="text-gray-400">fld01 </span><span className="text-gray-800 font-medium">{r.fld01}</span></div>
                      )}
                      {r.fld02 && (
                        <div><span className="text-gray-400">fld02 </span><span className="text-gray-800 font-medium">{r.fld02}</span></div>
                      )}
                      {r.fld03 && (
                        <div><span className="text-gray-400">fld03 </span><span className="text-gray-800 font-medium">{r.fld03}</span></div>
                      )}
                      {r.fldd01 && (
                        <div className="col-span-2"><span className="text-gray-400">fldd01 </span><span className="text-gray-800">{r.fldd01}</span></div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
