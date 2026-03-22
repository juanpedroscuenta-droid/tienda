import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Product, useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Heart, Package, Star } from 'lucide-react';
import { slugify } from '@/lib/utils';
import { useFavorites } from '@/contexts/FavoritesContext';

interface ProductCardProps {
  product: Product;
}

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

      {/* Imagen del Producto */}
      <div className="h-64 w-full relative flex items-center justify-center p-6 bg-white overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <Package className="h-20 w-20 text-slate-100" />
        )}
      </div>

      {/* Línea Separadora (Como en la captura del usuario) */}
      <div className="w-[85%] border-t border-gray-100 mb-4"></div>

      {/* Información del Producto */}
      <div className="text-left w-full px-6 pb-6 flex flex-col flex-1">
        {/* Nombre - Fuente más Grande y Bold */}
        <h3 className="text-[17px] font-bold text-gray-900 mb-2 line-clamp-3 leading-[1.3] min-h-[66px]">
          {product.name}
        </h3>

        {/* Estrellas de Calificación */}
        <div className="flex gap-0.5 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="w-4 h-4 fill-gray-100 text-gray-100" />
          ))}
        </div>

        {/* Precio - Grande y Rojo Marca */}
        <div className="mb-5 flex items-center gap-3">
           <span className="text-[22px] font-bold text-[#E2343E]">
             $ {product.price.toLocaleString('es-CO')}
           </span>
           {(product.originalPrice || (product as any).original_price) && (Number(product.originalPrice || (product as any).original_price) > product.price) && (
             <span className="text-xs text-gray-400 line-through font-medium">
               $ {Number(product.originalPrice || (product as any).original_price).toLocaleString('es-CO')}
             </span>
           )}
        </div>

        {/* Botón de Acción - Estilo Screenshot */}
        <button
          className="w-full bg-[#E2343E] hover:bg-[#c42831] text-white rounded-sm text-[14px] font-bold py-3.5 transition-all duration-200 uppercase tracking-wide flex items-center justify-center"
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
