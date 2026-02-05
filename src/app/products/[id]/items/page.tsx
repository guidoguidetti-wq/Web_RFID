'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trash2, ArrowLeft, Activity } from 'lucide-react';

export default function ProductItemsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [id]);

  const fetchItems = async () => {
    try {
      const res = await fetch(`/api/items?product_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Error fetching items", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo item e tutti i movimenti collegati?")) return;
    
    try {
      const res = await fetch(`/api/items?id=${itemId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchItems();
      } else {
        const err = await res.json();
        alert(err.error || "Errore cancellazione item");
      }
    } catch (error) {
      console.error("Failed to delete item", error);
    }
  };

  if (loading) return <div className="p-10 text-center">Caricamento items...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-800">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Lista Items (Prodotto {id})</h1>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        {items.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Nessun item trovato.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                {Object.keys(items[0]).map((key) => (
                  <th key={key} className="px-6 py-4 text-sm font-bold text-gray-700">{key}</th>
                ))}
                <th className="px-6 py-4 text-sm font-bold text-gray-700 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {Object.values(item).map((val: any, j) => (
                    <td key={j} className="px-6 py-4 text-sm text-gray-700">{String(val)}</td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => router.push(`/items/${encodeURIComponent(item.item_id || item.id)}/movements`)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition"
                        title="Storico Movimenti"
                      >
                        <Activity size={20} />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.item_id || item.id)} 
                        className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition"
                        title="Elimina Item"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
