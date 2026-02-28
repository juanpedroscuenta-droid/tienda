import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StepComponentProps } from '../types';
import { FilterGroupsSelector } from './FilterGroupsSelector';

export const BasicInfoStep: React.FC<StepComponentProps> = ({
  formData,
  setFormData,
  categories,
  onValidationChange
}) => {
  const mainCategories = categories.filter(cat => !cat.parentId);
  const subCategories = categories.filter(cat => cat.parentId === formData.category);
  const thirdCategories = categories.filter(cat => cat.parentId === formData.subcategory);

  // Validación en tiempo real
  React.useEffect(() => {
    const isValid = !!(formData.name && formData.category);
    onValidationChange?.(isValid);
  }, [formData.name, formData.category, onValidationChange]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre y Marca */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
              Nombre del Producto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Perfume Chanel No. 5"
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand" className="text-sm font-semibold text-gray-700">
              Marca <span className="text-xs text-gray-500">(Opcional)</span>
            </Label>
            <Input
              id="brand"
              value={formData.brand || ''}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Ej: Chanel, Mazda..."
              className="h-11"
            />
          </div>
        </div>

        {/* Categoría Principal */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-semibold">
            Categoría Principal <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => {
              setFormData({
                ...formData,
                category: value,
                subcategory: '',
                terceraCategoria: ''
              });
            }}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Seleccionar categoría principal" />
            </SelectTrigger>
            <SelectContent>
              {mainCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subcategoría */}
        {formData.category && (
          <div className="space-y-2">
            <Label htmlFor="subcategory" className="text-sm font-semibold">
              Subcategoría <span className="text-xs text-gray-500">(Opcional)</span>
            </Label>
            <Select
              value={formData.subcategory || "none"}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  subcategory: value === "none" ? "" : value,
                  terceraCategoria: ""
                });
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Seleccionar subcategoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {subCategories.map((subCategory) => (
                  <SelectItem key={subCategory.id} value={subCategory.id}>
                    {subCategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tercera Categoría */}
        {formData.category && formData.subcategory && (
          <div className="space-y-2">
            <Label htmlFor="terceraCategoria" className="text-sm font-semibold">
              Tercera Categoría <span className="text-xs text-gray-500">(Opcional)</span>
            </Label>
            <Select
              value={formData.terceraCategoria || "none"}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  terceraCategoria: value === "none" ? "" : value
                });
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Seleccionar tercera categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {thirdCategories.map((thirdCategory) => (
                  <SelectItem key={thirdCategory.id} value={thirdCategory.id}>
                    {thirdCategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Grupos / Etiquetas del Producto */}
      <FilterGroupsSelector formData={formData} setFormData={setFormData} />

      {/* Vista previa de clasificación */}
      {(formData.category || formData.subcategory || formData.terceraCategoria) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">Clasificación:</p>
          <p className="text-sm text-blue-700 mt-1">
            {categories.find(cat => cat.id === formData.category)?.name || ''}
            {formData.subcategory && ' > ' + categories.find(cat => cat.id === formData.subcategory)?.name}
            {formData.terceraCategoria && ' > ' + categories.find(cat => cat.id === formData.terceraCategoria)?.name}
          </p>
        </div>
      )}
    </div>
  );
};
