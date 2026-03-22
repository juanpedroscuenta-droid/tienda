import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

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

const hostname = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || `http://${hostname}:3001/api`;

// Simple global cache to avoid refetching on every page
let cachedFilters: Filter[] | null = null;
let isFetching = false;
const listeners: ((f: Filter[]) => void)[] = [];

export function useFilters() {
  const [filters, setFilters] = useState<Filter[]>(cachedFilters || []);
  const [loading, setLoading] = useState(!cachedFilters);

  useEffect(() => {
    console.log('[useFilters] Hook mounted, cached:', !!cachedFilters, 'isFetching:', isFetching);
    
    // Only use cache if it actually contains filters
    if (cachedFilters && cachedFilters.length > 0) {
      setFilters(cachedFilters);
      setLoading(false);
      return;
    }

    const onFiltersLoaded = (f: Filter[]) => {
      console.log('[useFilters] Listeners notified with', f.length, 'filters');
      setFilters(f);
      setLoading(false);
    };

    listeners.push(onFiltersLoaded);

    if (!isFetching) {
      fetchFilters();
    }

    return () => {
      const idx = listeners.indexOf(onFiltersLoaded);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const fetchFilters = async () => {
    try {
      isFetching = true;
      setLoading(true);
      console.log('[useFilters] Fetching from', `${API_BASE_URL}/filters`);

      const response = await fetch(`${API_BASE_URL}/filters`);
      if (response.ok) {
        const data = await response.json();
        console.log('[useFilters] Success from Node backend:', data.length, 'filters');
        cachedFilters = data;
        listeners.forEach(l => l(data));
        return;
      }
      throw new Error('Backend response not OK');
    } catch (error) {
      console.warn('[useFilters] Node backend failed, falling back to Supabase:', error);
      
      try {
        // Fallback to direct Supabase query
        const { data: filtersData, error: filtersError } = await supabase.from('filters').select('*');
        if (filtersError) throw filtersError;

        const { data: optionsData, error: optionsError } = await supabase.from('filter_options').select('*');
        if (optionsError) throw optionsError;

        const result: Filter[] = (filtersData || []).map(f => ({
          id: f.id,
          name: f.name,
          order: f.order_index || 0,
          options: (optionsData || [])
            .filter(opt => opt.filter_id === f.id)
            .map(opt => ({
              id: opt.id,
              name: opt.name,
              order: opt.order_index || 0
            }))
        }));

        console.log('[useFilters] Success from Supabase fallback:', result.length, 'filters');
        cachedFilters = result;
        listeners.forEach(l => l(result));
      } catch (suppError) {
        console.error('[useFilters] Both Node and Supabase failed:', suppError);
        cachedFilters = [];
        listeners.forEach(l => l([]));
      }
    } finally {
      isFetching = false;
      setLoading(false);
    }
  };

  return {
    filters,
    loading,
    refetch: fetchFilters
  };
}
