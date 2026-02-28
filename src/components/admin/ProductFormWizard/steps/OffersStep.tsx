import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StepComponentProps } from '../types';
import { parseFormattedPrice } from '@/lib/utils';

export const OffersStep: React.FC<StepComponentProps> = ({
  formData,
  setFormData
}) => {
  // Sincronización de Precios y Descuento
  const handleOriginalPriceChange = (val: string) => {
    const origPrice = parseFormattedPrice(val);
    const discPercent = parseFloat(formData.discount) || 0;

    const updates: any = { originalPrice: val };

    if (discPercent > 0 && origPrice > 0) {
      const calculatedPrice = Math.round(origPrice * (1 - discPercent / 100));
      updates.price = calculatedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    setFormData({ ...formData, ...updates });
  };

  const handleDiscountChange = (val: string) => {
    const discPercent = parseFloat(val) || 0;
    const origPrice = parseFormattedPrice(formData.originalPrice);

    const updates: any = { discount: val };

    if (discPercent > 0 && origPrice > 0) {
      const calculatedPrice = Math.round(origPrice * (1 - discPercent / 100));
      updates.price = calculatedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    setFormData({ ...formData, ...updates });
  };

  // El porcentaje que se muestra debe ser el que el usuario escribió si existe, 
  // o el calculado si hay precios pero no porcentaje explícito.
  const displayDiscount = formData.discount && parseFloat(formData.discount) > 0
    ? Math.round(parseFloat(formData.discount))
    : (formData.originalPrice && formData.price && parseFormattedPrice(formData.originalPrice) > parseFormattedPrice(formData.price)
      ? Math.round((1 - (parseFormattedPrice(formData.price) / parseFormattedPrice(formData.originalPrice))) * 100)
      : 0);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-900">
          <strong>Ofertas y Promociones</strong>
        </p>
        <p className="text-sm text-green-700 mt-1">
          Configura descuentos y ofertas especiales para este producto. Al cambiar el descuento o el precio original, el precio de venta se actualizará automáticamente.
        </p>
      </div>

      {/* Activar Oferta */}
      <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg shadow-sm">
        <input
          type="checkbox"
          id="isOffer"
          checked={formData.isOffer}
          onChange={(e) => setFormData({ ...formData, isOffer: e.target.checked })}
          className="w-5 h-5 rounded text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
        />
        <Label htmlFor="isOffer" className="text-base font-semibold cursor-pointer flex items-center gap-2">
          Activar oferta especial
          <Badge variant="outline" className={formData.isOffer ? 'bg-green-50 text-green-700 border-green-200' : ''}>
            {formData.isOffer ? 'Activo' : 'Inactivo'}
          </Badge>
        </Label>
      </div>

      {/* Campos de Oferta */}
      {formData.isOffer && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border border-gray-200 rounded-xl bg-gray-50/50">
          <div className="space-y-2">
            <Label htmlFor="originalPrice" className="text-sm font-bold text-gray-700">
              Precio Original (Precio antes)
            </Label>
            <Input
              id="originalPrice"
              type="text"
              value={formData.originalPrice}
              onChange={(e) => handleOriginalPriceChange(e.target.value)}
              placeholder="Ej: 15.000"
              className="h-12 text-lg font-medium border-gray-300 focus:border-green-500 focus:ring-green-500"
            />
            <p className="text-[10px] text-gray-500">Este precio aparecerá tachado en la web.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount" className="text-sm font-bold text-gray-700">
              Descuento (%)
            </Label>
            <Input
              id="discount"
              type="text"
              value={formData.discount}
              onChange={(e) => handleDiscountChange(e.target.value)}
              placeholder="Ej: 32"
              className="h-12 text-lg font-medium border-gray-300 focus:border-green-500 focus:ring-green-500"
            />
            <p className="text-[10px] text-gray-500">Porcentaje de rebaja que se aplicará.</p>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label className="text-sm font-bold text-gray-700">Precio de Venta Resultante</Label>
            <Input
              value={formData.price}
              disabled
              className="h-12 bg-white font-black text-xl text-green-700 border-green-200"
            />
            <p className="text-[10px] text-gray-400">Este es el precio final que pagará el cliente después de aplicar el {formData.discount || '0'}%.</p>
          </div>

          {/* Vista Previa del Badge */}
          {formData.originalPrice && formData.price && (
            <div className="md:col-span-2 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Vista Previa Etiqueta:</p>
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 line-through">
                    ${parseFormattedPrice(formData.originalPrice).toLocaleString('es-CO')}
                  </span>
                  <span className="text-2xl font-black text-gray-900">
                    ${parseFormattedPrice(formData.price).toLocaleString('es-CO')}
                  </span>
                </div>
                {displayDiscount > 0 && (
                  <div className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black animate-pulse flex items-center gap-1">
                    <span className="text-lg">-{displayDiscount}%</span>
                    <span className="text-[10px] uppercase">OFF</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
