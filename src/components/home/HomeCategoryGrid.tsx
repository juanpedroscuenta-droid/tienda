import React, { useMemo } from 'react';
import {
    Settings,
    Zap,
    CircleDot,
    Layout,
    Activity,
    Hexagon,
    ArrowRight,
    Box
} from 'lucide-react';
import { useCategories } from '@/hooks/use-categories';

interface HomeCategoryGridProps {
    onSelect: (cat: string) => void;
}

// Icon mapping based on keywords in category names
const getIconForCategory = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('BALINERA')) return <CircleDot className="w-6 h-6 md:w-9 md:h-9 text-black" />;
    if (n.includes('BUJIA')) return <Zap className="w-6 h-6 md:w-9 md:h-9 text-black" />;
    if (n.includes('MOTOR')) return <Settings className="w-6 h-6 md:w-9 md:h-9 text-black" />;
    if (n.includes('CHASIS')) return <Layout className="w-6 h-6 md:w-9 md:h-9 text-black" />;
    if (n.includes('ELECTRICA')) return <Activity className="w-6 h-6 md:w-9 md:h-9 text-black" />;
    if (n.includes('ESTANDAR')) return <Hexagon className="w-6 h-6 md:w-9 md:h-9 text-black" />;
    return <Box className="w-6 h-6 md:w-9 md:h-9 text-black" />;
};

export const HomeCategoryGrid: React.FC<HomeCategoryGridProps> = ({ onSelect }) => {
    const { mainCategories, loading } = useCategories();

    // Filter out "Todos" and take the most relevant ones (e.g., top 6 or 8)
    const displayCategories = useMemo(() => {
        return mainCategories
            .filter(cat => cat.name !== 'Todos')
            .slice(0, 8); // Showing up to 8 categories to keep the grid clean
    }, [mainCategories]);

    if (loading && displayCategories.length === 0) {
        return (
            <div className="w-full px-2 md:px-4 mb-12 mt-4 animate-pulse">
                <div className="h-8 w-64 bg-gray-200 rounded mb-6 mx-2"></div>
                <div className="grid grid-cols-2 gap-3 md:gap-6 px-1">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-24 md:h-32 bg-gray-100 rounded-[28px] md:rounded-[40px]"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (displayCategories.length === 0) return null;

    return (
        <div className="w-full px-2 md:px-4 mb-12 mt-4">
            <h2 className="text-[#000] font-black text-2xl md:text-3xl mb-6 tracking-tight uppercase px-2 leading-none">
                Categorias de Repuestos
            </h2>
            <div className="grid grid-cols-2 gap-3 md:gap-6 px-1">
                {displayCategories.map((cat, idx) => (
                    <button
                        key={cat.id || idx}
                        onClick={() => onSelect(cat.name)}
                        className="flex items-center gap-3 bg-[#f2f2f2] hover:bg-[#e6e6e6] transition-all p-4 md:p-7 rounded-[28px] md:rounded-[40px] group border border-transparent shadow-sm active:scale-95 overflow-hidden"
                    >
                        <div className="bg-white w-12 h-12 md:w-16 md:h-16 rounded-full shadow-sm group-hover:rotate-6 transition-transform duration-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {cat.image ? (
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                getIconForCategory(cat.name)
                            )}
                        </div>
                        <span className="text-[10px] md:text-[14px] font-black text-[#000] uppercase tracking-tighter md:tracking-normal leading-[1.1] text-left break-words">
                            {cat.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
