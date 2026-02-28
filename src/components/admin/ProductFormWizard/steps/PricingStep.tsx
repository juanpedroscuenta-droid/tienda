import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye } from 'lucide-react';
import { cn, parseFormattedPrice } from '@/lib/utils';
import { StepComponentProps } from '../types';

export const PricingStep: React.FC<StepComponentProps> = ({
  formData,
  setFormData,
  onValidationChange
}) => {
  // Validación en tiempo real
  React.useEffect(() => {
    const isValid = !!(formData.price && formData.stock);
    onValidationChange?.(isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.price, formData.stock]);

  const margin = formData.price && formData.cost && parseFormattedPrice(formData.price) > 0 && parseFormattedPrice(formData.cost) > 0
    ? Math.round(((parseFormattedPrice(formData.price) - parseFormattedPrice(formData.cost)) / parseFormattedPrice(formData.price)) * 100)
    : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Precio de Venta */}
        <div className="space-y-2">
          <Label htmlFor="price" className="text-sm font-semibold">
            Precio de Venta <span className="text-red-500">*</span>
          </Label>
          <Input
            id="price"
            type="text"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="Ej: 12.500"
            required
            className="h-11"
          />
        </div>

        {/* Costo de Adquisición */}
        <div className="space-y-2">
          <Label htmlFor="cost" className="text-sm font-semibold flex items-center">
            Costo de Adquisición
            <span className="ml-2 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-xs font-medium">
              Uso interno
            </span>
          </Label>
          <Input
            id="cost"
            type="text"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            placeholder="Ej: 8.000"
            className="h-11"
          />
          {margin !== null && (
            <div className="mt-2 text-xs">
              <span className="font-medium">Margen: </span>
              <span className="text-green-600 font-medium">{margin}%</span>
            </div>
          )}
        </div>

        {/* Stock */}
        <div className="space-y-2">
          <Label htmlFor="stock" className="text-sm font-semibold">
            Stock <span className="text-red-500">*</span>
          </Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            placeholder="Ej: 100"
            required
            className="h-11"
          />
        </div>

        {/* Estado de Publicación */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Estado de Publicación
          </Label>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                formData.isPublished ? "bg-green-500" : "bg-gray-400"
              )}></div>
              <span className="text-xs text-gray-600">
                {formData.isPublished ? "Publicado" : "No publicado"}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          <p className="text-xs text-gray-500">
            {formData.isPublished
              ? "✅ Visible para el público"
              : "🔒 Solo visible internamente"}
          </p>
        </div>
      </div>
    </div>
  );
};
