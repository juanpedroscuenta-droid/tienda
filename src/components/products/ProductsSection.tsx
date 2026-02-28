import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import { NewProductsCarousel } from './NewProductsCarousel';
import { GenericProductCarousel } from './GenericProductCarousel';
import { FilterSidebar } from './FilterSidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HomeCategoryGrid } from '@/components/home/HomeCategoryGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/contexts/CartContext';
import { useCategories } from '@/hooks/use-categories';
import { useFilters } from '@/hooks/use-filters';
import { fetchProducts as fetchProductsApi } from '@/lib/api';
import { parseFormattedPrice } from '@/lib/utils';

interface ProductsSectionProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  setCategories: (cats: string[]) => void;
  initialSearchTerm?: string;
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
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [sortBy, setSortBy] = useState('relevance');
  const [products, setProducts] = useState<Product[]>([]);
  const { getCategoryByName } = useCategories();
  const { filters, loading: filtersLoading } = useFilters();
  const [loading, setLoading] = useState(true);

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceFrom, setPriceFrom] = useState<string>('');
  const [priceTo, setPriceTo] = useState<string>('');
  const [priceApplied, setPriceApplied] = useState<{ from: number; to: number } | null>(null);

  const [selectedFilterOptions, setSelectedFilterOptions] = useState<{ [filterId: string]: string[] }>({});
  const [showAllForFilter, setShowAllForFilter] = useState<{ [filterId: string]: boolean }>({});

  const [showCatalog, setShowCatalog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

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
      setProducts(filtered);
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
  }, [filteredAndSortedProducts, currentPage]);

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
    <section ref={sectionRef} id="products-section" className="py-8 bg-white w-full max-w-[1400px] mx-auto px-4 md:px-8 min-h-screen">
      <div className="flex flex-col md:flex-row gap-10">
        {/* Placeholder — reserves sidebar space; position:relative lets absolute child anchor here */}
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
              className="w-full pt-2 border-r pr-6"
            />
          </div>
        </div>

        <div className="flex-1">
          {!isFiltering && !showCatalog && (
            <div className="mb-6 -mt-4">
              <div className="md:hidden">
                <HomeCategoryGrid onSelect={setSelectedCategory} />
              </div>
              {/* negative margin to escape parent px-4 md:px-8 so carousel buttons aren't clipped */}
              <div className="-mx-4 md:-mx-8">
                <NewProductsCarousel />
              </div>
            </div>
          )}
          {!isFiltering && !showCatalog && (
            <div className="space-y-2">
              <h3 className="text-[#1a2b3c] font-bold text-xl mb-4 tracking-tight uppercase px-6 sm:px-8">PRODUCTOS</h3>
              {/* negative margin escape trick so right button isn't clipped by parent px-8 */}
              <div className="-mx-4 md:-mx-8">
                <GenericProductCarousel title="" products={carouselGroups.productos1} />
              </div>
              <div className="-mx-4 md:-mx-8">
                <GenericProductCarousel title="" products={carouselGroups.productos2} />
              </div>

              <div className="flex justify-center w-full py-8 mb-4">
                <button
                  onClick={() => setShowCatalog(true)}
                  className="text-gray-900 font-black uppercase tracking-[0.25em] text-sm hover:text-[#005cb9] transition-all border-b-4 border-gray-900 hover:border-[#005cb9] pb-2 px-4"
                >
                  Ver todo el catálogo
                </button>
              </div>

              <div className="-mx-4 md:-mx-8">
                <GenericProductCarousel
                  title="Ofertas"
                  products={carouselGroups.ofertas}
                  emptyMessage="Lo sentimos aun no tenemos productos en promocion"
                />
              </div>
            </div>
          )}

          {(isFiltering || showCatalog) && (
            <>
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div>
                  <h2 className="text-2xl font-bold">
                    {isFiltering ? (selectedCategory !== 'Todos' ? selectedCategory : 'Resultados de búsqueda') : 'Catálogo Completo'}
                  </h2>
                  <p className="text-sm text-gray-500">{filteredAndSortedProducts.length} encontrados</p>
                </div>
                <div className="flex items-center gap-4">
                  {showCatalog && !isFiltering && (
                    <Button
                      variant="ghost"
                      onClick={() => setShowCatalog(false)}
                      className="text-gray-500 hover:text-black font-bold uppercase tracking-tight text-xs"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Volver
                    </Button>
                  )}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevancia</SelectItem>
                      <SelectItem value="name">Nombre</SelectItem>
                      <SelectItem value="price-asc">Menor precio</SelectItem>
                      <SelectItem value="price-desc">Mayor precio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl" />)}
                </div>
              ) : paginatedProducts.length > 0 ? (
                <div className="space-y-12">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 sm:gap-x-6 gap-y-4 sm:gap-y-10">
                    {paginatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
                  </div>

                  {/* Catalog Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 pb-12">
                      <Button
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="h-10 w-10 p-0 rounded-lg"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {Array.from({ length: totalPages }).map((_, i) => {
                        const pageNum = i + 1;
                        if (totalPages > 7 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                          if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="px-1">...</span>;
                          return null;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-10 w-10 p-0 rounded-lg ${currentPage === pageNum ? 'bg-black text-white border-black' : ''}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      <Button
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className="h-10 w-10 p-0 rounded-lg"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No encontramos coincidencias</h3>
                  <p className="text-gray-500 max-w-xs mb-6">
                    Intenta ajustar o eliminar algunos filtros para encontrar lo que buscas.
                  </p>
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="rounded-full px-8 hover:bg-black hover:text-white transition-all"
                  >
                    Limpiar todos los filtros
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
