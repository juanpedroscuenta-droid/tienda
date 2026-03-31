import React, { useEffect, useState } from 'react';
import { AdvancedHeader } from '@/components/layout/AdvancedHeader';
import { Footer } from '@/components/layout/Footer';
import { TopPromoBar } from '@/components/layout/TopPromoBar';
import { useCategories } from '@/hooks/use-categories';
import { fetchProducts } from '@/lib/api';
import { Product, useCart } from '@/contexts/CartContext';
import { Loader2, ChevronRight, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const PromotionCard = ({ product }: { product: Product }) => {
    const { addToCart } = useCart();
    const discountPercent = product.originalPrice 
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 10;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product);
        toast({
            title: "Agregado",
            description: `${product.name} se agregó al carrito`,
            duration: 2000,
        });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden flex flex-col sm:flex-row transition-all hover:shadow-md group relative h-full">
            {/* Tag de Descuento */}
            <div className="absolute top-2 left-2 z-10">
                <div className="bg-[#E2343E] text-white text-[11px] font-bold px-2 py-1 rounded-full shadow-sm">
                    -{discountPercent}%
                </div>
            </div>

            {/* Imagen */}
            <div className="w-full sm:w-48 h-48 flex-shrink-0 bg-white p-4 flex items-center justify-center relative border-b sm:border-b-0 sm:border-r border-gray-100">
                <img 
                    src={product.image || 'https://via.placeholder.com/200'} 
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
            </div>

            {/* Contenido */}
            <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                    <h3 className="text-[15px] font-bold text-gray-900 leading-tight mb-2 line-clamp-2">
                        {product.name}
                    </h3>
                    
                    {/* Estrellas (Mock) */}
                    <div className="flex gap-0.5 mb-3">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="w-3 h-3 fill-gray-200 text-gray-200" />
                        ))}
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                        {product.originalPrice && (
                            <span className="text-sm text-gray-400 line-through">
                                ${product.originalPrice.toLocaleString('es-CO')}
                            </span>
                        )}
                        <span className="text-[18px] font-black text-[#E2343E]">
                            ${product.price.toLocaleString('es-CO')}
                        </span>
                    </div>
                </div>

                <Button 
                    onClick={handleAddToCart}
                    className="w-full sm:w-auto bg-[#E2343E] hover:bg-[#c42831] text-white font-bold py-5 rounded-md text-[13px] uppercase tracking-wide px-8"
                >
                    AÑADIR AL CARRITO
                </Button>
            </div>
        </div>
    );
};

const PromocionesPage = () => {
    const { categories, mainCategories, subcategoriesByParent, thirdLevelBySubcategory } = useCategories();
    const [promoVisible, setPromoVisible] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPromos = async () => {
            setLoading(true);
            try {
                // Forzamos la descarga de los productos para encontrar ofertas
                const { products: allProducts } = await fetchProducts({ limit: 1000 });
                
                // Filtramos estrictamente por isOffer true
                const promos = allProducts.filter(p => 
                    p.isOffer === true || 
                    (p as any).is_offer === true
                );
                
                setProducts(promos);
            } catch (error) {
                console.error("Error loading promotions:", error);
            } finally {
                setLoading(false);
            }
        };

        loadPromos();
    }, []);

    return (
        <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
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

            {/* Breadcrumb Section */}
            <div className="pt-28 pb-4">
                <div className="max-w-[1400px] mx-auto px-6">
                    <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                        <Link to="/" className="hover:text-red-600 transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3 pt-0.5" />
                        <span className="text-gray-900 font-medium">Promociones</span>
                    </nav>
                </div>
            </div>

            <main className="flex-1 pb-20">
                <div className="max-w-[1400px] mx-auto px-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Buscando las mejores ofertas...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="bg-white rounded-lg p-20 text-center border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Nuevas ofertas pronto!</h2>
                            <p className="text-gray-500 max-w-md mx-auto">
                                En este momento no hay productos con descuento activo. Vuelve pronto para descubrir promociones imperdibles.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {products.map((product) => (
                                <PromotionCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PromocionesPage;
