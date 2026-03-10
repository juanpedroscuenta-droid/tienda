import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { TopPromoBar } from '@/components/layout/TopPromoBar';
import { AdvancedHeader } from '@/components/layout/AdvancedHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/use-categories';
import { useBold } from '@/hooks/use-bold';
import { toast } from '@/hooks/use-toast';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  Info,
  Ticket,
  CreditCard,
} from 'lucide-react';
import { db } from '@/firebase';
import { createOrder, validateCouponByCode, fetchProducts, markCouponAsUsed } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Componente Card local para diseño base estilo Amazon
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className || ''}`}>
    {children}
  </div>
);

// Separador local para evitar error 504 de Vite
const LocalSeparator = () => <div className="h-[1px] w-full bg-gray-200 my-4" />;

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeFromCart,
    getTotal,
    getDiscountedTotal,
    clearCart,
    appliedCoupon,
    setAppliedCoupon,
    addToCart
  } = useCart();

  const { user, isAuthenticated } = useAuth();
  const { categories, mainCategories, subcategoriesByParent, thirdLevelBySubcategory } = useCategories();
  const { openCheckout } = useBold();

  const [promoVisible, setPromoVisible] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isPayingOnline, setIsPayingOnline] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [recommendedProduct, setRecommendedProduct] = useState<Product | null>(null);

  // --- CÁLCULOS MOVIDOS ARRIBA PARA EVITAR TDZ ---
  const subtotal = getTotal();
  const deliveryLimit = 133000;
  const deliveryFee = subtotal >= deliveryLimit ? 0 : 7000;
  const deliveryRemaining = Math.max(0, deliveryLimit - subtotal);
  const deliveryProgress = Math.min(100, (subtotal / deliveryLimit) * 100);
  const finalTotal = getDiscountedTotal() + deliveryFee;
  const discount = subtotal - getDiscountedTotal();

  useEffect(() => {
    if (isAuthenticated && user) {
      setUserName(user.name || '');
      setUserEmail(user.email || '');
      setUserPhone(user.phone || '');

      const isSupabase = typeof (db as any)?.from === 'function';
      if (isSupabase && user.id) {
        (db as any).from('users').select('*').eq('id', user.id).maybeSingle()
          .then(({ data }: any) => {
            if (data?.phone) setUserPhone(data.phone);
            else if (data?.telefono) setUserPhone(data.telefono);
          })
          .catch(() => { });
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const getRecommendations = async () => {
      try {
        const allProducts = await fetchProducts();
        if (allProducts && allProducts.length > 0) {
          const inCartIds = items.map(item => item.id);
          const candidates = allProducts.filter(p => !inCartIds.includes(p.id));
          const list = candidates.length > 0 ? candidates : allProducts;
          const randomIdx = Math.floor(Math.random() * list.length);
          setRecommendedProduct(list[randomIdx]);
        }
      } catch (error) {
        console.error("Error fetching recommended products:", error);
      }
    };
    getRecommendations();
  }, [items]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidatingCoupon(true);
    try {
      const result = await validateCouponByCode(couponCode);
      if (result.valid) {
        setAppliedCoupon(result.coupon);
        markCouponAsUsed(result.coupon.id, user?.id || null, userName || user?.name || 'Cliente invitado', userEmail || user?.email || null);
        toast({ title: "¡Epa!", description: "Cupón canjeado con éxito" });
        setCouponCode('');
      } else {
        toast({ title: "Ops", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Ocurrió un error al validar el cupón", variant: "destructive" });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated || !user) {
      toast({ title: "Inicia sesión", description: "Debes iniciar sesión para realizar un pedido", variant: "destructive" });
      return;
    }
    if (items.length === 0) return;

    setIsCheckingOut(true);
    const message =
      `🛒 *NUEVO PEDIDO - TIENDA 24-7*\n\n` +
      `👤 *Nombre:* ${userName}\n📧 *Email:* ${userEmail}\n📱 *Teléfono:* ${userPhone || 'No especificado'}\n\n` +
      `*📦 PRODUCTOS:*\n${items.map(i => `- ${i.name} x${i.quantity}`).join('\n')}\n` +
      (appliedCoupon ? `\n🎫 *Cupón:* ${appliedCoupon.code} (-$${discount.toLocaleString('es-CO')})\n` : '') +
      `\n💰 *TOTAL A PAGAR: $${finalTotal.toLocaleString('es-CO')}*\n\n` +
      `⏰ ${new Date().toLocaleDateString()} - Pedido por WhatsApp`;

    const whatsappUrl = `https://wa.me/573212619434?text=${encodeURIComponent(message)}`;

    try {
      await createOrder({
        user_id: user.id,
        items: items.map(i => ({ ...i, price: Number(i.price) })),
        total: finalTotal,
        delivery_fee: deliveryFee,
        order_notes: orderNotes || null,
        status: 'pending',
        payment_method: 'whatsapp',
        userName,
        userEmail,
        userPhone
      });

      window.open(whatsappUrl, '_blank');
      clearCart();
      navigate('/');
    } catch (e) {
      toast({ title: "Error", description: "No se pudo guardar el pedido", variant: "destructive" });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!isAuthenticated || !user) {
      toast({ title: "Inicia sesión", description: "Debes iniciar sesión para pagar", variant: "destructive" });
      return;
    }
    setIsPayingOnline(true);
    try {
      const order = await createOrder({
        user_id: user.id,
        items: items.map(i => ({ ...i, price: Number(i.price) })),
        total: finalTotal,
        delivery_fee: deliveryFee,
        status: 'pending_payment',
        payment_method: 'bold',
        userName,
        userEmail,
        userPhone
      });

      const apiBaseUrl = import.meta.env.VITE_BACKEND_URL || `http://localhost:3001/api`;
      const res = await fetch(`${apiBaseUrl}/payments/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, amount: finalTotal, description: 'Compra Tienda 24-7', userName, userEmail })
      });

      if (!res.ok) throw new Error('Error en pasarela');
      const sessionData = await res.json();

      // Bold requiere que la URL de redirección use HTTPS.
      // En local, window.location.origin = 'http://localhost:...' que Bold rechaza.
      // Usamos la URL de producción como fallback para pruebas locales.
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const redirectBase = isLocalhost
        ? 'https://regalaalgo.com'
        : window.location.origin;
      const redirectionUrl = `${redirectBase}/pago-resultado`;

      openCheckout({
        ...sessionData,
        redirectionUrl,
      });
      clearCart();
    } catch (e: any) {
      toast({ title: "Error de Pago", description: e.message, variant: "destructive" });
    } finally {
      setIsPayingOnline(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eaeded]">
      <TopPromoBar setPromoVisible={setPromoVisible} />
      <AdvancedHeader
        categories={categories}
        selectedCategory="Todos"
        setSelectedCategory={(cat) => navigate(cat === 'Todos' ? '/' : `/categoria/${encodeURIComponent(cat)}`)}
        promoVisible={promoVisible}
        mainCategories={mainCategories}
        subcategoriesByParent={subcategoriesByParent}
        thirdLevelBySubcategory={thirdLevelBySubcategory}
      />

      <main className="max-w-[1500px] mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* COLUMNA IZQUIERDA */}
          <div className="space-y-4">
            <Card className="p-4 md:p-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <h1 className="text-2xl md:text-3xl font-medium text-[#0f1111]">Carrito de compras</h1>
                <span className="text-sm text-[#565959] hidden md:block">Precio</span>
              </div>

              {items.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingCart className="h-12 w-12 text-gray-200" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h3>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">Cuando agregues productos a tu carrito aparecerán aquí. ¡Explora nuestras ofertas!</p>
                  <Button onClick={() => navigate('/')} className="bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold rounded-lg px-10 h-12 transition-all shadow-sm">
                    Volver a la tienda
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <div key={item.id} className="py-6 flex flex-col md:grid md:grid-cols-[160px_1fr_auto] gap-4 md:gap-6">
                      {/* Imagen */}
                      <div className="w-full max-w-[120px] md:max-w-none aspect-square bg-white rounded-lg border border-gray-100 flex items-center justify-center p-2 mx-auto md:mx-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logo.webp';
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex flex-col justify-between min-w-0">
                        <div className="space-y-1">
                          <h4 className="text-base sm:text-lg font-medium text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer leading-tight break-words">
                            {item.name}
                          </h4>
                          <p className="text-xs text-green-700 font-bold mt-1">✓ En stock</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-6">
                          <div className="flex items-center border border-gray-300 rounded-lg bg-[#f0f2f2] shadow-sm overflow-hidden h-8 sm:h-9">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-3 hover:bg-gray-200 transition-colors border-r border-gray-300 disabled:opacity-50"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 sm:px-4 bg-white h-full flex items-center font-bold text-sm min-w-[36px] sm:min-w-[40px] justify-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-3 hover:bg-gray-200 transition-colors border-l border-gray-300"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="hidden sm:block w-[1px] h-4 bg-gray-200" />
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-xs text-[#007185] hover:underline"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {/* Precio */}
                      <div className="text-left md:text-right pt-2 md:pt-0">
                        <span className="md:hidden text-sm text-gray-500 mr-2">Precio:</span>
                        <p className="inline md:block text-xl font-bold text-[#0f1111]">
                          COP {item.price.toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-6 text-right">
                    <p className="text-xl md:text-2xl text-[#0f1111]">
                      Subtotal ({items.length} productos): <span className="font-bold">COP {subtotal.toLocaleString('es-CO')}</span>
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="space-y-4">
            <Card className="p-5 flex flex-col gap-4 sticky top-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${subtotal >= deliveryLimit ? 'bg-green-600' : 'bg-gray-200'}`}>
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {subtotal >= deliveryLimit ? '¡Envío GRATIS calificado!' : 'Envío estándar'}
                  </p>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full transition-all duration-700 ease-out ${subtotal >= deliveryLimit ? 'bg-green-600' : 'bg-blue-600'}`}
                    style={{ width: `${deliveryProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {subtotal >= deliveryLimit
                    ? 'Tu pedido califica para envío gratis.'
                    : `Agrega COP ${(deliveryLimit - subtotal).toLocaleString()} más para envío GRATIS.`}
                </p>
              </div>

              <div className="py-2">
                <div className="text-xl md:text-2xl font-medium text-[#0f1111]">
                  Subtotal: <span className="font-bold">COP {subtotal.toLocaleString('es-CO')}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleOnlinePayment}
                  disabled={isPayingOnline || items.length === 0}
                  className="w-full h-12 bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold rounded-xl shadow-sm border border-[#fcd200] text-base"
                >
                  {isPayingOnline ? 'Cargando Bold...' : 'Pagar sesión Segura'}
                </Button>
                <Button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || items.length === 0}
                  className="w-full h-12 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold rounded-xl shadow-sm text-base flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Pedir por WhatsApp
                </Button>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-2">
                <button className="text-sm text-[#007185] hover:underline flex items-center gap-2 text-left">
                  <Info className="w-4 h-4" />
                  Información sobre envíos y devoluciones
                </button>
              </div>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
};

export default CartPage;
