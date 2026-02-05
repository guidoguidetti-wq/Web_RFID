'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Box, X, Plus, Save, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProductLabel {
  pr_fld: string;
  pr_lab: string;
  pr_des: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductGridProps {
  products: any[];
  labels: ProductLabel[];
  pagination: Pagination;
  filters: { [key: string]: string };
  onPageChange: (page: number) => void;
  onFilterChange: (filters: { [key: string]: string }) => void;
  onProductAdded?: () => void;
  onRefresh?: () => void;
  isAddModalOpen: boolean;
  onCloseAddModal: () => void;
}

export default function ProductGrid({ products, labels, pagination, filters, onPageChange, onFilterChange, onProductAdded, onRefresh, isAddModalOpen, onCloseAddModal }: ProductGridProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>({});
  const [localFilters, setLocalFilters] = useState<{ [key: string]: string }>(filters);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Internal state for Edit Modal only
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (isAddModalOpen) {
        setCurrentProduct({});
        setIsEditing(false);
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

  // Define strictly the columns for the Grid as requested
  const gridFields = ['product_id', 'fld01', 'fld02', 'fld03', 'fldd01', 'fldd02'];

  const columns = useMemo(() => {
    return gridFields.map(field => {
      const labelObj = labels.find(l => l.pr_fld === field);
      const header = labelObj ? (labelObj.pr_lab || labelObj.pr_des || field) : (field === 'product_id' ? 'ID' : field);
      return { key: field, label: header };
    });
  }, [labels]);

  const formFields = useMemo(() => {
    const desiredOrder = ['product_id', 'fld01', 'fld02', 'fld03', 'fldd01', 'fldd02'];
    return desiredOrder.map(key => {
       const labelObj = labels.find(l => l.pr_fld === key);
       const label = labelObj ? (labelObj.pr_lab || labelObj.pr_des || key) : (key === 'product_id' ? 'ID Prodotto' : key);
       return { key, label };
    });
  }, [labels]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer to call API after 500ms of no typing
    debounceTimer.current = setTimeout(() => {
      onFilterChange(newFilters);
    }, 500);
  };

  const openEditModal = (product: any) => {
    setCurrentProduct({ ...product });
    setIsEditing(true);
    setIsEditModalOpen(true);
  };

  const closeModals = () => {
      if (isAddModalOpen) onCloseAddModal();
      setIsEditModalOpen(false);
  };

  const handleSave = async () => {
    try {
      const url = '/api/products';
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentProduct)
      });
      
      if (res.ok) {
        closeModals();
        setCurrentProduct({});
        if (onRefresh) onRefresh();
        if (!isEditing && onProductAdded) onProductAdded();
      } else {
        const err = await res.json();
        alert('Errore nel salvataggio: ' + (err.error || 'Unknown error'));
      }
    } catch (error) {
      console.error("Error saving product", error);
      alert("Errore di connessione");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;
    
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (res.ok) {
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'Errore durante la cancellazione');
      }
    } catch (error) {
      console.error("Error deleting product", error);
      alert("Errore di connessione");
    }
  };

  // Logic to determine if modal should be shown
  const showModal = isAddModalOpen || isEditModalOpen;

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden relative">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-200">
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2 text-xs font-bold text-gray-700 align-top">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      {col.label}
                    </div>
                    <input
                      type="text"
                      placeholder={`Filter...`}
                      className="text-xs font-normal p-1 border border-gray-300 rounded w-full"
                      value={localFilters[col.key] || ''}
                      onChange={(e) => handleFilterChange(col.key, e.target.value)}
                    />
                  </div>
                </th>
              ))}
              <th className="px-3 py-2 text-xs font-bold text-gray-700 align-top">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.length === 0 ? (
               <tr><td colSpan={columns.length + 1} className="p-4 text-center text-gray-500 text-sm">Nessun prodotto trovato.</td></tr>
            ) : (
              products.map((product, idx) => (
                <tr key={idx}>
                  {columns.map((col) => {
                    let cellClass = "px-3 py-1 text-xs text-gray-700 ";
                    let maxWidth = "";
                    let isTruncated = true;

                    if (col.key === 'product_id') {
                      maxWidth = "max-w-[70px]";
                    } else if (col.key === 'fld01') {
                      maxWidth = "max-w-[90px]";
                    } else if (col.key === 'fld02') {
                      maxWidth = "max-w-[90px]";
                    } else if (col.key === 'fld03') {
                      maxWidth = "max-w-[60px]";
                    } else if (col.key === 'fldd01') {
                      maxWidth = "max-w-[150px]";
                    } else if (col.key === 'fldd02') {
                      maxWidth = "max-w-[150px]";
                    } else {
                      maxWidth = "max-w-[100px]";
                    }

                    cellClass += maxWidth + " truncate overflow-hidden";

                    return (
                      <td
                        key={col.key}
                        className={cellClass}
                        title={String(product[col.key] || '')}
                      >
                        {product[col.key]}
                      </td>
                    );
                  })}
                  <td className="px-3 py-1">
                    <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/products/${product.product_id || product.id}/items`)}
                          className="text-blue-600 hover:text-blue-800 p-0.5 rounded hover:bg-blue-100 transition"
                          title="View Items"
                        >
                          <Box size={14} />
                        </button>
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-yellow-600 hover:text-yellow-800 p-0.5 rounded hover:bg-yellow-100 transition"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.product_id || product.id)}
                          className="text-red-600 hover:text-red-800 p-0.5 rounded hover:bg-red-100 transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Adding/Editing Product */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-800">{isEditing ? 'Modifica Prodotto' : 'Aggiungi Prodotto'}</h3>
              <button onClick={closeModals} className="text-gray-500 hover:text-red-500">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {formFields.length === 0 && <p className="text-gray-500 italic">Nessun campo configurato (Products_labels).</p>}
                {formFields.map((field) => (
                   <div key={field.key}>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                     <input
                       type="text"
                       className={`w-full p-2 border rounded outline-none ${
                         field.key === 'product_id' && isEditing 
                           ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed' 
                           : 'border-blue-300 focus:ring-2 focus:ring-blue-500'
                       }`}
                       value={currentProduct[field.key] || ''}
                       onChange={(e) => setCurrentProduct({ ...currentProduct, [field.key]: e.target.value })}
                       disabled={field.key === 'product_id' && isEditing}
                     />
                   </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button 
                onClick={closeModals}
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