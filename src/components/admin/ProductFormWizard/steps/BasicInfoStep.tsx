import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StepComponentProps } from '../types';
import { FilterGroupsSelector } from './FilterGroupsSelector';
import { fetchSuppliers, createSupplier } from '@/lib/api';
import { Plus, Loader2, Building2 } from 'lucide-react';

import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
}

export const BasicInfoStep: React.FC<StepComponentProps> = ({
  formData,
  setFormData,
  categories,
  onValidationChange
}) => {
  const mainCategories = categories.filter(cat => !cat.parentId);
  const subCategories = categories.filter(cat => cat.parentId === formData.category);
  const thirdCategories = categories.filter(cat => cat.parentId === formData.subcategory);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  


  // Cargar proveedores
  useEffect(() => {
    setLoadingSuppliers(true);
    fetchSuppliers()
      .then(data => setSuppliers(data))
      .catch(() => setSuppliers([]))
      .finally(() => setLoadingSuppliers(false));
  }, []);

  // Validación en tiempo real estable
  const lastValidRef = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    const isValid = !!(formData.name && formData.category);
    if (isValid !== lastValidRef.current) {
      lastValidRef.current = isValid;
      onValidationChange?.(isValid);
    }
  }, [formData.name, formData.category, onValidationChange]);

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) return;
    setCreatingSupplier(true);
    try {
      const created = await createSupplier({ name: newSupplierName.trim() });
      setSuppliers(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData({ ...formData, supplier_id: created.id });
      setNewSupplierName('');
      setShowNewSupplier(false);
      toast({ title: '✅ Proveedor creado', description: `"${created.name}" fue agregado.`, duration: 3000 });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setCreatingSupplier(false);
    }
  };



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

      {/* ── PROVEEDOR ── */}
      <div className="space-y-2 max-w-md">
        <div className="flex items-center justify-between">
          <Label htmlFor="supplier" className="text-sm font-semibold flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-gray-500" />
            Proveedor <span className="text-xs text-gray-400 font-normal">(Opcional)</span>
          </Label>
          <button
            type="button"
            onClick={() => setShowNewSupplier(prev => !prev)}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {showNewSupplier ? 'Cancelar' : 'Nuevo proveedor'}
          </button>
        </div>

        {/* Selector de proveedor existente */}
        {!showNewSupplier && (
          <Select
            value={formData.supplier_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, supplier_id: value === 'none' ? '' : value })}
            disabled={loadingSuppliers}
          >
            <SelectTrigger className="h-11 bg-white border-2 border-slate-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all">
              {loadingSuppliers
                ? <span className="flex items-center gap-2 text-gray-400"><Loader2 className="w-4 h-4 animate-spin" />Cargando proveedores...</span>
                : <SelectValue placeholder="Sin proveedor asignado" />
              }
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin proveedor</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{s.name}</span>
                    {s.contact_name && <span className="text-[10px] text-slate-400">Contacto: {s.contact_name}</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Formulario quick-create */}
        {showNewSupplier && (
          <div className="flex gap-2 items-center p-3 border border-blue-100 bg-blue-50/50 rounded-lg">
            <Input
              autoFocus
              placeholder="Nombre del nuevo proveedor"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateSupplier(); } }}
              className="h-9 flex-1 bg-white"
            />
            <button
              type="button"
              onClick={handleCreateSupplier}
              disabled={!newSupplierName.trim() || creatingSupplier}
              className="h-9 px-4 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 disabled:opacity-40 flex items-center gap-1.5 transition-colors"
            >
              {creatingSupplier ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Crear
            </button>
          </div>
        )}

        {/* Info del proveedor seleccionado */}
        {formData.supplier_id && formData.supplier_id !== 'none' && (() => {
          const s = suppliers.find(x => x.id === formData.supplier_id);
          if (!s) return null;
          return (
            <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-0.5 mt-1 pl-1">
              {s.phone && <span>📞 {s.phone}</span>}
              {s.email && <span>✉️ {s.email}</span>}
            </div>
          );
        })()}
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
