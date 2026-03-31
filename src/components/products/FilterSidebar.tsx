import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter } from '@/hooks/use-filters';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight, ChevronDown, Check, Plus, Minus } from 'lucide-react';
import { useCategories, Category } from '@/hooks/use-categories';

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
    const { mainCategories } = useCategories();
    const [showAllCats, setShowAllCats] = useState(false);
    const [showAllForFilter, setShowAllForFilter] = useState<Record<string, boolean>>({});

    const toggleShowAllFilter = (fId: string) => {
        setShowAllForFilter(prev => ({ ...prev, [fId]: !prev[fId] }));
    };

    const INITIAL_VISIBLE = 6;

    return (
        <aside className={`${className} font-sans`}>
            {/* Promo Banner - Restored original version */}
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

            <div className="mb-6">
                <h3 className="text-[16px] font-black text-gray-900 mb-5 font-sans flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-red-600"></span>
                    FILTRAR POR
                </h3>

                <div className="space-y-6">
                    {/* CATEGORY LIST */}
                    <div className="pb-4 border-b border-gray-50">
                        <h4 className="text-[12px] font-black uppercase tracking-widest text-gray-400 mb-4">Categorías</h4>
                        <div className="space-y-2.5">
                            {["Todos", ...mainCategories.map(c => c.name)].slice(0, showAllCats ? undefined : INITIAL_VISIBLE).map(catName => {
                                const isSelected = selectedCategory === catName;
                                return (
                                    <div key={catName} className="flex items-center space-x-3 group cursor-pointer" onClick={() => setSelectedCategory(catName)}>
                                        <Checkbox 
                                            checked={isSelected} 
                                            className="h-4 w-4 rounded-none border-gray-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 transition-colors"
                                        />
                                        <label className={`text-[12px] font-bold cursor-pointer transition-colors ${isSelected ? 'text-red-700' : 'text-gray-500 group-hover:text-black hover:translate-x-0.5 duration-200'}`}>
                                            {catName}
                                        </label>
                                    </div>
                                );
                            })}
                            
                            {mainCategories.length > INITIAL_VISIBLE && (
                                <button 
                                    onClick={() => setShowAllCats(!showAllCats)}
                                    className="text-[11px] font-black uppercase tracking-widest text-red-600 pt-2 flex items-center gap-1 hover:gap-2 transition-all"
                                >
                                    {showAllCats ? 'Ver menos' : `Ver más (${mainCategories.length - INITIAL_VISIBLE + 1})`}
                                    {showAllCats ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* SPECS FILTERS */}
                    {filtersLoading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="animate-pulse space-y-2 pb-4">
                                <div className="h-3 w-16 bg-gray-100 rounded"></div>
                                <div className="h-4 w-32 bg-gray-50 rounded"></div>
                                <div className="h-4 w-28 bg-gray-50 rounded"></div>
                            </div>
                        ))
                    ) : (
                        filters.map(f => (
                            <div key={f.id} className="pb-4 border-b border-gray-50">
                                <h4 className="text-[12px] font-black uppercase tracking-widest text-gray-400 mb-4">{f.name}</h4>
                                <div className="space-y-2.5">
                                    {f.options.slice(0, showAllForFilter[f.id] ? undefined : INITIAL_VISIBLE).map(o => {
                                        const isSelected = (selectedFilterOptions[f.id] || []).includes(o.id);
                                        return (
                                            <div 
                                                key={o.id} 
                                                className="flex items-center justify-between group cursor-pointer"
                                                onClick={() => toggleFilterOption(f.id, o.id)}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <Checkbox 
                                                        checked={isSelected} 
                                                        className="h-4 w-4 rounded-none border-gray-300 data-[state=checked]:bg-black data-[state=checked]:border-black transition-colors"
                                                    />
                                                    <span className={`text-[12px] font-bold transition-colors ${isSelected ? 'text-black' : 'text-gray-500 group-hover:text-gray-900 hover:translate-x-0.5 duration-200'}`}>
                                                        {o.name}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-black text-gray-200 group-hover:text-gray-400 transition-colors">
                                                    {filterOptionCounts[f.id]?.[o.id] || 0}
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {f.options.length > INITIAL_VISIBLE && (
                                        <button 
                                            onClick={() => toggleShowAllFilter(f.id)}
                                            className="text-[11px] font-black uppercase tracking-widest text-gray-900 pt-2 flex items-center gap-1 hover:gap-2 transition-all"
                                        >
                                            {showAllForFilter[f.id] ? 'Ver menos' : `Ver más (${f.options.length - INITIAL_VISIBLE})`}
                                            {showAllForFilter[f.id] ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Price Filter */}
            <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Precio</h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <Input
                        placeholder="Mín"
                        value={priceFrom}
                        onChange={e => setPriceFrom(e.target.value)}
                        className="h-9 bg-gray-50 border-gray-100 rounded-none text-[11px] font-bold focus-visible:ring-1 focus-visible:ring-gray-200"
                    />
                    <Input
                        placeholder="Máx"
                        value={priceTo}
                        onChange={e => setPriceTo(e.target.value)}
                        className="h-9 bg-gray-50 border-gray-100 rounded-none text-[11px] font-bold focus-visible:ring-1 focus-visible:ring-gray-200"
                    />
                </div>
                <Button
                    size="sm"
                    onClick={applyPrice}
                    className="w-full h-10 bg-red-600 hover:bg-black text-white rounded-none text-[10px] font-black uppercase tracking-widest transition-all"
                >
                    Aplicar Filtro
                </Button>
            </div>

        </aside>
    );
};
