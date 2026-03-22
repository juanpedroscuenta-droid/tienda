import React from 'react';
import { useNavigate } from 'react-router-dom';

export const QuoteBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-[#f8f9fa] border-y border-gray-100 py-12 px-6 overflow-hidden relative group">
      {/* Subtle Background Pattern (using CSS) */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700" 
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="container mx-auto max-w-[1400px] flex flex-col md:flex-row items-center justify-between gap-10 relative z-10 px-4 md:px-8">
        <div className="flex flex-col text-center md:text-left space-y-2 max-w-2xl">
          <p className="text-[14px] md:text-[18px] font-black text-gray-900 uppercase tracking-tighter leading-none mb-1">
            ¿No encuentras tu Repuesto?
          </p>
          <div className="flex flex-col md:flex-row items-baseline gap-x-3 gap-y-1">
            <span className="text-[18px] md:text-[24px] font-black text-[#C62828] uppercase tracking-tight leading-none">
              ¡NOSOTROS TE AYUDAMOS!
            </span>
            <h2 className="text-[32px] md:text-[42px] font-black text-gray-900 uppercase tracking-tighter leading-none mt-1">
              SOLICITA TU COTIZACIÓN
            </h2>
          </div>
        </div>

        <button 
          onClick={() => navigate('/cotizacion')}
          className="bg-[#C62828] text-white text-[12px] md:text-[14px] font-black px-12 py-5 uppercase tracking-widest shadow-xl hover:bg-black hover:scale-105 transition-all active:scale-95 whitespace-nowrap"
        >
          ¡COTIZAR AQUI!
        </button>
      </div>
    </div>
  );
};
