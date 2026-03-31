
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const HomeBanners: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-0 mb-12">
            {/* Banner 1: Catálogo */}
            <div
                className="relative overflow-hidden rounded-[1.8rem] min-h-[140px] md:h-[180px] shadow-sm group cursor-pointer"
                onClick={() => {
                    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
            >
                <img
                    src="/8-MONTAJE-CARRO-SPORT_.webp"
                    alt="Catálogo de Partes"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </div>

            {/* Banner 2: Búsqueda por Modelo */}
            <div
                className="relative overflow-hidden rounded-[1.8rem] min-h-[140px] md:h-[180px] shadow-sm group cursor-pointer"
                onClick={() => {
                    window.dispatchEvent(new CustomEvent('app:open-filters'));
                }}
            >
                <img
                    src="/8-MONTAJE-LOCAL_.webp"
                    alt="Busqueda por Modelo"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </div>
        </div>
    );
};
