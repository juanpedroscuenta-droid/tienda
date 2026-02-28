import React, { useState, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Product } from '@/contexts/CartContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, Sparkles, Heart, PlusCircle, Package } from 'lucide-react';
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

  return (
    <div
      className="bg-[#fafafa] border border-gray-150 rounded-[2rem] p-4 sm:p-6 flex flex-col items-center relative group/card hover:shadow-xl transition-all duration-300 h-full cursor-pointer w-full"
      onClick={handleViewDetails}
    >
      <div className="absolute top-5 right-5 flex flex-col gap-4 z-10">
        <button
          className={`${isFav ? 'text-red-500' : 'text-gray-900 hover:text-red-500'} transition-colors`}
          onClick={handleToggleFavorite}
        >
          <Heart className={`h-5 w-5 ${isFav ? 'fill-current' : 'stroke-[1.5px]'}`} />
        </button>
        <button
          className="text-gray-900 hover:text-[#005cb9] transition-colors"
          onClick={handleAddToCart}
        >
          <PlusCircle className="h-5 w-5 stroke-[1.5px]" />
        </button>
      </div>

      {/* Badge de Oferta */}
      {Boolean(product.isOffer || (product as any).is_offer || (product.discount && product.discount > 0)) && (
        <div className="absolute top-5 left-5 z-10">
          <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wider">
            {product.discount ? `-${product.discount}%` : 'OFERTA'}
          </div>
        </div>
      )}
      <div className="h-40 sm:h-52 w-full flex items-center justify-center mb-4 sm:mb-6 p-2 sm:p-4">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="max-h-full max-w-full object-contain transform group-hover/card:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <Package className="h-20 w-20 text-slate-200" />
        )}
      </div>
      <div className="text-left w-full px-2 mt-auto">
        <h4 className="text-[11px] sm:text-[12px] font-normal text-slate-500 mb-2 line-clamp-2 min-h-[32px] sm:min-h-[36px] leading-tight uppercase tracking-tight">
          {product.name}
        </h4>
        <p className="text-[10px] text-slate-400 mb-1 font-medium italic opacity-80">
          Ref : {(product as any).barcode || (product as any).ref || product.id.slice(0, 10)}
        </p>
        <div className="flex flex-wrap items-baseline gap-2 mb-4 mt-1">
          <span className="text-base font-bold text-gray-950">
            $ {product.price.toLocaleString('es-CO')}
          </span>
          {(product.originalPrice || (product as any).original_price) && (Number(product.originalPrice || (product as any).original_price) > product.price) && (
            <span className="text-[11px] text-slate-300 line-through">
              $ {Number(product.originalPrice || (product as any).original_price).toLocaleString('es-CO')}
            </span>
          )}
        </div>

        <button
          className="w-full bg-white border-2 border-gray-900 text-gray-900 rounded-lg text-[11px] sm:text-[12px] font-extrabold py-3 hover:bg-gray-900 hover:text-white transition-all duration-200 uppercase tracking-widest relative z-10 flex items-center justify-center"
          onClick={handleAddToCart}
        >
          Añadir al carrito
        </button>
      </div>
    </div>
  );
};

export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id;
});
