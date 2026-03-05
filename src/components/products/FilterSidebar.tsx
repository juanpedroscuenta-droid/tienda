import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter } from '@/hooks/use-filters';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';
import { useCategories } from '@/hooks/use-categories';

interface FilterSidebarProps {
    filters: Filter[];
    filtersLoading: boolean;
    selectedFilterOptions: { [filterId: string]: string[] };
    toggleFilterOption: (fId: string, oId: string) => void;
    filterOptionCounts: { [filterId: string]: { [optionId: string]: number } };
    priceFrom: string;
    setPriceFrom: (v: string) => void;
    priceTo: string;
    setPriceTo: (v: string) => void;
    applyPrice: () => void;
    className?: string;
    isMobile?: boolean;
    selectedCategory?: string;
    setSelectedCategory?: (cat: string) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
    filters,
    filtersLoading,
    selectedFilterOptions,
    toggleFilterOption,
    filterOptionCounts,
    priceFrom,
    setPriceFrom,
    priceTo,
    setPriceTo,
    applyPrice,
    className = "",
    isMobile = false,
    selectedCategory = "Todos",
    setSelectedCategory = () => { },
}) => {
    const { mainCategories, subcategoriesByParent } = useCategories();
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        [selectedCategory]: true
    });

    const toggleExpand = (catName: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [catName]: !prev[catName]
        }));
    };

    return (
        <aside className={`${className} font-sans`}>
            {/* Promo Banner */}
            <div className="mb-10 text-center">
                <div className="relative inline-block">
                    <h2 className="text-[32px] font-black leading-none tracking-tighter text-gray-900 mb-0">
                        ¡LO NUEVO!
                    </h2>
                    <p className="text-[20px] font-black tracking-tight text-gray-900 mb-4">
                        + 100 REFERENCIAS
                    </p>
                    <button className="bg-black text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest hover:scale-105 transition-transform">
                        VER TODO
                    </button>
                    <div className="w-16 h-0.5 bg-yellow-400 mx-auto mt-2"></div>
                </div>
            </div>

            <div className="mb-10">
                <h3 className="text-[18px] font-black text-gray-900 mb-6 font-sans">
                    ¿Qué repuesto necesitas?
                </h3>

                <div className="space-y-8">
                    {!filtersLoading && filters.map(f => (
                        <div key={f.id} className="pb-4">
                            <h4 className="text-[14px] font-black uppercase tracking-tight text-gray-900 mb-4">{f.name}</h4>
                            <div className="space-y-3">
                                {f.options.slice(0, 10).map(o => (
                                    <button
                                        key={o.id}
                                        onClick={() => toggleFilterOption(f.id, o.id)}
                                        className={`flex items-center justify-between w-full text-left group`}
                                    >
                                        <span className={`text-[13px] font-bold transition-colors ${(selectedFilterOptions[f.id] || []).includes(o.id) ? 'text-black' : 'text-gray-400 hover:text-gray-900'}`}>
                                            {o.name}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-200">
                                            ({filterOptionCounts[f.id]?.[o.id] || 0})
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Price Filter - Restyled to be subtle */}
            <div className="mt-12 pt-8">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Rango de Precio</h4>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Mín"
                        value={priceFrom}
                        onChange={e => setPriceFrom(e.target.value)}
                        className="h-9 bg-gray-50 border-none rounded-none text-xs focus-visible:ring-1 focus-visible:ring-gray-200"
                    />
                    <span className="text-gray-300">—</span>
                    <Input
                        placeholder="Máx"
                        value={priceTo}
                        onChange={e => setPriceTo(e.target.value)}
                        className="h-9 bg-gray-50 border-none rounded-none text-xs focus-visible:ring-1 focus-visible:ring-gray-200"
                    />
                    <Button
                        size="sm"
                        onClick={applyPrice}
                        className="h-9 bg-black hover:bg-gray-800 text-white rounded-none px-3 text-[10px] font-black uppercase"
                    >
                        Filtrar
                    </Button>
                </div>
            </div>

        </aside>
    );
};
