import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { Suspense, lazy, useEffect } from "react";
import { CacheProvider } from "@/contexts/CacheContext";
import { SimulationNotice } from "@/components/ui/SimulationNotice";
import { WebsiteVisitTracker } from "@/components/analytics/WebsiteVisitTracker";
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
const HabeasDataPage = lazy(() => import("./pages/HabeasDataPage"));
const TransparenciaPage = lazy(() => import("./pages/TransparenciaPage"));
const RastreoPage = lazy(() => import("./pages/RastreoPage"));
const GarantiaPage = lazy(() => import("./pages/GarantiaPage"));
const ContactoPage = lazy(() => import("./pages/ContactoPage"));
const FacturacionPage = lazy(() => import("./pages/FacturacionPage"));
const SICPage = lazy(() => import("./pages/SICPage"));
const CambiosPage = lazy(() => import("./pages/CambiosPage"));

const queryClient = new QueryClient();

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
                  <WebsiteVisitTracker />
                  <Suspense fallback={<div className="min-h-screen bg-white"></div>}>
                    <Routes>
                      {/* Define home page as a base for many views if needed */}
                      <Route path="/" element={<AdvancedIndex />} />

                      {/* Modal-like routes that show site behind them */}
                      <Route path="/login" element={<><AdvancedIndex /><LoginPage /></>} />
                      <Route path="/register" element={<><AdvancedIndex /><RegisterPage /></>} />

                      <Route path="/categoria/:categorySlug" element={<CategoryViewPage />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/admin" element={<AdminPanel />} />
                      <Route path="/perfil" element={<UserProfile />} />
                      <Route path="/favoritos" element={<FavoritesPage />} />
                      <Route path="/producto/:slug" element={<ProductDetailPage />} />
                      <Route path="/sobre-nosotros" element={<AboutUs />} />
                      <Route path="/envios" element={<Envios />} />
                      <Route path="/testimonios" element={<Testimonios />} />
                      <Route path="/retiros" element={<Retiros />} />
                      <Route path="/preguntas-frecuentes" element={<FAQPage />} />
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
                      <Route path="/habeas-data" element={<HabeasDataPage />} />
                      <Route path="/transparencia" element={<TransparenciaPage />} />
                      <Route path="/rastreo" element={<RastreoPage />} />
                      <Route path="/garantia" element={<GarantiaPage />} />
                      <Route path="/contacto" element={<ContactoPage />} />
                      <Route path="/facturacion" element={<FacturacionPage />} />
                      <Route path="/sic" element={<SICPage />} />
                      <Route path="/cambios" element={<CambiosPage />} />
                      <Route path="/devoluciones" element={<CambiosPage />} />
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
