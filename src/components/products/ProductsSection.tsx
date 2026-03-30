import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown, Truck, CircleDollarSign, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { NewProductsCarousel } from './NewProductsCarousel';
import { GenericProductCarousel } from './GenericProductCarousel';
import { BestSellerCard } from './BestSellerCard';
import { QuoteBanner } from './QuoteBanner';
import { FilterSidebar } from './FilterSidebar';
import { HomeCategoryGrid } from '@/components/home/HomeCategoryGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/contexts/CartContext';
import { useCategories } from '@/hooks/use-categories';
import { useFilters } from '@/hooks/use-filters';
import { fetchProducts as fetchProductsApi } from '@/lib/api';
import { parseFormattedPrice } from '@/lib/utils';
import { HomeBanners } from '@/components/home/HomeBanners';
import { ProductCardSkeleton } from './ProductCardSkeleton';

interface ProductsSectionProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  setCategories: (cats: string[]) => void;
  initialSearchTerm?: string;
  showCatalog?: boolean;
  setShowCatalog?: (show: boolean) => void;
}

function extractMlFromProduct(p: Product): number[] {
  const out: number[] = [];
  const text = [p.name, p.description, JSON.stringify(p.specifications || [])].join(' ').toLowerCase();
  const patterns: { ml: number; re: RegExp }[] = [
    { ml: 2.5, re: /(?:^|[^\d])(?:2[,.]5|2\.5)\s*ml|ml\s*(?:2[,.]5|2\.5)/i },
    { ml: 5, re: /(?:^|[^\d])5\s*ml|ml\s*5(?:[^\d]|$)/i },
    { ml: 10, re: /(?:^|[^\d])10\s*ml|ml\s*10(?:[^\d]|$)/i },
    { ml: 30, re: /(?:^|[^\d])30\s*ml|ml\s*30(?:[^\d]|$)/i },
    { ml: 100, re: /(?:^|[^\d])100\s*ml|ml\s*100(?:[^\d]|$)/i },
  ];
  for (const { ml, re } of patterns) {
    if (re.test(text)) out.push(ml);
  }
  return out;
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({
  selectedCategory,
  setSelectedCategory,
  setCategories,
  initialSearchTerm = '',
  showCatalog = false,
  setShowCatalog = () => { },
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [sortBy, setSortBy] = useState('relevance');
  const [products, setProducts] = useState<Product[]>([]);
  const { getCategoryByName, getBreadcrumbPath, categoriesData } = useCategories();
  const { filters, loading: filtersLoading } = useFilters();
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = React.useTransition();
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceFrom, setPriceFrom] = useState<string>('');
  const [priceTo, setPriceTo] = useState<string>('');
  const [priceApplied, setPriceApplied] = useState<{ from: number; to: number } | null>(null);

  const [selectedFilterOptions, setSelectedFilterOptions] = useState<{ [filterId: string]: string[] }>({});
  const [showAllForFilter, setShowAllForFilter] = useState<{ [filterId: string]: boolean }>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24); // Aumentamos para mejor UX inicial

  useEffect(() => {
    setSearchTerm(initialSearchTerm || '');
    setShowCatalog(false);
    setCurrentPage(1);
  }, [initialSearchTerm, selectedCategory]);

  const [totalProducts, setTotalProducts] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [offerProducts, setOfferProducts] = useState<Product[]>([]);

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const offset = (currentPage - 1) * itemsPerPage;

      const selectedSort = sortBy === 'relevance' ? 'id' : 
                           sortBy === 'price-asc' ? 'price' : 
                           sortBy === 'price-desc' ? 'price' : 
                           sortBy === 'name' ? 'name' : 'updated_at'; // newest case
      
      const selectedOrder = (sortBy === 'price-asc' || sortBy === 'relevance' || sortBy === 'name') ? 'asc' : 'desc';

      const { products: fetchedProducts, total } = await fetchProductsApi({
        limit: itemsPerPage,
        offset: offset,
        category_name: selectedCategory === 'Todos' ? undefined : selectedCategory,
        search: searchTerm,
        sort: selectedSort,
        order: selectedOrder
      });

      startTransition(() => {
        setProducts(fetchedProducts);
        setTotalProducts(total);
      });
    } catch (e) {
      console.error("Error cargando productos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, sortBy, itemsPerPage]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, itemsPerPage, selectedCategory, debouncedSearchTerm, sortBy]);

  useEffect(() => {
    // Solo cargar los destacados/ofertas una vez (o por refresh forzado)
    const loadSecondaryData = async () => {
      try {
        const [featured, offers] = await Promise.all([
          import('@/lib/api').then(api => api.fetchFeatured(20)),
          import('@/lib/api').then(api => api.fetchOffers(12))
        ]);
        setFeaturedProducts(featured);
        setOfferProducts(offers);
      } catch (e) {
        console.warn("Secondary data load failed", e);
      }
    };
    loadSecondaryData();
  }, []);

  const baseFiltered = useMemo(() => {
    // Los productos ya vienen filtrados por categoría y búsqueda desde el servidor.
    return products;
  }, [products]);

  const brandCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of baseFiltered) {
      const b = (p as any).brand ? String((p as any).brand).trim() : '';
      if (b) map[b] = (map[b] || 0) + 1;
    }
    return map;
  }, [baseFiltered]);

  const uniqueBrands = useMemo(() => Object.keys(brandCounts).sort(), [brandCounts]);

  const getProductFilterOptions = (product: Product): { [filterId: string]: string[] } => {
    try {
      // 1. Priorizar propiedades directas si existen
      if (product.filterOptions && typeof product.filterOptions === 'object') {
        return product.filterOptions;
      }
      if (product.filter_options && typeof product.filter_options === 'object') {
        return product.filter_options;
      }

      // 2. Buscar en specifications
      let specs = product.specifications;
      if (typeof specs === 'string') {
        try {
          specs = JSON.parse(specs);
        } catch (e) {
          specs = [];
        }
      }

      if (Array.isArray(specs)) {
        // Buscar desde el final para obtener el más reciente en caso de duplicados
        const filterOptionsSpec = [...specs].reverse().find((s: any) => s.name === '_filter_options');
        if (filterOptionsSpec?.value) {
          return JSON.parse(filterOptionsSpec.value);
        }
      }
    } catch (e) {
      console.warn("Error parsing specs for product:", product.id, e);
    }
    return {};
  };

  const filterOptionCounts = useMemo(() => {
    const counts: { [filterId: string]: { [optionId: string]: number } } = {};
    filters.forEach(f => {
      counts[f.id] = {};
      f.options.forEach(o => counts[f.id][o.id] = 0);
    });
    baseFiltered.forEach(p => {
      const pFilters = getProductFilterOptions(p);
      filters.forEach(f => {
        (pFilters[f.id] || []).forEach(optId => {
          if (counts[f.id][optId] !== undefined) counts[f.id][optId]++;
        });
      });
    });
    return counts;
  }, [baseFiltered, filters]);

  const filteredAndSortedProducts = useMemo(() => {
    let list = baseFiltered.filter((p) => {
      if (selectedBrands.length && !selectedBrands.includes(String((p as any).brand || ''))) return false;
      if (priceApplied) {
        if (p.price < priceApplied.from || p.price > priceApplied.to) return false;
      }
      for (const [fId, opts] of Object.entries(selectedFilterOptions)) {
        if (opts.length && !opts.some(o => (getProductFilterOptions(p)[fId] || []).includes(o))) return false;
      }
      return true;
    });
    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [baseFiltered, selectedBrands, priceApplied, selectedFilterOptions, sortBy]);

  const carouselGroups = useMemo(() => {
    return {
      productos1: featuredProducts.slice(0, 20),
      productos2: featuredProducts.slice(20, 40),
      ofertas: offerProducts.slice(0, 4)
    };
  }, [featuredProducts, offerProducts]);

  const paginatedProducts = useMemo(() => {
    // Los productos ya vienen paginados desde el servidor.
    return filteredAndSortedProducts;
  }, [filteredAndSortedProducts]);

  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  useEffect(() => {
    if (showCatalog || currentPage > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showCatalog, currentPage]);

  const toggleBrand = (b: string) => setSelectedBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  const toggleFilterOption = (fId: string, oId: string) => {
    setSelectedFilterOptions(prev => {
      const current = prev[fId] || [];
      return { ...prev, [fId]: current.includes(oId) ? current.filter(x => x !== oId) : [...current, oId] };
    });
  };

  const applyPrice = () => {
    const from = parseFormattedPrice(priceFrom) || 0;
    const to = parseFormattedPrice(priceTo) || 999999999;
    setPriceApplied({ from, to });
  };

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setPriceFrom(''); setPriceTo(''); setPriceApplied(null);
    setSelectedFilterOptions({});
  };

  const isFiltering = useMemo(() => {
    return searchTerm.trim() !== '' ||
      selectedBrands.length > 0 ||
      priceApplied !== null ||
      Object.values(selectedFilterOptions).some(opts => opts.length > 0) ||
      selectedCategory !== 'Todos';
  }, [searchTerm, selectedBrands, priceApplied, selectedFilterOptions, selectedCategory]);

  // Sync state with global events for the mobile drawer
  useEffect(() => {
    const handleGlobalFilterChange = (e: any) => {
      const { type, payload } = e.detail;
      if (type === 'toggleOption') toggleFilterOption(payload.fId, payload.oId);
      if (type === 'applyPrice') {
        setPriceFrom(payload.from);
        setPriceTo(payload.to);
        setPriceApplied({ from: parseFormattedPrice(payload.from) || 0, to: parseFormattedPrice(payload.to) || 999999999 });
      }
      if (type === 'setFilters') {
        setSelectedFilterOptions(payload);
        setCurrentPage(1);
      }
      if (type === 'clear') clearAllFilters();
    };

    window.addEventListener('app:filter-change', handleGlobalFilterChange);

    // Periodically notify global listeners about current filter state
    const timer = setInterval(() => {
      window.dispatchEvent(new CustomEvent('app:filter-state', {
        detail: {
          filters,
          filtersLoading,
          selectedFilterOptions,
          filterOptionCounts,
          priceFrom,
          priceTo
        }
      }));
    }, 1000);

    return () => {
      window.removeEventListener('app:filter-change', handleGlobalFilterChange);
      clearInterval(timer);
    };
  }, [filters, filtersLoading, selectedFilterOptions, filterOptionCounts, priceFrom, priceTo]);

  // Sidebar is now handled via pure CSS sticky for stability

  return (
    <section id="productos" className={`${(isFiltering || showCatalog) ? 'pt-2 pb-8' : 'py-8'} bg-white w-full max-w-[1400px] mx-auto px-4 md:px-8 min-h-screen`}>
      <div className="flex flex-col md:flex-row gap-10">
        {/* Placeholder — reserves sidebar space; position:relative lets absolute child anchor here */}
        {(isFiltering || showCatalog) && (
          <aside className="w-full md:w-64 flex-shrink-0 hidden md:block">
            <div className="sticky top-[75px] max-h-[calc(100vh-100px)] relative group/sidebar">
              {/* Scroll Up Indicator */}
              <button
                id="sidebar-scroll-indicator-up"
                onClick={() => {
                  const container = document.getElementById('sidebar-scroll-container');
                  if (container) container.scrollBy({ top: -200, behavior: 'smooth' });
                }}
                className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border border-neutral-100 rounded-full flex items-center justify-center shadow-lg text-[#ba181b] transition-all duration-300 z-30 hover:scale-110 active:scale-95 opacity-0 pointer-events-none"
                title="Subir"
              >
                <ChevronDown className="w-4 h-4 rotate-180" strokeWidth={3} />
              </button>

              <div
                id="sidebar-scroll-container"
                className="overflow-y-auto scrollbar-hide pr-1 max-h-[calc(100vh-100px)] pt-8 pb-10"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const isBottom = Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 10;
                  const isTop = el.scrollTop < 10;

                  const indicatorDown = document.getElementById('sidebar-scroll-indicator-down');
                  const indicatorUp = document.getElementById('sidebar-scroll-indicator-up');

                  if (indicatorDown) {
                    indicatorDown.style.opacity = isBottom ? '0' : '1';
                    indicatorDown.style.pointerEvents = isBottom ? 'none' : 'auto';
                  }
                  if (indicatorUp) {
                    indicatorUp.style.opacity = isTop ? '0' : '1';
                    indicatorUp.style.pointerEvents = isTop ? 'none' : 'auto';
                  }
                }}
              >
                <FilterSidebar
                  filters={filters}
                  filtersLoading={filtersLoading}
                  selectedFilterOptions={selectedFilterOptions}
                  toggleFilterOption={toggleFilterOption}
                  filterOptionCounts={filterOptionCounts}
                  priceFrom={priceFrom}
                  setPriceFrom={setPriceFrom}
                  priceTo={priceTo}
                  setPriceTo={setPriceTo}
                  applyPrice={applyPrice}
                  className="w-full"
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                />
              </div>

              {/* Scroll Down Indicator */}
              <button
                id="sidebar-scroll-indicator-down"
                onClick={() => {
                  const container = document.getElementById('sidebar-scroll-container');
                  if (container) container.scrollBy({ top: 200, behavior: 'smooth' });
                }}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border border-neutral-100 rounded-full flex items-center justify-center shadow-lg text-[#ba181b] animate-bounce transition-all duration-300 z-30 hover:scale-110 active:scale-95"
                style={{ opacity: filtersLoading ? 0 : 1 }}
                title="Bajar"
              >
                <ChevronDown className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>
          </aside>
        )}

        <div className="flex-1 min-w-0">
          {/* Vista inicial Limpia - Solo Carrusel de novedades y luego el Grid */}
          {!isFiltering && !showCatalog && (
            <div className="mb-12">
              <NewProductsCarousel />
            </div>
          )}

          {/* Breadcrumbs */}
          {(isFiltering || showCatalog) && (
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-8 text-gray-400">
              <span className="text-red-500 cursor-pointer hover:underline" onClick={() => setSelectedCategory("Todos")}>Home</span>
              {getBreadcrumbPath(selectedCategory).slice(1).map((part, i) => (
                <React.Fragment key={i}>
                  <ChevronRight className="w-3 h-3" />
                  <span className={i === getBreadcrumbPath(selectedCategory).slice(1).length - 1 ? 'text-black' : 'text-red-500 cursor-pointer hover:underline'} onClick={() => setSelectedCategory(part)}>
                    {part}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b gap-4">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold uppercase text-gray-400 whitespace-nowrap">Ordenar por:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-9 border rounded-none shadow-none focus:ring-0 font-bold text-[12px] text-gray-700">
                    <SelectValue placeholder="Orden por defecto" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-gray-200">
                    <SelectItem value="relevance">Orden por defecto (Mezcla)</SelectItem>
                    <SelectItem value="name">Alfabético</SelectItem>
                    <SelectItem value="price-asc">Menor precio</SelectItem>
                    <SelectItem value="price-desc">Mayor precio</SelectItem>
                    <SelectItem value="newest">Más recientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold uppercase text-gray-400 whitespace-nowrap">Mostrar:</span>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
                >
                  <SelectTrigger className="w-[70px] h-9 border rounded-none shadow-none focus:ring-0 font-bold text-[12px] text-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-gray-200">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="48">48</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1 border-l pl-6 border-gray-100">
                <button className="p-2 text-black bg-gray-50 border border-gray-200">
                  <Search className="w-4 h-4" strokeWidth={3} />
                </button>
                <button className="p-2 text-gray-400 hover:text-black border border-transparent">
                  <div className="grid grid-cols-3 gap-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <div key={i} className="w-1 h-1 bg-current" />)}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12">
              {Array.from({ length: itemsPerPage || 10 }).map((_, i) => (
                <div key={i} className="animate-in fade-in duration-500">
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div className={`space-y-16 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
              <motion.div
                layout
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12"
              >
                <AnimatePresence mode="popLayout">
                  {/* Si es vista de inicio (sin filtros ni catálogo), mostramos solo 8 para una vista más limpia */}
                  {((!isFiltering && !showCatalog) ? paginatedProducts.slice(0, 8) : paginatedProducts).map((p, idx) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        duration: 0.4,
                        delay: Math.min(idx % 24 * 0.05, 0.5),
                        ease: "easeOut"
                      }}
                    >
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Trust Bar Section */}
              {!isFiltering && !showCatalog && (
                <div className="mb-14 grid grid-cols-1 md:grid-cols-3 bg-gray-50/50 rounded-xl overflow-hidden border border-gray-100">
                  <div className="flex items-center gap-4 p-6 border-b md:border-b-0 md:border-r border-gray-100">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-red-500">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase leading-tight">Envío gratis ↑ $60.000</h4>
                      <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">Más de 1000 autopartes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-6 border-b md:border-b-0 md:border-r border-gray-100">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-red-500">
                      <CircleDollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase leading-tight">Autopartes y repuestos</h4>
                      <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">Genéricos / Homologada para todas las marcas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-6">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-red-500">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase leading-tight">Pago y envío 100% seguro</h4>
                      <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">A toda Colombia</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Allied Brands Section */}
              {!isFiltering && !showCatalog && (
                <div className="mb-16">
                  <div className="professional-header">
                    <h2>Marcas</h2>
                  </div>

                  <div className="relative group/marcas pb-10 w-full overflow-hidden">
                    {/* Navigation Buttons */}
                    <button
                      onClick={() => {
                        const container = document.getElementById('brands-scroll-container');
                        if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                      }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-lg text-red-500 opacity-0 group-hover/marcas:opacity-100 transition-opacity hidden md:flex"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div
                      id="brands-scroll-container"
                      className="grid grid-cols-2 place-items-center gap-y-10 gap-x-6 py-8 px-4 md:py-4 md:flex md:items-center md:justify-start md:gap-x-12 md:overflow-x-auto scrollbar-hide scroll-smooth w-full"
                    >
                      {[
                        { name: 'Chevrolet', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Chevrolet-logo.png/1200px-Chevrolet-logo.png', scale: 1 },
                        { name: 'Renault', logo: 'https://cdn.worldvectorlogo.com/logos/renault-6.svg', scale: 2.5 },
                        { name: 'Toyota', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Toyota_carlogo.svg/1200px-Toyota_carlogo.svg.png', scale: 1 },
                        { name: 'Mazda', logo: 'https://cdn.worldvectorlogo.com/logos/mazda-3.svg', scale: 1.8 },
                        { name: 'Kia', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Kia-logo.png/1200px-Kia-logo.png', scale: 1 },
                        { name: 'Hyundai', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hyundai_Motor_Company_logo.svg/1200px-Hyundai_Motor_Company_logo.svg.png', scale: 1 },
                        { name: 'Nissan', logo: 'https://cdn.worldvectorlogo.com/logos/nissan-6.svg', scale: 1.8 },
                        { name: 'Ford', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Ford_Motor_Company_Logo.svg/1200px-Ford_Motor_Company_Logo.svg.png', scale: 1 },
                        { name: 'Volkswagen', logo: 'https://cdn.worldvectorlogo.com/logos/volkswagen-8.svg', scale: 1.8 },
                        { name: 'Suzuki', logo: 'https://cdn.worldvectorlogo.com/logos/suzuki.svg', scale: 1.2 },
                        { name: 'Chana', logo: 'https://logotyp.us/files/changan.svg', scale: 2.2 }
                      ].map((brand, i) => (
                        <div
                          key={i}
                          className="min-w-[100px] md:min-w-[140px] h-12 md:h-20 flex items-center justify-center transition-all duration-500 transform hover:scale-110 cursor-pointer p-2"
                          title={brand.name}
                        >
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="max-w-full max-h-full object-contain"
                            style={{ transform: `scale(${brand.scale})` }}
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        const container = document.getElementById('brands-scroll-container');
                        if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-lg text-red-500 opacity-0 group-hover/marcas:opacity-100 transition-opacity hidden md:flex"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Enhanced Pagination Bar with 'Envíos a toda Colombia' Info */}
              {totalPages > 1 && (isFiltering || showCatalog) && (
                <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    {/* Envíos a toda Colombia Block */}
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[24px] font-black text-gray-900 leading-none">Envíos a toda</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[28px] font-black text-gray-900 leading-none uppercase tracking-tighter">Colombia</span>
                          <div className="w-8 h-8 flex items-center justify-center text-red-500">
                            <Truck className="w-6 h-6" />
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Repuestos y autopartes</span>
                      </div>
                    </div>

                  </div>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      if (totalPages > 5 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                        if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                        return null;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`h-9 w-9 flex items-center justify-center border text-[12px] font-bold transition-all ${currentPage === pageNum
                            ? 'border-red-500 text-red-500 bg-white'
                            : 'border-gray-100 text-gray-400 hover:border-gray-300 hover:text-black'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="h-9 w-9 flex items-center justify-center border border-gray-100 text-gray-400 hover:border-gray-300 hover:text-black disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {!isFiltering && !showCatalog && (
                <>
                  <div className="pt-4 pb-12">
                    <div className="w-full bg-red-600 bg-gradient-to-r from-red-600 to-red-500 rounded-none overflow-hidden relative min-h-[140px] flex items-center px-4 md:px-10 py-8 group">
                      {/* Background Car Image Overlay */}
                      <div
                        className="absolute inset-0 z-0 opacity-20 pointer-events-none transition-transform duration-700 group-hover:scale-110"
                        style={{
                          backgroundImage: 'url("https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1932&auto=format&fit=crop")',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          mixBlendMode: 'luminosity'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600/60 to-transparent z-[1]" />
                      <div className="flex flex-col md:flex-row items-center justify-between w-full gap-8 z-10">
                        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                          <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-none border border-white/20">
                            <span className="text-white font-bold text-xl md:text-2xl uppercase tracking-wider">Autopartes</span>
                          </div>
                          <div className="flex flex-col">
                            <h2 className="text-white font-bold text-lg md:text-2xl uppercase tracking-tight leading-none">
                              Y Repuestos Genéricos / Homologados
                            </h2>
                            <p className="text-white/80 text-[10px] md:text-[11px] font-medium mt-2 uppercase tracking-[0.2em]">
                              Variedad de manijas, plumillas, pines y repuestos para todas las marcas
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowCatalog(true)}
                          className="bg-white text-black font-bold px-12 py-4 rounded-none text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-neutral-900 hover:text-white transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap"
                        >
                          Ver Todo
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-20 pb-20 border-t border-gray-50 bg-white w-full overflow-hidden">
                    <div className="container mx-auto px-4 md:px-8">
                      <div className="mb-14">
                        <h2 className="text-[12px] font-black text-[#C62828] uppercase tracking-[0.4em] mb-2 leading-none">Selección Premium</h2>
                        <h3 className="text-[32px] md:text-[52px] font-black text-gray-900 uppercase tracking-tighter leading-none mt-2">Los mas vendidos</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-12 lg:gap-x-24 gap-y-20">
                        {carouselGroups.productos1.slice(0, 4).map(p => (
                          <BestSellerCard key={`best-${p.id}`} product={p} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Solicitud de Cotización Bar as requested */}
                  <QuoteBanner />
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="bg-gray-50 p-6 rounded-full mb-6">
                <Search className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Sin coincidencias</h3>
              <p className="text-gray-400 max-w-xs mb-8 font-medium">
                No encontramos lo que buscas. Intenta con otros términos o limpia los filtros.
              </p>
              <Button
                onClick={clearAllFilters}
                className="rounded-full px-10 bg-black text-white font-black uppercase text-xs tracking-[0.2em] h-14"
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
