import React, { useState, useEffect } from 'react';
import { Product } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { TopPromoBar } from '@/components/layout/TopPromoBar';
import { AdvancedHeader } from '@/components/layout/AdvancedHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/use-categories';
import { toast } from '@/hooks/use-toast';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  ArrowLeft,
  Info,
  ChevronDown,
  Gift,
  Ticket,
  ExternalLink,
  Share2
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
    setAppliedCoupon
  } = useCart();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { categories, mainCategories, subcategoriesByParent, thirdLevelBySubcategory } = useCategories();
  const [promoVisible, setPromoVisible] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [recommendedProduct, setRecommendedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      setUserName(user.name || '');
      setUserEmail(user.email || '');
      setUserPhone(user.phone || '');

      const isSupabase = typeof (db as any)?.from === 'function';
      if (isSupabase && user.id) {
        (db as any).from('users').select('phone, telefono').eq('id', user.id).maybeSingle()
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
          // Filter to avoid suggesting products already in cart if possible
          const inCartIds = items.map(item => item.id);
          const candidates = allProducts.filter(p => !inCartIds.includes(p.id));
          const list = candidates.length > 0 ? candidates : allProducts;

          // Randomly pick one
          const randomIdx = Math.floor(Math.random() * list.length);
          setRecommendedProduct(list[randomIdx]);
        }
      } catch (error) {
        console.error("Error fetching recommended products:", error);
      }
    };
    getRecommendations();
  }, [items]);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) removeFromCart(productId);
    else updateQuantity(productId, newQuantity);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    console.log(`[CartPage] Intentando validar cupón: ${couponCode} - Nota: Esto NO aumenta el contador de uso todavía.`);
    setIsValidatingCoupon(true);
    try {
      const result = await validateCouponByCode(couponCode);
      if (result.valid) {
        setAppliedCoupon(result.coupon);
        console.log(`[CartPage] Cupón validado, marcando uso inmediatamente...`);
        markCouponAsUsed(result.coupon.id, user?.id || null, userName || user?.name || 'Cliente invitado', userEmail || user?.email || null);
        toast({ title: "¡Epa!", description: "Cupón canjeado con éxito", variant: "default" });
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
    console.log(`[CartPage] Iniciando proceso de checkout (Proceder al pago)...`);

    if (!isAuthenticated || !user) {
      toast({ title: "Inicia sesión", description: "Debes iniciar sesión para realizar un pedido", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Carrito vacío", description: "Agrega productos antes de continuar", variant: "destructive" });
      return;
    }
    if (!userName || !userEmail) {
      toast({ title: "Datos incompletos", description: "No se pudo obtener tu nombre o email.", variant: "destructive" });
      return;
    }

    setIsCheckingOut(true);
    const subtotal = getTotal();
    const finalTotal = getDiscountedTotal() + deliveryFee;
    const discount = subtotal - getDiscountedTotal();

    console.log(`[CartPage] Total de la orden calculado. Cupón aplicado en esta compra:`, appliedCoupon?.code || 'Ninguno');

    const message =
      `🛒 *NUEVO PEDIDO - TIENDA 24-7*\n\n` +
      `👤 *Nombre:* ${userName}\n📧 *Email:* ${userEmail}\n📱 *Teléfono:* ${userPhone || 'No especificado'}\n\n` +
      `*📦 PRODUCTOS:*\n${items.map(i => `- ${i.name} x${i.quantity}${i.selectedColor ? ` (${i.selectedColor.name})` : ''}`).join('\n')}\n` +
      (appliedCoupon ? `\n🎫 *Cupón:* ${appliedCoupon.code} (-$${discount.toLocaleString('es-CO')})\n` : '') +
      (orderNotes ? `\n*Notas:* ${orderNotes}\n` : '') +
      `\n💰 *TOTAL A PAGAR: $${finalTotal.toLocaleString('es-CO')}*\n\n` +
      `⏰ ${new Date().toLocaleDateString('es-CO')} - ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}\n✅ Confirma disponibilidad y entrega.`;

    const whatsappUrl = `https://wa.me/573212619434?text=${encodeURIComponent(message)}`;

    try {
      const orderPayload = {
        user_id: user.id,
        items: items.map((i: any) => ({
          id: i.id,
          name: i.name,
          price: Number(i.price),
          quantity: i.quantity,
          image: i.image,
          selectedColor: i.selectedColor
        })),
        total: finalTotal,
        delivery_fee: deliveryFee,
        order_notes: orderNotes || null,
        status: 'pending',
        coupon_code: appliedCoupon?.code || null,
        discount_value: discount
      };

      console.log(`[CartPage] Enviando petición a la base de datos para crear la orden y descontar el uso del cupón...`, orderPayload);
      const ordenCreada = await createOrder({ ...orderPayload, userName, userEmail, userPhone });
      console.log(`[CartPage] ¡Orden creada exitosamente en la base de datos! ID:`, ordenCreada?.id || 'OK');

      // Solo continuar si la orden se guardó exitosamente
      window.open(whatsappUrl, '_blank');
      setTimeout(() => {
        clearCart();
        setOrderNotes('');
        setAppliedCoupon(null);
        toast({ title: "¡Pedido enviado!", description: "Te contactaremos pronto por WhatsApp." });
        navigate('/');
      }, 500);
    } catch (e) {
      console.error("Failed to checkout:", e);
      toast({ title: "Error", description: "Ocurrió un problema guardando tu pedido. Por favor, intenta de nuevo.", variant: "destructive" });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const subtotal = getTotal();
  const deliveryLimit = 133000;
  const deliveryFee = subtotal >= deliveryLimit ? 0 : 7000;
  const deliveryRemaining = Math.max(0, deliveryLimit - subtotal);
  const deliveryProgress = Math.min(100, (subtotal / deliveryLimit) * 100);

  const finalTotal = getDiscountedTotal() + deliveryFee;
  const discount = subtotal - getDiscountedTotal();

  const setSelectedCategory = (cat: string) => navigate(cat === 'Todos' ? '/' : `/categoria/${encodeURIComponent(cat)}`);

  return (
    <div className="min-h-screen bg-[#eaeded]">
      <TopPromoBar setPromoVisible={setPromoVisible} />
      <AdvancedHeader
        categories={categories}
        selectedCategory="Todos"
        setSelectedCategory={setSelectedCategory}
        promoVisible={promoVisible}
        mainCategories={mainCategories}
        subcategoriesByParent={subcategoriesByParent}
        thirdLevelBySubcategory={thirdLevelBySubcategory}
      />

      <main className="max-w-[1500px] mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* Resumen Móvil: Se muestra arriba en pantallas pequeñas */}
          <div className="lg:hidden">
            <Card className="rounded-none border-none shadow-sm overflow-hidden mb-6">
              <div className="bg-white p-5 space-y-4">
                {/* Envío Gratis Progress Estilo Amazon */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] text-[#0f1111] leading-tight flex-1">
                      Subtotal <span className="text-[12px] font-bold align-top mt-1 inline-block">COP</span><span className="font-bold text-[22px]">{subtotal.toLocaleString('es-CO')}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 relative h-4 bg-white rounded-md border border-[#888c8c] overflow-hidden -mt-1 w-full max-w-[200px]">
                    <div
                      className="absolute top-0 left-0 h-full bg-[#067d62] rounded-md transition-all duration-1000 border-r border-white shadow-[1px_0_0_0_#067d62]"
                      style={{ width: `${deliveryProgress}%` }}
                    />
                  </div>
                  <div className="text-[14px]">
                    {subtotal >= deliveryLimit ? (
                      <span className="text-[#067d62] font-bold">¡Tu pedido califica para envío GRATIS!</span>
                    ) : (
                      <p className="text-[#0f1111] leading-tight inline">
                        <Info className="w-5 h-5 text-[#007185] inline-block mr-1 align-text-bottom" />
                        Agrega <span className="text-[#b12704]">COP {deliveryRemaining.toLocaleString('es-CO')}</span> productos elegibles a tu pedido para <span className="font-bold text-[#0f1111]">envío gratis</span>. <span className="text-[#007185] hover:underline cursor-pointer">Encontrar productos elegibles</span>
                      </p>
                    )}
                  </div>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-1 text-[#067d62] font-bold text-sm">
                      <Ticket className="w-3 h-3" />
                      Descuento ({appliedCoupon.code})
                    </div>
                    <span className="text-[#b12704] font-bold text-sm">-COP {discount.toLocaleString('es-CO')}</span>
                  </div>
                )}

                <Button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || items.length === 0}
                  className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] border border-[#fcd200] rounded-full h-11 shadow-sm font-normal text-[15px]"
                >
                  {isCheckingOut ? 'Procesando...' : `Proceder al pago (${items.length} ${items.length === 1 ? 'producto' : 'productos'})`}
                </Button>

                {appliedCoupon && (
                  <Button variant="ghost" size="sm" onClick={() => setAppliedCoupon(null)} className="w-full h-auto py-1 text-[12px] text-red-600">
                    Eliminar cupón aplicado
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Columna Izquierda: Carrito */}
          <div className="space-y-4">
            <Card className="rounded-none border-none shadow-sm overflow-hidden">
              <div className="bg-white p-6">
                <div className="flex items-end justify-between border-b pb-2 mb-4">
                  <h1 className="text-3xl font-medium text-[#0f1111]">Carrito de compras</h1>
                  <span className="text-sm text-[#565959] hidden md:block">Precio</span>
                </div>

                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ShoppingCart className="h-16 w-16 text-gray-200 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Tu carrito está vacío</h3>
                    <p className="text-[#007185] hover:underline cursor-pointer mb-6" onClick={() => navigate('/')}>
                      Explorar productos de hoy
                    </p>
                    <Button onClick={() => navigate('/')} className="bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] border border-[#fcd200] rounded-lg px-8 shadow-sm">
                      Ir a la tienda
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <div key={`${item.id}-${item.selectedColor?.name || 'default'}`} className="py-6 flex gap-4 md:gap-6">
                        {/* Imagen */}
                        <div className="w-40 md:w-48 h-40 md:h-48 flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>

                        {/* Detalles */}
                        <div className="flex-1 flex flex-col md:flex-row justify-between gap-2 min-w-0">
                          <div className="space-y-1">
                            <h4 className="text-[#0f1111] text-lg font-medium leading-tight truncate-2-lines line-clamp-2 md:line-clamp-3">
                              {item.name}
                            </h4>
                            <p className="text-sm text-[#007600]">Disponible</p>

                            {item.selectedColor && (
                              <p className="text-sm text-[#0f1111]">
                                <span className="font-bold">Color:</span> {item.selectedColor.name}
                              </p>
                            )}

                            {/* Botones de acción */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-[12px] text-[#007185]">
                              {/* Selector Cantidad Estilo Amazon */}
                              <div className="flex items-center border border-[#888c8c] rounded-lg bg-[#f0f2f2] shadow-sm overflow-hidden h-8">
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  className="px-2.5 hover:bg-gray-200 transition-colors h-full flex items-center"
                                >
                                  {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                                </button>
                                <span className="px-3 font-medium text-[#0f1111] bg-white h-full flex items-center border-x border-[#888c8c]">{item.quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                  className="px-2.5 hover:bg-gray-200 transition-colors h-full flex items-center"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <Separator orientation="vertical" className="h-4 bg-gray-300 hidden md:block" />

                              <button onClick={() => removeFromCart(item.id)} className="hover:underline">Eliminar</button>
                              <Separator orientation="vertical" className="h-4 bg-gray-300" />
                              <button className="hover:underline">Guardar para más tarde</button>
                              <Separator orientation="vertical" className="h-4 bg-gray-300 hidden md:block" />

                              {/* Botón Canjear Cupón */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button className="hover:underline flex items-center gap-1">
                                    <Ticket className="w-3 h-3" /> Canjear cupón
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="bg-white rounded-xl">
                                  <DialogHeader>
                                    <DialogTitle>Canjear código promocional</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="coupon">Introduce el código:</Label>
                                      <div className="flex gap-2">
                                        <Input
                                          id="coupon"
                                          placeholder="EJ: DESCUENTO10"
                                          value={couponCode}
                                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                          className="uppercase font-mono"
                                        />
                                        <Button
                                          onClick={handleApplyCoupon}
                                          disabled={isValidatingCoupon || !couponCode}
                                          className="bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111]"
                                        >
                                          {isValidatingCoupon ? 'Validando...' : 'Aplicar'}
                                        </Button>
                                      </div>
                                    </div>
                                    {appliedCoupon && (
                                      <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-green-700">
                                          <Ticket className="w-4 h-4" />
                                          <span className="font-bold">Cupón {appliedCoupon.code} aplicado</span>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setAppliedCoupon(null)} className="h-6 px-2 text-red-600">Remover</Button>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Separator orientation="vertical" className="h-4 bg-gray-300 hidden md:block" />
                              <button className="hover:underline hidden md:block">Compartir</button>
                            </div>
                          </div>

                          {/* Precio */}
                          <div className="text-right">
                            <span className="text-lg font-bold text-[#0f1111]">
                              COP {item.price.toLocaleString('es-CO')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 text-right">
                      <p className="text-lg text-[#0f1111]">
                        Subtotal ({items.length} {items.length === 1 ? 'producto' : 'productos'}): <span className="font-bold">COP {subtotal.toLocaleString('es-CO')}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div className="text-[12px] text-[#565959] space-y-1">
              <p>El precio y la disponibilidad de los productos están sujetos a cambios. En el carrito de compras puedes dejar temporalmente los productos que quieras. Aparecerá el precio más reciente de cada producto. <span className="text-[#007185] hover:underline cursor-pointer">Más información</span></p>
              <p>¿Tienes una tarjeta de regalo o código promocional? Te pediremos que ingreses tu código de canje cuando sea el momento de pagar.</p>
            </div>
          </div>

          {/* Columna Derecha: Resumen Desktop */}
          <div className="space-y-4 hidden lg:block">
            <Card className="rounded-none border-none shadow-sm overflow-hidden">
              <div className="bg-white p-5 space-y-4">
                {/* Envío Gratis Progress Estilo Amazon */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] text-[#0f1111] leading-tight flex-1">
                      Subtotal <span className="text-[12px] font-bold align-top mt-1 inline-block">COP</span><span className="font-bold text-[22px]">{subtotal.toLocaleString('es-CO')}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 relative h-4 bg-white rounded-md border border-[#888c8c] overflow-hidden -mt-1 w-[200px]">
                    <div
                      className="absolute top-0 left-0 h-full bg-[#067d62] rounded-md transition-all duration-1000 border-r border-white shadow-[1px_0_0_0_#067d62]"
                      style={{ width: `${deliveryProgress}%` }}
                    />
                  </div>

                  <div className="text-[14px]">
                    {subtotal >= deliveryLimit ? (
                      <span className="text-[#067d62] font-bold">¡Tu pedido califica para envío GRATIS!</span>
                    ) : (
                      <p className="text-[#0f1111] leading-tight inline">
                        <Info className="w-5 h-5 text-[#007185] inline-block mr-1 align-text-bottom" />
                        Agrega <span className="text-[#b12704]">COP {deliveryRemaining.toLocaleString('es-CO')}</span> productos elegibles a tu pedido para <span className="font-bold text-[#0f1111]">envío gratis</span>. <span className="text-[#007185] hover:underline cursor-pointer">Encontrar productos elegibles</span>
                      </p>
                    )}
                  </div>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-1 text-[#067d62] font-bold text-sm">
                      <Ticket className="w-3 h-3" />
                      Descuento ({appliedCoupon.code})
                    </div>
                    <span className="text-[#b12704] font-bold text-sm">-COP {discount.toLocaleString('es-CO')}</span>
                  </div>
                )}

                <Button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || items.length === 0}
                  className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] border border-[#fcd200] rounded-full h-11 shadow-sm font-normal text-[15px]"
                >
                  {isCheckingOut ? 'Procesando...' : `Proceder al pago (${items.length} ${items.length === 1 ? 'producto' : 'productos'})`}
                </Button>

                {appliedCoupon && (
                  <Button variant="ghost" size="sm" onClick={() => setAppliedCoupon(null)} className="w-full h-auto py-1 text-[12px] text-red-600">
                    Eliminar cupón aplicado
                  </Button>
                )}
              </div>
            </Card>


            {/* Cross-selling Area */}
            {recommendedProduct && (
              <Card className="rounded-none border-none shadow-sm overflow-hidden hidden md:block">
                <div className="bg-white p-5 space-y-4">
                  <h3 className="font-bold text-[#0f1111] leading-tight text-sm">Envío gratis en mejores vendedores para ti</h3>
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-white rounded p-1 flex-shrink-0">
                      <img
                        src={recommendedProduct.image}
                        className="w-full h-full object-contain mix-blend-multiply"
                        alt={recommendedProduct.name}
                      />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-[12px] text-[#007185] hover:underline hover:text-[#c45500] cursor-pointer truncate-2-lines line-clamp-2 leading-tight font-medium">
                        {recommendedProduct.name}
                      </p>
                      <div className="flex items-center text-orange-400 text-[10px]">
                        {'★'.repeat(4)}{'☆'.repeat(1)}
                        <span className="text-[#007185] ml-1">{(Math.floor(Math.random() * 900) + 100).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-bold text-[#b12704]">
                        COP {recommendedProduct.price.toLocaleString('es-CO')}
                      </p>
                      <Button
                        onClick={() => {
                          addToCart(recommendedProduct);
                          toast({ title: "Agregado", description: "Producto agregado al carrito" });
                        }}
                        className="bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] text-[11px] h-7 px-4 rounded-full border border-[#fcd200] shadow-sm mt-1 py-0 font-normal"
                      >
                        Agregar al carrito
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};

// Componente Card local para no depender de shadcn si no estuviera registrado correctamente
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg border border-gray-200 ${className || ''}`}>
    {children}
  </div>
);
