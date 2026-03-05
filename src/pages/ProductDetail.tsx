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
  ChevronRight,
  Info
} from 'lucide-react';

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
        <div className="max-w-6xl mx-auto px-4 mb-3">
          <nav className="flex flex-wrap items-center text-sm text-neutral-500">
            <button type="button" onClick={() => navigate('/')} className="hover:text-black transition-colors">Inicio</button>
            <span className="mx-2">/</span>
            <span className="text-black font-medium truncate">{product.name}</span>
          </nav>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 px-4">
          <div className="flex flex-col">
            <div className="relative bg-white flex flex-col items-center">
              <div className="relative w-full flex justify-center min-h-[450px] md:min-h-[550px] items-center">
                {imageLoading && <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80"><Loader2 className="h-12 w-12 text-black animate-spin" /></div>}
                <img
                  src={activeImageUrl || product.image}
                  alt={product.name}
                  className={`max-h-[450px] md:max-h-[550px] w-full object-contain ${imageLoading ? 'opacity-50' : ''} transition-all duration-500`}
                  onLoad={() => setImageLoading(false)}
                />
              </div>
              <div className="flex justify-center gap-3 mt-8 flex-wrap">
                {[product.image, ...(product.additionalImages || []), ...(product.additional_images || [])]
                  .filter(Boolean)
                  .filter((url, index, self) => self.indexOf(url) === index) // Unique
                  .map((url, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveImageIndex(i); setActiveImageUrl(url); }}
                      className={`w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${activeImageIndex === i ? 'border-black shadow-md scale-110' : 'border-neutral-200 hover:border-neutral-400'}`}
                    >
                      <img src={url} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm h-fit">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl md:text-3xl font-black text-[#1a2b3c] leading-tight uppercase tracking-tight pr-4">
                {product.name}
              </h1>
              <Button variant="ghost" size="icon" className="hover:bg-red-50 hover:text-red-500 rounded-full transition-colors flex-shrink-0">
                <Heart className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex flex-col gap-1 mb-4">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-400">
                <span className="uppercase tracking-widest">{product.category || 'Yamalube'}</span>
                <span className="tracking-wide">Referencia: {(product as any).barcode || product.id.slice(0, 8)}</span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= Number(calculateAverageRating()) ? 'fill-current' : 'text-neutral-200'}`} />
                  ))}
                </div>
                <span className="text-xs text-neutral-400 font-bold ml-1">{reviews.length}</span>
              </div>
            </div>

            <div className="text-4xl font-black text-[#1a2b3c] mb-6">
              $ {product.price.toLocaleString('es-AR')}
            </div>

            <div className="mb-8">
              <span className="text-xs font-bold text-neutral-500 uppercase block mb-3">Cantidad:</span>
              <div className="flex items-center bg-[#f7f8f9] border border-neutral-200 rounded-lg w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 flex items-center justify-center text-neutral-500 hover:text-black transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="h-10 min-w-[3rem] flex items-center justify-center font-bold text-[#1a2b3c]">
                  {quantity}
                </div>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 flex items-center justify-center text-neutral-500 hover:text-black transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Banner de compatibilidad */}
            <div className="bg-[#f0f2f5] p-4 rounded-xl flex items-center gap-4 mb-8 border-l-4 border-black group cursor-pointer hover:bg-[#e8ebf0] transition-all">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Shield className="h-5 w-5 text-black" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] leading-tight text-neutral-700 font-medium">
                  Se adapta a su: <span className="font-bold text-black">Encuentra el repuesto ideal</span>
                </p>
              </div>
              <button className="text-[13px] font-black underline text-black uppercase tracking-tighter">
                Agregar vehículo
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-8">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="w-full border-black border-2  text-black h-12 rounded-xl font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
              >
                Añadir al carrito
              </Button>

              <Button
                onClick={() => navigate('/checkout')}
                className="w-full bg-[#005cb9] hover:bg-[#004a96] text-white h-12 rounded-xl font-black uppercase tracking-widest transition-all shadow-md shadow-blue-100"
              >
                Comprar ahora
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100 mb-6">
              <div className="flex items-center gap-2 text-neutral-500 group cursor-pointer">
                <Truck className="h-4 w-4 group-hover:text-black transition-colors" />
                <span className="text-[11px] font-bold underline decoration-neutral-200 group-hover:text-black transition-all">Tiempo de entrega</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-500 group cursor-pointer">
                <Shield className="h-4 w-4 group-hover:text-black transition-colors" />
                <span className="text-[11px] font-bold underline decoration-neutral-200 group-hover:text-black transition-all">Condiciones Generales</span>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Compartir:</span>
              <div className="flex gap-3">
                <button className="p-2 bg-[#f7f8f9] rounded-full text-[#1a2b3c] hover:bg-black hover:text-white transition-all shadow-sm">
                  <Facebook className="h-4 w-4" />
                </button>
                <button className="p-2 bg-[#f7f8f9] rounded-full text-[#1a2b3c] hover:bg-black hover:text-white transition-all shadow-sm">
                  <Twitter className="h-4 w-4" />
                </button>
                <button className="p-2 bg-[#f7f8f9] rounded-full text-[#1a2b3c] hover:bg-black hover:text-white transition-all shadow-sm">
                  <Info className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <section className="max-w-6xl mx-auto px-4 mt-12 border-t pt-10">
          <div className="flex border-b mb-6">
            <button onClick={() => setActiveTab('descripcion')} className={`pb-3 px-6 text-sm font-medium border-b-2 ${activeTab === 'descripcion' ? 'border-black' : 'border-transparent'}`}>Descripción</button>
            <button onClick={() => setActiveTab('especificaciones')} className={`pb-3 px-6 text-sm font-medium border-b-2 ${activeTab === 'especificaciones' ? 'border-black' : 'border-transparent'}`}>Especificaciones</button>
          </div>
          <div className="text-neutral-700">
            {activeTab === 'descripcion' ? (
              <p className="whitespace-pre-wrap">{product.description || 'Sin descripción.'}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getSpecs().length > 0 ? (
                  getSpecs().map((spec: any, i: number) => (
                    <div key={i} className="flex justify-between border-b py-2">
                      <span className="font-medium">{spec.name}</span>
                      <span>{String(spec.value)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No hay especificaciones disponibles.</p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 my-12">
          <h2 className="text-2xl font-bold mb-6">Reseñas</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {reviews.length === 0 ? (
              <p className="text-gray-500 italic mt-2">Aún no hay reseñas para este artículo. ¡Sé el primero en opinar!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="min-w-[280px] bg-white border p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold">{review.userName.charAt(0)}</div>
                    <span className="font-medium text-sm">{review.userName}</span>
                  </div>
                  <div className="flex text-amber-500 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`h-4 w-4 ${s <= review.rating ? 'fill-current' : ''}`} />)}
                  </div>
                  <p className="text-sm line-clamp-3">{review.comment}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 border-t pt-8">
            {user ? (
              showReviewForm ? (
                <div className="max-w-2xl bg-neutral-50 p-6 rounded-xl border border-neutral-100">
                  <h3 className="font-bold mb-4">Escribir una reseña</h3>
                  <div className="flex mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-6 w-6 cursor-pointer ${s <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-neutral-300'}`}
                        onClick={() => setReviewRating(s)}
                      />
                    ))}
                  </div>
                  <textarea
                    className="w-full border rounded-lg p-3 mb-4 min-h-[100px] text-sm"
                    placeholder="Cuéntanos qué te pareció el producto..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowReviewForm(false)}>Cancelar</Button>
                    <Button
                      className="bg-black text-white"
                      onClick={handleSubmitReview}
                      disabled={submittingReview || reviewComment.trim().length < 10}
                    >
                      {submittingReview ? 'Enviando...' : 'Publicar'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowReviewForm(true)} variant="outline" className="font-medium border-black font-bold">
                  Escribir una reseña
                </Button>
              )
            ) : (
              <p className="text-sm text-neutral-600 bg-neutral-50 p-4 rounded-lg inline-block border">Debes <button onClick={() => navigate('/perfil')} className="font-bold underline text-black">iniciar sesión</button> para dejar una reseña.</p>
            )}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 my-12">
          <h2 className="text-2xl font-bold mb-6">Productos relacionados</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {similarProducts.length > 0 ? (
              similarProducts.map((p) => (
                <div key={p.id} className="min-w-[240px] w-[240px] border p-4 rounded-lg cursor-pointer flex flex-col hover:border-black transition-colors" onClick={() => goToProduct(p)}>
                  <img src={p.image} alt={p.name} className="h-40 w-full object-contain mb-4" />
                  <h3 className="font-medium text-sm mb-2 line-clamp-2">{p.name}</h3>
                  <p className="font-bold text-lg mt-auto">${p.price.toLocaleString('es-AR')}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic mt-2">No hay productos relacionados para este artículo.</p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetailPage;
