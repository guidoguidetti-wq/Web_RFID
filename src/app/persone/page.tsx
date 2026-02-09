'use client';

import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import PeopleTable from '@/components/PeopleTable';

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

export default function PersonePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  const fetchPeople = async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      // Aggiungi filtri ai query params
      Object.keys(currentFilters).forEach(key => {
        if (currentFilters[key]) {
          queryParams.append(`filter_${key}`, currentFilters[key]);
        }
      });

      const res = await fetch(`/api/people?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPeople(data.people);
        setPagination(data.pagination);
      } else {
        console.error('Error fetching people');
      }
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleFilterChange = (newFilters: { [key: string]: string }) => {
    setFilters(newFilters);
    fetchPeople(1, newFilters);
  };

  const handlePageChange = (newPage: number) => {
    fetchPeople(newPage, filters);
  };

  const handleRefresh = () => {
    fetchPeople(pagination.page, filters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestione Persone</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gestisci le persone e i loro dati
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <UserPlus size={20} />
            OnBoard
          </button>
        </div>
      </div>

      {/* Contenuto */}
      {loading && people.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento in corso...</p>
          </div>
        </div>
      ) : (
        <PeopleTable
          people={people}
          pagination={pagination}
          filters={filters}
          onPageChange={handlePageChange}
          onFilterChange={handleFilterChange}
          onRefresh={handleRefresh}
          isAddModalOpen={isAddModalOpen}
          onCloseAddModal={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}
