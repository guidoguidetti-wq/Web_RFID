'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import ProductGrid from '@/components/ProductGrid';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  async function fetchProducts(page = 1, currentFilters = filters) {
    try {
      setLoading(true);

      // Build query string with filters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');

      Object.keys(currentFilters).forEach(key => {
        if (currentFilters[key]) {
          params.append(`filter_${key}`, currentFilters[key]);
        }
      });

      const [prodRes, labelRes] = await Promise.all([
        fetch(`/api/products?${params.toString()}`),
        fetch('/api/products/labels')
      ]);

      if (prodRes.ok && labelRes.ok) {
        const prodData = await prodRes.json();
        const labelData = await labelRes.json();
        setProducts(prodData.products);
        setPagination(prodData.pagination);
        setLabels(labelData);
      }
    } catch (error) {
      console.error("Failed to load products data", error);
    } finally {
      setLoading(false);
    }
  }

  const handleFilterChange = (newFilters: { [key: string]: string }) => {
    setFilters(newFilters);
    // Reset to page 1 when filters change
    fetchProducts(1, newFilters);
  };

  useEffect(() => {
    fetchProducts(1);
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500">Caricamento prodotti...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Single Row Header with Everything */}
      <div className="flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow border border-gray-200 mb-3">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <img src="/RFID_System_Logo.png" alt="Logo" className="h-6 w-auto" />
          <h1 className="text-xl font-bold text-gray-800">Prodotti</h1>
        </div>

        {/* Center: Pagination Info + Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-600 whitespace-nowrap">
              Pagina {pagination.page} di {pagination.totalPages}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchProducts(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-xs"
                title="Precedente"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* First page */}
              {pagination.page > 3 && (
                <>
                  <button
                    onClick={() => fetchProducts(1)}
                    className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition text-xs"
                  >
                    1
                  </button>
                  {pagination.page > 4 && <span className="px-1 text-gray-500 text-xs">...</span>}
                </>
              )}

              {/* Pages around current */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => p >= pagination.page - 1 && p <= pagination.page + 1)
                .map(p => (
                  <button
                    key={p}
                    onClick={() => fetchProducts(p)}
                    className={`px-2 py-1 rounded border transition text-xs min-w-[28px] ${
                      p === pagination.page
                        ? 'bg-blue-600 border-blue-600 text-white font-bold'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}

              {/* Last page */}
              {pagination.page < pagination.totalPages - 2 && (
                <>
                  {pagination.page < pagination.totalPages - 3 && <span className="px-1 text-gray-500 text-xs">...</span>}
                  <button
                    onClick={() => fetchProducts(pagination.totalPages)}
                    className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition text-xs"
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => fetchProducts(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-xs"
                title="Successiva"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Right: Add Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
        >
          <Plus size={16} /> Aggiungi Prodotto
        </button>
      </div>
      <ProductGrid
        products={products}
        labels={labels}
        pagination={pagination}
        filters={filters}
        onPageChange={(page) => fetchProducts(page)}
        onFilterChange={handleFilterChange}
        onProductAdded={() => fetchProducts(pagination.page)}
        onRefresh={() => fetchProducts(pagination.page)}
        isAddModalOpen={isAddModalOpen}
        onCloseAddModal={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}