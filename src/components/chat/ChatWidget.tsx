import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, ShoppingCart, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { fetchProducts, fetchChatBotSettings } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    products?: any[];
}

export const ChatWidget: React.FC = () => {
    const { addToCart } = useCart();
    const { user, updateUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '¡Hola! Soy Carlos Bot, tu asistente de Soporte 24/7. ¿En qué puedo ayudarte hoy?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [config, setConfig] = useState<any>(null);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [pendingProduct, setPendingProduct] = useState<any>(null);
    const [cartAddedProduct, setCartAddedProduct] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadConfig = async () => {
            // Intentar cargar del backend primero
            try {
                const backendSettings = await fetchChatBotSettings();
                if (backendSettings && backendSettings.is_unlocked && backendSettings.api_key) {
                    setConfig({
                        isUnlocked: backendSettings.is_unlocked,
                        provider: backendSettings.provider,
                        apiKey: backendSettings.api_key,
                        prompt: backendSettings.prompt,
                        allowProductAccess: backendSettings.allow_product_access
                    });
                    return;
                }
            } catch (e) {
                console.warn('[ChatWidget] Backend config load failed, using local fallback');
            }

            // Fallback a localStorage
            const savedConfig = localStorage.getItem('fuego_bot_settings');
            if (savedConfig) {
                try {
                    const parsed = JSON.parse(savedConfig);
                    if (parsed.isUnlocked && parsed.apiKey) {
                        setConfig(parsed);
                    }
                } catch (e) {
                    console.error('Error loading chat config local', e);
                }
            }
        };

        loadConfig();
        fetchProducts().then(setAllProducts).catch(console.error);
    }, []);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const slugify = (text: string): string =>
        text.toString().normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^\w\s-]/g, '')
            .trim().replace(/\s+/g, '-').replace(/-+/g, '-').toLowerCase();

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !config) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        const lowerMsg = userMsg.toLowerCase();

        // === DETECCIÓN DE INTENCIONES EN EL CLIENTE ===

        // 1. Ignorado: ya no pedimos dirección al usuario

        // 2. Si esperamos confirmación de compra y el usuario dice SI
        const isConfirm = /^(s[iíIÍ]|si!|yes|dale|claro|ok|por fa|porfa|añade|agregalo|agrégalo|quiero|lo llevo|lo quiero)/i.test(lowerMsg);
        if (pendingProduct && isConfirm) {
            addToCart(pendingProduct, 1);
            setCartAddedProduct(pendingProduct);
            toast({
                title: '¡Añadido al carrito!',
                description: `${pendingProduct.name} agregado por Carlos Bot. ¡Procede al pago!`,
                className: 'bg-[#ffd814] text-black rounded-none border-2 border-slate-900'
            });
            if (!user?.address) {
                // Ya no pedimos dirección automáticamente
            }
            setPendingProduct(null);
        }

        // Detectar producto desde el mensaje del USUARIO (antes de llamar a la IA)
        if (config?.allowProductAccess && allProducts.length > 0 && !pendingProduct) {
            const foundByUser = allProducts.find((p: any) => {
                const productWords = p.name.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
                return productWords.some((word: string) => lowerMsg.includes(word));
            });
            if (foundByUser) setPendingProduct(foundByUser);
        }

        try {
            let systemContent = `Eres Carlos Bot, asistente de ventas de esta tienda. Eres rápido, amable y muy conciso. Tu misión es VENDER. Cuando el cliente confirme que quiere comprar dile: "Perfecto! Producto agregado a tu carrito. Para terminar tu compra presiona el botón del carrito y dale Pagar."`;

            if (isAuthenticated && user) {
                systemContent += ` Cliente: ${user.name}.`;
            }

            if (config.allowProductAccess && allProducts.length > 0) {
                const catalogSummary = allProducts
                    .map(p => `- ${p.name} (COP ${p.price.toLocaleString('es-CO')})`)
                    .join('\n');
                systemContent += `\n\nCatálogo:\n${catalogSummary}`;
                systemContent += `\n\nInstrucción crítica: Responde SOLO con texto natural, sin códigos ni tokens especiales. Cuando el cliente acepte comprar, confirma con texto simple.`;
            }

            const isDeepSeek = config.provider === 'deepseek';
            const apiEndpoint = isDeepSeek
                ? 'https://api.deepseek.com/chat/completions'
                : 'https://api.openai.com/v1/chat/completions';

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: isDeepSeek ? 'deepseek-chat' : 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemContent },
                        ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: userMsg }
                    ]
                })
            });

            if (!response.ok) throw new Error('Error en la respuesta de IA');

            const data = await response.json();
            const aiText = data.choices[0].message.content;
            const cleanText = aiText.replace(/\*\*/g, '').replace(/\*/g, '');

            // El pendingProduct fue detectado desde el mensaje del usuario.
            const mentionedProduct = pendingProduct || null;

            // Mostrar tarjeta solo del producto en discusión
            const productsToShow = mentionedProduct ? [mentionedProduct] : [];
            setMessages(prev => [...prev, { role: 'assistant', content: cleanText, products: productsToShow }]);

        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Lo siento, tuve un problema técnico. ¿Podrías intentar de nuevo?'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!config) return null;

    return (
        <div className="fixed bottom-[96px] right-6 z-50 flex flex-col items-end gap-4 max-w-[95vw]">

            {/* Ventana de Chat */}
            {isOpen && (
                <div className="mb-4 w-full sm:w-[500px] h-[480px] max-h-[calc(100vh-180px)] bg-white rounded-none shadow-2xl border-2 border-slate-900 flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="bg-[#ffd814] p-5 text-[#0f1111] flex items-center justify-between border-b-2 border-slate-900 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-black/10 rounded-none flex items-center justify-center border border-black/15">
                                <Bot className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-[13px] font-black uppercase tracking-[0.15em] leading-tight">
                                    Carlos Bot
                                    <span className="block text-[10px] opacity-75 font-bold">Soporte 24/7 Digital</span>
                                </h3>
                                <p className="text-[9px] text-[#0f1111]/60 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                                    <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span> En línea
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}
                            className="text-[#0f1111]/50 hover:text-[#0f1111] hover:bg-black/5 rounded-none">
                            <X className="w-6 h-6" />
                        </Button>
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {messages.map((m, i) => (
                            <div key={i} className={cn(
                                'flex flex-col max-w-[88%]',
                                m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                            )}>
                                <div className={cn(
                                    'p-4 rounded-none text-[13px] shadow-sm leading-relaxed border',
                                    m.role === 'user'
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white border-slate-200 text-slate-800'
                                )}>
                                    {m.content}

                                    {/* Tarjetas de productos sugeridos */}
                                    {m.products && m.products.length > 0 && (
                                        <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-slate-100">
                                            {m.products.map((p, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => window.open(`/producto/${slugify(p.name)}`, '_blank')}
                                                    className="bg-white border border-slate-200 rounded-none p-3 flex items-center gap-3 cursor-pointer hover:border-slate-900 transition-all group"
                                                >
                                                    <img src={p.image} className="w-12 h-12 object-contain bg-white rounded-none border border-slate-100 flex-shrink-0" alt="" />
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-black uppercase tracking-tight truncate text-slate-900">{p.name}</p>
                                                        <p className="text-[12px] text-orange-600 font-black">COP {p.price.toLocaleString('es-CO')}</p>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 flex-shrink-0 transition-colors ml-auto" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest p-3 bg-white rounded-none border border-slate-100 w-fit">
                                <span className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                                </span>
                                Carlos está escribiendo...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer: Banner de checkout + Input */}
                    <div className="border-t-2 border-slate-900 bg-white flex-shrink-0">

                        {/* Banner de Checkout — aparece cuando se agrega al carrito */}
                        {cartAddedProduct && (
                            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-700 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 flex-shrink-0 bg-[#ffd814] rounded-none flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-black" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Producto en tu carrito</p>
                                        <p className="text-[12px] font-black uppercase truncate text-[#ffd814]">{cartAddedProduct.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { navigate('/cart'); setIsOpen(false); }}
                                    className="flex-shrink-0 flex items-center gap-2 bg-[#ffd814] text-black px-4 py-2 text-[11px] font-black uppercase tracking-wider hover:bg-yellow-300 active:scale-95 transition-all"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    Ir a pagar
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-4 flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Escribe tu consulta aquí..."
                                className="rounded-none h-11 border-slate-200 focus-visible:ring-slate-900 text-[12px] font-semibold text-slate-900 placeholder:text-slate-400"
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={isLoading || !input.trim()}
                                className="h-11 w-11 rounded-none bg-slate-900 hover:bg-black p-0 shadow-none flex-shrink-0"
                            >
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                </div>
            )}

            {/* Botón flotante del bot */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group bg-[#ffd814] text-[#0f1111] p-3 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center relative h-[56px] w-[56px] border-2 border-slate-900"
                >
                    <Bot className="w-7 h-7" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 border-2 border-white rounded-full animate-pulse"></span>
                </button>
            )}

        </div>
    );
};
