'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PersonQRCard from '@/components/PersonQRCard';
import PersonOnboardForm from '@/components/PersonOnboardForm';
import { Loader2, AlertCircle } from 'lucide-react';

interface QRCheckResponse {
  exists: boolean;
  hasAssociation: boolean;
  item: any;
  person: any;
  code: string;
  error?: string;
}

export default function QRCodePage() {
  const params = useParams();
  const code = params.code as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<QRCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch QR data
  const fetchQRData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/qr/check?code=${encodeURIComponent(code)}`);
      const json = await response.json();

      if (response.ok) {
        setData(json);
      } else {
        setError(json.error || 'Errore nella verifica del codice QR');
      }
    } catch (err) {
      console.error('Error fetching QR data:', err);
      setError('Errore di connessione. Verifica la tua rete.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    if (code) {
      fetchQRData();
    }
  }, [code]);

  // Handle successful onboarding
  const handleOnboardSuccess = () => {
    // Reload data to show the card
    fetchQRData();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Errore
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={fetchQRData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  // Render based on association status
  if (data?.hasAssociation && data.person) {
    // Show person card
    return <PersonQRCard person={data.person} />;
  }

  // Show onboarding form
  return <PersonOnboardForm code={code} onSuccess={handleOnboardSuccess} />;
}
