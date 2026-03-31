import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/firebase';
import { AdvancedHeader } from '@/components/layout/AdvancedHeader';
import { Footer } from '@/components/layout/Footer';
import { useCategories } from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { recordProductView } from '@/lib/product-analytics';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProductBySlug, fetchProducts } from '@/lib/api';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Star,
  Shield,
  Truck,
  ArrowLeft,
  Loader2,
  Heart,
  Share2,
  Facebook,
  Twitter,
  Instagram,
  ChevronLeft,
  ChevronRight,
  Info,
  Package,
  CheckCircle2,
  BadgeCheck,
  Zap,
  ShoppingCart,
  ArrowRight,
  AlertCircle,
  Check
} from 'lucide-react';
import { FilterSidebar } from '@/components/products/FilterSidebar';
import { SocialShareBar } from '@/components/products/SocialShareBar';
import { useFilters } from '@/hooks/use-filters';

import { Product } from '@/contexts/CartContext';

// Utilidad para crear slugs SEO-friendly
function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

const ProductDetailPage = () => {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeImageUrl, setActiveImageUrl] = useState('');
  const [selectedColor, setSelectedColor] = useState<{ name: string, hexCode: string, image: string } | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { categories, categoriesData, mainCategories, subcategoriesByParent, thirdLevelBySubcategory } = useCategories();

  // Hook de filtros para el sidebar
  const { filters, loading: filtersLoading } = useFilters();
  const [selectedFilterOptions, setSelectedFilterOptions] = useState({});
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');

  const toggleFilterOption = (fId: string, oId: string) => {
    navigate(`/categoria/${encodeURIComponent(product?.category || 'Todos')}`);
  };

  const applyPrice = () => navigate(`/categoria/${encodeURIComponent(product?.category || 'Todos')}`);
  const filterOptionCounts = {};

  // Reseñas
  const [reviews, setReviews] = useState<any[]>([]);

  // Autoplay para productos relacionados
  useEffect(() => {
    const container = document.getElementById('similar-products-container');
    if (!container) return;
    (container as any).lastInteraction = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const lastInt = (container as any).lastInteraction || 0;
      if (now - lastInt >= 5000) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (maxScroll > 10) {
          if (container.scrollLeft >= maxScroll - 20) container.scrollTo({ left: 0, behavior: 'smooth' });
          else container.scrollBy({ left: container.clientWidth / 2, behavior: 'smooth' });
        }
        (container as any).lastInteraction = now;
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [similarProducts.length]);

  // Redirigir si el slug no coincide
  useEffect(() => {
    if (!product || !urlSlug) return;
    const canonicalSlug = slugify(product.name);
    if (urlSlug !== canonicalSlug && urlSlug !== product.id) {
      navigate(`/producto/${canonicalSlug}`, { replace: true });
    }
  }, [product, urlSlug, navigate]);

  // SEO Title
  useEffect(() => {
    document.title = product ? `${product.name} | R.REPUESTOS 24/7` : 'Cargando producto... | R.REPUESTOS 24/7';
  }, [product]);

  // Cargar datos del producto
  useEffect(() => {
    const loadProductData = async () => {
      if (!urlSlug) return;
      setLoading(true);
      setImageLoading(true);
      try {
        const productData = await fetchProductBySlug(urlSlug);
        if (productData) {
          setProduct(productData);
          setActiveImageUrl(productData.image);
          setActiveImageIndex(0);
          if (productData.colors && productData.colors.length > 0) setSelectedColor(productData.colors[0]);

          if (!viewRecorded) {
            recordProductView(productData.id, productData.name, user?.id, user?.email, user?.name).catch(() => {});
            setViewRecorded(true);
          }

          fetchProducts({ category_id: productData.category_id || productData.category, limit: 12 }).then(result => {
            setSimilarProducts(result.products.filter(p => p.id !== productData.id).slice(0, 8));
          }).catch(() => {});
        } else {
          setError("Producto no encontrado");
        }
      } catch (err) {
        console.error("Error loading product:", err);
        setError("No se pudo cargar el producto.");
      } finally {
        setLoading(false);
      }
    };
    loadProductData();
  }, [urlSlug, user?.id, viewRecorded, navigate]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity, selectedColor);
      toast({ title: "¡Producto agregado!" });
    }
  };

  const goToProduct = (prod: Product) => {
    navigate(`/producto/${slugify(prod.name)}`);
  };

  const originalPrice = (product as any)?.oldPrice || (product as any)?.originalPrice || (product ? Math.round(product.price * 1.15) : 0);

  return (
    <div className="flex flex-col min-h-screen">
      <SocialShareBar productName={product?.name || "Cargando..."} productUrl={typeof window !== 'undefined' ? window.location.href : ""} />
      <AdvancedHeader
        selectedCategory={product?.category || ""}
        setSelectedCategory={(cat) => navigate('/categoria/' + encodeURIComponent(cat))}
        categories={categories}
        mainCategories={mainCategories}
        subcategoriesByParent={subcategoriesByParent}
        thirdLevelBySubcategory={thirdLevelBySubcategory}
        allCategoriesData={categoriesData}
      />

      <main className="w-full bg-white px-0 sm:px-4 pt-6 pb-16 md:pt-8 md:pb-24">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 px-4">
          <aside className="hidden lg:block w-[280px] flex-shrink-0 animate-in fade-in slide-in-from-left-4 duration-500">
            <FilterSidebar
              filters={filters} filtersLoading={filtersLoading} selectedFilterOptions={selectedFilterOptions}
              toggleFilterOption={toggleFilterOption} filterOptionCounts={filterOptionCounts}
              priceFrom={priceFrom} setPriceFrom={setPriceFrom} priceTo={priceTo} setPriceTo={setPriceTo} applyPrice={applyPrice}
              selectedCategory={product?.category || "Todos"} setSelectedCategory={(cat) => navigate('/categoria/' + encodeURIComponent(cat))}
            />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <nav className="flex flex-wrap items-center text-[10px] font-black uppercase tracking-[0.2em] text-[#ba181b]">
                <button type="button" onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">Home</button>
                <ChevronRight className="w-3 h-3 mx-2 text-neutral-300" />
                {loading ? <div className="w-20 h-3 bg-neutral-100 animate-pulse rounded" /> : (
                  <button type="button" onClick={() => navigate('/categoria/' + encodeURIComponent(product?.category || 'Todos'))} className="hover:opacity-80 transition-opacity truncate max-w-[200px]">
                    {categoriesData.find(c => c.id === product?.category)?.name || product?.category || 'Todos'}
                  </button>
                )}
                <ChevronRight className="w-3 h-3 mx-2 text-neutral-300" />
                {loading ? <div className="w-40 h-3 bg-neutral-100 animate-pulse rounded" /> : <span className="text-neutral-900 truncate max-w-[300px]">{product?.name}</span>}
              </nav>
            </div>

            {error && !loading && !product ? (
              <div className="container mx-auto px-4 py-16 text-center min-h-[50vh] flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">{error}</h1>
                <Button onClick={() => navigate('/')}><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
                <div className="md:col-span-7 flex flex-col">
                  <div className="relative bg-white flex flex-col items-center group">
                    <div className="relative w-full flex justify-center min-h-[400px] md:min-h-[500px] items-center p-4 border rounded-2xl bg-white/50 backdrop-blur-sm overflow-hidden group-hover:shadow-xl transition-all duration-500 border-neutral-100">
                      {loading ? <div className="w-full h-full bg-neutral-50 animate-pulse rounded-xl" /> : (
                        <img src={activeImageUrl || product?.image} alt={product?.name} className={`max-h-[400px] md:max-h-[500px] w-full object-contain ${imageLoading ? 'opacity-50' : 'opacity-100'} transition-all duration-500`} onLoad={() => setImageLoading(false)} />
                      )}
                    </div>
                    <div className="flex justify-start gap-3 mt-6 w-full overflow-x-auto pb-2 scrollbar-hide">
                      {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="min-w-[70px] h-[70px] rounded-xl bg-neutral-50 animate-pulse" />) :
                        [product?.image, ...(product?.additionalImages || []), ...(product?.additional_images || [])].filter(Boolean).filter((u, i, s) => s.indexOf(u) === i).map((url, i) => (
                          <button key={i} onClick={() => { setActiveImageIndex(i); setActiveImageUrl(url!); }} className={`min-w-[70px] h-[70px] rounded-xl border-2 overflow-hidden ${activeImageIndex === i ? 'border-orange-500 scale-105' : 'border-neutral-100'}`}>
                            <img src={url} alt="" className="w-full h-full object-contain p-1" />
                          </button>
                        ))
                      }
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 flex flex-col">
                  <div className="sticky top-24">
                    {loading ? (
                      <div className="space-y-4 mb-6">
                        <div className="h-10 w-3/4 bg-neutral-100 animate-pulse rounded" />
                        <div className="h-12 w-2/3 bg-neutral-100 animate-pulse rounded" />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-[28px] md:text-[34px] font-black text-[#0f1111] leading-[1.1] mb-4">{product?.name}</h1>
                        <div className="flex items-center gap-4 mb-6">
                          <span className="text-2xl font-bold text-gray-400 line-through">$ {originalPrice.toLocaleString('es-AR')}</span>
                          <span className="text-4xl font-black text-[#0f1111]">$ {product?.price.toLocaleString('es-AR')}</span>
                        </div>
                      </>
                    )}
                    {Number(product?.stock) > 0 ? (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[13px] font-bold text-emerald-700">En stock {Number(product?.stock) <= 12 && `(Solo quedan ${product?.stock})`}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-[13px] font-bold text-red-600">Agotado</span>
                      </div>
                    )}
                    {loading ? <div className="h-20 w-full bg-neutral-50 animate-pulse rounded mb-8" /> : <p className="text-[14px] text-gray-500 mb-8 leading-relaxed line-clamp-3">{product?.description}</p>}
                    
                    <div className="space-y-4 mb-8">
                       <div className="flex items-center gap-4">
                         <div className="w-14 h-14 font-bold text-[#ba181b] flex items-center justify-center">
                           <Truck className="w-8 h-8" />
                         </div>
                         <div>
                           <p className="text-[15px] font-black uppercase">Envío gratis</p>
                           <p className="text-[11px] font-bold text-gray-400 uppercase">En pedidos seleccionados</p>
                         </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      {loading ? <div className="h-12 w-full bg-neutral-50 animate-pulse rounded-xl" /> : (
                        <>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center bg-white border-2 border-neutral-100 rounded-xl overflow-hidden">
                              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-12 w-12 flex items-center justify-center"><Minus className="h-4 w-4" /></button>
                              <div className="h-12 min-w-[3rem] flex items-center justify-center font-black">{quantity}</div>
                              <button onClick={() => setQuantity(Math.min(product?.stock ?? 999, quantity + 1))} className="h-12 w-12 flex items-center justify-center"><Plus className="h-4 w-4" /></button>
                            </div>
                            <Button 
                              onClick={handleAddToCart} 
                              disabled={Number(product?.stock) <= 0}
                              className="flex-1 bg-[#1a1a1a] hover:bg-black text-white h-12 rounded-xl font-black uppercase text-[13px] flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                              <ShoppingCart className="w-5 h-5" /> Añadir al carrito
                            </Button>
                          </div>
                          <Button 
                            onClick={() => { handleAddToCart(); navigate('/carrito'); }} 
                            disabled={Number(product?.stock) <= 0}
                            className="w-full bg-[#ba181b] hover:bg-[#a01518] text-white h-12 rounded-xl font-black uppercase text-[13px] disabled:opacity-50"
                          >
                            Comprar ahora
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-20 pt-12 border-t border-neutral-100">
              <h2 className="text-xl font-bold text-[#ba181b] mb-8">Productos relacionados</h2>
              <div id="similar-products-container" className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide scroll-smooth">
                {loading || similarProducts.length === 0 ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="flex-[0_0_55%] sm:flex-[0_0_23.5%] h-80 bg-neutral-50 animate-pulse rounded-xl" />) :
                  similarProducts.map((p) => (
                    <div key={p.id} className="flex-[0_0_55%] sm:flex-[0_0_23.5%] min-w-0 group cursor-pointer flex flex-col bg-white border border-neutral-200 rounded-none overflow-hidden hover:shadow-md transition-shadow" onClick={() => goToProduct(p)}>
                      <div className="relative aspect-square w-full p-4 flex items-center justify-center bg-white">
                        <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="p-4 flex flex-col flex-1 border-t border-neutral-100">
                        <h3 className="text-sm font-bold text-neutral-800 line-clamp-3 min-h-[60px] leading-tight mb-2 uppercase">{p.name}</h3>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-sm font-bold text-[#ba181b]">${p.price.toLocaleString('es-AR')}</span>
                        </div>
                        <button className="mt-auto w-full bg-[#ba181b] hover:bg-[#a01518] text-white py-2 px-4 rounded-sm text-xs font-bold uppercase transition-colors">Añadir al carrito</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetailPage;
