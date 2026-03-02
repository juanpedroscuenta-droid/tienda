import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, User, HelpCircle, Search, Menu, X, ChevronDown, ChevronRight, SlidersHorizontal, ChevronLeft, Heart, Bike } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Badge } from '@/components/ui/badge';
import type { Category } from '@/hooks/use-categories';
import { FilterSidebar } from '@/components/products/FilterSidebar';
import { slugify } from '@/lib/utils';

interface AdvancedHeaderProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  promoVisible?: boolean;
  mainCategories?: Category[];
  subcategoriesByParent?: Record<string, Category[]>;
  thirdLevelBySubcategory?: Record<string, Category[]>;
  searchTerm?: string;
  onSearch?: (val: string) => void;
  allCategoriesData?: Category[];
}

export const AdvancedHeader: React.FC<AdvancedHeaderProps> = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  promoVisible,
  mainCategories = [],
  subcategoriesByParent = {},
  thirdLevelBySubcategory = {},
  searchTerm = '',
  onSearch,
  allCategoriesData = [],
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const itemCount = getItemCount();
  const { favorites, toggleFavorite } = useFavorites();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<'main' | 'sub'>('main');
  const [activeMainCat, setActiveMainCat] = useState<string | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showFavoritesMenu, setShowFavoritesMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState<string | null>(null);
  const [openAyudaDropdown, setOpenAyudaDropdown] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');
  const [activeSub, setActiveSub] = useState<Category | null>(null);
  const [activeThird, setActiveThird] = useState<Category | null>(null);
  const accountMenuTimer = useRef<NodeJS.Timeout | null>(null);
  const favoritesMenuTimer = useRef<NodeJS.Timeout | null>(null);
  const categoryDropdownTimer = useRef<NodeJS.Timeout | null>(null);

  // State to sync filters with ProductsSection
  const [filterState, setFilterState] = useState<any>(null);

  React.useEffect(() => {
    const handleFilterState = (e: any) => {
      setFilterState(e.detail);
    };
    window.addEventListener('app:filter-state', handleFilterState);
    return () => window.removeEventListener('app:filter-state', handleFilterState);
  }, []);

  // Update theme-color meta tag when menu opens/closes on mobile
  React.useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      if (isMenuOpen) {
        metaThemeColor.setAttribute('content', '#000000');
      } else {
        // Original color from index.html or preferred default
        metaThemeColor.setAttribute('content', '#1e40af');
      }
    }
  }, [isMenuOpen]);

  // No longer auto-select first sub on open
  React.useEffect(() => {
    if (!openCategoryDropdown) {
      setActiveSub(null);
      setActiveThird(null);
    }
  }, [openCategoryDropdown]);

  const getFourthLevel = (parentId: string) => {
    if (!allCategoriesData) return [];
    return allCategoriesData.filter(c => c.parentId === parentId);
  };

  const dispatchFilterAction = (type: string, payload: any) => {
    window.dispatchEvent(new CustomEvent('app:filter-change', {
      detail: { type, payload }
    }));
  };

  // Sincronizar local con prop cuando esta cambie externamente
  React.useEffect(() => {
    setLocalSearchTerm(searchTerm || '');
  }, [searchTerm]);

  // Solo categorías desde la BD (sin "Todos"). Sin fallback estático.
  const mainCategoriesForNav = categories.filter((c) => c !== "Todos");

  const goToCategory = (name: string) => {
    setIsMenuOpen(false);
    setOpenCategoryDropdown(null);
    setOpenAyudaDropdown(false);
    navigate(`/categoria/${encodeURIComponent(name)}`);
  };

  const getSubsForMain = (mainName: string) =>
    subcategoriesByParent[mainName] ?? [];
  const getThirdsForSub = (subId: string) =>
    thirdLevelBySubcategory[subId] ?? [];

  const handleSearchChange = (val: string) => {
    setLocalSearchTerm(val);
    if (onSearch) {
      onSearch(val);
    }

    // Si no estamos en la home y hay texto, ir a la home
    if (window.location.pathname !== '/' && val.length > 0) {
      navigate(`/?search=${encodeURIComponent(val)}`);
    } else if (window.location.pathname === '/') {
      // Si estamos en la home, actualizamos la URL para que sea persistente
      const params = new URLSearchParams(window.location.search);
      if (val) {
        params.set('search', val);
      } else {
        params.delete('search');
      }
      const newUrl = params.toString() ? `?${params.toString()}` : '/';
      window.history.replaceState({}, '', newUrl);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchTerm) {
      navigate(`/?search=${encodeURIComponent(localSearchTerm)}`);
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="w-full font-sans selection:bg-blue-800 selection:text-white" >
      {/* Top Header - Black Theme */}
      <header className="bg-black text-white w-full border-b border-zinc-800 overflow-visible relative z-[60]">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between overflow-visible">
          {/* Logo */}
          <div
            className="flex-shrink-0 cursor-pointer flex items-center gap-3 overflow-visible"
            onClick={() => navigate('/')}
            role="banner"
            aria-label="Ir a inicio de 24/7"
          >
            <div className="h-10 md:h-12 flex items-center overflow-visible">
              <img
                src="/logo.webp"
                alt="24/7"
                width="140"
                height="70"
                className="h-[50px] md:h-[70px] w-auto object-contain"
              />
            </div>
          </div>

          {/* Search Bar - Minimal & White */}
          <form
            className="hidden md:flex flex-1 max-w-2xl mx-12 relative group"
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <input
              id="search-input"
              type="text"
              placeholder="¿Qué estás buscando?"
              value={localSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full py-2.5 px-5 pr-12 text-sm text-gray-800 bg-white border-2 border-transparent rounded-lg focus:outline-none focus:border-white/50 transition-all placeholder:text-gray-500"
              aria-label="Buscador de productos"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-600 transition-colors p-2"
              aria-label="Ejecutar búsqueda"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          {/* Icons - Clean & Minimal */}
          <div className="flex items-center space-x-6">
            {/* Help */}
            <div className="relative group/help hidden sm:block">
              <button
                className="flex flex-col items-center gap-1 group transition-opacity hover:opacity-80 p-1"
                onMouseEnter={() => setShowHelpMenu(true)}
                onMouseLeave={() => setShowHelpMenu(false)}
                aria-label="Menú de Ayuda y Contacto"
              >
                <HelpCircle className="w-6 h-6 stroke-[1.5px]" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Ayuda</span>
              </button>

              {showHelpMenu && (
                <div
                  className="absolute top-full right-0 mt-4 w-56 bg-white text-gray-900 shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-gray-100 z-[70] overflow-hidden rounded-lg"
                  onMouseEnter={() => setShowHelpMenu(true)}
                  onMouseLeave={() => setShowHelpMenu(false)}
                >
                  <a
                    href="https://wa.me/573212619434"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
                  >
                    <span className="text-green-500 text-xl">📱</span>
                    <div className="text-left">
                      <div className="text-sm font-bold text-gray-900">WhatsApp</div>
                      <div className="text-[11px] text-gray-700 font-medium">+57 321 2619434</div>
                    </div>
                  </a>
                  <a
                    href="mailto:tienda247@gmail.com"
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xl">📧</span>
                    <div className="text-left">
                      <div className="text-sm font-bold text-gray-900">Email</div>
                      <div className="text-[11px] text-gray-700 font-medium">tienda247@gmail.com</div>
                    </div>
                  </a>
                </div>
              )}
            </div>

            {/* Favorites Dropdown Container */}
            <div
              className="relative hidden md:block"
              onMouseEnter={() => {
                if (favoritesMenuTimer.current) clearTimeout(favoritesMenuTimer.current);
                setShowFavoritesMenu(true);
              }}
              onMouseLeave={() => {
                if (favoritesMenuTimer.current) clearTimeout(favoritesMenuTimer.current);
                favoritesMenuTimer.current = setTimeout(() => setShowFavoritesMenu(false), 200);
              }}
            >
              <button
                className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity relative"
                onClick={() => navigate('/favoritos')}
                aria-label={`Mis Favoritos, ${favorites.length} productos`}
              >
                <div className="relative">
                  <Heart className="w-6 h-6 stroke-[1.5px]" />
                  {favorites.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-md">
                      {favorites.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider">Favoritos</span>
              </button>

              {/* Favorites Dropdown Overlay */}
              {showFavoritesMenu && (
                <div
                  className="absolute top-full right-0 mt-4 w-80 bg-white text-gray-900 shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-gray-100 z-[70] rounded-xl overflow-hidden p-4"
                  onMouseEnter={() => {
                    if (favoritesMenuTimer.current) clearTimeout(favoritesMenuTimer.current);
                    setShowFavoritesMenu(true);
                  }}
                  onMouseLeave={() => {
                    if (favoritesMenuTimer.current) clearTimeout(favoritesMenuTimer.current);
                    favoritesMenuTimer.current = setTimeout(() => setShowFavoritesMenu(false), 200);
                  }}
                >
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-sm font-black text-gray-900">Favoritos</h3>
                    <Badge variant="secondary" className="text-[10px] font-black bg-gray-100 text-gray-600 rounded-full h-5">{favorites.length}</Badge>
                  </div>

                  {favorites.length === 0 ? (
                    <div className="py-10 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Heart className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tu lista está vacía</p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {favorites.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl group/fav transition-all duration-200 border border-transparent hover:border-gray-100 cursor-pointer"
                            onClick={() => {
                              navigate(`/producto/${slugify(item.name)}`);
                              setShowFavoritesMenu(false);
                            }}
                          >
                            <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 p-1">
                              <img
                                src={item.image || '/placeholder.png'}
                                alt={item.name}
                                className="w-full h-full object-contain group-hover/fav:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-gray-900 line-clamp-2 leading-tight group-hover/fav:text-blue-600 transition-colors">
                                {item.name}
                              </p>
                              <p className="text-xs font-black text-gray-900 mt-1">${item.price?.toLocaleString('es-CO')}</p>
                            </div>
                            <button
                              className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item);
                              }}
                            >
                              <Heart className="w-4 h-4 fill-current transition-colors" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {favorites.length > 5 && (
                        <div className="py-2 text-center border-t border-gray-50 mt-2">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            + {favorites.length - 5} artículos más
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => { navigate('/favoritos'); setShowFavoritesMenu(false); }}
                        className="w-full mt-4 bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white py-3 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 transform active:scale-[0.98]"
                      >
                        Ver todos los favoritos
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Favorites Button (Always navigates) */}
            <div className="md:hidden">
              <button
                className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity relative"
                onClick={() => navigate('/favoritos')}
                aria-label={`Mis Favoritos, ${favorites.length} productos`}
              >
                <div className="relative">
                  <Heart className="w-6 h-6 stroke-[1.5px]" />
                  {favorites.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-md">
                      {favorites.length}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Account */}
            <div
              className="relative"
              onMouseEnter={() => {
                if (accountMenuTimer.current) clearTimeout(accountMenuTimer.current);
                setShowAccountMenu(true);
              }}
              onMouseLeave={() => {
                if (accountMenuTimer.current) clearTimeout(accountMenuTimer.current);
                accountMenuTimer.current = setTimeout(() => setShowAccountMenu(false), 150);
              }}
            >
              <button
                className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
                onClick={() => setShowAccountMenu(prev => !prev)}
                aria-label="Menú de Cuenta"
              >
                <User className="w-6 h-6 stroke-[1.5px]" />
                <span className="text-[10px] uppercase font-bold tracking-wider hidden md:block">Mi cuenta</span>
              </button>

              {showAccountMenu && (
                <div
                  className="absolute top-full right-[-70px] md:right-0 mt-3 w-[260px] max-w-[calc(100vw-32px)] bg-white text-gray-900 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-50 z-[100] rounded-[28px] overflow-hidden p-6"
                  onMouseEnter={() => {
                    if (accountMenuTimer.current) clearTimeout(accountMenuTimer.current);
                    setShowAccountMenu(true);
                  }}
                  onMouseLeave={() => {
                    if (accountMenuTimer.current) clearTimeout(accountMenuTimer.current);
                    accountMenuTimer.current = setTimeout(() => setShowAccountMenu(false), 150);
                  }}
                >
                  {user ? (
                    <div className="flex flex-col">
                      <div className="mb-4">
                        <p className="text-[17px] font-black text-gray-900">Hola,</p>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => { navigate('/perfil'); setShowAccountMenu(false); }}
                          className="w-full text-left px-4 py-3 bg-[#f2f2f2] rounded-2xl text-[15px] font-bold text-gray-800 transition-colors"
                        >
                          Perfil
                        </button>
                        <button
                          onClick={() => { navigate('/perfil?tab=addresses'); setShowAccountMenu(false); }}
                          className="w-full text-left px-4 py-3 rounded-2xl text-[15px] font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                        >
                          Mis direcciones
                        </button>
                        <button
                          onClick={() => { navigate('/perfil?tab=orders'); setShowAccountMenu(false); }}
                          className="w-full text-left px-4 py-3 rounded-2xl text-[15px] font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                        >
                          Mis pedidos
                        </button>

                        {(user.isAdmin || user.subCuenta === "si") && (
                          <button
                            onClick={() => { navigate('/admin'); setShowAccountMenu(false); }}
                            className="w-full text-left px-4 py-3 rounded-2xl text-[15px] font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                          >
                            Panel Administrador
                          </button>
                        )}
                      </div>

                      <div className="mt-6">
                        <button
                          onClick={async () => { await logout(); setShowAccountMenu(false); }}
                          className="w-full py-3 px-4 border border-gray-900 text-gray-900 rounded-[12px] font-black text-[13px] uppercase tracking-widest transition-all"
                        >
                          CERRAR SESIÓN
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-4">
                      <div className="mb-2">
                        <p className="text-base font-black text-gray-900 uppercase tracking-tight">Bienvenido</p>
                        <p className="text-xs font-medium text-gray-400">Accede a tu cuenta Yamaha</p>
                      </div>
                      <button
                        onClick={() => { navigate('/login'); setShowAccountMenu(false); }}
                        className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all"
                      >
                        Ingresar
                      </button>
                      <button
                        onClick={() => { navigate('/register'); setShowAccountMenu(false); }}
                        className="w-full py-3.5 border-2 border-gray-900 text-gray-900 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-gray-900 hover:text-white transition-all"
                      >
                        Registrarme
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity relative"
              onClick={() => navigate('/cart')}
              aria-label={`Ver carrito de compras, ${itemCount} productos`}
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6 stroke-[1.5px]" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider hidden md:block">Mi carrito</span>
            </button>

            {/* Mobile Toggle */}
            <button
              className="md:hidden text-white p-3 -mr-2 min-w-[48px] min-h-[48px] flex items-center justify-center"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Cerrar menú principal" : "Abrir menú principal"}
            >
              {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>

        {/* Persistent Mobile Search Bar (Mobile only) */}
        <div className="md:hidden px-4 pb-3 pt-1" >
          <form className="relative" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="¿Qué estás buscando?"
              value={localSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full py-2 px-4 pr-10 text-sm text-white bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-white/40 placeholder:text-gray-400"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70">
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div >
      </header >

      {/* Mobile Drawer Overlay */}
      {
        isMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />
        )
      }

      {/* Mobile Drawer Content */}
      <div
        className={`fixed inset-y-0 left-0 w-[85%] max-w-[320px] bg-white z-[110] md:hidden transform transition-transform duration-300 ease-out shadow-2xl flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Drawer Header - Black Theme for continuity */}
        <div className="flex items-center justify-between p-6 bg-black text-white border-b border-zinc-800">
          <img
            src="/logo.webp"
            alt="24/7"
            className="h-8 w-auto object-contain"
          />
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 -mr-2 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-10">
          {menuView === 'main' ? (
            <>
              <div className="px-6 space-y-1 pt-4">
                {mainCategoriesForNav.map((name) => {
                  const catObj = mainCategories.find(c => c.name === name);
                  const subs = getSubsForMain(name);
                  const hasSubs = subs.length > 0;

                  return (
                    <button
                      key={name}
                      onClick={() => {
                        if (hasSubs) {
                          setActiveMainCat(name);
                          setMenuView('sub');
                        } else {
                          goToCategory(name);
                        }
                      }}
                      className="w-full flex items-center justify-between py-4 group hover:bg-gray-50 -mx-2 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                          {catObj?.image ? (
                            <img
                              src={catObj.image}
                              alt={name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 uppercase font-black text-[10px]">
                              {name.slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight">
                          {name}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" />
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 px-6 border-t border-gray-100 pt-8">
                {filterState && (
                  <FilterSidebar
                    isMobile
                    filters={filterState.filters}
                    filtersLoading={filterState.filtersLoading}
                    selectedFilterOptions={filterState.selectedFilterOptions}
                    toggleFilterOption={(fId, oId) => dispatchFilterAction('toggleOption', { fId, oId })}
                    filterOptionCounts={filterState.filterOptionCounts}
                    priceFrom={filterState.priceFrom}
                    setPriceFrom={(v) => dispatchFilterAction('updatePriceState', { from: v, to: filterState.priceTo })}
                    priceTo={filterState.priceTo}
                    setPriceTo={(v) => dispatchFilterAction('updatePriceState', { from: filterState.priceFrom, to: v })}
                    applyPrice={() => {
                      const pFrom = (document.querySelector('input[placeholder="Min"]') as HTMLInputElement)?.value;
                      const pTo = (document.querySelector('input[placeholder="Max"]') as HTMLInputElement)?.value;
                      dispatchFilterAction('applyPrice', { from: pFrom, to: pTo });
                    }}
                    className="w-full"
                  />
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 px-6 space-y-6">


                <button
                  onClick={() => {
                    const productsSection = document.getElementById('products-section');
                    if (productsSection) {
                      productsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                    setIsMenuOpen(false);
                  }}
                  className="mt-4 w-full bg-black text-white py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all text-center"
                >
                  Cerrar y ver resultados
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2">
              {/* Submenu Header */}
              <div className="px-4 mb-6">
                <button
                  onClick={() => setMenuView('main')}
                  className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-900 hover:text-blue-600 transition-colors py-2"
                >
                  <ChevronLeft className="w-4 h-4 text-black" />
                  Regresar
                </button>
              </div>

              {/* Active Category Info */}
              <div className="px-6 flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden border border-gray-100">
                  {mainCategories.find(c => c.name === activeMainCat)?.image ? (
                    <img
                      src={mainCategories.find(c => c.name === activeMainCat)?.image}
                      alt={activeMainCat || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 uppercase font-black text-xs">
                      {activeMainCat?.slice(0, 2)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none">
                    {activeMainCat}
                  </h3>
                  <button
                    onClick={() => activeMainCat && goToCategory(activeMainCat)}
                    className="text-[10px] font-bold text-gray-400 uppercase tracking-widest underline mt-1 block"
                  >
                    Ver todo
                  </button>
                </div>
              </div>

              {/* Subcategories List */}
              <div className="px-6 space-y-2">
                {activeMainCat && getSubsForMain(activeMainCat).map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => goToCategory(sub.name)}
                    className="w-full flex items-center justify-between py-4 border-b border-gray-50 text-left group"
                  >
                    <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">
                      {sub.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp Link at bottom of menu */}
        <div className="p-6 border-t border-gray-100">
          <a
            href="https://wa.me/573212619434"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-green-600 font-bold text-sm"
          >
            <span className="text-xl">📱</span>
            WhatsApp +57 321 2619434
          </a>
        </div>
      </div>

      {/* Desktop Navigation Bar - Black & Clean */}
      <nav
        className="relative hidden md:block bg-black border-t border-white/10 border-b border-zinc-800 z-50"
        onMouseLeave={() => {
          categoryDropdownTimer.current = setTimeout(() => setOpenCategoryDropdown(null), 100);
        }}
      >
        <div className="w-full max-w-[1440px] mx-auto px-1">
          <ul className="grid grid-flow-col auto-cols-fr w-full h-[60px] text-white">
            {mainCategoriesForNav.map((category) => {
              const isActive = selectedCategory === category;
              const subs = getSubsForMain(category);
              const hasDropdown = subs.length > 0;
              const isDropdownOpen = openCategoryDropdown === category;

              // Explicit splitting for common long categories with "y"
              const lowerName = category.toLowerCase();
              let labelElement: React.ReactNode = category;

              if (lowerName.includes(' y ')) {
                const parts = category.split(/\s+[yY]\s+/);
                labelElement = (
                  <>
                    <span className="block leading-none">{parts[0]} Y</span>
                    <span className="block leading-none">{parts.slice(1).join(' Y ')}</span>
                  </>
                );
              } else if (category.length > 10 && category.includes(' ')) {
                const parts = category.split(' ');
                labelElement = (
                  <>
                    <span className="block leading-none">{parts[0]}</span>
                    <span className="block leading-none">{parts.slice(1).join(' ')}</span>
                  </>
                );
              }

              return (
                <li
                  key={category}
                  className="flex items-center justify-center h-full border-r border-white/5 last:border-0"
                  onMouseEnter={() => {
                    if (categoryDropdownTimer.current) clearTimeout(categoryDropdownTimer.current);
                    if (hasDropdown) setOpenCategoryDropdown(category);
                  }}
                  onMouseLeave={() => {
                    categoryDropdownTimer.current = setTimeout(() => setOpenCategoryDropdown(null), 150);
                  }}
                >
                  <button
                    type="button"
                    className={`flex flex-col items-center justify-center w-full min-h-[50px] px-1 text-center transition-all uppercase relative group ${isActive || isDropdownOpen
                      ? "text-white opacity-100"
                      : "text-white/70 hover:text-white"
                      }`}
                    onClick={() => {
                      goToCategory(category);
                    }}
                  >
                    <div className="text-[10px] xl:text-[11px] font-bold uppercase flex flex-col items-center leading-tight">
                      {labelElement}
                    </div>
                    {(isActive || isDropdownOpen) && (
                      <span className="absolute -bottom-0 left-1 right-1 h-0.5 bg-white animate-in fade-in" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

        </div>

        {/* Dropdown Categorías (Mega-Menu) - Blue Minimal Style */}
        {openCategoryDropdown && (() => {
          const subs = getSubsForMain(openCategoryDropdown);
          if (subs.length === 0) return null;

          return (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full w-full max-w-4xl bg-white shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] z-50 border border-gray-100 rounded-b-[2rem] animate-in fade-in slide-in-from-top-2 duration-300"
              onMouseEnter={() => {
                if (categoryDropdownTimer.current) clearTimeout(categoryDropdownTimer.current);
                setOpenCategoryDropdown(openCategoryDropdown);
              }}
            >
              <div className="flex" style={{ maxHeight: '70vh' }}>
                {/* Col 1: Level 1 Subcategories & Promo */}
                <div className="w-[320px] bg-[#f8f9fa] p-5 flex flex-col overflow-y-scroll" style={{ maxHeight: '70vh', scrollbarWidth: 'auto' }}>
                  <div className="flex flex-col gap-1 mb-10">
                    {subs.map((s) => (
                      <button
                        key={s.id}
                        onMouseEnter={() => {
                          setActiveSub(s);
                          setActiveThird(null);
                        }}
                        onClick={() => goToCategory(s.name)}
                        className={`flex items-center justify-between px-6 py-4 rounded-xl transition-all text-left group ${activeSub?.id === s.id ? 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-black' : 'text-gray-500 hover:text-black hover:bg-white/50'}`}
                      >
                        <span className="text-[14px] font-bold tracking-tight">{s.name}</span>
                        {(thirdLevelBySubcategory[s.id || ''] || []).length > 0 && (
                          <ChevronRight className={`w-4 h-4 transition-all ${activeSub?.id === s.id ? 'translate-x-1 opacity-100' : 'opacity-100 text-gray-300'}`} />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Promo Box */}
                  <div className="mt-auto bg-[#eaebed] p-5 rounded-[1.5rem] border border-gray-200/30">
                    <p className="text-[14px] font-bold text-gray-700 mb-4 leading-tight">
                      Encuentra el repuesto ideal <span className="font-medium text-gray-400 lowercase">{openCategoryDropdown}</span>
                    </p>
                    <button className="w-full bg-[#2a2a2a] text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md active:scale-[0.98] group">
                      <Bike className="w-4 h-4 text-white/80 group-hover:scale-110 transition-transform" />
                      <span>Búsqueda Por Modelo</span>
                    </button>
                  </div>
                </div>

                {/* Col 2: Level 2 Subcategories */}
                <div className="w-[300px] border-l border-gray-100 p-5 flex flex-col bg-white overflow-y-scroll" style={{ maxHeight: '70vh', scrollbarWidth: 'auto' }}>
                  {activeSub && (
                    <div className="flex flex-col gap-1">
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-4">Categorías</h4>
                      {(thirdLevelBySubcategory[activeSub.id || ''] || []).map((t) => (
                        <button
                          key={t.id}
                          onMouseEnter={() => setActiveThird(t)}
                          onClick={() => goToCategory(t.name)}
                          className={`flex items-center justify-between px-5 py-3.5 rounded-xl transition-all text-left group ${activeThird?.id === t.id ? 'bg-[#f8f9fa] text-black shadow-sm' : 'text-gray-500 hover:text-black hover:bg-[#f8f9fa]/50'}`}
                        >
                          <span className="text-[14px] font-bold tracking-tight">{t.name}</span>
                          {getFourthLevel(t.id || '').length > 0 && (
                            <ChevronRight className={`w-4 h-4 transition-all ${activeThird?.id === t.id ? 'translate-x-1 opacity-100' : 'opacity-100 text-gray-300'}`} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Col 3: Level 3 Items */}
                <div className="flex-1 p-10 bg-white overflow-y-auto custom-scrollbar border-l border-gray-100 min-h-0">
                  {activeThird ? (
                    <div className="flex flex-col gap-1">
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-4">Productos</h4>
                      <div className="grid grid-cols-1 gap-y-1">
                        {getFourthLevel(activeThird.id || '').map((f) => (
                          <button
                            key={f.id}
                            onClick={() => goToCategory(f.name)}
                            className="text-left py-3 px-5 text-[14px] font-medium text-gray-500 hover:text-black hover:bg-[#f8f9fa] rounded-xl transition-all"
                          >
                            {f.name}
                          </button>
                        ))}
                        {getFourthLevel(activeThird.id || '').length === 0 && (
                          <div className="px-5 py-10 text-center border-2 border-dashed border-gray-50 rounded-2xl">
                            <p className="text-gray-400 text-sm">Explora toda la sección de <br /><span className="font-bold text-black">{activeThird.name}</span></p>
                            <button
                              onClick={() => goToCategory(activeThird.name)}
                              className="mt-4 text-xs font-black uppercase underline decoration-2 underline-offset-4"
                            >
                              Ver catálogo completo
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })()}
      </nav>
    </div >
  );
};
