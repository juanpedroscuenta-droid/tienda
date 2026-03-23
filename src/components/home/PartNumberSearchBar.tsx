
import React, { useState } from 'react';
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const PartNumberSearchBar = () => {
  const [partNumber, setPartNumber] = useState('');

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!partNumber.trim()) return;

    // 1. Despachar evento de búsqueda global
    window.dispatchEvent(new CustomEvent('app:filter-change', {
      detail: { type: 'search', payload: partNumber.trim() }
    }));

    // 2. Cambiar a vista de catálogo amplia (ocultar banners)
    window.dispatchEvent(new CustomEvent('app:set-catalog-view', {
      detail: true
    }));

    // 3. Scroll suave al inicio de los resultados
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <form 
        onSubmit={handleSearch}
        className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 p-2 md:p-3 relative z-10"
      >
        <div className="flex flex-col md:flex-row items-center gap-2">
          <div className="relative flex-1 w-full flex items-center px-4">
            <Search className="absolute left-6 w-5 h-5 text-zinc-400" />
            <Input
              type="text"
              placeholder="INGRESE EL NÚMERO DE PARTE O REFERENCIA OEM..."
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              className="pl-10 border-none bg-transparent focus-visible:ring-0 h-12 font-medium text-zinc-700 placeholder:text-zinc-400 placeholder:text-xs uppercase tracking-wider"
            />
          </div>

          <Button 
            type="submit"
            className="w-full md:w-auto min-w-[140px] h-12 bg-[#ba181b] hover:bg-[#a01518] text-white font-black uppercase tracking-widest rounded-md transition-all shadow-lg active:scale-95 m-1 border border-red-700"
          >
            BUSCAR REF
          </Button>
        </div>
      </form>
      
      {/* Flechita decorativa abajo */}
      <div className="flex justify-center -mt-px relative z-0">
        <div className="w-10 h-6 bg-white shadow-lg border-b border-l border-r border-gray-50 flex justify-center items-end pb-1" 
             style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}>
          <ChevronDown className="w-4 h-4 text-zinc-800" />
        </div>
      </div>
    </div>
  );
};
