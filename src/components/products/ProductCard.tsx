import React, { memo, useRef, useState, useEffect } from 'react';
import { Product, useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Heart, Package, Star } from 'lucide-react';
import { slugify } from '@/lib/utils';
import { useFavorites } from '@/contexts/FavoritesContext';

interface ProductCardProps {
  product: Product;
}

/**
 * LazyImage: solo descarga la imagen real cuando el componente entra en el viewport.
 * Antes de eso, muestra un skeleton animado. Al cargar, hace un fadeIn suave.
 */
const LazyImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // rootMargin: empieza a cargar cuando el card está a 200px de entrar en pantalla
      { rootMargin: '200px 0px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      {/* Skeleton mientras no es visible ni cargó */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-sm" />
      )}

      {/* Solo crea el <img> cuando entra al viewport */}
      {visible && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
};

const ProductCardComponent: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    toast({
      title: "Agregado",
      description: `${product.name} se agregó al carrito`,
      duration: 2000,
    });
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product);
  };

  const handleViewDetails = () => {
    const slug = slugify(product.name);
    navigate(`/producto/${slug}`);
  };

  const isFav = isFavorite(product.id);

  return (
    <div
      className="bg-white flex flex-col items-center relative transition-all duration-300 h-full cursor-pointer w-full border border-gray-100 hover:shadow-lg rounded-sm group"
      onClick={handleViewDetails}
    >
      {/* Botón Favoritos (Sutil al hacer hover) */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className={`p-1.5 rounded-full bg-white shadow-sm ${isFav ? 'text-red-500' : 'text-gray-300 hover:text-red-500'} transition-colors`}
          onClick={handleToggleFavorite}
        >
          <Heart className={`h-5 w-5 ${isFav ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Imagen del Producto — usa LazyImage para NO descargar hasta que sea visible */}
      <div className="h-44 md:h-64 w-full relative flex items-center justify-center p-3 md:p-6 bg-white overflow-hidden">
        {product.image ? (
          <LazyImage
            src={product.image}
            alt={product.name}
            className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Package className="h-12 md:h-20 w-12 md:w-20 text-slate-100" />
        )}
      </div>

      {/* Línea Separadora */}
      <div className="w-[85%] border-t border-gray-100 mb-2 md:mb-4"></div>

      {/* Información del Producto */}
      <div className="text-left w-full px-4 md:px-6 pb-4 md:pb-6 flex flex-col flex-1">
        <h3 className="text-[15px] md:text-[17px] font-bold text-gray-900 mb-2 line-clamp-3 leading-[1.3] min-h-[60px] md:min-h-[66px]">
          {product.name}
        </h3>

        {/* Estrellas de Calificación */}
        <div className="flex gap-0.5 mb-3 md:mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="w-3.5 h-3.5 fill-gray-100 text-gray-100" />
          ))}
        </div>

        {/* Precio */}
        <div className="mb-4 md:mb-5 flex items-center gap-2 md:gap-3">
           <span className="text-[18px] md:text-[22px] font-bold text-[#E2343E]">
             $ {product.price.toLocaleString('es-CO')}
           </span>
           {(product.originalPrice || (product as any).original_price) && (Number(product.originalPrice || (product as any).original_price) > product.price) && (
             <span className="text-[10px] md:text-xs text-gray-400 line-through font-medium">
               $ {Number(product.originalPrice || (product as any).original_price).toLocaleString('es-CO')}
             </span>
           )}
        </div>

        {/* Botón de Acción */}
        <button
          className="w-full bg-[#E2343E] hover:bg-[#c42831] text-white rounded-sm text-[11px] md:text-[14px] font-bold py-2.5 md:py-3.5 transition-all duration-200 uppercase tracking-wide flex items-center justify-center"
          onClick={handleAddToCart}
        >
          AÑADIR AL CARRITO
        </button>
      </div>
    </div>
  );
};

export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id;
});
