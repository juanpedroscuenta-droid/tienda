import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Truck, CircleDollarSign, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import { NewProductsCarousel } from './NewProductsCarousel';
import { GenericProductCarousel } from './GenericProductCarousel';
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
  const { getCategoryByName, getBreadcrumbPath } = useCategories();
  const { filters, loading: filtersLoading } = useFilters();
  const [loading, setLoading] = useState(true);

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceFrom, setPriceFrom] = useState<string>('');
  const [priceTo, setPriceTo] = useState<string>('');
  const [priceApplied, setPriceApplied] = useState<{ from: number; to: number } | null>(null);

  const [selectedFilterOptions, setSelectedFilterOptions] = useState<{ [filterId: string]: string[] }>({});
  const [showAllForFilter, setShowAllForFilter] = useState<{ [filterId: string]: boolean }>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    setSearchTerm(initialSearchTerm || '');
    setShowCatalog(false);
    setCurrentPage(1);
  }, [initialSearchTerm, selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const allProducts = await fetchProductsApi();
      const filtered = allProducts.filter((p) => p.isPublished !== false);

      // Shuffle the main list for a 'varied' feel as requested by the user
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      setProducts(shuffled);
    } catch (e) {
      console.error("Error cargando productos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const baseFiltered = useMemo(() => {
    const selCat = selectedCategory?.trim() || '';
    const sel = selCat.toLowerCase();
    const byName = getCategoryByName(selCat);
    const catIdToMatch = byName?.id;

    const matchCategory = (p: Product) => {
      const catName = String((p as any).category_name || (p as any).categoryName || '').trim().toLowerCase();
      const subName = String((p as any).subcategory_name || (p as any).subcategoryName || '').trim().toLowerCase();
      const tercName = String((p as any).tercera_categoria_name || (p as any).terceraCategoriaName || '').trim().toLowerCase();
      const catId = (p as any).category_id || (p as any).category;
      const subId = (p as any).subcategory;
      const tercId = (p as any).tercera_categoria || (p as any).terceraCategoria;

      return catName === sel || subName === sel || tercName === sel ||
        (catIdToMatch && (String(catId) === String(catIdToMatch) || String(subId) === String(catIdToMatch) || String(tercId) === String(catIdToMatch)));
    };

    return products.filter((p) => {
      const matchSearch = !searchTerm ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      if (selectedCategory === 'Todos') return true;
      return matchCategory(p);
    });
  }, [products, searchTerm, selectedCategory, getCategoryByName]);

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
    const published = products.filter(p => p.isPublished !== false && (p as any).is_published !== false);
    // Skip the first 10 products as they are displayed in NewProductsCarousel
    const pool = published.slice(10);

    return {
      productos1: pool.slice(0, 20),
      productos2: pool.slice(20, 40),
      ofertas: published.filter(p => {
        const isOffer = p.isOffer === true ||
          (p as any).is_offer === true ||
          (p as any).is_offer === 'true' ||
          (p as any).oferta === true ||
          (p as any).oferta === 'true';

        const discValue = Number(p.discount || (p as any).descuento || 0);
        const hasDiscount = discValue > 0;

        const origPrice = Number(p.originalPrice || (p as any).original_price || 0);
        const currPrice = Number(p.price || 0);
        const priceDiff = origPrice > currPrice && currPrice > 0;

        return isOffer || hasDiscount || priceDiff;
      })
        .sort((a, b) => {
          const dateA = new Date((a as any).updated_at || (a as any).created_at || 0).getTime();
          const dateB = new Date((b as any).updated_at || (b as any).created_at || 0).getTime();
          if (dateB !== dateA) return dateB - dateA;
          return b.id.localeCompare(a.id);
        })
        .slice(0, 4)
    };
  }, [products]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

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

  // ── Sticky sidebar via JS scroll tracking ──────────────────────────────────
  const sectionRef = useRef<HTMLElement>(null);
  const sidebarPlaceholderRef = useRef<HTMLDivElement>(null);
  const sidebarContentRef = useRef<HTMLDivElement>(null);
  const [sidebarStyle, setSidebarStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const HEADER_H = 88; // approx header height in px
    const update = () => {
      const section = sectionRef.current;
      const placeholder = sidebarPlaceholderRef.current;
      const sidebarEl = sidebarContentRef.current;
      if (!section || !placeholder || !sidebarEl) return;

      const scrollY = window.scrollY;
      const viewportH = window.innerHeight;
      const secRect = section.getBoundingClientRect();
      const phRect = placeholder.getBoundingClientRect();
      const sidebarH = sidebarEl.offsetHeight;
      const availableH = viewportH - HEADER_H; // usable height below header

      // Absolute page position where sidebar starts being sticky
      const stickyStart = secRect.top + scrollY - HEADER_H;

      // ① Before section — normal flow
      if (scrollY < stickyStart) {
        setSidebarStyle({});
        return;
      }

      // ③ End of section — anchor sidebar to bottom of placeholder
      if (secRect.bottom <= HEADER_H + Math.min(sidebarH, availableH)) {
        setSidebarStyle({
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
        });
        return;
      }

      if (sidebarH <= availableH) {
        // ② SHORT sidebar — pin to top of viewport
        setSidebarStyle({
          position: 'fixed',
          top: HEADER_H,
          left: phRect.left,
          width: phRect.width,
          maxHeight: availableH,
          overflowY: 'auto',
          zIndex: 20,
        });
      } else {
        // ② TALL sidebar — scroll sidebar by shifting its top upward as user scrolls,
        //    revealing more content, until the bottom of the sidebar is fully visible,
        //    then it stays pinned.
        const scrolledIntoSection = scrollY - stickyStart;
        const maxShift = sidebarH - availableH; // how far sidebar needs to move up
        const shift = Math.min(scrolledIntoSection, maxShift);

        setSidebarStyle({
          position: 'fixed',
          top: HEADER_H - shift,   // moves up as user scrolls
          left: phRect.left,
          width: phRect.width,
          zIndex: 20,
        });
      }
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <section ref={sectionRef} id="products-section" className={`${(isFiltering || showCatalog) ? 'pt-2 pb-8' : 'py-8'} bg-white w-full max-w-[1400px] mx-auto px-4 md:px-8 min-h-screen`}>
      <div className="flex flex-col md:flex-row gap-10">
        {/* Placeholder — reserves sidebar space; position:relative lets absolute child anchor here */}
        {(isFiltering || showCatalog) && (
          <div
            ref={sidebarPlaceholderRef}
            className="w-full md:w-64 flex-shrink-0 hidden md:block"
            style={{ position: 'relative' }}
          >
            {/* Actual sidebar — repositioned via JS */}
            <div ref={sidebarContentRef} style={sidebarStyle} className="scrollbar-hide">
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
                className="w-full pt-2"
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            </div>
          </div>
        )}

        <div className="flex-1">
          {/* Vista inicial Limpia - Solo Carrusel de novedades y luego el Grid */}
          {!isFiltering && !showCatalog && (
            <div className="mb-12">
              <NewProductsCarousel />
            </div>
          )}

          {/* Breadcrumbs */}
          {(isFiltering || showCatalog) && (
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-8 text-gray-400">
              <span className="text-orange-500 cursor-pointer hover:underline" onClick={() => setSelectedCategory("Todos")}>Home</span>
              {getBreadcrumbPath(selectedCategory).slice(1).map((part, i) => (
                <React.Fragment key={i}>
                  <ChevronRight className="w-3 h-3" />
                  <span className={i === getBreadcrumbPath(selectedCategory).slice(1).length - 1 ? 'text-black' : 'text-orange-500 cursor-pointer hover:underline'} onClick={() => setSelectedCategory(part)}>
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
                    <SelectItem value="relevance">Orden por defecto</SelectItem>
                    <SelectItem value="name">Alfabético</SelectItem>
                    <SelectItem value="price-asc">Menor precio</SelectItem>
                    <SelectItem value="price-desc">Mayor precio</SelectItem>
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
                    <SelectItem value="12">12</SelectItem>
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

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-80 bg-gray-50 animate-pulse rounded-[2rem]" />)}
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div className="space-y-16">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-12">
                {paginatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Trust Bar Section */}
              {!isFiltering && !showCatalog && (
                <div className="mb-14 grid grid-cols-1 md:grid-cols-3 bg-gray-50/50 rounded-xl overflow-hidden border border-gray-100">
                  <div className="flex items-center gap-4 p-6 border-b md:border-b-0 md:border-r border-gray-100">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-500">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase leading-tight">Envío gratis ↑ $60.000</h4>
                      <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">Más de 1000 autopartes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-6 border-b md:border-b-0 md:border-r border-gray-100">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-500">
                      <CircleDollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase leading-tight">Autopartes y repuestos</h4>
                      <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">Genéricos / Homologada para todas las marcas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-6">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-500">
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
                    <h2>Nuestros aliados</h2>
                    <p>el respaldo de las mejores marcas</p>
                  </div>

                  <div className="relative flex items-center gap-4 px-10">
                    <button className="absolute left-0 p-2 text-gray-300 hover:text-black transition-colors">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-6 items-center gap-8 py-4 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                      <div className="font-black text-xl text-center tracking-tighter italic">TOTUS</div>
                      <div className="font-black text-xl text-center tracking-tighter text-red-600">Florio</div>
                      <div className="font-black text-xl text-center tracking-tighter">KTC</div>
                      <div className="font-black text-xl text-center tracking-tighter text-blue-800">GPM</div>
                      <div className="font-black text-xl text-center tracking-tighter text-yellow-500">GPC</div>
                      <div className="font-black text-xl text-center tracking-tighter text-indigo-900 font-serif italic text-2xl">Ci</div>
                    </div>
                    <button className="absolute right-0 p-2 text-gray-300 hover:text-black transition-colors">
                      <ChevronRight className="w-6 h-6" />
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
                          <div className="w-8 h-8 flex items-center justify-center text-orange-500">
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
                        if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="px-1 text-gray-200">...</span>;
                        return null;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`h-9 w-9 flex items-center justify-center border text-[12px] font-bold transition-all ${currentPage === pageNum
                            ? 'border-orange-500 text-orange-500 bg-white'
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
                    <div className="w-full bg-orange-600 bg-gradient-to-r from-orange-600 to-orange-500 rounded-none overflow-hidden relative min-h-[140px] flex items-center px-4 md:px-10 py-8 group">
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
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-600/60 to-transparent z-[1]" />
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

                  <div className="pt-8">
                    <div className="professional-header">
                      <h2>Los mas vendidos</h2>
                      <p>De todas las marcas</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-12">
                      {carouselGroups.productos1.slice(0, 10).map(p => (
                        <ProductCard key={`best-${p.id}`} product={p} />
                      ))}
                    </div>
                  </div>
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
