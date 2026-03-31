
import React, { useState } from 'react';
import { useFilters } from '@/hooks/use-filters';
import { useCategories } from '@/hooks/use-categories';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from "lucide-react";

export const VehicleFilterBar = () => {
  const { filters } = useFilters();
  const { categories } = useCategories();
  const [selections, setSelections] = useState<{ [key: string]: string }>({});

  // Identificar filtros por nombre
  const brandFilter = filters.find(f => f.name.toLowerCase().includes('marca'));
  const modelFilter = filters.find(f => f.name.toLowerCase().includes('modelo'));
  const yearFilter = filters.find(f => f.name.toLowerCase().includes('año') || f.name.toLowerCase().includes('anio'));

  const handleSearch = () => {
    // 1. Preparar filtros de atributos
    const filterPayload: { [key: string]: string[] } = {};
    if (brandFilter && selections.brand && selections.brand !== 'all') {
      filterPayload[brandFilter.id] = [selections.brand];
    }
    if (modelFilter && selections.model && selections.model !== 'all') {
      filterPayload[modelFilter.id] = [selections.model];
    }
    if (yearFilter && selections.year && selections.year !== 'all') {
      filterPayload[yearFilter.id] = [selections.year];
    }

    // 2. Si se seleccionó una categoría específica
    if (selections.category && selections.category !== 'all') {
      // Podríamos disparar un cambio de categoría global
      // Pero por ahora solo aplicamos los filtros de vehículo
    }

    // 3. Despachar evento para que ProductsSection reaccione
    window.dispatchEvent(new CustomEvent('app:filter-change', {
      detail: { type: 'setFilters', payload: filterPayload }
    }));

    // 4. Cambiar a vista de catálogo amplia (ocultar banners)
    window.dispatchEvent(new CustomEvent('app:set-catalog-view', {
      detail: true
    }));

    // 5. Scroll suave al inicio de los productos
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 p-2 md:p-3 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0">

          {/* Categoría */}
          <div className="w-full md:w-48 border-r-0 md:border-r border-gray-100 px-2 flex items-center">
            <Select onValueChange={(val) => setSelections(prev => ({ ...prev, category: val }))}>
              <SelectTrigger className="border-none bg-transparent focus:ring-0 shadow-none h-12 font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Marca */}
          <div className="w-full md:flex-1 border-r-0 md:border-r border-gray-100 px-2 flex items-center">
            <Select onValueChange={(val) => setSelections(prev => ({ ...prev, brand: val }))}>
              <SelectTrigger className="border-none bg-transparent focus:ring-0 shadow-none h-12 font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                <SelectValue placeholder="Marca de Vehículo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cualquier Marca</SelectItem>
                {brandFilter?.options.map(opt => (
                  <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>
                ))}
                {!brandFilter && (
                  <>
                    <SelectItem value="Toyota">Toyota</SelectItem>
                    <SelectItem value="Renault">Renault</SelectItem>
                    <SelectItem value="Chevrolet">Chevrolet</SelectItem>
                    <SelectItem value="Mazda">Mazda</SelectItem>
                    <SelectItem value="Kia">Kia</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Modelo / Año */}
          <div className="w-full md:flex-1 px-4 flex items-center">
            <Select onValueChange={(val) => setSelections(prev => ({ ...prev, model: val }))}>
              <SelectTrigger className="border-none bg-transparent focus:ring-0 shadow-none h-12 font-medium text-zinc-400">
                <SelectValue placeholder="MODELO / AÑO" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {modelFilter?.options.map(opt => (
                  <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>
                ))}
                {!modelFilter && (
                  <>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2020">2020</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Botón BUSCAR */}
          <Button
            onClick={handleSearch}
            className="w-full md:w-auto min-w-[140px] h-12 bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold uppercase tracking-widest rounded-md transition-all shadow-lg active:scale-95 m-1 border border-[#fcd200]"
          >
            BUSCAR
          </Button>
        </div>
      </div>

      {/* Flechita decorativa abajo (Estilo de la imagen) */}
      <div className="flex justify-center -mt-px relative z-0">
        <div className="w-10 h-6 bg-white shadow-lg border-b border-l border-r border-gray-50 flex justify-center items-end pb-1"
          style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}>
          <ChevronDown className="w-4 h-4 text-zinc-800" />
        </div>
      </div>
    </div>
  );
};
