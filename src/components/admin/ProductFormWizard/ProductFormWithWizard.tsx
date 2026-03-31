import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Package, Edit, Trash2, Search, Plus, X, AlertTriangle, ShieldCheck,
  Loader2, Eye, Filter, ChevronDown, Tags, History, SlidersHorizontal, CreditCard,
  FileSpreadsheet, Download, LayoutGrid, ChevronLeft, ChevronRight, Star, Image as ImageIcon, MoreVertical
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { cn, parseFormattedPrice } from '@/lib/utils';


import { toast } from '@/hooks/use-toast';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ProductFormWizard } from './ProductFormWizard';
import { CustomClock } from '@/components/ui/CustomClock';
import { scrapeProduct } from '@/lib/api';
import { Sparkles, Wand2 } from 'lucide-react';

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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Globe, 
  Zap, 
  ChevronDown as ChevronDownIcon,
  Search as SearchIcon
} from 'lucide-react';



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
  onViewLibrary?: () => void;
}

export const ProductFormWithWizard: React.FC<ProductFormWithWizardProps> = ({
  selectedProductId,
  onProductSelected,
  onViewLibrary
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
  const [pendingImportProducts, setPendingImportProducts] = useState<any[]>([]);
  const [isImportView, setIsImportView] = useState(false);
  const [selectedImportCategory, setSelectedImportCategory] = useState<string>('');

  const [selectedImportBrand, setSelectedImportBrand] = useState<string>('');
  const [priceMarkup, setPriceMarkup] = useState<number>(0);
  const [selectedProductIndices, setSelectedProductIndices] = useState<Set<number>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [initialScrapedData, setInitialScrapedData] = useState<any>(null);
  const [showScrapeDialog, setShowScrapeDialog] = useState(false);
  const [scrapingLogs, setScrapingLogs] = useState<string[]>([]);
  const [scrapingTimer, setScrapingTimer] = useState(0);






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
          .select("*, suppliers(name)")
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
          supplierName: product.suppliers?.name || null
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
    setInitialScrapedData(null);
    fetchProducts();
    if (onProductSelected) {
      onProductSelected();
    }
  };


  const handleAddProduct = () => {
    setEditingProductId(null);
    setInitialScrapedData(null);
    setShowWizard(true);
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) {
      toast({ variant: 'destructive', title: 'URL requerida', description: 'Por favor ingresa una URL válida.' });
      return;
    }

    setIsScraping(true);
    setScrapingLogs(['🔍 Iniciando análisis de la URL...']);
    setScrapingTimer(0);
    
    // Contador de tiempo real
    const timerInterval = setInterval(() => {
      setScrapingTimer(prev => prev + 1);
    }, 1000);

    // Simulador de logs dinámico
    const logSteps = [
      '🤖 Iniciando motor de extracción ultra-rápido...',
      '🌐 Intentando conexión directa con APIs de la tienda...',
      '📂 Escaneando Índice de Sitemaps principal...',
      '⚡ Mapeando catálogo completo (esto puede tardar unos segundos)...',
      '🔗 Validando rutas de productos detectadas...',
      '📸 Localizando fuentes de imágenes en CDNs...',
      '📝 Preparando estructuración masiva de datos...',
      '⚖️ Calculando precios y normalizando campos...'
    ];

    let logIndex = 0;
    const logSimInterval = setInterval(() => {
      if (logIndex < logSteps.length) {
        setScrapingLogs(prev => [...prev, logSteps[logIndex]]);
        logIndex++;
      } else {
        setScrapingLogs(prev => {
          const lastLog = prev.length > 0 ? prev[prev.length - 1] : '';
          if (lastLog && lastLog.includes('analizando')) return prev;
          return [...prev, '⏳ Seguimos analizando el catálogo masivo, por favor mantén esta ventana abierta...'];
        });
      }
    }, 2500);

    try {
      const data = await scrapeProduct(scrapeUrl.trim());
      clearInterval(timerInterval);
      clearInterval(logSimInterval);
      
      setScrapingLogs(prev => [...prev, `✅ ¡Catálogo extraído! Se encontraron ${data.length} productos.`]);

      if (!data || data.length === 0) {
        toast({ variant: 'destructive', title: 'Sin resultados', description: 'No pudimos extraer información de esta URL. Intenta con otra.' });
        setScrapingLogs(prev => [...prev, '❌ Error: No se encontraron productos.']);
        return;
      }
      
      await new Promise(r => setTimeout(r, 1000));


      // Si recibimos múltiples productos de un dominio masivo
      if (data.length > 1) {
        const items = data.map((product: any) => ({
          name: product.name || 'Sin título',
          price: product.price ? parseFloat(product.price.toString().replace(/[^\d.]/g, '')) : 0,
          originalPrice: product.price ? parseFloat(product.price.toString().replace(/[^\d.]/g, '')) : 0,
          brand: '',
          reference: '',
          discountText: '',
          image: product.images && product.images.length > 0 ? product.images[0] : null,
          categoryId: '',
          description: product.description || ''
        }));

        setPendingImportProducts(items);
        setSelectedProductIndices(new Set(items.map((_, i) => i)));
        setIsImportView(true);
        setShowScrapeDialog(false);
        setScrapeUrl('');
        toast({ title: '📦 Importación Masiva', description: `Se encontraron ${items.length} productos listos para procesar.` });
        return;
      }

      const product = data[0]; 
      
      const normalizedData = {
        name: product.name || '',
        description: product.description || '',
        price: product.price ? product.price.toString() : '',
        originalPrice: product.price ? product.price.toString() : '',
        image: product.images && product.images.length > 0 ? product.images[0] : '',
        additionalImages: product.images && product.images.length > 1 
          ? [...product.images.slice(1), '', '', ''].slice(0, 3) 
          : ['', '', ''],
      };

      setInitialScrapedData(normalizedData);
      setEditingProductId(null);
      setShowWizard(true);
      setScrapeUrl('');
      setShowScrapeDialog(false);
      
      toast({ title: '✨ ¡Magia completada!', description: 'Hemos extraído la información y abierto el editor.', duration: 5000 });
    } catch (err: any) {
      clearInterval(logSimInterval);
      setScrapingLogs(prev => [...prev, `❌ Error: ${err.message}`]);
      toast({ variant: 'destructive', title: 'Error de extracción', description: err.message });
    } finally {
      setIsScraping(false);
    }
  };




  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log("🔵 [EXCEL] Iniciando importación de:", file.name);
    e.target.value = '';

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      console.log("🔵 [EXCEL] Buffer cargado, tamaño:", data.byteLength);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);
      console.log("✅ [EXCEL] Workbook cargado satisfactoriamente");

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error("No se pudo encontrar la primera hoja del Excel.");
      }
      console.log("🔵 [EXCEL] Hoja detectada:", worksheet.name);

      const rows: any[][] = [];
      worksheet.eachRow((row, rowNumber) => {
        const rowData: any[] = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          rowData[colNumber - 1] = cell.value;
        });
        rows[rowNumber - 1] = rowData;
      });
      console.log("🔵 [EXCEL] Filas totales detectadas:", rows.length);

      // Map images to rows/cols
      const imagesMap: { [key: string]: string } = {};
      const workbookImages = worksheet.getImages();
      console.log("🔵 [EXCEL] Imágenes encontradas en metadatos:", workbookImages.length);

      workbookImages.forEach((image: any, imgIdx: number) => {
        try {
          const imgData = workbook.model.media[image.imageId];
          if (imgData && imgData.buffer) {
            // Log first image structure to debug
            if (imgIdx === 0) {
              console.log("🔍 [EXCEL] Estructura de la primera imagen:", JSON.stringify({
                anchor: image.anchor,
                range: image.range,
                type: typeof image.anchor
              }, null, 2));
            }

            const base64 = typeof window !== 'undefined' ?
              btoa(new Uint8Array(imgData.buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')) :
              Buffer.from(imgData.buffer).toString('base64');

            const dataUrl = `data:image/${imgData.extension};base64,${base64}`;

            let row = -1;
            const anchor = image.anchor;

            if (anchor) {
              if (typeof anchor.nativeRow === 'number') row = anchor.nativeRow;
              else if (anchor.from && typeof anchor.from.row === 'number') row = anchor.from.row;
              else if (typeof anchor.row === 'number') row = anchor.row;
            }

            if (row !== -1) {
              imagesMap[row] = dataUrl;
              if (imgIdx < 5) {
                console.log(`✅ [EXCEL] Imagen ${imgIdx} -> Fila ${row}`);
              }
            } else {
              console.warn(`⚠️ [EXCEL] Imagen ${imgIdx} sin fila.`, image.anchor);
            }
          }
        } catch (imgErr) {
          console.error(`❌ [EXCEL] Error imagen ${imgIdx}:`, imgErr);
        }
      });
      console.log(`📊 [EXCEL] Filas únicas con imágenes vinculadas: ${Object.keys(imagesMap).length}`);
      console.log("📌 [EXCEL] Listado de algunas filas con imagen:", Object.keys(imagesMap).slice(0, 10).join(", "));

      let nameIdx = -1, priceIdx = -1, brandIdx = -1, refIdx = -1, discountIdx = -1, imageColIdx = -1;
      let startIdx = 0;

      // Detection
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const row = rows[i];
        if (!row || !row.length) continue;

        let foundHeaders = false;
        row.forEach((cell, idx) => {
          const val = String(cell || '').toLowerCase().trim();
          if (val.includes('descripción') || val.includes('description') || val === 'nombre') nameIdx = idx;
          if (val === 'precio' || val === 'price' || val === 'valor') priceIdx = idx;
          if (val === 'marca' || val === 'brand') brandIdx = idx;
          if (val === 'referencia' || val === 'ref' || val === 'referencia') refIdx = idx;
          if (val === 'descuento' || val === 'discount') discountIdx = idx;
          if (val === 'imagen' || val === 'image' || val === 'foto') imageColIdx = idx;

          if (nameIdx !== -1 || priceIdx !== -1) foundHeaders = true;
        });

        if (foundHeaders) {
          console.log(`🎯 [EXCEL] Fila ${i} detectada como encabezado.`, { nameIdx, priceIdx, brandIdx, refIdx, discountIdx, imageColIdx });
          startIdx = i + 1;
          break;
        }
      }

      if (nameIdx === -1) {
        console.warn("⚠️ [EXCEL] No se detectó columna de nombre, usando col 0");
        nameIdx = 0;
      }
      if (priceIdx === -1) {
        console.warn("⚠️ [EXCEL] No se detectó columna de precio, usando col 1");
        priceIdx = 1;
      }

      const items: any[] = [];
      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[nameIdx]) continue;

        const name = String(row[nameIdx]).trim();
        const rawPrice = row[priceIdx];
        const cleanPrice = String(rawPrice ?? '').replace(/[\$\s\.]/g, '').replace(',', '.').trim();
        const price = parseFormattedPrice(cleanPrice);
        const brandRaw = brandIdx !== -1 ? String(row[brandIdx] || '').trim() : '';
        const reference = refIdx !== -1 ? String(row[refIdx] || '').trim() : '';
        const discountStr = discountIdx !== -1 ? String(row[discountIdx] || '').trim() : '';

        // Take embedded image if it exists in this row, otherwise try to detect URL if column exists
        // Sometimes anchor is exactly on the row, sometimes it spans multiple. We check row i.
        let itemImage = imagesMap[i] || null;

        // Try a small fuzzy match if not found exactly (common when images are slightly misaligned)
        if (!itemImage) itemImage = imagesMap[i - 1] || imagesMap[i + 1] || null;

        if (!itemImage && imageColIdx !== -1 && row[imageColIdx]) {
          const maybeUrl = String(row[imageColIdx]).trim();
          if (maybeUrl.startsWith('http')) {
            itemImage = maybeUrl;
          }
        }

        if (itemImage) {
          // console.log(`🖼️ [EXCEL] Producto "${name}" (Fila ${i}) vinculado a imagen.`);
        } else if (i < startIdx + 5) {
          console.log(`❓ [EXCEL] Producto "${name}" (Fila ${i}) NO tiene imagen.`);
        }

        items.push({
          name,
          price: isNaN(price) || !isFinite(price) ? 0 : price,
          originalPrice: isNaN(price) || !isFinite(price) ? 0 : price,
          brand: brandRaw,
          reference,
          discountText: discountStr,
          image: itemImage,
          categoryId: ''
        });
      }

      console.log(`✅ [EXCEL] Importación terminada. ${items.length} productos listos para previsualización.`);

      if (items.length === 0) {
        toast({
          variant: "destructive",
          title: "Archivo vacío",
          description: "No se encontraron filas con nombre y precio."
        });
        setImporting(false);
        return;
      }

      setPendingImportProducts(items);
      setSelectedProductIndices(new Set(items.map((_, i) => i)));
      setIsImportView(true);
    } catch (err: any) {
      console.error("❌ [EXCEL] Error crítico procesando Excel:", err);
      toast({
        variant: "destructive",
        title: "Error al leer archivo",
        description: err?.message || "No se pudo procesar el archivo Excel."
      });
    } finally {
      setImporting(false);
    }
  };



  const handleBulkAssign = () => {
    if (!selectedImportCategory && !selectedImportBrand) {
      toast({ title: "Atención", description: "Selecciona una categoría o ingresa una marca para asignar." });
      return;
    }

    setPendingImportProducts(prev => prev.map((item, idx) => {
      if (!selectedProductIndices.has(idx)) return item;
      return {
        ...item,
        categoryId: selectedImportCategory || item.categoryId,
        brand: selectedImportBrand || item.brand
      };
    }));

    toast({
      title: "Ajustes aplicados",
      description: `Se actualizaron ${selectedProductIndices.size} productos.`
    });
  };


  const handleToggleSelect = (index: number) => {
    setSelectedProductIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedProductIndices.size === pendingImportProducts.length) {
      setSelectedProductIndices(new Set());
    } else {
      setSelectedProductIndices(new Set(pendingImportProducts.map((_, i) => i)));
    }
  };

  const handleConfirmImport = async () => {
    const unassignedCount = pendingImportProducts.filter(p => !p.categoryId).length;
    if (unassignedCount > 0) {
      toast({
        variant: "destructive",
        title: "Productos sin categoría",
        description: `Quedan ${unassignedCount} productos sin categoría asignada.`
      });
      return;
    }

    setImporting(true);
    try {
      if (!isSupabase) {
        toast({ variant: "destructive", title: "Error", description: "Importar requiere Supabase." });
        return;
      }

      const payloads = pendingImportProducts.map(item => {
        const category = categories.find(c => c.id === item.categoryId);
        // Calculate final price with markup
        const finalPrice = Math.round(item.price * (1 + (priceMarkup / 100)));

        return {
          name: item.name,
          description: item.discountText ? `Nota de descuento: ${item.discountText}` : null,
          price: finalPrice,
          original_price: finalPrice,
          image: item.image || null,
          additional_images: [],
          category: item.categoryId,
          category_id: item.categoryId,
          category_name: category?.name || "General",
          subcategory: null,
          subcategory_name: null,
          tercera_categoria: null,
          tercera_categoria_name: null,
          stock: 1,
          is_published: true,
          is_offer: item.discountText ? true : false,
          discount: 0,
          specifications: [
            { name: "Referencia", value: item.reference || "N/A" },
            { name: "Marca Original", value: item.brand || "N/A" }
          ],
          brand: item.brand || selectedImportBrand,
          benefits: [],
          warranties: [],
          payment_methods: [],
          colors: [],
          created_by: user?.email || "import",
          last_modified_by: user?.email || "import",
        };
      });



      console.log(`🚀 [IMPORT] Preparando payload para ${payloads.length} productos.`);
      console.log("🔍 [IMPORT] Muestra del primer payload:", JSON.stringify(payloads[0], null, 2));

      const { error } = await (db as any)
        .from("products")
        .insert(payloads);

      if (error) throw error;

      toast({
        title: "Importación completada",
        description: `Se crearon ${pendingImportProducts.length} productos correctamente.`
      });
      setIsImportView(false);
      setPendingImportProducts([]);
      fetchProducts();

    } catch (err: any) {
      console.error("Error importing Excel:", err);
      toast({
        variant: "destructive",
        title: "Error al importar",
        description: err?.message || "No se pudo guardar los productos."
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
          initialData={initialScrapedData}
          onProductSelected={handleWizardClose}
          categories={categories}
          user={user}
          liberta={liberta}
        />

      </div>
    );
  }

  if (isImportView) {
    const allAssigned = pendingImportProducts.length > 0 && pendingImportProducts.every(p => p.categoryId);
    const assignedCount = pendingImportProducts.filter(p => p.categoryId).length;
    const pendingCount = pendingImportProducts.length - assignedCount;

    return (
      <div className="flex flex-col h-full bg-white -mx-6 -mt-6" style={{ minHeight: '100vh' }}>
        {/* TOP BAR / HEADER */}
        <div className="flex flex-col border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsImportView(false)}
                className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">Configurar Importación</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 uppercase tracking-wider">Paso Final</span>
                  <p className="text-xs text-slate-400">Excel procesado: {pendingImportProducts.length} productos detectados</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end mr-4">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progreso:</span>
                  <span className="text-xs font-black text-slate-700">{assignedCount} / {pendingImportProducts.length}</span>
                </div>
                <div className="w-32 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${(assignedCount / pendingImportProducts.length) * 100}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => setIsImportView(false)}
                className="text-sm text-slate-500 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors font-medium"
              >
                Cancelar
              </button>
              <Button
                disabled={!allAssigned || importing}
                onClick={handleConfirmImport}
                className="h-10 px-6 bg-green-600 hover:bg-green-700 text-white font-black rounded-lg shadow-lg shadow-green-100 transition-all active:scale-95 flex items-center gap-2"
              >
                {importing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                GUARDAR CAMBIOS ({pendingImportProducts.length})
              </Button>
            </div>
          </div>

          {/* CONTROLS ROW */}
          <div className="px-6 py-3 bg-slate-50/50 flex flex-wrap items-end gap-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">📦 Categoría Destino</label>
              <select
                value={selectedImportCategory}
                onChange={(e) => setSelectedImportCategory(e.target.value)}
                className="h-10 w-64 text-sm px-4 border-2 border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-bold text-slate-700 shadow-sm"
              >
                <option value="">-- Elige Categoría --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">🏷️ Marca / Referencia</label>
              <Input
                value={selectedImportBrand}
                onChange={(e) => setSelectedImportBrand(e.target.value)}
                placeholder="Ej: Hyundai, Kia..."
                className="h-10 w-48 text-sm border-2 border-slate-200 rounded-xl font-bold placeholder:font-medium shadow-sm focus-visible:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">📈 Ganancia (%)</label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  value={priceMarkup}
                  onChange={(e) => setPriceMarkup(Number(e.target.value))}
                  className="h-10 w-28 text-sm border-2 border-slate-200 rounded-xl pr-8 font-black text-orange-600 shadow-sm focus-visible:ring-orange-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
              </div>
            </div>

            <Button
              disabled={(!selectedImportCategory && !selectedImportBrand) || selectedProductIndices.size === 0}
              onClick={handleBulkAssign}
              className="h-10 px-6 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:grayscale"
            >
              ASIGNAR A SELECCIONADOS ({selectedProductIndices.size})
            </Button>

            <div className="flex-1 flex justify-end pb-1 px-4">
              <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 font-bold py-1.5 px-3 rounded-lg shadow-sm">
                Tip: Selecciona productos abajo para aplicar ajustes
              </Badge>
            </div>
          </div>
        </div>

        {/* TABLE BODY */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-sm border-collapse min-w-[1000px]">
            <thead className="bg-[#f8fafc] border-b border-slate-200 sticky top-0 z-20">
              <tr>
                <th className="w-14 px-6 py-4">
                  <Checkbox
                    checked={selectedProductIndices.size === pendingImportProducts.length && pendingImportProducts.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="h-5 w-5 border-2 border-slate-300 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                  />
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">Producto / Referencia</th>
                <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">Marca/Filtro</th>
                <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Precio Excel</th>
                <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Final (+{priceMarkup}%)</th>
                <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">Estado / Categoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingImportProducts.map((item, idx) => {
                const finalPrice = Math.round((item.price || 0) * (1 + priceMarkup / 100));
                const isSelected = selectedProductIndices.has(idx);
                const isAssigned = !!item.categoryId;
                const cat = categories.find(c => c.id === item.categoryId);

                return (
                  <tr
                    key={idx}
                    onClick={() => handleToggleSelect(idx)}
                    className={cn(
                      "cursor-pointer transition-all hover:bg-slate-50 border-l-4",
                      isSelected ? "bg-orange-50/40 border-l-orange-500" : "border-l-transparent",
                      !isAssigned && "bg-red-50/10"
                    )}
                  >
                    <td className="w-14 px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelect(idx)}
                        className="h-5 w-5 border-2 border-slate-300 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3 max-w-xl">
                        {/* Miniatura de la imagen */}
                        <div className="h-10 w-10 shrink-0 bg-slate-100 rounded-md overflow-hidden border border-slate-200">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt="preview"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error';
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-slate-300" />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-xs uppercase leading-tight tracking-tight group-hover:text-orange-600 transition-colors">{item.name}</span>
                          <div className="flex items-center gap-3 mt-1.5">
                            <Badge variant="secondary" className="bg-slate-100 text-[10px] font-mono font-black text-slate-500 border-none px-2 rounded">
                              REF: {item.reference || 'N/A'}
                            </Badge>
                            {item.discountText && (
                              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 rounded py-0.5 border border-blue-100 uppercase">
                                {item.discountText}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {item.brand ? (
                        <Badge variant="outline" className="text-xs font-bold text-slate-600 border-slate-200 bg-white shadow-sm rounded-lg px-3 py-1">
                          {item.brand}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">No especificada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs text-slate-400 font-bold font-mono tracking-tighter">${(item.price || 0).toLocaleString('es-CO')}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-base font-black text-green-600 font-mono tracking-tighter">${finalPrice.toLocaleString('es-CO')}</span>
                        {priceMarkup > 0 && (
                          <span className="text-[9px] font-bold text-orange-500">Margin +{priceMarkup}%</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {isAssigned ? (
                          <Badge className="bg-green-600 text-white border-none px-4 py-1 font-black text-[10px] uppercase rounded-lg shadow-md shadow-green-100 tracking-wider">
                            {cat?.name}
                          </Badge>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter bg-red-50 border border-red-200 px-3 py-1 rounded-lg animate-pulse">
                              PENDIENTE
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] -mt-6 -mx-6 bg-[#F8FAFB]">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filtros</h2>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setSelectedCategory(''); setSearchTerm(''); }}>
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <div className="space-y-2">
               <Label className="text-[11px] font-bold text-slate-700 uppercase">Buscar en catálogo</Label>
               <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input 
                    placeholder="Ejem: Motor..." 
                    className="h-8 pl-8 text-xs bg-slate-50 border-slate-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-700 uppercase">Categorías</Label>
              <div className="space-y-1">
                <button 
                  onClick={() => setSelectedCategory('')}
                  className={cn(
                    "w-full text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-between",
                    !selectedCategory ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Todas</span>
                  </div>
                </button>
                {categories.filter(c => !c.parentId).map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-between",
                      selectedCategory === cat.id ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Tags className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[120px]">{cat.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-700 uppercase">Ordenar</Label>
              <select 
                className="w-full h-8 text-xs bg-slate-50 border-slate-200 rounded px-2"
                value={sortOrder}
                onChange={(e: any) => setSortOrder(e.target.value)}
              >
                <option value="recent">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="price-high">Precio: Alto a Bajo</option>
                <option value="price-low">Precio: Bajo a Alto</option>
              </select>
            </div>
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              Inventario <span className="text-blue-600 font-mono tracking-tight font-light lowercase">({sortedProducts.length})</span>
            </h1>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
              <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-100 font-bold px-3 py-1">
                Total: {sortedProducts.length}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowScrapeDialog(true)}
              variant="outline"
              size="sm"
              className="h-8 border-[#00A09D]/20 bg-[#00A09D]/5 text-[#00A09D] font-black uppercase text-[10px]"
            >
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              IA Import
            </Button>
            <Button
              onClick={handleAddProduct}
              className="h-8 bg-[#00A09D] hover:bg-[#00817e] text-white font-black uppercase text-[10px] px-6"
            >
              CREAR PRODUCTO
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleExportExcel}>
               <Download className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
           {loadingProducts ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                 <Loader2 className="h-10 w-10 animate-spin text-[#00A09D]" />
                 <p className="text-xs font-black text-slate-400 capitalize">Cargando catálogo...</p>
              </div>
           ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                       <tr>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Producto</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Categoría</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Precio</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {paginatedProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                             <td className="px-6 py-3">
                                <div className="flex items-center gap-3">
                                   <div className="h-10 w-10 shrink-0 bg-slate-50 rounded border border-slate-100 overflow-hidden">
                                      <img src={product.image} className="w-full h-full object-contain" />
                                   </div>
                                   <div className="min-w-0">
                                      <div className="text-[11px] font-black text-slate-800 uppercase tracking-tighter truncate max-w-[250px]">{product.name}</div>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-3">
                                <Badge variant="outline" className="text-[9px] font-black uppercase text-slate-500 bg-white border-slate-200">
                                   {product.categoryName || 'General'}
                                </Badge>
                             </td>
                             <td className="px-6 py-3 font-mono text-[11px] font-black text-slate-700">
                                ${(product.price || 0).toLocaleString('es-CO')}
                             </td>
                             <td className="px-6 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                   <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#00A09D]" onClick={() => handleEdit(product)}>
                                      <Edit className="h-4 w-4" />
                                   </Button>
                                   <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => handleDelete(product.id)}>
                                      <Trash2 className="h-4 w-4" />
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
              <div className="flex justify-center py-6">
                 <Button onClick={loadMoreProducts} variant="ghost" className="text-[#00A09D] font-black uppercase text-[10px]">
                    Cargar más resultados
                 </Button>
              </div>
           )}
        </div>
      </main>

      <Dialog open={showScrapeDialog} onOpenChange={setShowScrapeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              IA Importación
            </DialogTitle>
            <DialogDescription>
              Introduce la URL de un producto o tienda para extraer datos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="https://tienda.com/producto" 
              value={scrapeUrl} 
              onChange={(e) => setScrapeUrl(e.target.value)} 
              disabled={isScraping}
            />
          </div>
          {isScraping && (
             <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                   <Loader2 className="h-3 w-3 animate-spin" />
                   Escanenado sitio...
                </div>
                <div className="h-32 overflow-y-auto font-mono text-[9px] text-slate-600">
                   {scrapingLogs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
             </div>
          )}
          <DialogFooter>
            <Button onClick={handleScrape} disabled={isScraping || !scrapeUrl}>
              {isScraping ? 'Extrayendo...' : 'Comenzar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
