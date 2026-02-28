import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { AdvancedHeader } from '@/components/layout/AdvancedHeader';
import { TopPromoBar } from '@/components/layout/TopPromoBar';
import { useCategories } from '@/hooks/use-categories';

interface InfoPageLayoutProps {
    title: string;
    breadcrumb: string;
    children: React.ReactNode;
}

export const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ title, breadcrumb, children }) => {
    const { categories, mainCategories, subcategoriesByParent, thirdLevelBySubcategory } = useCategories();
    const [promoVisible, setPromoVisible] = React.useState(true);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <TopPromoBar setPromoVisible={setPromoVisible} />
            <AdvancedHeader
                categories={categories}
                selectedCategory="Todos"
                setSelectedCategory={() => { }}
                promoVisible={promoVisible}
                mainCategories={mainCategories}
                subcategoriesByParent={subcategoriesByParent}
                thirdLevelBySubcategory={thirdLevelBySubcategory}
            />

            {/* Hero */}
            <div className="bg-gray-50 border-b border-gray-100 pt-28 pb-10">
                <div className="max-w-4xl mx-auto px-6">
                    <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                        Volver al inicio
                    </Link>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{breadcrumb}</p>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{title}</h1>
                </div>
            </div>

            {/* Content */}
            <main className="flex-1">
                <div className="max-w-4xl mx-auto px-6 py-14">
                    <div className="prose prose-gray max-w-none text-[15px] leading-relaxed text-gray-700 space-y-6">
                        {children}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};
