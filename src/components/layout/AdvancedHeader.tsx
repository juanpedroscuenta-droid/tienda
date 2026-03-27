import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, User, HelpCircle, Search, Menu, X, ChevronDown, ChevronRight, SlidersHorizontal, ChevronLeft, Heart, Bike, Car, ShieldCheck, QrCode, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const { getItemCount, getTotal } = useCart();
  const itemCount = getItemCount();
  const total = getTotal();
  const { favorites, toggleFavorite } = useFavorites();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<'main' | 'sub' | 'categories'>('main');
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
  const helpMenuTimer = useRef<NodeJS.Timeout | null>(null);
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

  // Auto-select first sub on open categories
  React.useEffect(() => {
    if (openCategoryDropdown === "Categories" && !activeSub && mainCategories.length > 0) {
      const firstValid = mainCategories.find(c => c.id !== "todos");
      if (firstValid) {
        setActiveSub(firstValid);
        setActiveThird(null);
      }
    }
    if (!openCategoryDropdown) {
      setActiveSub(null);
      setActiveThird(null);
    }
  }, [openCategoryDropdown, mainCategories, activeSub]);

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

  // Handle Body Scroll Lock
  React.useEffect(() => {
    if (openCategoryDropdown === "Categories") {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [openCategoryDropdown]);

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
    <div className="w-full max-w-full overflow-x-hidden font-sans selection:bg-blue-800 selection:text-white" >
      {/* Red Super-Header on top as requested */}
      <div className="bg-[#ba181b] text-white w-full border-b border-black/5 py-3.5 hidden md:block">
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between text-[13px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="text-white">📍</span> Bogotá, Colombia
            </span>
            <span className="flex items-center gap-2">
              <span className="text-white font-bold">📞</span> 3052830433
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAccountMenu(true)}
              onMouseEnter={() => setShowAccountMenu(true)}
              className="hover:text-red-500 transition-colors flex items-center gap-2"
            >
              <User className="w-3.5 h-3.5" strokeWidth={2.5} />
              {user ? `Hola, ${user.name.split(' ')[0]}` : 'Login'}
            </button>
          </div>

        </div>
      </div>

      {/* DESKTOP HEADER */}
      <header className="hidden md:block bg-white text-gray-900 w-full border-b border-gray-100 overflow-visible relative z-[60] shadow-sm">
        <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between overflow-visible">
          {/* Logo */}
          <div
            className="flex-shrink-0 cursor-pointer flex items-center gap-3 overflow-visible"
            onClick={() => navigate('/')}
            role="banner"
            aria-label="Ir a inicio de 24/7"
          >
            <div className="h-8 md:h-14 flex items-center overflow-visible bg-white p-2 rounded-sm">
              <img
                src="/logo.webp"
                alt="24/7"
                width="160"
                height="80"
                className="h-[55px] md:h-[75px] w-auto object-contain"
              />
            </div>
          </div>

          {/* Search Bar - Minimal & White */}
          <form
            className="flex flex-1 mx-12 relative group"
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <input
              id="search-input"
              type="text"
              placeholder="¿Qué estás buscando?"
              value={localSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full py-3 px-6 pr-32 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all placeholder:text-gray-400"
              aria-label="Buscador de productos"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-full px-10 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[12px] rounded-sm transition-all shadow-md active:scale-[0.98]"
              aria-label="Ejecutar búsqueda"
            >
              BUSCAR
            </button>
          </form>

          {/* Icons - Clean & Minimal */}
          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex items-center gap-6 mr-4 border-r border-white/10 pr-6">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-black/5 flex items-center justify-center border border-black/10">
                      <CreditCard className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-[13px] font-black uppercase tracking-tight">Pagar con QR</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] bg-white border-2 border-slate-900 rounded-none p-0 overflow-hidden flex flex-col">
                  <DialogHeader className="bg-[#ffd814] p-3 border-b-2 border-slate-900 flex-shrink-0">
                    <DialogTitle className="text-[14px] font-black uppercase tracking-[0.15em] text-[#0f1111] flex items-center gap-2">
                      <QrCode className="w-5 h-5" />
                      Pagar con QR
                    </DialogTitle>
                  </DialogHeader>
                  <div className="p-2 flex flex-col items-center justify-center bg-white overflow-y-auto">
                    <div className="w-full flex items-center justify-center bg-white">
                      <img
                        src="/Picsart_26-03-06_12-21-01-693.jpg (1).webp"
                        alt="QR de Pago"
                        className="w-full h-auto max-h-[75vh] object-contain"
                      />
                    </div>
                    <div className="mt-6 text-center space-y-2">
                      <p className="text-[14px] font-black uppercase tracking-tight text-slate-900">Escanea para pagar</p>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tienda 24/7 Digital</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

            </div>

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
              {showFavoritesMenu && (
                <div
                  className="absolute top-full right-0 w-80 z-[160] pointer-events-none transition-all duration-300 opacity-100 translate-y-0"
                  onMouseEnter={() => {
                    if (favoritesMenuTimer.current) clearTimeout(favoritesMenuTimer.current);
                    setShowFavoritesMenu(true);
                  }}
                  onMouseLeave={() => {
                    if (favoritesMenuTimer.current) clearTimeout(favoritesMenuTimer.current);
                    favoritesMenuTimer.current = setTimeout(() => setShowFavoritesMenu(false), 200);
                  }}
                >
                  <div className="bg-white text-gray-900 shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-gray-100 rounded-xl overflow-hidden p-4 mt-1 pointer-events-auto">
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
                  className="absolute top-full right-0 w-[280px] max-w-[calc(100vw-32px)] z-[160] pointer-events-none transition-all duration-300 opacity-100 translate-y-0"
                  onMouseEnter={() => {
                    if (accountMenuTimer.current) clearTimeout(accountMenuTimer.current);
                    setShowAccountMenu(true);
                  }}
                  onMouseLeave={() => {
                    if (accountMenuTimer.current) clearTimeout(accountMenuTimer.current);
                    accountMenuTimer.current = setTimeout(() => setShowAccountMenu(false), 150);
                  }}
                >
                  <div className="bg-white text-gray-900 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-50 rounded-[28px] overflow-hidden p-6 mt-1 pointer-events-auto">
                    {user ? (
                      <div className="flex flex-col">
                        <div className="mb-4">
                          <p className="text-[17px] font-black text-gray-900">Hola, {user.email?.split('@')[0]}</p>
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
                            className="w-full py-3 px-4 border border-gray-900 text-gray-900 rounded-[12px] font-black text-[13px] uppercase tracking-widest transition-all hover:bg-gray-900 hover:text-white"
                          >
                            CERRAR SESIÓN
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-4">
                        <div className="mb-2">
                          <p className="text-base font-black text-gray-900 uppercase tracking-tight">Bienvenido</p>
                          <p className="text-xs font-medium text-gray-400">Accede a tu cuenta 24/7</p>
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
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              className="hidden md:flex items-center gap-3 hover:opacity-80 transition-opacity relative group"
              onClick={() => navigate('/cart')}
              aria-label={`Ver carrito de compras, ${itemCount} productos`}
            >
              <div className="relative p-2 bg-red-50 rounded-full group-hover:bg-red-100 transition-colors">
                <ShoppingCart className="w-6 h-6 text-red-600 fill-current" />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[13px] font-black text-gray-900 uppercase">Mi Carrito</span>
                <span className="text-[12px] font-bold text-red-600">
                  ${total.toLocaleString('es-CO')} | {itemCount}
                </span>
              </div>
            </button>
          </div> {/* Closing div for the desktop header icons container */}
        </div> {/* Closing div for the desktop header main container */}
      </header> {/* Closing header tag for the desktop header */}


      {/* MOBILE HEADER (Screenshot Red Style) */}
      <header className="md:hidden flex flex-col w-full z-[60] sticky top-0 bg-white">
        {/* Row 1: Search Bar (Red BG) */}
        <div className="bg-[#E2343E] px-4 py-5">
          <form className="flex w-full h-11" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="¿Qué estás buscando?"
              value={localSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 py-0 px-4 text-sm text-gray-800 bg-white border-0 outline-none rounded-l-md"
              aria-label="Buscador móvil"
            />
            <button
              type="submit"
              className="bg-black text-white px-5 font-black text-[12px] uppercase flex items-center justify-center rounded-r-md"
            >
              BUSCAR
            </button>
          </form>
        </div>

        {/* Row 2: Icons & Logo (Red BG) */}
        <div className="bg-[#E2343E] px-4 py-3 flex items-center justify-between border-t border-white/10 relative">
          <div className="flex-1 flex justify-start">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="text-white p-2 -ml-2"
              aria-label="Abrir menú"
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>

          <div
            className="flex items-center cursor-pointer absolute left-1/2 -translate-x-1/2 z-[70] h-full"
            onClick={() => {
              navigate('/');
              window.scrollTo(0, 0);
            }}
          >
            <img
              src="/logo.webp"
              alt="24/7"
              className="h-10 w-auto object-contain brightness-0 invert cursor-pointer" // Invert color to make it white/accessible on red if it's dark
            />
          </div>

          <div className="flex-1 flex items-center justify-end gap-3">
            <button
              onClick={() => navigate('/cart')}
              className="text-white relative p-1"
              aria-label="Ver carrito"
            >
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-red-600 text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="text-white p-1"
              aria-label="Ver cuenta"
            >
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

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
        className={`fixed inset-y-0 left-0 w-[85%] max-w-[320px] bg-white z-[110] md:hidden transform transition-transform duration-300 ease-out shadow-2xl flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 bg-white border-b border-gray-100 shrink-0">
          <img
            src="/logo.webp"
            alt="24/7"
            className="h-10 w-auto object-contain cursor-pointer"
            onClick={() => { navigate('/'); setIsMenuOpen(false); }}
          />
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 -mr-2 text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-10">
          {menuView === 'main' && (
            <>
              <div className="px-6 pt-6 pb-2">
                <h3 className="text-sm font-black text-[#E2343E] uppercase tracking-wider">Menú Principal</h3>
              </div>

              <div className="px-6 flex flex-col border-b border-[#E2343E]/10 pb-4">
                {[
                  { name: 'Cotización', path: '/cotizacion' },
                  { name: 'Promociones', path: '/promociones' },
                  { name: 'Tienda', path: '/?tienda=true' },
                  { name: 'Categorías', action: () => setMenuView('categories') }
                ].map((item: any) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (item.action) item.action();
                      else {
                        navigate(item.path);
                        setIsMenuOpen(false);
                      }
                    }}
                    className="w-full text-left py-4 text-[16px] font-bold text-neutral-800 border-b border-neutral-50 last:border-0 hover:text-red-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      {item.name}
                      {item.name === 'Categorías' && <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {menuView === 'categories' && (
            <>
              {/* Back Button */}
              <div className="px-4 pt-4 mb-2">
                <button
                  onClick={() => setMenuView('main')}
                  className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#E2343E] hover:text-red-700 transition-colors py-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Regresar al Menú
                </button>
              </div>

              <div className="px-6 pt-2 pb-2">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Todas las Categorías</h3>
              </div>

              <div className="px-6 space-y-1 pt-2">
                {mainCategoriesForNav.length > 0 ? (
                  mainCategoriesForNav.map((name) => {
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
                        className="w-full flex items-center justify-between py-4 group hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-100">
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
                          <span className="text-sm font-bold text-gray-800 uppercase tracking-tight">
                            {name}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" />
                      </button>
                    );
                  })
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-xs text-gray-400 font-medium">Cargando categorías...</p>
                  </div>
                )}
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
          )}
          {menuView === 'sub' && (
            <div className="pt-2">
              {/* Submenu Header */}
              <div className="px-4 mb-6">
                <button
                  onClick={() => setMenuView('categories')}
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
        <div className="p-6 border-t border-gray-100 space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-3 w-full text-slate-900 group hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-xl">
                  <QrCode className="w-5 h-5 text-slate-900" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-black uppercase tracking-tight">Pagar con QR</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pago rápido digital</p>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-xl max-h-[85vh] bg-white border-2 border-slate-900 rounded-none p-0 overflow-hidden z-[200] flex flex-col">
              <DialogHeader className="bg-[#ffd814] p-3 border-b-2 border-slate-900 flex-shrink-0">
                <DialogTitle className="text-[13px] font-black uppercase tracking-[0.15em] text-[#0f1111] flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Pagar con QR
                </DialogTitle>
              </DialogHeader>
              <div className="p-1 flex flex-col items-center justify-center bg-white overflow-y-auto">
                <div className="w-full flex items-center justify-center bg-white">
                  <img
                    src="/Picsart_26-03-06_12-21-01-693.jpg (1).webp"
                    alt="QR de Pago"
                    className="w-full h-auto max-h-[70vh] object-contain"
                  />
                </div>
                <div className="mt-6 text-center space-y-2">
                  <p className="text-[14px] font-black uppercase tracking-tight text-slate-900">Escanea para pagar</p>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tienda 24/7 Digital</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>


        </div>
      </div>

      <nav
        className="relative hidden md:block bg-white border-t border-gray-100 border-b-2 border-neutral-300 z-[100] sticky top-0 shadow-lg"
        onMouseLeave={() => {
          categoryDropdownTimer.current = setTimeout(() => setOpenCategoryDropdown(null), 350);
        }}
      >
        <div className="container mx-auto px-4 md:px-8">
          <ul className="flex items-center h-[55px] gap-8 text-neutral-800">
            {/* Category Button - styled like the image */}
            <li className="flex-shrink-0">
              <button
                onMouseEnter={() => setOpenCategoryDropdown("Categories")}
                className="flex items-center gap-4 px-8 py-2.5 border border-gray-900 rounded-sm font-black text-[13px] uppercase tracking-tighter hover:bg-gray-50 transition-all text-gray-900"
              >
                TODAS LAS CATEGORIAS
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>
            </li>

            {/* Other Navigation Links */}
            <li className="flex items-center gap-8">
              <button
                onClick={() => navigate('/')}
                className="text-[16px] font-bold text-neutral-800 hover:text-red-600 transition-colors uppercase tracking-tight"
              >
                Inicio
              </button>
              <button
                onClick={() => navigate('/cotizacion')}
                className="text-[16px] font-bold text-neutral-800 hover:text-red-600 transition-colors uppercase tracking-tight"
              >
                Cotización
              </button>
              <button
                onClick={() => navigate('/promociones')}
                className="text-[16px] font-bold text-neutral-800 hover:text-red-600 transition-colors uppercase tracking-tight"
              >
                Promociones
              </button>
              <button
                onClick={() => navigate('/?tienda=true')}
                className="text-[16px] font-bold text-neutral-800 hover:text-red-600 transition-colors uppercase tracking-tight"
              >
                Tienda
              </button>
              <button
                onClick={() => navigate('/faq')}
                className="text-[16px] font-bold text-neutral-800 hover:text-red-600 transition-colors uppercase tracking-tight"
              >
                FAQ
              </button>
            </li>

            {/* Spacer for categories (we will handle the categories list separately if needed, but for now we follow the image) */}
            <div className="flex-1"></div>

          </ul>


        </div>

        {/* Dropdown Categorías (Mega-Menu) */}
        {openCategoryDropdown && (() => {
          const isAllCategories = openCategoryDropdown === "Categories";
          const subs = isAllCategories ? (mainCategories || []).filter(c => c.id !== "todos") : getSubsForMain(openCategoryDropdown);

          return (
            <div
              className={`fixed left-0 right-0 top-[112px] md:top-[155px] z-[500] pointer-events-none transition-all duration-300 ${openCategoryDropdown ? 'opacity-100' : 'opacity-0'}`}
              style={{ top: openCategoryDropdown ? undefined : '-100%' }}
            >
              <div
                className="mx-auto w-[95%] max-w-[1400px] z-[501] pointer-events-auto shadow-[0_40px_100px_rgba(0,0,0,0.2)] rounded-2xl overflow-hidden mt-1"
                onMouseEnter={() => {
                  if (categoryDropdownTimer.current) clearTimeout(categoryDropdownTimer.current);
                }}
              >
                <div className="bg-white border border-gray-100 rounded-b-2xl overflow-hidden">
                  {subs.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <HelpCircle className="w-8 h-8 text-red-500 animate-pulse" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">Cargando categorías...</h4>
                      <p className="text-gray-500 max-w-xs mt-2">Estamos recuperando el catálogo, por favor espera un momento.</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-red-600 text-white rounded-full font-bold text-sm uppercase tracking-widest hover:bg-black transition-colors"
                      >
                        Reintentar carga
                      </button>
                    </div>
                  ) : (
                    <div className="flex" style={{ maxHeight: '75vh' }}>
                      {/* Col 1: Level 1 Subcategories & Promo */}
                      <div className="w-[350px] bg-[#f8f9fa] p-5 flex flex-col overflow-y-auto border-r border-gray-100" style={{ maxHeight: '75vh' }}>
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
                            <Car className="w-4 h-4 text-white/80 group-hover:scale-110 transition-transform" />
                            <span>Búsqueda Por Modelo</span>
                          </button>
                        </div>
                      </div>

                      {/* Col 2: Level 2 Subcategories */}
                      <div className="w-[350px] border-l border-gray-100 p-5 flex flex-col bg-white overflow-y-auto" style={{ maxHeight: '75vh' }}>
                        {activeSub && (() => {
                          const nextLevelItems = isAllCategories
                            ? (subcategoriesByParent[activeSub.name] || [])
                            : (thirdLevelBySubcategory[activeSub.id || ''] || []);

                          return (
                            <div className="flex flex-col gap-1 h-full">
                              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-4">Categorías</h4>
                              {nextLevelItems.length > 0 ? (
                                nextLevelItems.map((s) => (
                                  <button
                                    key={s.id}
                                    onMouseEnter={() => setActiveThird(s)}
                                    onClick={() => goToCategory(s.name)}
                                    className={`flex items-center justify-between px-5 py-3.5 rounded-xl transition-all text-left group ${activeThird?.id === s.id ? 'bg-[#f8f9fa] text-black shadow-sm' : 'text-gray-500 hover:text-black hover:bg-[#f8f9fa]/50'}`}
                                  >
                                    <span className="text-[14px] font-bold tracking-tight">{s.name}</span>
                                    {(isAllCategories ? (thirdLevelBySubcategory[s.id || ''] || []).length > 0 : getFourthLevel(s.id || '').length > 0) && (
                                      <ChevronRight className={`w-4 h-4 transition-all ${activeThird?.id === s.id ? 'translate-x-1 opacity-100' : 'opacity-100 text-gray-300'}`} />
                                    )}
                                  </button>
                                ))
                              ) : (
                                <div className="px-5 py-8 mt-2 text-center border overflow-hidden bg-slate-50 border-gray-100 rounded-2xl flex-1 flex flex-col items-center justify-center group cursor-pointer hover:border-black/10 transition-colors" onClick={() => goToCategory(activeSub.name)}>
                                  <p className="text-gray-400 text-sm font-medium">Sin más clasificaciones en <br /><span className="font-bold text-black text-base mt-2 block">{activeSub.name}</span></p>
                                  <button
                                    className="mt-6 w-[85%] py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-md group-hover:scale-105 group-hover:bg-blue-600 transition-all"
                                  >
                                    Ver Productos
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Col 3: Level 3 Items */}
                      <div className="flex-1 p-10 bg-white overflow-y-auto border-l border-gray-100 min-h-0" style={{ maxHeight: '75vh' }}>
                        {activeThird ? (
                          (() => {
                            const finalLevelItems = isAllCategories
                              ? (getThirdsForSub(activeThird.id || ''))
                              : (getFourthLevel(activeThird.id || ''));

                            return (
                              <div className="flex flex-col gap-1">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-4">Productos</h4>
                                <div className="grid grid-cols-1 gap-y-1">
                                  {finalLevelItems.map((f) => (
                                    <button
                                      key={f.id}
                                      onClick={() => goToCategory(f.name)}
                                      className="text-left py-3 px-5 text-[14px] font-medium text-gray-500 hover:text-black hover:bg-[#f8f9fa] rounded-xl transition-all"
                                    >
                                      {f.name}
                                    </button>
                                  ))}
                                  {finalLevelItems.length === 0 && (
                                    <div className="px-5 py-10 text-center border-2 border-dashed border-gray-50 rounded-2xl">
                                      <p className="text-gray-400 text-sm">Explora toda la sección de <br /><span className="font-bold text-black">{activeThird.name}</span></p>
                                      <button
                                        onClick={() => goToCategory(activeThird.name)}
                                        className="mt-4 text-xs font-black uppercase underline decoration-2 underline-offset-4 pointer-events-auto"
                                      >
                                        Ver catálogo completo
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()
                        ) : activeSub ? (
                          <div className="h-full w-full flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto transition-all duration-300 animate-in fade-in zoom-in-95">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                              <Search className="w-8 h-8 text-gray-300" />
                            </div>
                            <h4 className="text-xl font-black text-gray-800">Sección {activeSub.name}</h4>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">
                              {(isAllCategories ? (getThirdsForSub(activeSub.id || '')) : (getThirdsForSub(activeSub.id || ''))).length > 0
                                ? "Selecciona una categoría de la izquierda para ver más detalles y productos específicos."
                                : "No existen más subcategorías para este departamento. Selecciona el botón para ver todo el inventario de esta sección."}
                            </p>
                            <button
                              onClick={() => goToCategory(activeSub.name)}
                              className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-black text-xs font-black uppercase tracking-widest rounded-full transition-colors mt-4 shadow-sm"
                            >
                              Ir al catálogo
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </nav>

      {/* Shared Dropdowns Overlays (Always available for both headers) */}
      <div className="relative z-[150]">
        {/* Shared Account Menu Dropdown */}
        {showAccountMenu && (
          <div
            className="fixed top-[135px] md:top-[85px] right-4 md:right-10 w-[280px] max-w-[calc(100vw-32px)] bg-white text-gray-900 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-50 z-[160] rounded-[28px] overflow-hidden p-6"
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
                  <p className="text-[17px] font-black text-gray-900">Hola, {user.email?.split('@')[0]}</p>
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
                    className="w-full py-3 px-4 border border-gray-900 text-gray-900 rounded-[12px] font-black text-[13px] uppercase tracking-widest transition-all hover:bg-gray-900 hover:text-white"
                  >
                    CERRAR SESIÓN
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                <div className="mb-2">
                  <p className="text-base font-black text-gray-900 uppercase tracking-tight">Bienvenido</p>
                  <p className="text-xs font-medium text-gray-400">Accede a tu cuenta 24/7</p>
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

        {/* Shared Favorites Dropdown Overlay */}
        {showFavoritesMenu && (
          <div
            className="fixed top-[135px] md:top-[85px] right-4 md:right-32 w-80 bg-white text-gray-900 shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-gray-100 z-[160] rounded-xl overflow-hidden p-4"
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
    </div>
  );
};

export default AdvancedHeader;
