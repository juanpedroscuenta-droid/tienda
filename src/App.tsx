import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { CacheProvider } from "@/contexts/CacheContext";
import { SimulationNotice } from "@/components/ui/SimulationNotice";
import { FavoritesProvider } from "@/contexts/FavoritesContext";

// Lazy loading de las páginas para mejorar el rendimiento
const AdvancedIndex = lazy(() => import("./pages/AdvancedIndex"));
const AdminPanel = lazy(() => import("./pages/AdminPanel").then(module => ({ default: module.AdminPanel })));
const NotFound = lazy(() => import("./pages/NotFound"));
const UserProfile = lazy(() => import("@/components/user/UserProfile").then(module => ({ default: module.UserProfile })));
const ProductDetailPage = lazy(() => import("./pages/ProductDetail"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Retiros = lazy(() => import("./pages/Retiros"));
const SharedEmployeeManager = lazy(() => import("./pages/SharedEmployeeManager"));
const ImageDownloaderPage = lazy(() => import("./pages/ImageDownloaderPage"));
const ImageUrlUpdaterPage = lazy(() => import("./pages/ImageUrlUpdaterPage"));
const AdminImageOrientation = lazy(() => import("./pages/AdminImageOrientation"));
const Testimonios = lazy(() => import("./pages/Testimonios"));
const Envios = lazy(() => import("./pages/Envios"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const CategoryViewPage = lazy(() => import("./pages/CategoryViewPage"));
const AuthPage = lazy(() => import("./pages/AuthPage").then(module => ({ default: module.AuthPage })));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const CartPage = lazy(() => import("./pages/CartPage").then(m => ({ default: m.CartPage })));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const NosotrosPage = lazy(() => import("./pages/NosotrosPage"));
const MarcasPage = lazy(() => import("./pages/MarcasPage"));
const ServiciosPage = lazy(() => import("./pages/ServiciosPage"));
const TerminosPage = lazy(() => import("./pages/TerminosPage"));
const PromocionesPage = lazy(() => import("./pages/PromocionesPage"));

const RastreoPage = lazy(() => import("./pages/RastreoPage"));
const GarantiaPage = lazy(() => import("./pages/GarantiaPage"));
const ContactoPage = lazy(() => import("./pages/ContactoPage"));
const FacturacionPage = lazy(() => import("./pages/FacturacionPage"));
const SICPage = lazy(() => import("./pages/SICPage"));
const CambiosPage = lazy(() => import("./pages/CambiosPage"));
const SupplierCatalogForm = lazy(() => import("./pages/SupplierCatalogForm"));
const SupplierCatalogView = lazy(() => import("./pages/SupplierCatalogView"));
const NewArrivalsPage = lazy(() => import("./pages/NewArrivalsPage"));
const CotizacionPage = lazy(() => import("./pages/CotizacionPage"));
const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage").then(m => ({ default: m.PaymentResultPage })));

const queryClient = new QueryClient();

/**
 * ⚡ PERFORMANCE FIX: Frozen Admin Panel
 * This wrapper completely isolates the 2700-line AdminPanel from React updates 
 * while it's hidden. It prevents store navigation from causing admin re-renders.
 */
const AdminPanelFreezer = React.memo(({ children, active }: { children: React.ReactNode, active: boolean }) => {
  const lastChildren = useRef(children);

  if (active) {
    lastChildren.current = children;
  }

  return (
    <div style={{
      display: active ? 'block' : 'none',
      visibility: active ? 'visible' : 'hidden',
      pointerEvents: active ? 'auto' : 'none'
    }}>
      {lastChildren.current}
    </div>
  );
}, (prev, next) => prev.active === next.active);

const PersistentAdminPanel = () => {
  const location = useLocation();
  const isOnAdmin = location.pathname === '/admin';
  const hasVisitedRef = useRef(false);

  if (isOnAdmin && !hasVisitedRef.current) {
    hasVisitedRef.current = true;
  }

  if (!hasVisitedRef.current) return null;

  return (
    <div
      style={{
        display: isOnAdmin ? 'block' : 'none',
        position: isOnAdmin ? 'relative' : 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: isOnAdmin ? 'auto' : -1,
        visibility: isOnAdmin ? 'visible' : 'hidden',
        pointerEvents: isOnAdmin ? 'auto' : 'none',
        background: 'white'
      }}
    >
      <AdminPanelFreezer active={isOnAdmin}>
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
          <AdminPanel />
        </Suspense>
      </AdminPanelFreezer>
    </div>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  useEffect(() => {
    // Prevenir traducción automática - soluciona problemas de pantalla blanca
    const preventTranslation = () => {
      // Meta tag para Google Translate
      const metaTranslate = document.querySelector('meta[name="google"]') as HTMLMetaElement;
      if (!metaTranslate) {
        const meta = document.createElement('meta');
        meta.name = 'google';
        meta.content = 'notranslate';
        document.head.appendChild(meta);
      }

      // Añadir clases notranslate a elementos críticos
      document.documentElement.classList.add('notranslate');
      document.body.classList.add('notranslate');

      // Añadir estilos para prevenir problemas
      const styleEl = document.getElementById('notranslate-styles');
      if (!styleEl) {
        const style = document.createElement('style');
        style.id = 'notranslate-styles';
        style.textContent = `
          .notranslate {
            translate: no !important;
          }
          [translate="no"] {
            translate: no !important;
          }
        `;
        document.head.appendChild(style);
      }
    };

    preventTranslation();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Agregamos CacheProvider para mejorar el rendimiento */}
      <CacheProvider config={{ maxAge: 24 * 60 * 60 * 1000 }}> {/* 24 horas */}
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <SimulationNotice />
                <BrowserRouter>
                  {/* Global Scroll to top for every route change */}
                  <ScrollToTop />
                  {/* ⚡ Persistent Admin Panel — stays mounted across navigations */}
                  <PersistentAdminPanel />

                  <Suspense fallback={<div className="min-h-screen bg-white"></div>}>
                    <Routes>
                      {/* Define home page as a base for many views if needed */}
                      <Route path="/" element={<AdvancedIndex />} />

                      {/* Modal-like routes that show site behind them */}
                      <Route path="/login" element={<><AdvancedIndex /><LoginPage /></>} />
                      <Route path="/register" element={<><AdvancedIndex /><RegisterPage /></>} />

                      <Route path="/categoria/:categorySlug" element={<CategoryViewPage />} />
                      <Route path="/cotizacion" element={<CotizacionPage />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      {/* Admin route now renders nothing — PersistentAdminPanel handles it */}
                      <Route path="/admin" element={<></>} />
                      <Route path="/perfil" element={<UserProfile />} />
                      <Route path="/favoritos" element={<FavoritesPage />} />
                      <Route path="/producto/:slug" element={<ProductDetailPage />} />
                      <Route path="/sobre-nosotros" element={<AboutUs />} />
                      <Route path="/envios" element={<Envios />} />
                      <Route path="/testimonios" element={<Testimonios />} />
                      <Route path="/retiros" element={<Retiros />} />
                      <Route path="/preguntas-frecuentes" element={<FAQPage />} />
                      <Route path="/faq" element={<FAQPage />} />
                      <Route path="/shared/employees" element={<SharedEmployeeManager />} />
                      <Route path="/admin/image-downloader" element={<ImageDownloaderPage />} />
                      <Route path="/admin/update-image-urls" element={<ImageUrlUpdaterPage />} />
                      <Route path="/admin/rotate-image" element={<AdminImageOrientation />} />
                      {/* Footer info pages */}
                      <Route path="/nosotros" element={<NosotrosPage />} />
                      <Route path="/marcas" element={<MarcasPage />} />
                      <Route path="/servicios" element={<ServiciosPage />} />
                      <Route path="/terminos" element={<TerminosPage />} />
                      <Route path="/promociones" element={<PromocionesPage />} />

                      <Route path="/rastreo" element={<RastreoPage />} />
                      <Route path="/garantia" element={<GarantiaPage />} />
                      <Route path="/contacto" element={<ContactoPage />} />
                      <Route path="/facturacion" element={<FacturacionPage />} />
                      <Route path="/sic" element={<SICPage />} />
                      <Route path="/cambios" element={<CambiosPage />} />
                      <Route path="/devoluciones" element={<CambiosPage />} />
                      <Route path="/supplier-upload/:supplierId" element={<SupplierCatalogForm />} />
                      <Route path="/supplier-catalog/:supplierId" element={<SupplierCatalogView />} />
                      <Route path="/nuevos" element={<NewArrivalsPage />} />
                      <Route path="/pago-resultado" element={<PaymentResultPage />} />
                      <Route path="/carrito" element={<CartPage />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </CacheProvider>
    </QueryClientProvider>
  );
};



export default App;
