import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Package, Edit, Trash2, Search, Plus, X, AlertTriangle, ShieldCheck,
  Loader2, Eye, Filter, ChevronDown, Tags, History, SlidersHorizontal, CreditCard,
  FileSpreadsheet, Download
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

  // Si el wizard está abierto, mostrar solo el wizard
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
    <div className="space-y-3 -mt-2">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Gestión de Productos
        </h1>
        <p className="text-slate-600">
          Administra el inventario y la información de tus productos
        </p>
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

      {/* Lista de Productos */}
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="bg-white border-b border-slate-200 py-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900">
                Inventario de Productos ({sortedProducts.length})
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImportExcel}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-200 flex-1 sm:flex-none"
                        disabled={importing || categories.length === 0}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {importing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                        )}
                        Importar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-xs">Columna A: nombre, Columna B: precio. Los productos se crean con stock 1 y publicados.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-200 flex-1 sm:flex-none"
                        onClick={handleExportExcel}
                        disabled={products.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-xs">Exporta todos los productos actualmente cargados a un archivo Excel.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      disabled={products.length === 0 || loadingProducts}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Borrar Todos
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminarán permanentemente todos
                        ({products.length}) los productos de tu inventario.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAllProducts} className="bg-red-600 hover:bg-red-700">
                        Sí, eliminar todos
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  onClick={handleAddProduct}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro por categoría */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-3 gap-1 text-slate-700 border-slate-200 hover:bg-slate-50">
                    <Filter className="h-4 w-4" />
                    <span>Categoría</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 max-h-[300px] overflow-y-auto">
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

              {/* Ordenamiento */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-3 gap-1 text-slate-700 border-slate-200 hover:bg-slate-50">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Ordenar por</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setSortOrder('recent')} className={sortOrder === 'recent' ? 'bg-slate-100 text-slate-900' : ''}>
                    <CustomClock className="h-4 w-4 mr-2 opacity-70" /> Más recientes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('oldest')} className={sortOrder === 'oldest' ? 'bg-slate-100 text-slate-900' : ''}>
                    <History className="h-4 w-4 mr-2 opacity-70" /> Más antiguos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('name-asc')} className={sortOrder === 'name-asc' ? 'bg-slate-100 text-slate-900' : ''}>
                    <Tags className="h-4 w-4 mr-2 opacity-70" /> Nombre (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('name-desc')} className={sortOrder === 'name-desc' ? 'bg-slate-100 text-slate-900' : ''}>
                    <Tags className="h-4 w-4 mr-2 opacity-70" /> Nombre (Z-A)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('price-high')} className={sortOrder === 'price-high' ? 'bg-slate-100 text-slate-900' : ''}>
                    <CreditCard className="h-4 w-4 mr-2 opacity-70" /> Precio (Mayor a menor)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('price-low')} className={sortOrder === 'price-low' ? 'bg-slate-100 text-slate-900' : ''}>
                    <CreditCard className="h-4 w-4 mr-2 opacity-70" /> Precio (Menor a mayor)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Indicador de filtro activo */}
              {selectedCategory && (
                <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 gap-1">
                  {categories.find(cat => cat.id === selectedCategory)?.name || "Categoría"}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCategory('')}
                    className="h-4 w-4 p-0 ml-1 hover:bg-slate-300 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>

          <div className="relative mt-4">
            <div className="flex items-center bg-white border rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 transition-all">
              <div className="pl-3 py-2">
                <Search className="h-5 w-5 text-sky-500" />
              </div>
              <Input
                placeholder="Buscar por nombre, descripción, categoría o precio"
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10 flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchTerm('')}
                  className="h-8 w-8 mr-1 rounded-full hover:bg-sky-50 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loadingProducts ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center text-sky-600">
                <Loader2 className="h-10 w-10 animate-spin mb-2" />
                <p className="text-sm font-medium">Cargando productos...</p>
              </div>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-10 bg-sky-50/50 rounded-lg border border-dashed border-sky-200">
              <div className="flex flex-col items-center">
                <Package className="h-12 w-12 text-sky-300 mb-3" />
                <p className="text-sky-700 font-medium">No se encontraron productos</p>
                {searchTerm ? (
                  <p className="text-sm text-sky-600/70 mt-1">Prueba con otros términos de búsqueda</p>
                ) : selectedCategory ? (
                  <p className="text-sm text-sky-600/70 mt-1">No hay productos en esta categoría</p>
                ) : (
                  <p className="text-sm text-sky-600/70 mt-1">Añade tu primer producto</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {paginatedProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock || 0);
                  return (
                    <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border rounded-xl hover:shadow-lg transition-all duration-200 hover:border-sky-200 bg-white gap-4">
                      {/* Product image + info */}
                      <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                          {loadingImages[product.id] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
                              <Loader2 className="h-5 w-5 text-sky-600 animate-spin" />
                            </div>
                          )}
                          <img
                            src={product.image}
                            alt={product.name}
                            className={cn(
                              "w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl shadow-md transition-opacity duration-300",
                              loadingImages[product.id] ? "opacity-0" : "opacity-100"
                            )}
                            onLoad={() => handleImageLoadEnd(product.id)}
                            onError={(e) => {
                              handleImageLoadEnd(product.id);
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                            onLoadStart={() => handleImageLoadStart(product.id)}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm sm:text-base leading-tight truncate">{product.name}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-0.5">{product.description}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <Badge variant="outline" className="font-medium bg-orange-50 text-orange-700 border-orange-200 text-[10px] sm:text-xs">
                              <span className="text-gray-400 mr-1">Cat:</span> {product.categoryName || product.category}
                            </Badge>
                            {product.subcategoryName && (
                              <Badge variant="outline" className="font-medium bg-blue-50 text-blue-700 border-blue-200 text-[10px] sm:text-xs">
                                {product.subcategoryName}
                              </Badge>
                            )}
                            <span className="text-sm font-bold text-green-600">
                              ${(product.price || 0).toLocaleString('es-CO')}
                            </span>
                            <Badge className={cn(
                              stockStatus.color,
                              "flex items-center gap-1 text-[10px] sm:text-xs"
                            )}>
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                stockStatus.text === "En Stock" ? "bg-green-400" :
                                  stockStatus.text === "Stock Bajo" ? "bg-yellow-400" :
                                    "bg-red-400"
                              )}></span>
                              {stockStatus.text}: {product.stock || 0}
                            </Badge>
                            <Badge className={cn(
                              "flex items-center gap-1 text-[10px] sm:text-xs",
                              product.isPublished !== false
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            )}>
                              <Eye className="h-3 w-3" />
                              {product.isPublished !== false ? "Publicado" : "No publicado"}
                            </Badge>
                            {product.updated_at && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 ml-2">
                                <CustomClock className="h-3 w-3 mr-1 opacity-70" />
                                {new Date(product.updated_at).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-auto flex-shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(product)}
                                className="hover:bg-blue-50 hover:border-blue-300 transition-colors text-blue-600"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="bg-blue-600">
                              <p className="text-xs">{liberta === "si" ? "Editar producto" : "Enviar cambios a revisión"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const slug = slugify(product.name || 'producto');
                                  const newWindow = window.open(`/producto/${slug}`, '_blank');
                                  newWindow?.focus();
                                }}
                                className="hover:bg-sky-50 hover:border-sky-300 transition-colors text-sky-600"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="bg-sky-600">
                              <p className="text-xs">Ver producto</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                {liberta === "si" ? "¿Eliminar producto?" : "¿Enviar solicitud de eliminación?"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {liberta === "si" ?
                                  `Esta acción es irreversible y eliminará el producto "${product.name}" del sistema.` :
                                  `Se enviará una solicitud para eliminar el producto "${product.name}" que requerirá aprobación del administrador.`
                                }
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(product.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {liberta === "si" ? "Eliminar" : "Enviar solicitud"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMoreProducts && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={loadMoreProducts}
                    variant="outline"
                    className="border-sky-200 text-sky-700 hover:bg-sky-50"
                    disabled={loadingMoreProducts}
                  >
                    {loadingMoreProducts ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Cargar más productos
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
