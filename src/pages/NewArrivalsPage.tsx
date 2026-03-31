import React, { useState, useEffect } from "react";
import { TopPromoBar } from "@/components/layout/TopPromoBar";
import { AdvancedHeader } from "@/components/layout/AdvancedHeader";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { useCategories } from "@/hooks/use-categories";
import { fetchProducts as fetchProductsApi } from "@/lib/api";
import { Product } from "@/contexts/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Loader2 } from "lucide-react";

export const NewArrivalsPage = () => {
    const navigate = useNavigate();
    const [promoVisible, setPromoVisible] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const {
        categories,
        mainCategories,
        subcategoriesByParent,
        thirdLevelBySubcategory,
    } = useCategories();

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const allProducts = await fetchProductsApi();
                const published = allProducts.filter(p => p.isPublished !== false);

                // Use the newest ones or just shuffle and pick 20 (similar to carousel logic but 20 items)
                // Assuming newer products are either at the start/end or just randomly selected for now.
                const shuffled = [...published].sort(() => Math.random() - 0.5);
                setProducts(shuffled.slice(0, 20));
            } catch (err) {
                console.error("Error fetching newest products", err);
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, []);

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
                            <span className="text-black font-bold">Recién Llegados</span>
                        </nav>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
                    {/* Header with styling matching the New Products format */}
                    <div className="text-center mb-16 relative w-fit mx-auto">
                        <Zap className="absolute -top-4 -left-6 text-[#FFD700] w-8 h-8 fill-current animate-pulse" />
                        <h1 className="text-4xl md:text-5xl font-black text-black leading-none tracking-tighter transform -rotate-2">
                            PRODUCTOS
                        </h1>
                        <h1 className="text-5xl md:text-6xl font-black text-[#1a1a1a] leading-none tracking-tighter transform rotate-1 mt-1">
                            NUEVOS
                        </h1>
                        <Zap className="absolute -bottom-4 -right-6 text-[#FFD700] w-8 h-8 fill-current animate-pulse delay-150" />
                        <div className="mt-8 bg-[#FFD700] py-2 px-8 transform -rotate-1 shadow-sm border-b-4 border-black/10 inline-block">
                            <span className="text-xl font-black text-black uppercase tracking-[-0.05em]">
                                ÚLTIMOS 20 PRODUCTOS
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="py-24 flex justify-center items-center">
                            <Loader2 className="w-12 h-12 text-[#FFD700] animate-spin" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <Zap className="w-10 h-10 text-gray-200" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight mb-2">No hay productos</h2>
                            <p className="text-xs text-gray-400 mb-8 max-w-sm uppercase tracking-widest leading-loose">
                                Revisa de nuevo más tarde para ver artículos recientes.
                            </p>
                            <Link
                                to="/"
                                className="inline-block border-2 border-black text-black px-10 py-3 font-black text-xs uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300 transform active:scale-95"
                            >
                                Ir a la tienda
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {products.map((product) => (
                                <div key={product.id} className="flex flex-col h-full rounded-2xl transition-all bg-white hover:shadow-xl hover:shadow-orange-500/5 group">
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

export default NewArrivalsPage;
