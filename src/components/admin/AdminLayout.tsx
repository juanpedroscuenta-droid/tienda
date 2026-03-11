import React, { ReactNode, useState, useEffect, useRef } from 'react';
import {
  Bell,
  Search,
  User,
  ChevronDown,
  Moon,
  Sun,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Megaphone,
  HelpCircle,
  X,
  LayoutGrid,
  Home,
  Calendar,
  Pencil,
  MoreVertical,
  Zap
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
  isAdmin: boolean;
  isSubAdmin?: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navigateToHome: () => void;
  userName?: string;
  userAvatar?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  isAdmin,
  isSubAdmin = false,
  activeTab,
  setActiveTab,
  navigateToHome,
  userName = "Administrador",
  userAvatar
}) => {
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(3);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showPlanIADialog, setShowPlanIADialog] = useState(false);
  const [showAnunciosDialog, setShowAnunciosDialog] = useState(false);

  const displayName = user?.name || userName || "Usuario";
  const displayRole = user?.isAdmin ? "Administrador" : "Usuario";

  console.log('[AdminLayout] Render - showUserMenu:', showUserMenu, 'user:', user?.name);

  const handleLogout = async () => {
    console.log('[AdminLayout] handleLogout initiated');
    const confirmed = window.confirm('¿Estás seguro de que deseas cerrar sesión?');
    if (!confirmed) return;

    setShowUserMenu(false);
    try {
      await logout();
      // El logout de AuthContext ya redirige a '/', 
      // pero por si acaso forzamos un segundo intento si falla el primero
    } catch (err) {
      console.error('[AdminLayout] Logout error:', err);
      window.location.href = '/';
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Close user menu when clicking outside (robust ref-based check)
  useEffect(() => {
    console.log('[AdminLayout] useEffect - showUserMenu:', showUserMenu);
    if (!showUserMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      console.log('[AdminLayout] Click outside detected, contains:', userMenuRef.current?.contains(target));
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        console.log('[AdminLayout] Closing menu');
        setShowUserMenu(false);
      }
    };

    // Add slight delay to avoid immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showUserMenu]);

  // Header customized to match the design style
  const Header = () => {
    const [dateRange] = useState("2025-12-28 → 2026-01-27");

    const handleHelpClick = () => {
      console.log('[AdminLayout] Help icon clicked, navigating to help-manual');
      setActiveTab('help-manual');
    };

    const handleSparklesClick = () => {
      setShowPlanIADialog(true);
    };

    const handleMegaphoneClick = () => {
      setShowAnunciosDialog(true);
    };

    const handleBellClick = () => {
      console.log('[AdminLayout] Bell button clicked');
      // Mostrar notificaciones
      alert('Tienes ' + notificationsCount + ' notificaciones');
    };

    const handleSettingsClick = () => {
      console.log('[AdminLayout] Settings clicked');
      setActiveTab('configuration');
      setShowUserMenu(false);
    };

    const handleAvatarClick = () => {
      console.log('[AdminLayout] Avatar clicked, current showUserMenu:', showUserMenu);
      setShowUserMenu(prev => {
        console.log('[AdminLayout] Setting showUserMenu from', prev, 'to', !prev);
        return !prev;
      });
    };

    return (
      <div className="flex flex-col w-full z-30">
        {/* Top Notification Bar - Solid Blue */}
        <div className="bg-blue-500 text-white px-5 py-2 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center space-x-2 flex-1 justify-center">
            <span>Plan deluxe ilimitado websy</span>
            <button className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-0.5 rounded text-xs font-semibold transition-colors">
              Resolve
            </button>
          </div>
        </div>

        {/* Main Header Toolbar */}
        <header className="bg-white border-b border-slate-100 flex items-center justify-between px-6 py-3 z-20">
          {/* Left Section */}
          <div className="flex items-center space-x-3">
            {/* Navigation Chevrons */}
            <div className="flex items-center space-x-1 text-slate-400">
              <button className="p-1 hover:bg-slate-50 rounded transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-medium">1 / 1</span>
              <button className="p-1 hover:bg-slate-50 rounded transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Dropdown Icons */}
            <div className="flex items-center space-x-1.5">
              <button className="flex items-center p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                <LayoutGrid className="h-3.5 w-3.5 text-slate-500" />
                <ChevronDown className="h-2.5 w-2.5 text-slate-400 ml-0.5" />
              </button>
              <button className="flex items-center p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                <Home className="h-3.5 w-3.5 text-slate-500" />
                <ChevronDown className="h-2.5 w-2.5 text-slate-400 ml-0.5" />
              </button>
            </div>

            {/* Dashboard Title */}
            <div className="flex flex-col ml-1.5">
              <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
                Dashboard
              </h1>
              <a href="#" className="text-xs text-blue-500 hover:text-blue-600 font-medium mt-0.5">
                + Quick Filters
              </a>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Date Range Selector */}
            <button className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 hover:bg-slate-100 transition-colors">
              <span>{dateRange}</span>
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Starburst Icon */}
            <button className="p-1.5 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition-colors">
              <Zap className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {/* Edit Dashboard Button */}
            <button
              onClick={() => console.log('[AdminLayout] Edit Dashboard clicked')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit Dashboard</span>
            </button>

            {/* More Options */}
            <button className="p-1.5 text-slate-400 hover:text-slate-500 transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Circular Action Icons */}
            <div className="flex items-center space-x-1.5 ml-1">
              {/* Home Button - Ir a la tienda */}
              <button
                onClick={navigateToHome}
                className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center hover:bg-blue-100 hover:text-blue-700 transition-all active:scale-95 cursor-pointer touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                type="button"
                title="Ir a la tienda (Ecommerce)"
              >
                <Home className="h-4 w-4" />
              </button>

              {/* Plan sin IA - Blue */}
              <button
                onClick={handleSparklesClick}
                className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center hover:bg-blue-500 transition-all active:scale-95 cursor-pointer touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                type="button"
                title="Plan IA"
              >
                <Sparkles className="h-4 w-4" />
              </button>

              {/* Anuncios Websy */}
              <button
                onClick={handleMegaphoneClick}
                className="w-8 h-8 rounded-full bg-slate-400 text-white flex items-center justify-center hover:bg-slate-500 transition-all active:scale-95 cursor-pointer touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                type="button"
                title="Anuncios Websy"
              >
                <Megaphone className="h-4 w-4" />
              </button>

              {/* Bell - Orange */}
              <button
                onClick={handleBellClick}
                className="w-8 h-8 rounded-full bg-orange-400 text-white flex items-center justify-center hover:bg-orange-500 transition-all active:scale-95 cursor-pointer touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                type="button"
                title="Notificaciones"
              >
                <Bell className="h-4 w-4" />
              </button>

              {/* Help - Blue */}
              <button
                onClick={handleHelpClick}
                className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center hover:bg-blue-500 transition-all active:scale-95 cursor-pointer touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                type="button"
                title="Manual de Ayuda"
              >
                <HelpCircle className="h-4 w-4" />
              </button>

              {/* User Avatar - Green */}
              <div className="relative ml-0.5" ref={userMenuRef}>
                <button
                  onClick={handleAvatarClick}
                  className="w-8 h-8 rounded-full bg-green-400 text-white flex items-center justify-center font-semibold text-xs hover:bg-green-500 transition-all active:scale-95 cursor-pointer relative z-50 touch-manipulation"
                  type="button"
                  style={{ pointerEvents: 'auto', WebkitTapHighlightColor: 'transparent' }}
                >
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    displayName.substring(0, 2).toUpperCase()
                  )}
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-[9999] animate-in slide-in-from-top-5 duration-200">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-700">{displayName}</p>
                      <p className="text-xs text-slate-500">{displayRole}</p>
                    </div>
                    <ul>
                      <li>
                        <button className="flex items-center space-x-3 w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                          <User className="h-4 w-4 text-slate-400" />
                          <span>Mi perfil</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={handleSettingsClick}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                        >
                          <Settings className="h-4 w-4 text-slate-400" />
                          <span>Configuración</span>
                        </button>
                      </li>
                      <li className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Cerrar sesión</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dialog: Plan sin IA */}
        <Dialog open={showPlanIADialog} onOpenChange={setShowPlanIADialog}>
          <DialogContent className="max-w-md rounded-xl border-slate-200">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-800">
                <Sparkles className="h-5 w-5 text-[hsl(214,100%,38%)]" />
                Plan sin IA
              </DialogTitle>
              <DialogDescription className="text-slate-600 text-left pt-2 space-y-2">
                <p className="font-medium">La IA potencia tu negocio.</p>
                <p className="text-sm">
                  Actualmente estás en el plan básico. Potencia tus ventas, automatiza respuestas y mejora la experiencia de tus clientes con nuestro asistente de inteligencia artificial.
                </p>
                <p className="text-sm">
                  Contáctanos para conocer los planes con IA disponibles.
                </p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* Dialog: Anuncios Websy */}
        <Dialog open={showAnunciosDialog} onOpenChange={setShowAnunciosDialog}>
          <DialogContent className="max-w-md rounded-xl border-slate-200">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-800">
                <Megaphone className="h-5 w-5 text-slate-500" />
                Anuncios Websy
              </DialogTitle>
              <DialogDescription className="text-slate-600 text-left pt-2">
                <p className="text-sm">
                  Aquí aparecerán anuncios generales de Websy con sus asociados.
                </p>
                <p className="text-sm mt-3 text-slate-500">
                  Próximamente podrás ver novedades, ofertas y comunicaciones relevantes para tu negocio.
                </p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className={cn("flex-shrink-0", isMobile ? "hidden" : "block")}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdmin={isAdmin}
          isSubAdmin={isSubAdmin}
          navigateToHome={navigateToHome}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />

        {/* Tab Title and Context - Removed typical page header, moved inside content components or specific dashboard header */}
        {activeTab !== 'dashboard' && (
          <div className="bg-white px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">
              {sidebarItems.find(item => item.id === activeTab)?.label}
            </h2>
            <div className="flex items-center text-sm text-slate-500 mt-1">
              <span>Application</span>
              <span className="mx-2">/</span>
              <span className="text-blue-500 font-medium">{sidebarItems.find(item => item.id === activeTab)?.label}</span>
            </div>
          </div>
        )}

        {/* Content Container with Scroll */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Import sidebarItems here so they're accessible to both components
const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', description: 'Vista general del sistema' },
  { id: 'products', label: 'Productos', description: 'Gestión de inventario' },
  { id: 'orders', label: 'Pedidos', description: 'Control de ventas' },
  { id: 'categories', label: 'Categorías', description: 'Organizar productos' },
  { id: 'subaccounts', label: 'Subcuentas', description: 'Gestión de accesos' },
  { id: 'management', label: 'Gestión', description: 'Administración de recursos' },
  { id: 'analytics', label: 'Analítica', description: 'Estadísticas avanzadas' },
  { id: 'info', label: 'Info Secciones', description: 'Configuración general' },
  { id: 'ai-assistant', label: 'Asistente IA', description: 'Inteligencia artificial' },
  { id: 'emails', label: 'Correos', description: 'Bandeja de entrada' },
  { id: 'image-library', label: 'Biblioteca', description: 'Gestión de imágenes' },
  { id: 'help-manual', label: 'Manual de Ayuda', description: 'Guías y tutoriales' },
  { id: 'revisiones', label: 'Revisiones', description: 'Aprobar cambios' }
];

export default AdminLayout;
