'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardList, Plus, Pencil, Lock, Trash2, Eye, X, Save } from 'lucide-react';

export default function InventoriesPage() {
  const router = useRouter();
  const [inventories, setInventories] = useState<any[]>([]);
  const [filteredInventories, setFilteredInventories] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlace, setUserPlace] = useState('');
  const [userName, setUserName] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentInv, setCurrentInv] = useState<any>({});

  // Close Modal State
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeOptions, setCloseOptions] = useState({
    create_movements: false,
    update_items: true
  });
  const [invToClose, setInvToClose] = useState<any>(null);

  const [filters, setFilters] = useState({
    inv_id: '',
    inv_name: '',
    inv_start_date: '',
    inv_place_id: '',
    inv_state: '',
    inv_note: '',
    inv_chk_id: ''
  });

  const fetchInventories = async () => {
    const res = await fetch('/api/inventories');
    if (res.ok) {
      const data = await res.json();
      setInventories(data);
      setFilteredInventories(data);
    }
  };

  const fetchPlaces = async () => {
    const res = await fetch('/api/places');
    if (res.ok) {
      const data = await res.json();
      setPlaces(data);
    }
  };

  const fetchZones = async () => {
    const res = await fetch('/api/zones');
    if (res.ok) {
      const data = await res.json();
      setZones(data);
    }
  };

  const fetchChecklists = async (place: string) => {
    try {
      const url = place ? `/api/checklists?place=${encodeURIComponent(place)}` : '/api/checklists';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setChecklists(data);
      }
    } catch (error) {
      console.error("Failed to load checklists", error);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchInventories(),
        fetchPlaces(),
        fetchZones()
      ]);
    } catch (error) {
      console.error("Error loading initial data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load user
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserPlace(user.place || '');
      setUserName(user.name || '');
    }
    
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchChecklists(userPlace);
  }, [userPlace]);

  useEffect(() => {
    if (inventories.length > 0) {
      const filtered = inventories.filter(inv => {
        const idMatch = String(inv.inv_id).toLowerCase().includes(filters.inv_id.toLowerCase());
        const nameMatch = (inv.inv_name || '').toLowerCase().includes(filters.inv_name.toLowerCase());
        const dateMatch = formatDate(inv.inv_start_date).toLowerCase().includes(filters.inv_start_date.toLowerCase());
        const placeVal = inv.place_name || inv.inv_place_id || '';
        const placeMatch = placeVal.toLowerCase().includes(filters.inv_place_id.toLowerCase());
        const stateMatch = String(inv.inv_state || '').toLowerCase().includes(filters.inv_state.toLowerCase());
        const noteMatch = (inv.inv_note || '').toLowerCase().includes(filters.inv_note.toLowerCase());
        const chkMatch = String(inv.inv_chk_id || '').toLowerCase().includes(filters.inv_chk_id.toLowerCase());

        return idMatch && nameMatch && dateMatch && placeMatch && stateMatch && noteMatch && chkMatch;
      });
      setFilteredInventories(filtered);
    } else {
      setFilteredInventories([]);
    }
  }, [inventories, filters]);

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Actions
  const openAddModal = () => {
    const now = new Date();
    // Use local time for the ISO-like string to match input expectations if needed, 
    // but toISOString() is UTC. Usually datetime-local expects local time format 'yyyy-MM-ddThh:mm:ss'.
    // The previous code used toISOString().slice(0,16) which is UTC. 
    // If the user wants local time pre-filled correctly, we should adjust.
    // However, I will stick to the requested change strictly first: "aggiungi hh:mm:ss".
    // toISOString().slice(0, 19) gives '2023-01-01T12:00:00'.
    
    // Better approach for local time string:
    const offset = now.getTimezoneOffset() * 60000;
    const localIso = new Date(now.getTime() - offset).toISOString().slice(0, 19);

    const dateStr = now.toLocaleString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '');
    const defaultName = `${userName} - ${userPlace} - ${dateStr}`;

    setCurrentInv({
      inv_name: defaultName,
      inv_start_date: localIso,
      inv_place_id: userPlace, // Also pre-fill place if desired, logical default
      inv_state: 'OPEN',
      inv_note: '',
      inv_chk_id: '',
      inv_last: false,
      inv_last_place: '',
      inv_last_zones: '',
      inv_det_place: userPlace,
      inv_det_zone: '',
      inv_mis_place: userPlace,
      inv_mis_zone: ''
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (inv: any) => {
    setCurrentInv({
      ...inv,
      inv_start_date: inv.inv_start_date ? new Date(inv.inv_start_date).toISOString().slice(0, 16) : ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleLastChange = (checked: boolean) => {
    setCurrentInv((prev: any) => ({
      ...prev,
      inv_last: checked,
      inv_chk_id: checked ? 0 : prev.inv_chk_id,
      inv_last_place: checked ? prev.inv_last_place : null,
      inv_last_zones: checked ? prev.inv_last_zones : null
    }));
  };

  const handleStateChange = (newState: string) => {
    if (newState === 'CLOSE') {
        alert('ATTENZIONE modifico lo stato ma NON eseguo registrazioni - Per una corretta registrazione di chiusura utilizza l\'apposita icona nella pagina Inventari');
    }
    setCurrentInv((prev: any) => ({ ...prev, inv_state: newState }));
  };

  const handleZoneToggle = (zoneId: string) => {
    const currentZones = currentInv.inv_last_zones ? currentInv.inv_last_zones.split(';').filter((z: string) => z) : [];
    let newZones;
    if (currentZones.includes(zoneId)) {
        newZones = currentZones.filter((z: string) => z !== zoneId);
    } else {
        newZones = [...currentZones, zoneId];
    }
    setCurrentInv((prev: any) => ({ ...prev, inv_last_zones: newZones.join(';') }));
  };

  const handleSave = async () => {
    try {
      const url = isEditing ? '/api/inventories' : '/api/inventories';
      const method = isEditing ? 'PUT' : 'POST';
      
      const payload = { ...currentInv };
      if (!payload.inv_last) {
         payload.inv_last_place = null;
         payload.inv_last_zones = null;
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchInventories();
      } else {
        const err = await res.json();
        alert('Errore: ' + (err.error || 'Salvataggio fallito'));
      }
    } catch (error) {
      console.error("Error saving", error);
      alert('Errore di connessione');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo inventario e tutti i suoi item?')) return;
    try {
      const res = await fetch(`/api/inventories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchInventories();
      } else {
        alert('Errore nella cancellazione');
      }
    } catch (error) {
      console.error(error);
      alert('Errore di connessione');
    }
  };

  const handleCloseInventory = (inv: any) => {
    if (inv.inv_state === 'CLOSE') {
        alert('Inventario già chiuso.');
        return;
    }
    setInvToClose(inv);
    setCloseOptions({
        create_movements: false,
        update_items: true
    });
    setIsCloseModalOpen(true);
  };

  const confirmCloseInventory = async () => {
     if (!invToClose) return;
     
     try {
       const res = await fetch('/api/inventories/close', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            inv_id: invToClose.inv_id,
            create_movements: closeOptions.create_movements,
            update_items: closeOptions.update_items
         })
       });

       if (res.ok) {
         setIsCloseModalOpen(false);
         setInvToClose(null);
         fetchInventories();
       } else {
         const err = await res.json();
         alert('Errore: ' + (err.error || 'Chiusura fallita'));
       }
     } catch (error) {
       console.error("Error closing", error);
       alert('Errore di connessione');
     }
  };


  if (loading) return <div className="p-10 text-center text-gray-500">Caricamento inventari...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
            <button onClick={() => router.push('/menu')} className="text-gray-600 hover:text-gray-800">
            <ArrowLeft size={24} />
            </button>
            <img src="/RFID_System_Logo.png" alt="Logo" className="h-8 w-auto" />
            <h1 className="text-2xl font-bold text-gray-800">Inventari</h1>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> Nuovo Inventario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="px-4 py-4 text-sm font-bold text-gray-700 w-[6%] align-top">
                  <div className="flex flex-col gap-2">
                    <span>ID</span>
                    <input 
                      type="text" 
                      placeholder="Filtra" 
                      className="text-xs font-normal p-1 border border-gray-300 rounded w-full"
                      value={filters.inv_id}
                      onChange={(e) => handleFilterChange('inv_id', e.target.value)}
                    />
                  </div>
                </th>
                <th className="px-4 py-4 text-sm font-bold text-gray-700 w-[15%] align-top">
                   <div className="flex flex-col gap-2">
                    <span>Nome</span>
                    <input 
                      type="text" 
                      placeholder="Filtra" 
                      className="text-xs font-normal p-1 border border-gray-300 rounded w-full"
                      value={filters.inv_name}
                      onChange={(e) => handleFilterChange('inv_name', e.target.value)}
                    />
                  </div>
                </th>
                <th className="px-4 py-4 text-sm font-bold text-gray-700 w-[12%] align-top">
                   <div className="flex flex-col gap-2">
                    <span>Data Inizio</span>
                    <input 
                      type="text" 
                      placeholder="Filtra" 
                      className="text-xs font-normal p-1 border border-gray-300 rounded w-full"
                      value={filters.inv_start_date}
                      onChange={(e) => handleFilterChange('inv_start_date', e.target.value)}
                    />
                  </div>
                </th>
                <th className="px-4 py-4 text-sm font-bold text-gray-700 w-[6%] align-top">
                    <div className="flex flex-col gap-2 pt-1">
                      <span>Items</span>
                    </div>
                </th>
                <th className="px-4 py-4 text-sm font-bold text-gray-700 w-[10%] align-top">
                   <div className="flex flex-col gap-2">
                    <span>Luogo</span>
                    <input 
                      type="text" 
                      placeholder="Filtra" 
                      className="text-xs font-normal p-1 border border-gray-300 rounded w-full"
                      value={filters.inv_place_id}
                      onChange={(e) => handleFilterChange('inv_place_id', e.target.value)}
                    />
                  </div>
                </th>
                <th className="px-4 py-4 text-sm font-bold text-gray-700 w-[8%] align-top">
                   <div className="flex flex-col gap-2">
                    <span>Stato</span>
                    <input 
                      type="text" 
                      placeholder="Filtra" 
                      className="text-xs font-normal p-1 border border-gray-300 rounded w-full"
                      value={filters.inv_state}
                      onChange={(e) => handleFilterChange('inv_state', e.target.value)}
                    />
                  </div>
                </th>
                <th className="px-4 py-4 text-sm font-bold text-gray-700 w-[12%] align-top">
                   <div className="flex flex-col gap-2">
                    <span>Note</span>
                    <input 
                      type="text" 
                      placeholder="Filtra" 
                      className="text-xs font-normal p-1 border border-gray-300 rounded w-full"
                      value={filters.inv_note}
                      onChange={(e) => handleFilterChange('inv_note', e.target.value)}
                    />
                  </div>
                </th>
                 <th className="px-4 py-4 text-sm font-bold text-gray-700 w-[8%] align-top">
                   <div className="flex flex-col gap-2">
                    <span>Checklist</span>
                    <input 
                      type="text" 
                      placeholder="Filtra" 
                      className="text-xs font-normal p-1 border border-gray-300 rounded w-full"
                      value={filters.inv_chk_id}
                      onChange={(e) => handleFilterChange('inv_chk_id', e.target.value)}
                    />
                  </div>
                </th>
                <th className="px-4 py-4 text-sm font-bold text-gray-700 w-[23%] align-top text-right">
                    Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventories.length === 0 ? (
                 <tr><td colSpan={9} className="p-8 text-center text-gray-500">Nessun inventario trovato.</td></tr>
              ) : (
                filteredInventories.map((inv, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm text-gray-700 truncate" title={String(inv.inv_id)}>{inv.inv_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 truncate" title={inv.inv_name}>{inv.inv_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 truncate" title={formatDate(inv.inv_start_date)}>{formatDate(inv.inv_start_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-semibold">{inv.item_count}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 truncate" title={inv.place_name || inv.inv_place_id}>
                      {inv.place_name || inv.inv_place_id}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold truncate">
                        <span className={`px-2 py-1 rounded text-xs ${inv.inv_state === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {inv.inv_state}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 truncate" title={inv.inv_note}>{inv.inv_note}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 truncate">{inv.inv_chk_id}</td>
                    <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => router.push(`/inventories/${inv.inv_id}/items`)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100"
                                title="Dettagli"
                            >
                                <Eye size={18} />
                            </button>
                            <button 
                                onClick={() => openEditModal(inv)}
                                className="text-yellow-600 hover:text-yellow-800 p-1 rounded hover:bg-yellow-100"
                                title="Modifica"
                            >
                                <Pencil size={18} />
                            </button>
                            <button 
                                onClick={() => handleCloseInventory(inv)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100"
                                title="Chiudi Inventario"
                            >
                                <Lock size={18} />
                            </button>
                            <button 
                                onClick={() => handleDelete(inv.inv_id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100"
                                title="Elimina"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Close Inventory Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-red-50 rounded-t-xl">
                    <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                        <Lock size={20} /> Chiudi Inventario
                    </h3>
                    <button onClick={() => setIsCloseModalOpen(false)} className="text-gray-500 hover:text-red-500">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-700 font-medium">Stai per chiudere l'inventario: <br/><span className="font-bold">{invToClose?.inv_name}</span></p>
                    
                    <div className="space-y-3 bg-gray-50 p-4 rounded border border-gray-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                checked={closeOptions.create_movements}
                                onChange={(e) => setCloseOptions(p => ({...p, create_movements: e.target.checked}))}
                            />
                            <span className="text-sm text-gray-700">Registra movimenti di Trasferimento Items</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                checked={closeOptions.update_items}
                                onChange={(e) => setCloseOptions(p => ({...p, update_items: e.target.checked}))}
                            />
                            <span className="text-sm text-gray-700">Sposto gli items (Aggiorna Item Last Pos)</span>
                        </label>
                    </div>

                    <div className="text-red-600 text-sm font-bold flex items-center gap-2 bg-red-50 p-2 rounded">
                        <span className="text-xl">⚠️</span> Attenzione: Operazione irreversibile.
                    </div>
                </div>
                <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                    <button 
                        onClick={() => setIsCloseModalOpen(false)} 
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                    >
                        Annulla
                    </button>
                    <button 
                        onClick={confirmCloseInventory} 
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-bold"
                    >
                        Conferma Chiusura
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-800">{isEditing ? 'Modifica Inventario' : 'Nuovo Inventario'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={currentInv.inv_name || ''}
                    onChange={(e) => setCurrentInv({...currentInv, inv_name: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio</label>
                  <input
                    type="datetime-local"
                    step="1"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={currentInv.inv_start_date || ''}
                    onChange={(e) => setCurrentInv({...currentInv, inv_start_date: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={currentInv.inv_place_id || ''}
                    onChange={(e) => setCurrentInv({...currentInv, inv_place_id: e.target.value})}
                  >
                    <option value="">Seleziona Place...</option>
                    {places.map(p => (
                        <option key={p.place_id} value={p.place_id}>{p.place_id} - {p.place_name}</option>
                    ))}
                  </select>
               </div>
               
               {/* Items Detected & Missing Groups */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-2">
                 <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-800 mb-2">Destinazione Items Detected</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Place Detected</label>
                        <select
                           className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                           value={currentInv.inv_det_place || ''}
                           onChange={(e) => setCurrentInv({...currentInv, inv_det_place: e.target.value})}
                        >
                           <option value="">Seleziona Place...</option>
                           {places.map(p => (
                               <option key={p.place_id} value={p.place_id}>{p.place_id} - {p.place_name}</option>
                           ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Zone Detected</label>
                        <select
                           className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                           value={currentInv.inv_det_zone || ''}
                           onChange={(e) => setCurrentInv({...currentInv, inv_det_zone: e.target.value})}
                        >
                           <option value="">Seleziona Zone...</option>
                           {zones.map(z => (
                               <option key={z.zone_id} value={z.zone_id}>{z.zone_id} - {z.zone_name}</option>
                           ))}
                        </select>
                      </div>
                    </div>
                 </div>

                 <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <h4 className="text-sm font-bold text-red-800 mb-2">Destinazione Items Lost</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Place Missing</label>
                        <select
                           className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                           value={currentInv.inv_mis_place || ''}
                           onChange={(e) => setCurrentInv({...currentInv, inv_mis_place: e.target.value})}
                        >
                           <option value="">Seleziona Place...</option>
                           {places.map(p => (
                               <option key={p.place_id} value={p.place_id}>{p.place_id} - {p.place_name}</option>
                           ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Zone Missing</label>
                        <select
                           className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                           value={currentInv.inv_mis_zone || ''}
                           onChange={(e) => setCurrentInv({...currentInv, inv_mis_zone: e.target.value})}
                        >
                           <option value="">Seleziona Zone...</option>
                           {zones.map(z => (
                               <option key={z.zone_id} value={z.zone_id}>{z.zone_id} - {z.zone_name}</option>
                           ))}
                        </select>
                      </div>
                    </div>
                 </div>
               </div>
               
               {/* Last Logic */}
               <div className="flex items-center gap-2 border-t pt-2 mt-2">
                 <input 
                   type="checkbox"
                   id="inv_last"
                   checked={currentInv.inv_last || false}
                   onChange={(e) => handleLastChange(e.target.checked)}
                   className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                 />
                 <label htmlFor="inv_last" className="text-sm font-medium text-gray-700">Inventario da Giacenza RFID</label>
               </div>

               {currentInv.inv_last && (
                 <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Items Risultanti nel Place</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={currentInv.inv_last_place || ''}
                        onChange={(e) => setCurrentInv({...currentInv, inv_last_place: e.target.value})}
                      >
                        <option value="">Seleziona Place...</option>
                        {places.map(p => (
                            <option key={p.place_id} value={p.place_id}>{p.place_id} - {p.place_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zones (Multi-select)</label>
                      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded bg-white p-2">
                          {zones.map(z => {
                             const isChecked = currentInv.inv_last_zones ? currentInv.inv_last_zones.split(';').includes(z.zone_id) : false;
                             return (
                                <div key={z.zone_id} className="flex items-center gap-2 mb-1">
                                    <input 
                                        type="checkbox" 
                                        id={`zone_${z.zone_id}`}
                                        checked={isChecked}
                                        onChange={() => handleZoneToggle(z.zone_id)}
                                    />
                                    <label htmlFor={`zone_${z.zone_id}`} className="text-sm text-gray-700">{z.zone_id} - {z.zone_name}</label>
                                </div>
                             )
                          })}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Selezionati: {currentInv.inv_last_zones}</p>
                    </div>
                 </div>
               )}

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Checklist</label>
                  <select
                    className={`w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none ${ currentInv.inv_last ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    value={currentInv.inv_chk_id || ''}
                    onChange={(e) => setCurrentInv({...currentInv, inv_chk_id: e.target.value})}
                    disabled={currentInv.inv_last}
                  >
                    <option value="">Seleziona Checklist...</option>
                    {checklists.map(c => (
                        <option key={c.chk_id} value={c.chk_id}>{c.chk_code}</option>
                    ))}
                  </select>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
                  <select 
                     className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                     value={currentInv.inv_state || 'OPEN'}
                     onChange={(e) => handleStateChange(e.target.value)}
                  >
                      <option value="OPEN">OPEN</option>
                      <option value="CLOSE">CLOSE</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={currentInv.inv_note || ''}
                    onChange={(e) => setCurrentInv({...currentInv, inv_note: e.target.value})}
                  />
               </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Annulla
              </button>
              <button 
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Save size={18} /> Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
