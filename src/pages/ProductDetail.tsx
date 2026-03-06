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
  ArrowRight
} from 'lucide-react';
import { FilterSidebar } from '@/components/products/FilterSidebar';
import { useFilters } from '@/hooks/use-filters';

import { Product } from '@/contexts/CartContext';

// Utilidad para crear slugs SEO-friendly
function slugify(text: string): string {
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

// Permite URLs tipo /producto/:slug
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
  const [activeTab, setActiveTab] = useState<'descripcion' | 'especificaciones'>('descripcion');
  const [selectedColor, setSelectedColor] = useState<{ name: string, hexCode: string, image: string } | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { categories, categoriesData, mainCategories, subcategoriesByParent, thirdLevelBySubcategory } = useCategories();
  const [selectedMililitros, setSelectedMililitros] = useState<'2.5' | '5' | '10'>('2.5');

  // Hook de filtros para el sidebar - gestión local para el detalle
  const { filters, loading: filtersLoading } = useFilters();
  const [selectedFilterOptions, setSelectedFilterOptions] = useState({});
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');

  const toggleFilterOption = (fId: string, oId: string) => {
    // En el detalle, filtrar podría llevarte de vuelta a la tienda
    navigate(`/categoria/${encodeURIComponent(product?.category || 'Todos')}`);
  };

  const applyPrice = () => navigate(`/categoria/${encodeURIComponent(product?.category || 'Todos')}`);
  const filterOptionCounts = {};

  // Estados para sistema de reseñas - simplified as we are moving to backend
  const [reviews, setReviews] = useState<any[]>([]);
  const [userReview, setUserReview] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const getSpecs = () => {
    if (!product?.specifications) return [];
    let specs: any[] = [];

    // Protect against non-array specs 
    if (Array.isArray(product.specifications)) {
      specs = product.specifications;
    } else if (typeof product.specifications === 'string') {
      try {
        const parsed = JSON.parse(product.specifications);
        if (Array.isArray(parsed)) specs = parsed;
        // In case it's an object instead of array of {name, value}
        else if (typeof parsed === 'object' && parsed !== null) {
          specs = Object.entries(parsed).map(([name, value]) => ({ name, value }));
        }
      } catch (e) {
        specs = [];
      }
    }

    // Filter out internal specs like _filter_options
    return specs.filter(spec => spec.name !== '_filter_options');
  };

  // Redirigir si el slug no coincide
  useEffect(() => {
    if (!product || !urlSlug) return;
    const canonicalSlug = slugify(product.name);
    if (urlSlug !== canonicalSlug) {
      navigate(`/producto/${canonicalSlug}`, { replace: true });
    }
  }, [product, urlSlug, navigate]);

  // Actualizar título de página para SEO
  useEffect(() => {
    if (product) {
      document.title = `${product.name} | R.REPUESTOS 24/7`;
    } else {
      document.title = 'Producto | R.REPUESTOS 24/7';
    }
  }, [product]);

  // Cargar datos del producto por slug (using new API)
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
          if (productData.colors && productData.colors.length > 0) {
            setSelectedColor(productData.colors[0]);
          }

          if (!viewRecorded) {
            recordProductView(productData.id, productData.name, user?.id, user?.email, user?.name)
              .catch(err => console.error("Error recording view:", err));
            setViewRecorded(true);
          }

          // Fetch similar products
          try {
            const allProducts = await fetchProducts();

            // Primero, productos de la misma categoría
            const sameCategory = allProducts.filter(
              p => p.category === productData.category && p.id !== productData.id && p.isPublished !== false
            );

            // Segundo, el resto de productos
            const otherCategory = allProducts.filter(
              p => p.category !== productData.category && p.id !== productData.id && p.isPublished !== false
            );

            // Unir y limitar a 8
            const similar = [...sameCategory, ...otherCategory].slice(0, 8);

            setSimilarProducts(similar);
          } catch (err) {
            console.error("Error loading similar products:", err);
          }
        } else {
          toast({ title: "Producto no encontrado", variant: "destructive" });
          navigate('/');
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

  // Cargar reseñas - keeping direct Supabase for now as orders was the priority but could be moved too
  useEffect(() => {
    const fetchReviews = async () => {
      if (!product?.id) return;
      try {
        const { data } = await (db as any)
          .from('product_reviews')
          .select('*')
          .eq('product_id', product.id)
          .order('created_at', { ascending: false });

        if (data) {
          const reviewsList = data.map((review: any) => ({
            id: review.id,
            productId: review.product_id,
            userId: review.user_id,
            userName: review.user_name,
            rating: review.rating,
            comment: review.comment,
            createdAt: new Date(review.created_at),
          }));
          setReviews(reviewsList);
          if (user) {
            const existingReview = reviewsList.find((r: any) => r.userId === user.id);
            setUserReview(existingReview || null);
          }
        }
      } catch (error) {
        console.error('Error al cargar reseñas:', error);
      }
    };
    fetchReviews();
  }, [product?.id, user]);

  const handleSubmitReview = async () => {
    if (!user) return;
    if (reviewComment.trim().length < 10) return;

    try {
      setSubmittingReview(true);

      // 1. Sincronizar usuario en la tabla pública para evitar error de llave foránea (Foreign Key Constraint)
      try {
        await (db as any).from('users').upsert({
          id: user.id,
          email: user.email || 'correo@ejemplo.com',
          name: user.name || 'Usuario',
        }, { onConflict: 'id' });
      } catch (syncErr) {
        console.warn("Caché de usuario no sincronizado, podría fallar si es nuevo:", syncErr);
      }

      // 2. Insertar la reseña (Ahora con todos los campos habilitados tras el ajuste SQL)
      const newReviewData = {
        product_id: product?.id,
        user_id: user.id,
        user_name: user.name || 'Usuario',
        user_email: user.email || 'correo@ejemplo.com',
        rating: reviewRating,
        comment: reviewComment.trim(),
      };

      const { data, error } = await (db as any)
        .from('product_reviews')
        .upsert(newReviewData, { onConflict: 'product_id,user_id' })
        .select()
        .single();

      if (!error) {
        toast({ title: "¡Reseña publicada!" });
        setShowReviewForm(false);
        setReviewComment('');

        // Agregar la reseña simulada para que aparezca instantáneamente visualmente
        const optimisticReview = data ? {
          id: data.id,
          productId: data.product_id,
          userId: data.user_id,
          userName: data.user_name,
          rating: data.rating,
          comment: data.comment,
          createdAt: new Date(data.created_at || new Date()),
        } : {
          id: Date.now().toString(),
          productId: product?.id,
          userId: user.id,
          userName: user.name || 'Usuario',
          rating: reviewRating,
          comment: reviewComment.trim(),
          createdAt: new Date(),
        };

        setReviews([optimisticReview, ...reviews]);
        setUserReview(optimisticReview);
      } else {
        throw error;
      }
    } catch (err: any) {
      console.error("Detalles completos del error:", err);
      toast({
        title: "Error al publicar la reseña",
        description: err.message || JSON.stringify(err),
        variant: "destructive"
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity, selectedColor);
      toast({ title: "¡Producto agregado!" });
    }
  };

  const goToProduct = (prod: Product) => {
    const slug = slugify(prod.name);
    navigate(`/producto/${slug}`);
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdvancedHeader selectedCategory="" setSelectedCategory={(cat) => navigate('/categoria/' + encodeURIComponent(cat))} categories={categories} mainCategories={mainCategories} subcategoriesByParent={subcategoriesByParent} thirdLevelBySubcategory={thirdLevelBySubcategory} />
        <div className="container mx-auto px-4 pt-32 pb-16 flex items-center justify-center min-h-[70vh]">
          <Loader2 className="h-12 w-12 text-black animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdvancedHeader selectedCategory="" setSelectedCategory={(cat) => navigate('/categoria/' + encodeURIComponent(cat))} categories={categories} mainCategories={mainCategories} subcategoriesByParent={subcategoriesByParent} thirdLevelBySubcategory={thirdLevelBySubcategory} />
        <div className="container mx-auto px-4 pt-32 pb-16 text-center min-h-[70vh] flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
          <Button onClick={() => navigate('/')}><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
        </div>
      </div>
    );
  }

  const originalPrice = (product as any).oldPrice || (product as any).originalPrice || Math.round(product.price * 1.15); // Mocked if not present


  return (
    <div className="flex flex-col min-h-screen">
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

          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-[280px] flex-shrink-0 animate-in fade-in slide-in-from-left-4 duration-500">
            <FilterSidebar
              filters={filters}
              filtersLoading={filtersLoading}
              selectedFilterOptions={selectedFilterOptions}
              toggleFilterOption={toggleFilterOption}
              filterOptionCounts={filterOptionCounts}
              priceFrom={priceFrom}
              setPriceFrom={setPriceFrom}
              priceTo={priceTo}
              setPriceTo={setPriceTo}
              applyPrice={applyPrice}
              selectedCategory={product.category}
              setSelectedCategory={(cat) => navigate('/categoria/' + encodeURIComponent(cat))}
            />

            {/* Promo Banner under filters */}
            <div className="mt-8 group cursor-pointer hover:scale-[1.02] transition-transform duration-500">
              <div className="bg-white p-3 rounded-[32px] border border-neutral-100 shadow-sm hover:shadow-xl transition-shadow">
                <img
                  src="/pics/Picsart_26-03-02_13-05-18-052.jpg"
                  alt="Envíos a toda Colombia"
                  className="w-full h-auto rounded-[24px]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/400x400/white/black?text=Envios+a+Toda+Colombia";
                  }}
                />
              </div>
            </div>
          </aside>

          {/* Product Detail Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <nav className="flex flex-wrap items-center text-xs font-bold uppercase tracking-widest text-[#f15a24]">
                <button type="button" onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">Home</button>
                <ChevronRight className="w-3 h-3 mx-2 text-neutral-300" />
                <button type="button" onClick={() => navigate('/categoria/' + encodeURIComponent(product.category))} className="hover:opacity-80 transition-opacity truncate max-w-[150px]">{product.category}</button>
                <ChevronRight className="w-3 h-3 mx-2 text-neutral-300" />
                <span className="text-neutral-900 truncate max-w-[200px]">{product.name}</span>
              </nav>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
              {/* Image Section */}
              <div className="md:col-span-7 flex flex-col">
                <div className="relative bg-white flex flex-col items-center group">
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <span className="bg-black text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
                      <Zap className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      Flash Sale
                    </span>
                  </div>

                  <div className="relative w-full flex justify-center min-h-[400px] md:min-h-[500px] items-center p-4 border rounded-2xl bg-white/50 backdrop-blur-sm overflow-hidden group-hover:shadow-xl transition-all duration-500 border-neutral-100">
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80">
                        <Loader2 className="h-12 w-12 text-black animate-spin" />
                      </div>
                    )}
                    <img
                      src={activeImageUrl || product.image}
                      alt={product.name}
                      className={`max-h-[400px] md:max-h-[500px] w-full object-contain ${imageLoading ? 'opacity-50' : 'opacity-100'} transition-all duration-500 transform group-hover:scale-105`}
                      onLoad={() => setImageLoading(false)}
                    />
                  </div>

                  {/* Thumbnails */}
                  <div className="flex justify-start gap-3 mt-6 w-full overflow-x-auto pb-2 scrollbar-hide">
                    {[product.image, ...(product.additionalImages || []), ...(product.additional_images || [])]
                      .filter(Boolean)
                      .filter((url, index, self) => self.indexOf(url) === index)
                      .map((url, i) => (
                        <button
                          key={i}
                          onClick={() => { setActiveImageIndex(i); setActiveImageUrl(url); }}
                          className={`min-w-[70px] h-[70px] rounded-xl border-2 overflow-hidden transition-all flex-shrink-0 ${activeImageIndex === i ? 'border-orange-500 shadow-md scale-105' : 'border-neutral-100 hover:border-neutral-300'}`}
                        >
                          <img src={url} alt="" className="w-full h-full object-contain p-1" />
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="md:col-span-5 flex flex-col">
                <div className="sticky top-24">
                  <h1 className="text-[28px] md:text-[34px] font-black text-[#0f1111] leading-[1.1] mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {product.name}
                  </h1>

                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-2xl font-bold text-gray-400 line-through decoration-2">
                      $ {originalPrice.toLocaleString('es-AR')}
                    </span>
                    <span className="text-4xl font-black text-[#0f1111]">
                      $ {product.price.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <p className="text-[14px] text-gray-500 mb-8 leading-relaxed line-clamp-3">
                    {product.description || 'Sin descripción disponible.'}
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Truck className="h-6 w-6 text-[#f15a24]" />
                      </div>
                      <div>
                        <p className="text-[15px] font-black text-gray-900 uppercase tracking-tight">Envío gratis</p>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Por compras superiores a $60.000</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Star className="h-6 w-6 text-[#f15a24] fill-[#f15a24]" />
                      </div>
                      <div>
                        <p className="text-[15px] font-black text-gray-900 uppercase tracking-tight">Condición: NUEVO</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-8">
                    <p className="text-[13px] font-bold text-neutral-700">
                      Disponibilidad: <span className="text-emerald-600">Hay existencias</span>
                    </p>
                    <p className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">
                      SKU: {(product as any).barcode || product.id.slice(0, 8)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-white border-2 border-neutral-100 rounded-xl overflow-hidden shadow-sm">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="h-12 w-12 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 active:text-black transition-all"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="h-12 min-w-[3rem] flex items-center justify-center font-black text-black">
                          {quantity}
                        </div>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="h-12 w-12 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 active:text-black transition-all"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <Button
                        onClick={handleAddToCart}
                        className="flex-1 bg-[#1a1a1a] hover:bg-black text-white h-12 rounded-xl font-black uppercase tracking-[0.1em] text-[13px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-black/10"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Añadir al carrito
                      </Button>
                    </div>

                    <Button
                      onClick={() => navigate('/checkout')}
                      className="w-full bg-[#f15a24] hover:bg-[#e0501d] text-white h-12 rounded-xl font-black uppercase tracking-[0.1em] text-[13px] transition-all shadow-md shadow-orange-100"
                    >
                      Comprar ahora
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Products Section - Full Width Grid */}
            <div className="mt-20 pt-12 border-t border-neutral-100">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-[22px] font-black text-gray-900 uppercase tracking-tighter">Productos Relacionados</h2>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full border border-neutral-100 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm active:scale-95">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 rounded-full border border-neutral-100 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm active:scale-95">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 xl:gap-8">
                {similarProducts.slice(0, 6).map((p) => (
                  <div
                    key={p.id}
                    className="group cursor-pointer flex flex-col p-4 bg-white hover:shadow-xl hover:shadow-neutral-200/40 rounded-3xl border border-transparent hover:border-neutral-100 transition-all duration-500 animate-in fade-in zoom-in-95 duration-700"
                    onClick={() => goToProduct(p)}
                  >
                    <div className="aspect-square w-full mb-5 overflow-hidden rounded-2xl relative bg-neutral-50 px-2">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <div className="space-y-2 flex flex-col items-center text-center">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] line-clamp-1">{p.category}</span>
                      <h3 className="text-[13px] font-black text-gray-900 line-clamp-2 min-h-[38px] leading-tight uppercase tracking-tight">{p.name}</h3>
                      <div className="flex items-center justify-center pt-2">
                        <span className="text-lg font-black text-[#0f1111]">$ {p.price.toLocaleString('es-AR')}</span>
                      </div>
                      <button className="mt-5 w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 group-hover:text-black transition-all border border-neutral-100 px-4 py-3 rounded-xl hover:border-black hover:bg-neutral-50 shadow-sm active:scale-[0.98]">
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                        Leer más
                      </button>
                    </div>
                  </div>
                ))}
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
