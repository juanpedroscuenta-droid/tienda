import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopPromoBar } from '@/components/layout/TopPromoBar';
import { AdvancedHeader } from '@/components/layout/AdvancedHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/use-categories';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Plus, Minus, Trash2, MessageCircle, ArrowLeft } from 'lucide-react';
import { db } from '@/firebase';
import { createOrder } from '@/lib/api';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, getTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { categories, mainCategories, subcategoriesByParent, thirdLevelBySubcategory } = useCategories();
  const [promoVisible, setPromoVisible] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');

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

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) removeFromCart(productId);
    else updateQuantity(productId, newQuantity);
  };

  const handleCheckout = async () => {
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
    const message =
      `🛒 *NUEVO PEDIDO - TIENDA 24-7*\n\n` +
      `👤 *Nombre:* ${userName}\n📧 *Email:* ${userEmail}\n📱 *Teléfono:* ${userPhone || 'No especificado'}\n\n` +
      `*📦 PRODUCTOS:*\n${items.map(i => `${i.name} x${i.quantity}${i.selectedColor ? ` (${i.selectedColor.name})` : ''}`).join('\n')}\n\n` +
      (orderNotes ? `*Notas:* ${orderNotes}\n\n` : '') +
      `💰 *TOTAL A PAGAR: $${total.toLocaleString('es-CO')}*\n\n` +
      `⏰ ${new Date().toLocaleDateString('es-CO')} - ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}\n✅ Confirma disponibilidad y entrega.`;
    const whatsappUrl = `https://wa.me/573212619434?text=${encodeURIComponent(message)}`;

    try {
      const orderPayload = {
        user_id: user.id,
        items: items.map((i: any) => ({ id: i.id, name: i.name, price: Number(i.price), quantity: i.quantity, image: i.image })),
        total: total,
        delivery_fee: deliveryFee,
        order_notes: orderNotes || null,
        status: 'pending',
      };

      await createOrder({ ...orderPayload, userName, userEmail, userPhone });
    } catch (e) {
      toast({ title: "Error", description: "No se pudo guardar el pedido.", variant: "destructive" });
    }

    window.open(whatsappUrl, '_blank');
    setTimeout(() => {
      clearCart();
      setOrderNotes('');
      setIsCheckingOut(false);
      toast({ title: "¡Pedido enviado!", description: "Te contactaremos pronto por WhatsApp." });
      navigate('/');
    }, 1000);
  };

  const subtotal = getTotal();
  const deliveryFee = subtotal >= 60000 ? 0 : 2000;
  const total = subtotal + deliveryFee;
  const setSelectedCategory = (cat: string) => navigate(cat === 'Todos' ? '/' : `/categoria/${encodeURIComponent(cat)}`);

  return (
    <div className="min-h-screen bg-white">
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Mi Carrito ({items.length})
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Tu carrito está vacío</h3>
            <p className="text-gray-500 mb-6">Agrega productos para continuar</p>
            <Button onClick={() => navigate('/')} className="bg-[hsl(214,100%,38%)] hover:opacity-90">
              Ver productos
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                  <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">${item.price?.toLocaleString?.('es-CO') ?? item.price}</p>
                    {item.selectedColor && (
                      <span className="text-xs text-gray-500">Color: {item.selectedColor.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />
            <div className="space-y-2">
              <Label>Notas adicionales (opcional)</Label>
              <Input placeholder="Ej: Entregar en portería" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>${subtotal.toLocaleString('es-CO')}</span></div>
              <div className="flex justify-between text-sm"><span>Envío</span><span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>{deliveryFee === 0 ? '¡GRATIS!' : `$${deliveryFee.toLocaleString('es-CO')}`}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>${total.toLocaleString('es-CO')}</span></div>
              {subtotal < 60000 && <p className="text-xs text-gray-500 text-center mt-1">*Envío gratis en compras +$60.000</p>}
            </div>

            {!isAuthenticated ? (
              <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 mb-3">Inicia sesión para realizar tu pedido</p>
                <Button onClick={() => navigate('/login')}>Iniciar sesión</Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1 h-12 bg-[hsl(214,100%,38%)] hover:opacity-90" onClick={handleCheckout} disabled={isCheckingOut}>
                  <MessageCircle className="h-5 w-5 mr-2" />
                  {isCheckingOut ? 'Enviando...' : 'Terminar y enviar por WhatsApp'}
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>Seguir comprando</Button>
                <Button variant="outline" className="text-red-600" onClick={clearCart}><Trash2 className="h-4 w-4" /></Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
