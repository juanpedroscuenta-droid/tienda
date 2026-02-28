import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter } from '@/hooks/use-filters';

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
}) => {
    const [showAllForFilter, setShowAllForFilter] = useState<{ [filterId: string]: boolean }>({});

    return (
        <aside className={className}>
            <h2 className={`${isMobile ? 'text-lg' : 'text-base'} font-bold mb-6 pb-3 border-b text-gray-900 uppercase tracking-tight`}>
                Filtrar por
            </h2>

            <div className="mb-8">
                <h3 className="font-black text-[11px] uppercase tracking-widest text-gray-400 mb-4">Precio</h3>
                <div className="flex gap-2">
                    <Input
                        placeholder="Min"
                        value={priceFrom}
                        onChange={e => setPriceFrom(e.target.value)}
                        type="text"
                        className="h-10 bg-gray-50 border-none rounded-xl text-sm"
                    />
                    <Input
                        placeholder="Max"
                        value={priceTo}
                        onChange={e => setPriceTo(e.target.value)}
                        type="text"
                        className="h-10 bg-gray-50 border-none rounded-xl text-sm"
                    />
                    <Button
                        size="sm"
                        onClick={applyPrice}
                        className="h-10 bg-black hover:bg-gray-800 text-white rounded-xl px-4"
                    >
                        OK
                    </Button>
                </div>
            </div>

            {!filtersLoading && filters.map(f => (
                <div key={f.id} className="mb-8">
                    <h3 className="font-black text-[11px] uppercase tracking-widest text-gray-400 mb-4">{f.name}</h3>
                    <div className="space-y-3">
                        {f.options.slice(0, showAllForFilter[f.id] ? undefined : 6).map(o => (
                            <label key={o.id} className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded-md checked:bg-black checked:border-black transition-all cursor-pointer"
                                        checked={(selectedFilterOptions[f.id] || []).includes(o.id)}
                                        onChange={() => toggleFilterOption(f.id, o.id)}
                                    />
                                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none left-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-gray-600 group-hover:text-black transition-colors">
                                    {o.name}
                                </span>
                                <span className="text-[10px] font-bold text-gray-300 ml-auto">
                                    {filterOptionCounts[f.id]?.[o.id] || 0}
                                </span>
                            </label>
                        ))}
                    </div>
                    {f.options.length > 6 && (
                        <button
                            onClick={() => setShowAllForFilter(p => ({ ...p, [f.id]: !p[f.id] }))}
                            className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-black mt-4 transition-colors"
                        >
                            {showAllForFilter[f.id] ? '- Ver menos' : '+ Ver más'}
                        </button>
                    )}
                </div>
            ))}
        </aside>
    );
};
