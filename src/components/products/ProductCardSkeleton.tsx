import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white flex flex-col items-center relative h-full w-full border border-gray-100 rounded-sm">
      {/* Imagen del Producto Skeleton */}
      <div className="h-64 w-full relative flex items-center justify-center p-6 bg-white overflow-hidden">
        <Skeleton className="h-48 w-48 rounded-md" />
      </div>

      {/* Línea Separadora */}
      <div className="w-[85%] border-t border-gray-100 mb-4"></div>

      {/* Información del Producto Skeleton */}
      <div className="text-left w-full px-6 pb-6 flex flex-col flex-1 gap-3">
        {/* Nombre Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-5 w-2/3" />
        </div>

        {/* Estrellas Skeleton */}
        <div className="flex gap-0.5 mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Skeleton key={s} className="w-4 h-4 rounded-full" />
          ))}
        </div>

        {/* Precio Skeleton */}
        <div className="mb-5">
          <Skeleton className="h-8 w-32" />
        </div>

        {/* Botón Skeleton */}
        <Skeleton className="h-12 w-full rounded-sm" />
      </div>
    </div>
  );
};
