'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, X, Save, UserCircle, Upload } from 'lucide-react';

interface Person {
  people_id: number;
  name: string;
  role: string | null;
  company: string | null;
  department: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PeopleTableProps {
  people: Person[];
  pagination: Pagination;
  filters: { [key: string]: string };
  onPageChange: (page: number) => void;
  onFilterChange: (filters: { [key: string]: string }) => void;
  onRefresh: () => void;
  isAddModalOpen: boolean;
  onCloseAddModal: () => void;
}

export default function PeopleTable({
  people,
  pagination,
  filters,
  onPageChange,
  onFilterChange,
  onRefresh,
  isAddModalOpen,
  onCloseAddModal
}: PeopleTableProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPerson, setCurrentPerson] = useState<Partial<Person>>({});
  const [localFilters, setLocalFilters] = useState<{ [key: string]: string }>(filters);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const filterableColumns = [
    { key: 'name', label: 'Nome' },
    { key: 'role', label: 'Ruolo' },
    { key: 'company', label: 'Azienda' },
    { key: 'department', label: 'Dipartimento' }
  ];

  useEffect(() => {
    if (isAddModalOpen) {
      setCurrentPerson({});
      setIsEditing(false);
      setSelectedFile(null);
      setImagePreview(null);
    }
  }, [isAddModalOpen]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onFilterChange(newFilters);
    }, 500);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validazione client-side
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Formato non supportato. Usa JPG, PNG o WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File troppo grande. Massimo 5MB');
      return;
    }

    // Preview locale
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedFile(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await fetch('/api/people/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const { imagePath } = await res.json();
        return imagePath;
      } else {
        const error = await res.json();
        alert(error.error || 'Errore upload immagine');
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Errore durante l\'upload dell\'immagine');
      return null;
    }
  };

  const handleSave = async () => {
    if (!currentPerson.name || currentPerson.name.trim().length < 2) {
      alert('Il nome è obbligatorio (minimo 2 caratteri)');
      return;
    }

    setIsSaving(true);

    try {
      let imagePath = currentPerson.image;

      // Upload immagine se selezionata
      if (selectedFile) {
        const uploadedPath = await uploadImage();
        if (uploadedPath) {
          imagePath = uploadedPath;
        } else {
          setIsSaving(false);
          return;
        }
      }

      // Salva dati persona
      const res = await fetch('/api/people', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentPerson,
          image: imagePath
        })
      });

      if (res.ok) {
        onRefresh();
        closeModal();
      } else {
        const error = await res.json();
        alert(error.error || 'Errore nel salvataggio');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (person: Person) => {
    if (!confirm(`Sei sicuro di voler eliminare ${person.name}?`)) return;

    try {
      const res = await fetch(`/api/people?id=${person.people_id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        onRefresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Errore nella cancellazione');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Errore durante la cancellazione');
    }
  };

  const openEditModal = (person: Person) => {
    setCurrentPerson({ ...person });
    setIsEditing(true);
    setIsEditModalOpen(true);
    setSelectedFile(null);
    setImagePreview(person.image ? `/${person.image}` : null);
  };

  const closeModal = () => {
    setIsEditModalOpen(false);
    onCloseAddModal();
    setCurrentPerson({});
    setSelectedFile(null);
    setImagePreview(null);
  };

  const isModalOpen = isAddModalOpen || isEditModalOpen;

  return (
    <div className="p-6">
      {/* Tabella */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Immagine</th>
                {filterableColumns.map((col) => (
                  <th key={col.key} className="px-6 py-3 text-sm font-semibold text-gray-600">
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-sm font-semibold text-gray-600 text-right">Azioni</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3"></th>
                {filterableColumns.map((col) => (
                  <th key={col.key} className="px-6 py-3">
                    <input
                      type="text"
                      className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Filtra ${col.label.toLowerCase()}`}
                      value={localFilters[col.key] || ''}
                      onChange={(e) => handleFilterChange(col.key, e.target.value)}
                    />
                  </th>
                ))}
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {people.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    Nessuna persona trovata
                  </td>
                </tr>
              ) : (
                people.map((person) => (
                  <tr key={person.people_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {person.image ? (
                        <img
                          src={`/${person.image}`}
                          alt={person.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserCircle size={24} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{person.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{person.role || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{person.company || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{person.department || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => openEditModal(person)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(person)}
                          className="text-red-600 hover:text-red-800 transition-colors"
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

        {/* Paginazione */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Pagina {pagination.page} di {pagination.totalPages} ({pagination.total} totali)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Precedente
              </button>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Successiva
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditing ? 'Modifica Persona' : 'Nuova Persona'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Immagine */}
              <div className="flex flex-col items-center space-y-3">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserCircle size={48} className="text-gray-400" />
                  </div>
                )}
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Upload size={18} />
                  <span className="text-sm">Carica Immagine</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500">JPG, PNG, WebP - Max 5MB</p>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome completo"
                  value={currentPerson.name || ''}
                  onChange={(e) => setCurrentPerson({ ...currentPerson, name: e.target.value })}
                />
              </div>

              {/* Ruolo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. Developer, Manager"
                  value={currentPerson.role || ''}
                  onChange={(e) => setCurrentPerson({ ...currentPerson, role: e.target.value })}
                />
              </div>

              {/* Azienda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Azienda</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome azienda"
                  value={currentPerson.company || ''}
                  onChange={(e) => setCurrentPerson({ ...currentPerson, company: e.target.value })}
                />
              </div>

              {/* Dipartimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dipartimento</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. IT, HR, Sales"
                  value={currentPerson.department || ''}
                  onChange={(e) => setCurrentPerson({ ...currentPerson, department: e.target.value })}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Salvataggio...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Salva</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
