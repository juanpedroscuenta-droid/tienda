import React, { useState } from "react";
import { TopPromoBar } from "@/components/layout/TopPromoBar";
import { AdvancedHeader } from "@/components/layout/AdvancedHeader";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { useCategories } from "@/hooks/use-categories";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ChevronRight, Home } from "lucide-react";

export const FavoritesPage = () => {
    const navigate = useNavigate();
    const [promoVisible, setPromoVisible] = useState(true);
    const {
        categories,
        mainCategories,
        subcategoriesByParent,
        thirdLevelBySubcategory,
    } = useCategories();
    const { favorites } = useFavorites();

    const setSelectedCategory = (cat: string) => {
        navigate(`/categoria/${encodeURIComponent(cat)}`);
    };

    return (
        <div className="min-h-screen bg-white text-neutral-900 overflow-x-hidden font-sans">
            <div className="w-full">
                <TopPromoBar setPromoVisible={setPromoVisible} />
            </div>
            <AdvancedHeader
                categories={categories}
                selectedCategory=""
                setSelectedCategory={setSelectedCategory}
                promoVisible={promoVisible}
                mainCategories={mainCategories}
                subcategoriesByParent={subcategoriesByParent}
                thirdLevelBySubcategory={thirdLevelBySubcategory}
            />

            <main className="w-full">
                {/* Breadcrumbs Section */}
                <div className="bg-[#f8f8f8] border-b border-gray-100 mb-8">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
                        <nav className="flex items-center gap-2 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                            <Link to="/" className="hover:text-black transition-colors">Home</Link>
                            <span className="text-gray-300">.</span>
                            <span className="text-black">Mis Favoritos</span>
                        </nav>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
                    {/* Title */}
                    <div className="text-center mb-16">
                        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-[0.1em] text-gray-900 mb-2">
                            Mis Favoritos
                        </h1>
                        <div className="w-16 h-[3px] bg-red-600 mx-auto"></div>
                    </div>

                    {/* Content */}
                    {favorites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <Heart className="w-10 h-10 text-gray-200" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight mb-2">Tu lista está vacía</h2>
                            <p className="text-xs text-gray-400 mb-8 max-w-sm uppercase tracking-widest leading-loose">
                                No tienes productos guardados en tus favoritos todavía.
                            </p>
                            <Link
                                to="/"
                                className="inline-block border-2 border-black text-black px-10 py-3 font-black text-xs uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300 transform active:scale-95"
                            >
                                Ir a la tienda
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                            {favorites.map((product) => (
                                <div key={product.id} className="flex flex-col">
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default FavoritesPage;
