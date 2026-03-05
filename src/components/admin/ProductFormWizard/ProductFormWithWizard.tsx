import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Package, Edit, Trash2, Search, Plus, X, AlertTriangle, ShieldCheck,
  Loader2, Eye, Filter, ChevronDown, Tags, History, SlidersHorizontal, CreditCard,
  FileSpreadsheet, Download, LayoutGrid, ChevronLeft, ChevronRight, Star
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn, parseFormattedPrice } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ProductFormWizard } from './ProductFormWizard';
import { CustomClock } from '@/components/ui/CustomClock';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Utilidad para crear slugs SEO-friendly
function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

interface ProductFormWithWizardProps {
  selectedProductId?: string | null;
  onProductSelected?: () => void;
}

export const ProductFormWithWizard: React.FC<ProductFormWithWizardProps> = ({
  selectedProductId,
  onProductSelected
}) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string; parentId?: string | null }>>([]);
  const [visibleProducts, setVisibleProducts] = useState<number>(20);
  const [hasMoreProducts, setHasMoreProducts] = useState<boolean>(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [liberta, setLiberta] = useState("no");
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'price-high' | 'price-low' | 'name-asc' | 'name-desc'>('recent');
  const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({});
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isSupabase = typeof (db as any)?.from === 'function';

  useEffect(() => {
    if (user) {
      if (user.isAdmin || user.email === "admin@gmail.com" || user.email === "admin@tienda.com") {
        setLiberta("si");
      } else if (user.subCuenta === "si") {
        setLiberta(user.liberta === "si" ? "si" : "no");
      } else {
        setLiberta("si");
      }
    }
  }, [user]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      setEditingProductId(selectedProductId);
      setShowWizard(true);
    } else if (selectedProductId === null) {
      setEditingProductId(null);
      setShowWizard(false);
    }
  }, [selectedProductId]);

  const fetchCategories = async () => {
    try {
      if (isSupabase) {
        const { data, error } = await (db as any)
          .from("categories")
          .select("*")
          .order("created_at", { ascending: true });
        if (error) throw error;

        const allCategories = (data || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name || "Categoría sin nombre",
          parentId: cat.parent_id ?? cat.parentId ?? null
        }));
        setCategories(allCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      if (isSupabase) {
        const { data, error } = await (db as any)
          .from("products")
          .select("*")
          .order("updated_at", { ascending: false });
        if (error) throw error;

        const normalized = (data || []).map((product: any) => ({
          id: product.id,
          ...product,
          price: product.price ?? 0,
          originalPrice: product.original_price ?? product.originalPrice ?? product.price ?? 0,
          additionalImages: product.additional_images ?? [],
          category: product.category_id ?? product.category ?? '',
          subcategory: product.subcategory ?? '',
          terceraCategoria: product.tercera_categoria ?? '',
          isOffer: product.is_offer ?? product.isOffer ?? false,
          isPublished: product.is_published ?? product.isPublished ?? true,
          categoryName: categories.find(c => c.id === (product.category_id ?? product.category))?.name || product.category,
          subcategoryName: categories.find(c => c.id === product.subcategory)?.name || product.subcategory,
        }));
        setProducts(normalized);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los productos."
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  // Actualizar nombres de categoría cuando cambien las categorías
  useEffect(() => {
    if (categories.length > 0 && products.length > 0) {
      setProducts(prevProducts => prevProducts.map(product => ({
        ...product,
        categoryName: categories.find(c => c.id === product.category)?.name || product.category,
        subcategoryName: categories.find(c => c.id === product.subcategory)?.name || product.subcategory,
      })));
    }
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (products.length === 0) return [];

    const hasSearchTerm = searchTerm.trim().length > 0;
    const hasCategoryFilter = selectedCategory.length > 0;

    if (!hasSearchTerm && !hasCategoryFilter) {
      return products;
    }

    const lowercasedTerm = hasSearchTerm ? searchTerm.toLowerCase() : '';

    return products.filter(product => {
      if (hasSearchTerm) {
        const matchesSearch =
          (product.name && product.name.toLowerCase().includes(lowercasedTerm)) ||
          (product.description && product.description.toLowerCase().includes(lowercasedTerm)) ||
          (product.categoryName && product.categoryName.toLowerCase().includes(lowercasedTerm)) ||
          (product.price && String(product.price).includes(lowercasedTerm));

        if (!matchesSearch) return false;
      }

      if (hasCategoryFilter) {
        const matchesCategory =
          product.category === selectedCategory ||
          product.subcategory === selectedCategory ||
          product.terceraCategoria === selectedCategory;

        if (!matchesCategory) return false;
      }

      return true;
    });
  }, [searchTerm, selectedCategory, products]);

  const sortedProducts = useMemo(() => {
    if (filteredProducts.length === 0) return [];

    const productsWithSortKeys = filteredProducts.map(product => {
      let sortKey: number | string = 0;

      switch (sortOrder) {
        case 'recent':
        case 'oldest':
          const modified = product.lastModified?.toDate?.() || product.updated_at || product.updatedAt || new Date();
          sortKey = modified instanceof Date ? modified.getTime() : new Date(modified).getTime();
          break;
        case 'price-high':
        case 'price-low':
          sortKey = parseFloat(String(product.price)) || 0;
          break;
        case 'name-asc':
        case 'name-desc':
          sortKey = (product.name || '').toLowerCase();
          break;
      }

      return { product, sortKey };
    });

    productsWithSortKeys.sort((a, b) => {
      switch (sortOrder) {
        case 'recent':
          return (b.sortKey as number) - (a.sortKey as number);
        case 'oldest':
          return (a.sortKey as number) - (b.sortKey as number);
        case 'price-high':
          return (b.sortKey as number) - (a.sortKey as number);
        case 'price-low':
          return (a.sortKey as number) - (b.sortKey as number);
        case 'name-asc':
          return (a.sortKey as string).localeCompare(b.sortKey as string);
        case 'name-desc':
          return (b.sortKey as string).localeCompare(a.sortKey as string);
        default:
          return 0;
      }
    });

    return productsWithSortKeys.map(item => item.product);
  }, [filteredProducts, sortOrder]);

  const paginatedProducts = useMemo(() => {
    return sortedProducts.slice(0, visibleProducts);
  }, [sortedProducts, visibleProducts]);

  useEffect(() => {
    setHasMoreProducts(visibleProducts < sortedProducts.length);
  }, [sortedProducts.length, visibleProducts]);

  const loadMoreProducts = () => {
    setLoadingMoreProducts(true);
    setTimeout(() => {
      setVisibleProducts(prev => prev + 20);
      setLoadingMoreProducts(false);
    }, 300);
  };

  const getStockStatus = useCallback((stock: number) => {
    if (stock > 10) {
      return { text: "En Stock", color: "bg-green-100 text-green-800 hover:bg-green-200" };
    } else if (stock > 0) {
      return { text: "Stock Bajo", color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" };
    } else {
      return { text: "Agotado", color: "bg-red-100 text-red-800 hover:bg-red-200" };
    }
  }, []);

  const handleImageLoadStart = (productId: string) => {
    setLoadingImages(prev => ({ ...prev, [productId]: true }));
  };

  const handleImageLoadEnd = (productId: string) => {
    setLoadingImages(prev => ({ ...prev, [productId]: false }));
  };

  const handleEdit = (product: any) => {
    setEditingProductId(product.id);
    setShowWizard(true);
  };

  const handleDelete = async (productId: string) => {
    try {
      if (isSupabase) {
        const { error } = await (db as any).from("products").delete().eq("id", productId);
        if (error) throw error;

        toast({
          title: "Producto eliminado",
          description: "El producto ha sido eliminado exitosamente."
        });

        setProducts(products.filter(product => product.id !== productId));
      }
    } catch (error: any) {
      console.error("Error eliminando producto:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al intentar eliminar el producto."
      });
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleDeleteAllProducts = async () => {
    try {
      if (products.length === 0) {
        toast({
          variant: "destructive",
          title: "Sin productos",
          description: "No hay productos para eliminar."
        });
        return;
      }

      if (isSupabase) {
        setLoadingProducts(true);
        const { error } = await (db as any).from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) throw error;

        toast({
          title: "Productos eliminados",
          description: "Todos los productos han sido eliminados exitosamente."
        });

        setProducts([]);
        setLoadingProducts(false);
      }
    } catch (error: any) {
      console.error("Error eliminando todos los productos:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al intentar eliminar los productos."
      });
      setLoadingProducts(false);
    }
  };

  const handleWizardClose = () => {
    setShowWizard(false);
    setEditingProductId(null);
    fetchProducts();
    if (onProductSelected) {
      onProductSelected();
    }
  };

  const handleAddProduct = () => {
    setEditingProductId(null);
    setShowWizard(true);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const defaultCategory = categories.find(c => !c.parentId) || categories[0];
    if (!defaultCategory?.id) {
      toast({
        variant: "destructive",
        title: "Error al importar",
        description: "Crea al menos una categoría antes de importar productos."
      });
      return;
    }

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const items: { name: string; price: number }[] = [];
      const headerCheck = (v: unknown) => String(v || '').toLowerCase();
      const isHeaderRow = (a: unknown, b: unknown) => {
        const sa = headerCheck(a);
        const sb = headerCheck(b);
        return sa.includes('nombre') || sa.includes('name') || sb.includes('precio') || sb.includes('price');
      };

      let startIdx = 0;
      if (rows.length > 0 && isHeaderRow(rows[0][0], rows[0][1])) startIdx = 1;

      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i];
        const name = String(row?.[0] ?? '').trim();
        const priceVal = row?.[1];
        if (!name) continue;
        const price = parseFormattedPrice(priceVal as any);
        if (isNaN(price) || price < 0) continue;
        items.push({ name, price });
      }

      if (items.length === 0) {
        toast({
          variant: "destructive",
          title: "Archivo vacío",
          description: "No se encontraron filas válidas (nombre en columna A, precio numérico en columna B)."
        });
        return;
      }

      if (!isSupabase) {
        toast({ variant: "destructive", title: "Error", description: "Importar requiere Supabase." });
        return;
      }

      const categoryName = defaultCategory.name || "General";
      const payloads = items.map(item => ({
        name: item.name,
        description: null,
        price: item.price,
        original_price: item.price,
        image: null,
        additional_images: [],
        category: defaultCategory.id,
        category_id: defaultCategory.id,
        category_name: categoryName,
        subcategory: null,
        subcategory_name: null,
        tercera_categoria: null,
        tercera_categoria_name: null,
        stock: 1,
        is_published: true,
        is_offer: false,
        discount: 0,
        specifications: [],
        benefits: [],
        warranties: [],
        payment_methods: [],
        colors: [],
        created_by: user?.email || "import",
        last_modified_by: user?.email || "import",
      }));

      const { error } = await (db as any)
        .from("products")
        .insert(payloads);

      if (error) throw error;

      toast({
        title: "Importación completada",
        description: `Se crearon ${items.length} productos correctamente.`
      });
      fetchProducts();
    } catch (err: any) {
      console.error("Error importing Excel:", err);
      toast({
        variant: "destructive",
        title: "Error al importar",
        description: err?.message || "No se pudo procesar el archivo Excel."
      });
    } finally {
      setImporting(false);
    }
  };

  const handleExportExcel = () => {
    try {
      if (products.length === 0) {
        toast({
          variant: "destructive",
          title: "Error al exportar",
          description: "No hay productos para exportar."
        });
        return;
      }

      const exportData = products.map(p => ({
        Nombre: p.name || '',
        Precio: p.price || 0,
        Precio_Original: p.originalPrice || p.original_price || p.price || 0,
        Costo: p.cost || 0,
        Stock: p.stock || 0,
        Categoria: p.categoryName || p.category || '',
        Subcategoria: p.subcategoryName || p.subcategory || '',
        Publicado: p.isPublished !== false ? 'Sí' : 'No',
        Oferta: p.isOffer ? 'Sí' : 'No',
        Descripcion: p.description || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Productos");

      const fileName = `inventario_productos_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Exportación exitosa",
        description: `Se han exportado ${products.length} productos.`
      });
    } catch (error: any) {
      console.error("Error exporting Excel:", error);
      toast({
        variant: "destructive",
        title: "Error al exportar",
        description: "No se pudo generar el archivo Excel."
      });
    }
  };

  if (showWizard) {
    return (
      <div className="space-y-4 max-w-full overflow-x-hidden">
        <ProductFormWizard
          selectedProductId={editingProductId}
          onProductSelected={handleWizardClose}
          categories={categories}
          user={user}
          liberta={liberta}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 -mt-2">
      {/* ERP Style Header Toolbar */}
      <div className="bg-white border-b border-slate-200 -mx-6 px-6 py-2 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-medium text-slate-500">Productos</h1>
          <Button
            onClick={handleAddProduct}
            className="bg-[#00A09D] hover:bg-[#00817e] text-white font-bold uppercase text-xs px-6 py-1.5 h-auto rounded transition-colors"
          >
            CREAR
          </Button>
        </div>

        <div className="flex flex-1 max-w-2xl items-center gap-2">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <Input
              placeholder="Productos / Buscar..."
              className="bg-slate-50 border-slate-200 pl-9 pr-10 h-9 text-sm focus:bg-white transition-all rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-300" />
              </div>
            )}
          </div>

          <div className="flex items-center border border-slate-200 rounded divide-x divide-slate-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 outline-none">
                  <Filter className="h-3 w-3" /> Filtros {selectedCategory && <span className="ml-1 text-[#00A09D]">•</span>}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-y-auto">
                <DropdownMenuItem onClick={() => setSelectedCategory('')} className={!selectedCategory ? 'bg-slate-100 text-slate-900' : ''}>
                  <span className="h-4 w-4 mr-2 opacity-70">🏠</span> Todas las categorías
                </DropdownMenuItem>
                {categories
                  .filter(category => !category.parentId)
                  .map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={selectedCategory === category.id ? 'bg-slate-100 text-slate-900' : ''}
                    >
                      <Tags className="h-4 w-4 mr-2 opacity-70" /> {category.name}
                    </DropdownMenuItem>
                  ))
                }
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 outline-none">
                  <SlidersHorizontal className="h-3 w-3" /> Agrupar por
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => setSortOrder('recent')} className={sortOrder === 'recent' ? 'bg-slate-100' : ''}>Más recientes</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder('price-high')} className={sortOrder === 'price-high' ? 'bg-slate-100' : ''}>Precio: Mayor a menor</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder('price-low')} className={sortOrder === 'price-low' ? 'bg-slate-100' : ''}>Precio: Menor a mayor</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5">
              <Star className="h-3 w-3" /> Favoritos
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>{Math.min(1, sortedProducts.length)}-{paginatedProducts.length} / {sortedProducts.length}</span>
            <div className="flex items-center border border-slate-200 rounded bg-white overflow-hidden">
              <button
                onClick={() => setVisibleProducts(Math.max(20, visibleProducts - 20))}
                disabled={visibleProducts <= 20}
                className="p-1.5 hover:bg-slate-50 disabled:opacity-30 border-r border-slate-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={loadMoreProducts}
                disabled={!hasMoreProducts}
                className="p-1.5 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center border border-slate-200 rounded bg-white overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                "p-2 transition-colors",
                viewMode === 'kanban' ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 transition-colors border-l border-slate-200",
                viewMode === 'list' ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              <History className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Aviso del estado de libertad */}
      {user?.subCuenta === "si" && (
        <div className={`p-4 rounded-lg border ${liberta === "si"
          ? "bg-green-50 border-green-200 text-green-800"
          : "bg-blue-50 border-blue-200 text-blue-800"}`}>
          <div className="flex items-center">
            {liberta === "si" ? (
              <ShieldCheck className="h-5 w-5 mr-2 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 mr-2 text-blue-600" />
            )}
            <p className="text-sm font-medium">
              {liberta === "si"
                ? "Tu cuenta tiene permisos para publicar cambios directamente."
                : "Tu cuenta no tiene permisos para publicar cambios directos. Los cambios que realices serán enviados a revisión del administrador."}
            </p>
          </div>
        </div>
      )}

      <div className="px-2">
        {loadingProducts ? (
          <div className="flex justify-center items-center py-24">
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#00A09D] mb-3" />
              <p className="text-slate-500 font-medium animate-pulse">Cargando catálogo...</p>
            </div>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <Package className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No se encontraron productos</h3>
            <p className="text-slate-500 mt-1 max-w-sm text-center px-4">
              {searchTerm
                ? `No hay resultados para "${searchTerm}". Intenta con otros términos.`
                : "Aún no tienes productos en tu inventario. ¡Haz clic en CREAR para empezar!"}
            </p>
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {paginatedProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock || 0);
              return (
                <div
                  key={product.id}
                  className="group bg-white border border-slate-200 rounded-sm hover:shadow-md transition-all duration-200 relative overflow-hidden"
                >
                  <div className="flex p-3 gap-3">
                    {/* Image Area */}
                    <div className="w-20 h-20 bg-slate-50 rounded flex-shrink-0 relative overflow-hidden flex items-center justify-center border border-slate-100 group-hover:border-slate-300 transition-colors">
                      {loadingImages[product.id] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                          <Loader2 className="h-4 w-4 text-[#00A09D] animate-spin" />
                        </div>
                      )}
                      <img
                        src={product.image}
                        alt={product.name}
                        className={cn(
                          "w-full h-full object-contain transition-transform duration-300 group-hover:scale-105",
                          loadingImages[product.id] ? "opacity-0" : "opacity-100"
                        )}
                        onLoad={() => handleImageLoadEnd(product.id)}
                        onLoadStart={() => handleImageLoadStart(product.id)}
                        onError={(e) => {
                          handleImageLoadEnd(product.id);
                          e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                        }}
                      />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0 pr-6">
                      <h4 className="font-bold text-sm text-slate-800 leading-tight mb-1 group-hover:text-[#00A09D] transition-colors line-clamp-2" title={product.name}>
                        {product.name}
                      </h4>
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-600 font-medium">
                          Precio: <span className="text-slate-900">${(product.price || 0).toLocaleString('es-CO')}</span>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          A mano: <span className={cn(
                            "font-bold",
                            product.stock > 10 ? "text-green-600" :
                              product.stock > 0 ? "text-orange-600" :
                                "text-red-600"
                          )}>{product.stock || 0},00 Unidades</span>
                        </p>
                      </div>

                      {/* Badges/Tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] bg-slate-100 text-slate-600 text-[9px] uppercase font-bold tracking-tight">
                          {product.categoryName || product.category || 'Sin Cat'}
                        </span>
                        {!product.isPublished && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] bg-red-50 text-red-600 text-[9px] uppercase font-bold tracking-tight">
                            Borrador
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Float Area (Right top corner) */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1.5 bg-white shadow-sm border border-slate-200 rounded hover:bg-[#00A09D] hover:text-white transition-colors text-slate-500"
                        title="Editar"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          const slug = slugify(product.name || 'producto');
                          window.open(`/producto/${slug}`, '_blank')?.focus();
                        }}
                        className="p-1.5 bg-white shadow-sm border border-slate-200 rounded hover:bg-blue-600 hover:text-white transition-colors text-slate-500"
                        title="Vista previa"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="p-1.5 bg-white shadow-sm border border-slate-200 rounded hover:bg-red-600 hover:text-white transition-colors text-slate-500"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará permanentemente "{product.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(product.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border rounded shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-2 font-semibold">Producto</th>
                  <th className="px-4 py-2 font-semibold">Categoría</th>
                  <th className="px-4 py-2 font-semibold text-right">Precio</th>
                  <th className="px-4 py-2 font-semibold text-right">Stock</th>
                  <th className="px-4 py-2 font-semibold text-center">Estado</th>
                  <th className="px-4 py-2 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={product.image || 'https://via.placeholder.com/40'} alt="" className="w-8 h-8 rounded object-cover border border-slate-100" />
                        <span className="font-bold text-slate-800">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{product.categoryName || 'General'}</td>
                    <td className="px-4 py-3 text-right font-medium">${(product.price || 0).toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "font-bold",
                        product.stock > 10 ? "text-green-600" : "text-orange-600"
                      )}>{product.stock || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={cn(
                        "text-[10px] uppercase font-bold tracking-tight rounded-[2px]",
                        product.isPublished !== false ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-500 border-slate-200"
                      )}>
                        {product.isPublished !== false ? 'Publicado' : 'Borrador'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => handleEdit(product)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => {
                          setDeletingProductId(product.id);
                          handleDelete(product.id);
                        }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasMoreProducts && (
          <div className="flex justify-center mt-8 pb-10">
            <Button
              onClick={loadMoreProducts}
              variant="outline"
              className="border-slate-200 text-[#00A09D] hover:bg-slate-50"
              disabled={loadingMoreProducts}
            >
              {loadingMoreProducts ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Cargar más productos
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
