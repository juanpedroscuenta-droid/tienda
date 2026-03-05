import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Plus, Minus, Trash2, MessageCircle, X, Info, Ticket } from 'lucide-react';
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { createOrder } from '@/lib/api';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeFromCart, getTotal, getDiscountedTotal, clearCart, appliedCoupon } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const isSupabase = typeof (db as any)?.from === 'function';
      if (isAuthenticated && user?.id) {
        setUserName(user.name || '');
        setUserPhone(user.phone || '');
        setUserEmail(user.email || '');

        if (isSupabase) {
          try {
            const { data, error } = await (db as any)
              .from("users")
              .select("*")
              .eq("id", user.id)
              .maybeSingle();

            if (data && !error) {
              setUserName(data.name || data.nombre || '');
              setUserPhone(data.phone || data.telefono || '');
              setUserEmail(data.email || '');
            }
          } catch (err) {
            console.error("Error fetching user data from Supabase:", err);
          }
        }
      }
    };
    fetchUserData();
  }, [isAuthenticated, user, isOpen]);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated || !user) {
      toast({ title: "Inicia sesión", description: "Debes iniciar sesión para realizar un pedido", variant: "destructive" });
      return;
    }

    if (items.length === 0) {
      toast({ title: "Carrito vacío", description: "Agrega productos a tu carrito antes de continuar", variant: "destructive" });
      return;
    }

    if (!userName || !userEmail) {
      toast({ title: "Datos incompletos", description: "No se pudo obtener tu nombre o email.", variant: "destructive" });
      return;
    }

    setIsCheckingOut(true);
    const subtotalValue = getTotal();
    const discountedSubtotal = getDiscountedTotal();
    const deliveryLimit = 133000;
    const deliveryFee = subtotalValue >= deliveryLimit ? 0 : 7000;
    const finalTotal = discountedSubtotal + deliveryFee;
    const discountValue = subtotalValue - discountedSubtotal;

    const message =
      `🛒 *NUEVO PEDIDO - TIENDA 24-7*\n\n` +
      `👤 *Nombre:* ${userName}\n` +
      `📧 *Email:* ${userEmail}\n` +
      `📱 *Teléfono:* ${userPhone || 'No especificado'}\n` +
      `\n*📦 PRODUCTOS SOLICITADOS:*\n${items.map(item => {
        let itemText = `- ${item.name} x${item.quantity}`;
        if (item.selectedColor) itemText += ` (Color: ${item.selectedColor.name})`;
        return itemText;
      }).join('\n')}\n` +
      (appliedCoupon ? `\n🎫 *Cupón:* ${appliedCoupon.code} (-$${discountValue.toLocaleString('es-CO')})\n` : '') +
      (orderNotes ? `\n*📝 Notas adicionales:*\n${orderNotes}\n` : '') +
      `\n💰 *TOTAL A PAGAR: $${finalTotal.toLocaleString('es-CO')}*\n\n` +
      `⏰ Fecha: ${new Date().toLocaleDateString('es-CO')} - ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}\n\n` +
      `✅ Por favor confirma la disponibilidad y tiempo de entrega.\n`;

    const storeWhatsApp = '573212619434';
    const whatsappUrl = `https://wa.me/${storeWhatsApp}?text=${encodeURIComponent(message)}`;

    try {
      const orderPayload = {
        user_id: user?.id || null,
        user_name: userName,
        user_email: userEmail,
        user_phone: userPhone,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          selectedColor: item.selectedColor
        })),
        order_notes: orderNotes,
        total: finalTotal,
        coupon_code: appliedCoupon?.code || null,
        discount_value: discountValue,
        status: "pending"
      };

      console.log("[CartSidebar] Enviando payload:", orderPayload);
      await createOrder(orderPayload);

      // Solo continuar si la orden se guardó exitosamente
      window.open(whatsappUrl, '_blank');
      setTimeout(() => {
        clearCart();
        setOrderNotes('');
        setIsCheckingOut(false);
        onClose();
        toast({ title: "¡Pedido enviado!", description: "Tu pedido ha sido enviado por WhatsApp." });
      }, 500);

    } catch (error) {
      console.error("[CartSidebar] Error guardando pedido:", error);
      toast({
        title: "Error al guardar el pedido",
        description: "Hubo un fallo registrando tu pedido o el cupón. Por favor verifica los datos.",
        variant: "destructive"
      });
      setIsCheckingOut(false);
    }
  };

  const subtotalValue = getTotal();
  const discountedSubtotal = getDiscountedTotal();
  const deliveryLimit = 133000;
  const deliveryFee = subtotalValue >= deliveryLimit ? 0 : 7000;
  const total = discountedSubtotal + deliveryFee;
  const deliveryProgress = Math.min(100, (subtotalValue / deliveryLimit) * 100);
  const deliveryRemaining = Math.max(0, deliveryLimit - subtotalValue);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Tu Carrito ({items.length})
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tu carrito está vacío</h3>
              <p className="text-muted-foreground mb-4">Agrega algunos productos para empezar</p>
              <Button onClick={onClose} className="gradient-orange hover:opacity-90">
                Continuar Comprando
              </Button>
            </div>
          ) : (
            <>
              {/* Lista de productos */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 bg-muted/50 p-4 rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm leading-tight">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">${item.price.toLocaleString('es-CO')}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        {item.selectedColor && (
                          <div className="flex items-center gap-1">
                            <span
                              className="w-3 h-3 rounded-full border border-gray-300"
                              style={{ backgroundColor: item.selectedColor.hexCode }}
                            ></span>
                            <span className="text-xs text-gray-500">{item.selectedColor.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              {/* Notas del pedido */}
              <div className="space-y-2 mb-6">
                <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                <Input
                  id="notes"
                  placeholder="Ej: Entregar en portería, tocar timbre, etc."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>

              {/* Barra de envío gratis */}
              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 h-2 bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-[#067d62] rounded-full transition-all duration-1000 flex items-center justify-end"
                      style={{ width: `${deliveryProgress}%` }}
                    >
                      <div className="w-1 h-1 bg-white rounded-full mr-0.5" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500">COP {deliveryLimit.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex gap-2 bg-blue-50/50 p-2.5 rounded-md border border-blue-100">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-tight text-blue-900">
                    {subtotalValue >= deliveryLimit ? (
                      <span className="font-bold text-green-700">¡Tu pedido califica para envío GRATIS!</span>
                    ) : (
                      <span>Agrega <span className="text-red-600 font-bold">COP {deliveryRemaining.toLocaleString('es-CO')}</span> más para <span className="font-bold">envío gratis</span>.</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Resumen de costos */}
              <div className="space-y-3 bg-muted/30 p-4 rounded-lg mb-6">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotalValue.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Domicilio:</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                    {deliveryFee === 0 ? '¡GRATIS!' : `$${deliveryFee.toLocaleString('es-CO')}`}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="gradient-text-orange">${total.toLocaleString('es-CO')}</span>
                </div>
                {subtotalValue < 60000 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    *Domicilio gratis en compras superiores a $60,000
                  </p>
                )}
              </div>

              {/* Botones de acción */}
              <div className="space-y-3 mt-6">
                {!isAuthenticated ? (
                  <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 mb-3">
                      Inicia sesión para realizar tu pedido
                    </p>
                    <Button size="sm" onClick={onClose}>
                      Iniciar Sesión
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-center mb-4">
                    <Button
                      className="w-full max-w-xs gradient-orange hover:opacity-90 h-12 flex items-center justify-center text-lg"
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                    >
                      <MessageCircle className="h-6 w-6 mr-2" />
                      {isCheckingOut ? 'Enviando...' : 'Enviar Pedido por WhatsApp'}
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Seguir Comprando
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* DEBUG: Muestra los datos obtenidos */}
              <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                <div>Nombre: {userName}</div>
                <div>Email: {userEmail}</div>
                <div>Teléfono: {userPhone || 'No especificado'}</div>
              </div>
            </>)}        </div>      </SheetContent>    </Sheet>);
};