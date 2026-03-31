import React from 'react';
import { Product } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { slugify } from '@/lib/utils';

interface BestSellerCardProps {
  product: Product;
}

export const BestSellerCard: React.FC<BestSellerCardProps> = ({ product }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    const slug = slugify(product.name);
    navigate(`/producto/${slug}`);
  };

  // Extract brand and sub-details if possible, otherwise use name parts
  const nameParts = product.name.split(' ');
  const brand = nameParts[nameParts.length - 1]; // Assuming brand is last or we take a part
  const category = (product as any).category_name || product.category || 'REPUESTO';
  
  // Format price
  const formattedPrice = product.price.toLocaleString('es-CO');

  return (
    <div className="flex flex-col items-start group cursor-pointer transition-all duration-300" onClick={handleViewDetails}>
      {/* Product Image */}
      <div className="w-full aspect-square mb-6 overflow-hidden flex items-center justify-center p-4 bg-transparent group-hover:scale-105 transition-transform duration-500">
        <img 
          src={product.image || '/placeholder-product.png'} 
          alt={product.name}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Product Info - Left Aligned as requested */}
      <div className="flex flex-col items-start text-left w-full">
        <div className="min-h-[110px] flex flex-col items-start justify-start w-full">
          <p className="text-[10px] font-bold text-[#E53935] uppercase tracking-wider mb-1 leading-none">
            {category}
          </p>
          <h3 className="text-[26px] md:text-[28px] font-black text-gray-950 uppercase leading-[0.9] tracking-tighter mb-2">
            {product.name.split(' ')[0]}
          </h3>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-normal line-clamp-2">
            {product.name.split(' ').slice(1).join(' ') || 'Original'}
          </p>
        </div>
        
        <div className="mt-2">
          <div className="mb-2">
            <span className="text-[14px] font-bold text-gray-950 uppercase">
              Precio <span className="text-[#E53935] font-black tracking-tight">${formattedPrice}</span>
            </span>
          </div>

          <button 
            type="button"
            className="bg-[#E53935] text-white text-[10px] font-black px-6 py-2.5 rounded-none uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95"
          >
            VER MAS....
          </button>
        </div>
      </div>
    </div>
  );
};
