import { useState, useEffect } from 'react';

export interface FilterOption {
  id: string;
  name: string;
  order: number;
}

export interface Filter {
  id: string;
  name: string;
  order: number;
  options: FilterOption[];
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

export function useFilters() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      setLoading(true);

      // Intentar obtener filtros desde nuestro nuevo backend Node.js
      const response = await fetch(`${API_BASE_URL}/filters`);
      if (!response.ok) throw new Error('Error al obtener filtros');

      const data = await response.json();
      setFilters(data);
    } catch (error) {
      console.error('Error fetching filters via Node backend:', error);
      // Fallback a un array vacío si falla el backend
      setFilters([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    filters,
    loading,
    refetch: fetchFilters
  };
}
