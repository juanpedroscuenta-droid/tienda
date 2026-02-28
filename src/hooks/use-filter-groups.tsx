import { useState, useEffect } from 'react';

export interface FilterGroup {
    id: string;
    name: string;
    description?: string;
    slug: string;
    color?: string;
    icon?: string;
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

export function useFilterGroups() {
    const [groups, setGroups] = useState<FilterGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/filters/groups`);
            if (!response.ok) throw new Error('Error al obtener grupos de filtros');
            const data = await response.json();
            setGroups(data);
        } catch (error) {
            console.error('Error fetching filter groups:', error);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    return { groups, loading };
}
