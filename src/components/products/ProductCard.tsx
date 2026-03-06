import React, { useState, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Product } from '@/contexts/CartContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, Sparkles, Heart, PlusCircle, Package, ShoppingBag } from 'lucide-react';
import { slugify } from '@/lib/utils';

import { useFavorites } from '@/contexts/FavoritesContext';

// Utilidad para crear slugs SEO-friendly

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({ product, onClick }) => {
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

  const secondImage = useMemo(() => {
    const additional = product.additionalImages || (product as any).additional_images;
    if (Array.isArray(additional) && additional.length > 0) {
      return additional.find(img => img && img !== product.image);
    }
    return null;
  }, [product]);

  return (
    <div
      className="bg-white flex flex-col items-center relative group/card transition-all duration-300 h-full cursor-pointer w-full p-2"
      onClick={handleViewDetails}
    >
      <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
        <button
          className={`p-2 rounded-full bg-white shadow-sm ${isFav ? 'text-red-500' : 'text-gray-400 hover:text-red-500'} transition-colors`}
          onClick={handleToggleFavorite}
        >
          <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : 'stroke-[1.5px]'}`} />
        </button>
      </div>

      {/* Badge de Oferta Estilo Imagen Replicada */}
      {Boolean(product.isOffer || (product as any).is_offer || (product.discount && product.discount > 0)) && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 -mt-2">
          <div className="bg-[#1a1a1a] text-white text-[9px] font-black px-4 py-0.5 rounded-full whitespace-nowrap shadow-sm">
            PRODUCTOS NUEVOS
          </div>
        </div>
      )}

      <div className="h-44 w-full relative flex items-center justify-center mb-2 p-2 bg-white overflow-hidden">
        {product.image ? (
          <>
            <img
              src={product.image}
              alt={product.name}
              className={`max-h-full max-w-full object-contain transform transition-all duration-700 ${secondImage ? 'group-hover/card:opacity-0 group-hover/card:scale-95' : 'group-hover/card:scale-105'}`}
              loading="lazy"
            />
            {secondImage && (
              <img
                src={secondImage}
                alt={product.name}
                className="absolute inset-0 m-auto max-h-[80%] max-w-[80%] object-contain opacity-0 group-hover/card:opacity-100 transform scale-95 group-hover/card:scale-100 transition-all duration-700"
                loading="lazy"
              />
            )}
          </>
        ) : (
          <Package className="h-16 w-16 text-slate-200" />
        )}
      </div>

      <div className="text-center w-full px-1 flex flex-col flex-1">
        <p className="text-[9px] font-semibold text-gray-400 mb-1 uppercase tracking-tight line-clamp-1">
          {(product as any).category_name || product.category || 'GENERAL'}
        </p>
        <h3 className="text-[12px] font-bold text-gray-900 mb-2 line-clamp-2 min-h-[34px] leading-tight">
          {product.name}
        </h3>

        <div className="mt-auto">
          <div className="flex flex-col items-center justify-center mb-3">
            {(product.originalPrice || (product as any).original_price) && (Number(product.originalPrice || (product as any).original_price) > product.price) ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 line-through font-bold">
                  $ {Number(product.originalPrice || (product as any).original_price).toLocaleString('es-CO')}
                </span>
                <span className="text-[14px] font-black text-gray-900">
                  $ {product.price.toLocaleString('es-CO')}
                </span>
              </div>
            ) : (
              <span className="text-[14px] font-black text-gray-900">
                $ {product.price.toLocaleString('es-CO')}
              </span>
            )}
          </div>

          <button
            className="w-full bg-white border border-gray-200 text-gray-700 rounded-sm text-[10px] font-bold py-2 hover:bg-black hover:text-white transition-all duration-200 flex items-center justify-center gap-2 uppercase"
            onClick={handleAddToCart}
          >
            AÑADIR AL CARRITO
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id;
});
