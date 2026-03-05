import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Key, MessageSquare, ShoppingBag, ShieldCheck, CheckCircle2, AlertCircle, Save, Unlock, Settings, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { fetchProducts } from '@/lib/api';

const ChatBotManager = () => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [activeView, setActiveView] = useState<'settings' | 'test'>('settings');
    const [provider, setProvider] = useState('deepseek');
    const [apiKey, setApiKey] = useState('');
    const [prompt, setPrompt] = useState('Eres un asistente de ventas amable y persuasivo. IMPORTANTE: No uses asteriscos (**) para negritas ni guiones para listas en tus respuestas, usa un lenguaje natural y limpio. Tu objetivo principal es ayudar a los clientes a encontrar y comprar los mejores productos.');
    const [allowProductAccess, setAllowProductAccess] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Estados para el Chat de Prueba
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, products?: any[] }[]>([
        { role: 'assistant', content: '¡Hola! Soy tu nuevo asistente IA. ¿En qué puedo ayudarte hoy?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [allProductsStore, setAllProductsStore] = useState<any[]>([]);

    useEffect(() => {
        // Cargar productos para referencia rápida
        fetchProducts().then(setAllProductsStore).catch(console.error);
    }, []);

    useEffect(() => {
        // Cargar configuración guardada
        const savedConfigStr = localStorage.getItem('fuego_bot_settings');
        if (savedConfigStr) {
            try {
                const savedConfig = JSON.parse(savedConfigStr);
                setIsUnlocked(savedConfig.isUnlocked || false);
                setProvider(savedConfig.provider || 'deepseek');
                setApiKey(savedConfig.apiKey || '');
                setPrompt(savedConfig.prompt || 'Eres un asistente de ventas amable y persuasivo. Tu objetivo principal es ayudar a los clientes a encontrar y comprar los mejores productos.');
                setAllowProductAccess(savedConfig.allowProductAccess ?? true);

                // Si ya tiene una API Key configurada, ir directamente al chat al recargar
                // a menos que el usuario haya estado explícitamente en la vista de ajustes
                const lastView = localStorage.getItem('fuego_bot_active_view');
                if (savedConfig.apiKey && lastView !== 'settings') {
                    setActiveView('test');
                } else if (lastView === 'settings') {
                    setActiveView('settings');
                }
            } catch (e) {
                console.error("Error al cargar configuración", e);
            }
        }
    }, []);

    // Persistir la vista activa cuando cambie
    useEffect(() => {
        if (isUnlocked) {
            localStorage.setItem('fuego_bot_active_view', activeView);
        }
    }, [activeView, isUnlocked]);

    const handleUnlock = () => {
        setIsUnlocked(true);
        saveSettings(true, provider, apiKey, prompt, allowProductAccess);
        toast({
            title: "Asistente Desbloqueado",
            description: "Ahora puedes configurar la inteligencia artificial.",
        });
    };

    const handleSave = async () => {
        setIsSaving(true);

        // Simular un guardado seguro
        await new Promise(r => setTimeout(r, 800));

        saveSettings(isUnlocked, provider, apiKey, prompt, allowProductAccess);

        setIsSaving(false);
        toast({
            title: "Configuración Guardada",
            description: "Los cambios han sido aplicados. ¡Ya puedes probar tu chat!",
        });

        // Pasar a la vista de chat si tiene API Key
        if (apiKey) {
            setActiveView('test');
        } else {
            toast({
                title: "Nota",
                description: "Recuerda ingresar una API Key para que el chat funcione realmente.",
                variant: "destructive"
            });
        }
    };

    const saveSettings = (unlocked: boolean, prov: string, key: string, pr: string, access: boolean) => {
        localStorage.setItem('fuego_bot_settings', JSON.stringify({
            isUnlocked: unlocked,
            provider: prov,
            apiKey: key,
            prompt: pr,
            allowProductAccess: access
        }));
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            let systemContent = prompt;

            // Si se permite acceso a productos, enriquecer el prompt con el catálogo
            if (allowProductAccess) {
                // Mensaje temporal de carga de productos
                setIsLoading(true);
                const allProducts = await fetchProducts();
                const catalogSummary = allProducts.map(p => `- ${p.name}: COP ${p.price.toLocaleString('es-CO')}`).join('\n');
                systemContent += `\n\nAquí tienes el catálogo de la tienda para responder dudas sobre productos:\n${catalogSummary}`;
            }

            // Preparar la petición según el proveedor
            let apiEndpoint = "";
            let authHeader = `Bearer ${apiKey}`;
            let body: any = {};

            if (provider === 'deepseek') {
                apiEndpoint = "https://api.deepseek.com/chat/completions";
                body = {
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: systemContent },
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: "user", content: userMsg }
                    ],
                    stream: false
                };
            } else if (provider === 'openai') {
                apiEndpoint = "https://api.openai.com/v1/chat/completions";
                body = {
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: systemContent },
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: "user", content: userMsg }
                    ]
                };
            } else if (provider === 'anthropic') {
                apiEndpoint = "https://api.anthropic.com/v1/messages";
                authHeader = "";
                body = {
                    model: "claude-3-haiku-20240307",
                    max_tokens: 1024,
                    messages: [
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: "user", content: userMsg }
                    ],
                    system: systemContent
                };
            }

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authHeader,
                    ...(provider === 'anthropic' && {
                        "x-api-key": apiKey,
                        "anthropic-version": "2023-06-01",
                        "dangerouslyAllowBrowser": "true"
                    })
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.error?.message || `Error ${response.status}: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            let aiText = "";

            if (provider === 'deepseek' || provider === 'openai') {
                aiText = data.choices[0].message.content;
            } else if (provider === 'anthropic') {
                aiText = data.content[0].text;
            }

            // Limpiar asteriscos y formato markdown sucio
            const cleanText = aiText.replace(/\*\*/g, '').replace(/\*/g, '');

            // Detectar productos mencionados para mostrar tarjetas
            let suggestedProducts: any[] = [];
            if (allowProductAccess && allProductsStore.length > 0) {
                suggestedProducts = allProductsStore.filter(p =>
                    cleanText.toLowerCase().includes(p.name.toLowerCase()) ||
                    (p.brand && cleanText.toLowerCase().includes(p.brand.toLowerCase()))
                ).slice(0, 3); // Máximo 3 productos recomendados visualmente
            }

            setMessages(prev => [...prev, { role: 'assistant', content: cleanText, products: suggestedProducts }]);
        } catch (error: any) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error real: ${error.message}. Por favor revisa tu API Key y conexión.`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Función para crear slug (mismo que en ProductDetailPage)
    const slugify = (text: string): string => {
        return text
            .toString()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .toLowerCase();
    };

    if (!isUnlocked) {
        return (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 md:p-12 text-center animate-in fade-in zoom-in-95 duration-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-100 rounded-3xl mx-auto flex items-center justify-center shadow-inner border border-white mb-6">
                    <Bot className="w-12 h-12 text-slate-400" />
                </div>

                <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-3">Asistente IA <span className="text-slate-400">No Disponible</span></h2>
                <p className="text-slate-500 max-w-lg mx-auto mb-10 text-lg leading-relaxed">
                    La funcionalidad de <strong>ChatBot Inteligente</strong> actualmente se encuentra bloqueada en tu cuenta. Desblóqueala para proveer una atención 24/7 y aumentar tus ventas automáticamente.
                </p>

                <Button
                    onClick={handleUnlock}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 px-8 py-6 rounded-xl text-lg font-medium transition-all hover:scale-105"
                >
                    <Unlock className="w-6 h-6 mr-3" />
                    Desbloquear Función de ChatBot
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Tabs de Navegación */}
            <div className="flex p-1 bg-white border border-slate-200 rounded-2xl w-fit mx-auto shadow-sm overflow-hidden">
                <button
                    onClick={() => setActiveView('settings')}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                        activeView === 'settings' ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <Settings className="w-4 h-4" />
                    Configuración
                </button>
                <button
                    onClick={() => setActiveView('test')}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                        activeView === 'test' ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <MessageSquare className="w-4 h-4" />
                    Probar Chat
                </button>
            </div>

            {activeView === 'settings' ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex justify-center items-center">
                                    <Bot className="w-6 h-6" />
                                </div>
                                Configuración de ChatBot IA
                            </h2>
                            <p className="text-slate-500 mt-2">Controla cómo interactúa tu asistente virtual con los clientes.</p>
                        </div>

                        <div className="flex bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold items-center border border-emerald-200 shadow-sm">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Desbloqueado
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Formulario Izquierdo */}
                        <div className="lg:col-span-2 space-y-6">

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                                    <ShieldCheck className="w-5 h-5 mr-2 text-indigo-500" /> API y Proveedor
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Proveedor de IA</label>
                                        <select
                                            value={provider}
                                            onChange={(e) => setProvider(e.target.value)}
                                            className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm h-11 px-3 border bg-white"
                                        >
                                            <option value="deepseek">DeepSeek (Recomendado)</option>
                                            <option value="openai">OpenAI (ChatGPT)</option>
                                            <option value="anthropic">Anthropic (Claude)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            API Key de {provider === 'deepseek' ? 'DeepSeek' : provider === 'openai' ? 'OpenAI' : 'Anthropic'}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Key className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <Input
                                                type="password"
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                placeholder="sk-..."
                                                className="pl-10 h-11"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                                    <MessageSquare className="w-5 h-5 mr-2 text-blue-500" /> Personalidad y Comportamiento
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center justify-between">
                                            Prompt del Sistema (Instrucciones)
                                            <span
                                                onClick={() => setPrompt('Eres un asistente de ventas amable y persuasivo. Tu objetivo principal es ayudar a los clientes a encontrar y comprar los mejores productos.')}
                                                className="text-xs text-slate-400 bg-white px-2 cursor-pointer hover:text-indigo-600 rounded outline outline-1 outline-slate-200"
                                            >Reestablecer</span>
                                        </label>
                                        <Textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder="Escribe cómo quieres que se comporte tu chatbot..."
                                            className="resize-none min-h-[120px] shadow-inner bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Panel Derecho */}
                        <div className="space-y-6">
                            <div className="bg-indigo-50 border-2 border-indigo-100 rounded-xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 rounded-full blur-3xl opacity-50 -mr-10 -mt-10"></div>

                                <h3 className="text-lg font-bold text-indigo-900 mb-2 relative z-10 flex items-center">
                                    <ShoppingBag className="w-5 h-5 mr-2 text-indigo-600" /> Acceso a Tienda
                                </h3>

                                <div className="flex items-center justify-between bg-white/60 p-4 rounded-xl border border-indigo-200/50 backdrop-blur-sm relative z-10 my-4">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-800 text-sm">Vender Productos</span>
                                        <span className="text-xs text-slate-500">{allowProductAccess ? 'Activado' : 'Apagado'}</span>
                                    </div>
                                    <Switch
                                        checked={allowProductAccess}
                                        onCheckedChange={setAllowProductAccess}
                                    />
                                </div>
                                <p className="text-indigo-700/80 text-xs relative z-10">
                                    Permite que la IA analice tu inventario para ofrecer recomendaciones directas.
                                </p>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col justify-center items-center text-center">
                                <Sparkles className="w-10 h-10 text-amber-500 mb-3" />
                                <h4 className="font-semibold text-slate-800 mb-1">Optimizando con IA</h4>
                                <p className="text-sm text-slate-500">
                                    La IA puede aumentar las conversiones guiando clientes indecisos.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-slate-900 hover:bg-slate-800 text-white min-w-[140px] shadow-md h-11"
                        >
                            {isSaving ? "Guardando..." : "Guardar y Probar Chat"}
                        </Button>
                    </div>
                </div>
            ) : (
                /* VISTA DE CHAT DE PRUEBA */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px] overflow-hidden animate-in slide-in-from-right-4 duration-300">
                    {/* Header del Chat */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Modo de Prueba IA</h3>
                                <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> ONLINE
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setActiveView('settings')} className="text-slate-500 gap-2">
                            <ArrowLeft className="w-4 h-4" /> Volver a Ajustes
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                        {messages.map((m, i) => (
                            <div key={i} className={cn(
                                "flex flex-col max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                                m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                            )}>
                                <div className={cn(
                                    "p-4 rounded-2xl text-sm shadow-sm leading-relaxed",
                                    m.role === 'user'
                                        ? "bg-slate-900 text-white rounded-br-none"
                                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                                )}>
                                    {m.content}

                                    {/* Tarjetas de productos sugeridos */}
                                    {m.products && m.products.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                                            {m.products.map((p, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => window.open(`/producto/${slugify(p.name)}`, '_blank')}
                                                    className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center gap-3 cursor-pointer hover:border-indigo-400 hover:bg-white transition-all w-full sm:w-[calc(50%-4px)]"
                                                >
                                                    <div className="w-12 h-12 bg-white rounded-lg flex-shrink-0 border border-slate-100 p-1">
                                                        <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-bold text-slate-800 truncate">{p.name}</p>
                                                        <p className="text-[10px] text-indigo-600 font-black">COP {p.price.toLocaleString('es-CO')}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1">
                                    {m.role === 'user' ? 'Tú (Prueba)' : (
                                        <>
                                            <Sparkles className="w-3 h-3 text-indigo-400" />
                                            Asistente AI ({provider})
                                        </>
                                    )}
                                </span>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-3 text-slate-400 text-xs italic p-3 bg-white/50 backdrop-blur-sm rounded-2xl w-fit border border-slate-100 animate-pulse">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-300"></span>
                                </div>
                                El bot está analizando tu catálogo...
                            </div>
                        )}
                    </div>

                    {/* Input del Chat */}
                    <div className="p-4 border-t border-slate-200 bg-white">
                        <div className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Escribe un mensaje para probar la IA..."
                                className="rounded-xl h-12 shadow-sm border-slate-200 focus:border-indigo-500"
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={isLoading || !input.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white w-12 h-12 rounded-xl flex-shrink-0 shadow-md"
                            >
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                        <p className="text-center text-[10px] text-slate-400 mt-2">
                            Prueba cómo responderá la IA a tus clientes con la configuración actual.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBotManager;
