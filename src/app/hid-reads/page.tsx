'use client';

import { useState, useRef, useEffect } from 'react';
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

export default function HidReadsPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [readings, setReadings] = useState<ReadResult[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [started, setStarted] = useState(false);

  const focusInput = () => {
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleStart = () => {
    setStarted(true);
    focusInput();
  };

  const handleClear = () => {
    setReadings([]);
    focusInput();
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const epc = inputValue.trim();
      if (!epc) return;
      setInputValue('');

      try {
        const res = await fetch(`/api/hid-reads?epc=${encodeURIComponent(epc)}`);
        if (res.ok) {
          const data: ReadResult = await res.json();
          setReadings(prev => [data, ...prev]);
        }
      } catch (error) {
        console.error('Errore lettura EPC', error);
      }

      focusInput();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/menu')} className="text-gray-600 hover:text-gray-800">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Letture HID</h1>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleStart}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg shadow transition-colors"
        >
          <Play size={16} />
          START
        </button>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-lg shadow transition-colors"
        >
          <Trash2 size={16} />
          CLEAR
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow transition-colors"
        >
          <Save size={16} />
          SAVE
        </button>
      </div>

      {/* EPC Input Field */}
      <div className="mb-4">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={started ? 'In attesa di lettura EPC...' : 'Premi START per iniziare'}
          disabled={!started}
          className="w-full border-2 border-blue-300 focus:border-blue-500 rounded-lg px-4 py-2 text-sm font-mono outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        />
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-auto min-w-max md:min-w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-3 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">#</th>
                <th className="px-3 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">EPC</th>
                <th className="px-3 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Stato</th>
                <th className="px-3 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">fld01</th>
                <th className="px-3 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">fld02</th>
                <th className="px-3 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">fld03</th>
                <th className="px-3 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">fldd01</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {readings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 text-xs">
                    Nessuna lettura ancora. Premi START e avvicina un tag RFID.
                  </td>
                </tr>
              ) : (
                readings.map((r, idx) => (
                  <tr key={idx} className={`hover:bg-gray-50 ${r.status === 'unknown' ? 'bg-red-50' : ''}`}>
                    <td className="px-3 py-2 text-[10px] sm:text-xs text-gray-500">{readings.length - idx}</td>
                    <td className="px-3 py-2 text-[10px] sm:text-xs font-mono text-gray-800 whitespace-nowrap">{r.epc}</td>
                    <td className="px-3 py-2 text-[10px] sm:text-xs whitespace-nowrap">
                      {r.status === 'valid' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">valid</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800">unknown</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-[10px] sm:text-xs text-gray-700 whitespace-nowrap">{r.fld01 || '-'}</td>
                    <td className="px-3 py-2 text-[10px] sm:text-xs text-gray-700 whitespace-nowrap">{r.fld02 || '-'}</td>
                    <td className="px-3 py-2 text-[10px] sm:text-xs text-gray-700 whitespace-nowrap">{r.fld03 || '-'}</td>
                    <td className="px-3 py-2 text-[10px] sm:text-xs text-gray-700">{r.fldd01 || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
