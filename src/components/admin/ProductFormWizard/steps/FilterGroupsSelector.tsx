import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, Tag } from 'lucide-react';
import { useFilterGroups } from '@/hooks/use-filter-groups';
import { ProductFormData } from '../types';

interface Props {
    formData: ProductFormData;
    setFormData: (data: ProductFormData | ((prev: ProductFormData) => ProductFormData)) => void;
}

export const FilterGroupsSelector: React.FC<Props> = ({ formData, setFormData }) => {
    const { groups, loading } = useFilterGroups();

    useEffect(() => {
        if (groups.length > 0) {
            console.log('--- FILTER GROUPS (TAGS) LOADED ---');
            console.log('Available groups:', groups);
            console.log('Selected groups in formData:', formData.filterGroups || []);
        }
    }, [groups, formData.filterGroups]);

    const toggleGroup = (groupId: string) => {
        const currentGroups = formData.filterGroups || [];
        const isSelected = currentGroups.includes(groupId);

        const newGroups = isSelected
            ? currentGroups.filter(id => id !== groupId)
            : [...currentGroups, groupId];

        console.log(`Toggling group ${groupId}. New groups:`, newGroups);

        setFormData(prev => ({
            ...prev,
            filterGroups: newGroups
        }));
    };

    if (loading && (!groups || groups.length === 0)) {
        return <div className="text-sm text-gray-500 animate-pulse">Cargando grupos...</div>;
    }

    if (!loading && groups.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100 mt-6">
            <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-400" />
                <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Etiquetas / Grupos de Exposición
                </Label>
            </div>

            <p className="text-xs text-gray-500 mb-3">
                Selecciona dónde aparecerá este producto (destacados, ofertas, marcas especiales, etc.)
            </p>

            <div className="flex flex-wrap gap-2">
                {groups.map((group) => {
                    const isSelected = (formData.filterGroups || []).includes(group.id);
                    return (
                        <button
                            key={group.id}
                            type="button"
                            onClick={() => toggleGroup(group.id)}
                            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${isSelected
                                    ? 'bg-black text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                                }
              `}
                        >
                            {isSelected && <Check className="h-3 w-3" />}
                            {group.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
