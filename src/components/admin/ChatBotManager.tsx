import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, Key, MessageSquare, ShoppingBag, ShieldCheck, CheckCircle2, AlertCircle, Save, Unlock, Settings, Send, ArrowLeft, Plus, Trash2, Clock, MessagesSquare, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { fetchProducts, fetchChatBotSettings, updateChatBotSettings } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    products?: any[];
}

interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
}

const INITIAL_MSG: ChatMessage = {
    role: 'assistant',
    content: '¡Hola! Soy tu asistente IA de prueba. Escríbeme algo para ver cómo respondo a tus clientes.',
};

const makeId = () => `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const newConversation = (): Conversation => ({
    id: makeId(),
    title: 'Nueva conversación',
    messages: [INITIAL_MSG],
    createdAt: Date.now(),
});

const slugify = (text: string): string =>
    text.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').toLowerCase();

// ─── Component ────────────────────────────────────────────────────────────────
const ChatBotManager = () => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [activeView, setActiveView] = useState<'settings' | 'test'>('settings');
    const [provider, setProvider] = useState('deepseek');
    const [apiKey, setApiKey] = useState('');
    const [prompt, setPrompt] = useState('Eres un asistente de ventas amable y persuasivo. IMPORTANTE: No uses asteriscos (**) para negritas ni guiones para listas en tus respuestas, usa un lenguaje natural y limpio. Tu objetivo principal es ayudar a los clientes a encontrar y comprar los mejores productos.');
    const [allowProductAccess, setAllowProductAccess] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // ── Conversation history ──
    const [conversations, setConversations] = useState<Conversation[]>([newConversation()]);
    const [activeConvId, setActiveConvId] = useState<string>('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ── Chat state ──
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [allProductsStore, setAllProductsStore] = useState<any[]>([]);

    // Init active conversation
    useEffect(() => {
        if (conversations.length > 0 && !activeConvId) {
            setActiveConvId(conversations[0].id);
        }
    }, [conversations, activeConvId]);

    useEffect(() => {
        fetchProducts().then(setAllProductsStore).catch(console.error);
    }, []);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const backendSettings = await fetchChatBotSettings();
                if (backendSettings && Object.keys(backendSettings).length > 0) {
                    setIsUnlocked(backendSettings.is_unlocked || false);
                    setProvider(backendSettings.provider || 'deepseek');
                    setApiKey(backendSettings.api_key || '');
                    setPrompt(backendSettings.prompt || prompt);
                    setAllowProductAccess(backendSettings.allow_product_access ?? true);
                    saveToLocalStorage(backendSettings.is_unlocked, backendSettings.provider, backendSettings.api_key, backendSettings.prompt, backendSettings.allow_product_access);
                    const lastView = localStorage.getItem('fuego_bot_active_view');
                    if (backendSettings.api_key && lastView !== 'settings') setActiveView('test');
                    return;
                }
            } catch (e) { /* fallback */ }
            const savedConfigStr = localStorage.getItem('fuego_bot_settings');
            if (savedConfigStr) {
                try {
                    const s = JSON.parse(savedConfigStr);
                    setIsUnlocked(s.isUnlocked || false);
                    setProvider(s.provider || 'deepseek');
                    setApiKey(s.apiKey || '');
                    setPrompt(s.prompt || prompt);
                    setAllowProductAccess(s.allowProductAccess ?? true);
                    const lastView = localStorage.getItem('fuego_bot_active_view');
                    if (s.apiKey && lastView !== 'settings') setActiveView('test');
                } catch { }
            }
        };
        loadConfig();
    }, []);

    useEffect(() => {
        if (isUnlocked) localStorage.setItem('fuego_bot_active_view', activeView);
    }, [activeView, isUnlocked]);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversations, activeConvId, isLoading]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveSettings(isUnlocked, provider, apiKey, prompt, allowProductAccess);
            toast({ title: "✅ Configuración Guardada", description: "Los cambios se guardaron correctamente." });
            if (apiKey) setActiveView('test');
        } catch (error: any) {
            toast({ title: "⚠️ Error al guardar", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const saveSettings = async (unlocked: boolean, prov: string, key: string, pr: string, access: boolean) => {
        saveToLocalStorage(unlocked, prov, key, pr, access);
        try {
            await updateChatBotSettings({ id: 1, is_unlocked: unlocked, provider: prov, api_key: key, prompt: pr, allow_product_access: access });
        } catch { }
    };

    const saveToLocalStorage = (unlocked: boolean, prov: string, key: string, pr: string, access: boolean) => {
        localStorage.setItem('fuego_bot_settings', JSON.stringify({ isUnlocked: unlocked, provider: prov, apiKey: key, prompt: pr, allowProductAccess: access }));
    };

    // ── Helpers ──────────────────────────────────────────────────────────────
    const activeConv = conversations.find(c => c.id === activeConvId) ?? conversations[0];
    const messages = activeConv?.messages ?? [INITIAL_MSG];

    const updateActiveMessages = (msgs: ChatMessage[]) => {
        setConversations(prev => prev.map(c => {
            if (c.id !== activeConvId) return c;
            // Auto-title from first user message
            const firstUser = msgs.find(m => m.role === 'user');
            return {
                ...c,
                messages: msgs,
                title: firstUser ? firstUser.content.slice(0, 40) : c.title,
            };
        }));
    };

    const handleNewConversation = () => {
        const conv = newConversation();
        setConversations(prev => [conv, ...prev]);
        setActiveConvId(conv.id);
        setInput('');
    };

    const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConversations(prev => {
            const remaining = prev.filter(c => c.id !== id);
            if (remaining.length === 0) {
                const fresh = newConversation();
                setActiveConvId(fresh.id);
                return [fresh];
            }
            if (activeConvId === id) setActiveConvId(remaining[0].id);
            return remaining;
        });
    };

    // ── Settings helpers ──────────────────────────────────────────────────────
    const handleUnlock = async () => {
        setIsUnlocked(true);
        saveSettings(true, provider, apiKey, prompt, allowProductAccess);
        toast({ title: "Asistente Desbloqueado", description: "Ahora puedes configurar la inteligencia artificial." });
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;
        const userMsg = input.trim();
        setInput('');

        const nextMsgs: ChatMessage[] = [...messages, { role: 'user', content: userMsg }];
        updateActiveMessages(nextMsgs);
        setIsLoading(true);

        // Controlador para el tiempo de espera (Timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 segundos

        try {
            let systemContent = prompt;

            if (allowProductAccess && allProductsStore.length > 0) {
                // EXTRACCIÓN DE PALABRAS CLAVE (Filtramos preposiciones y palabras cortas)
                const keywords = userMsg.toLowerCase()
                    .replace(/[?¿!¡,.;]/g, '')
                    .split(' ')
                    .filter(word => word.length > 3);

                // Solo buscamos si el mensaje parece tener una intención de producto
                if (keywords.length > 0) {
                    const matches = allProductsStore.filter(p => {
                        const searchString = `${p.name} ${p.brand || ''} ${p.category_name || ''}`.toLowerCase();
                        return keywords.some(keyword => searchString.includes(keyword));
                    }).slice(0, 25); // Limitamos a 25 coincidencias para máxima velocidad

                    if (matches.length > 0) {
                        const catalogSnippet = matches
                            .map(p => `- ${p.name} | Marca: ${p.brand || 'N/A'} | Precio: COP ${Number(p.price).toLocaleString('es-CO')}`)
                            .join('\n');

                        systemContent += `\n\nHe encontrado estos productos relacionados en la tienda para tu referencia:\n${catalogSnippet}\n\nResponde al cliente basándote en esta lista si aplica.`;
                    }
                }
            }

            let apiEndpoint = '';
            let authHeader = `Bearer ${apiKey}`;
            let body: any = {};

            // Configuración por proveedor
            if (provider === 'deepseek') {
                apiEndpoint = 'https://api.deepseek.com/chat/completions';
                body = {
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: systemContent },
                        ...nextMsgs.map(m => ({ role: m.role, content: m.content }))
                    ],
                    stream: false,
                    max_tokens: 1024
                };
            } else if (provider === 'openai') {
                apiEndpoint = 'https://api.openai.com/v1/chat/completions';
                body = {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemContent },
                        ...nextMsgs.map(m => ({ role: m.role, content: m.content }))
                    ]
                };
            } else if (provider === 'anthropic') {
                apiEndpoint = 'https://api.anthropic.com/v1/messages';
                authHeader = '';
                body = {
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 1024,
                    messages: nextMsgs.map(m => ({ role: m.role, content: m.content })),
                    system: systemContent
                };
            }

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                    ...(provider === 'anthropic' && {
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'dangerouslyAllowBrowser': 'true'
                    }),
                },
                body: JSON.stringify(body),
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err?.error?.message || `Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const aiText = provider === 'anthropic' ? data.content[0].text : data.choices[0].message.content;
            const cleanText = aiText.replace(/\*\*/g, '').replace(/\*/g, '');

            // ── DETECCIÓN INTELIGENTE DE TARJETAS ──
            let suggestedCards: any[] = [];

            // Si la IA dice que NO tiene el producto, no mostramos tarjetas
            const negativePattern = /\b(no tenemos|no cuento|no encuentro|lamentablemente|no dispongo|lo siento|no hay)\b/i;
            const isNegative = negativePattern.test(cleanText);

            if (allowProductAccess && !isNegative && allProductsStore.length > 0) {
                const lowerResponse = cleanText.toLowerCase();
                const genericWords = ['motor', 'pieza', 'repuesto', 'calidad', 'precio', 'tienda', 'vehiculo', 'carro', 'marca'];

                suggestedCards = allProductsStore
                    .filter(p => {
                        // Limpieza: Ignorar basura (precio 0 o nombres de relleno)
                        if (!p.name || Number(p.price) <= 0 || p.name.toLowerCase() === 'descripción') return false;

                        const nameLower = p.name.toLowerCase();
                        const brandLower = (p.brand || '').toLowerCase();

                        // Match por palabras clave largas que NO sean genéricas
                        const wordsMatch = nameLower.split(' ')
                            .filter(word => word.length > 4 && !genericWords.includes(word))
                            .some(word => lowerResponse.includes(word));

                        return wordsMatch || (brandLower && brandLower.length > 2 && lowerResponse.includes(brandLower));
                    })
                    .slice(0, 3);
            }

            updateActiveMessages([...nextMsgs, { role: 'assistant', content: cleanText, products: suggestedCards }]);
        } catch (error: any) {
            clearTimeout(timeoutId);
            let errorMsg = error.message;
            if (error.name === 'AbortError') errorMsg = "La IA tardó demasiado en responder (Timeout).";
            if (errorMsg.includes('Failed to fetch')) errorMsg = "Error de conexión. Podría ser un bloqueo de CORS o llave inválida.";

            updateActiveMessages([...nextMsgs, {
                role: 'assistant',
                content: `⚠️ Error: ${errorMsg}. Verifica tu conexión y que el proveedor sea correcto.`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Locked screen ─────────────────────────────────────────────────────────
    if (!isUnlocked) {
        return (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 md:p-12 text-center animate-in fade-in zoom-in-95 duration-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-100 rounded-3xl mx-auto flex items-center justify-center shadow-inner border border-white mb-6">
                    <Bot className="w-12 h-12 text-slate-400" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-3">Asistente IA <span className="text-slate-400">No Disponible</span></h2>
                <p className="text-slate-500 max-w-lg mx-auto mb-10 text-lg leading-relaxed">
                    La funcionalidad de <strong>ChatBot Inteligente</strong> actualmente se encuentra bloqueada. Desblóqueala para proveer una atención 24/7 y aumentar tus ventas.
                </p>
                <Button onClick={handleUnlock} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 px-8 py-6 rounded-xl text-lg font-medium transition-all hover:scale-105">
                    <Unlock className="w-6 h-6 mr-3" /> Desbloquear ChatBot
                </Button>
            </div>
        );
    }

    // ── Main ──────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Nav tabs */}
            <div className="flex p-1 bg-white border border-slate-200 rounded-2xl w-fit mx-auto shadow-sm overflow-hidden">
                <button onClick={() => setActiveView('settings')} className={cn("px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2", activeView === 'settings' ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50")}>
                    <Settings className="w-4 h-4" /> Configuración
                </button>
                <button onClick={() => setActiveView('test')} className={cn("px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2", activeView === 'test' ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50")}>
                    <MessageSquare className="w-4 h-4" /> Probar Chat
                </button>
            </div>

            {activeView === 'settings' ? (
                /* ── SETTINGS VIEW ── */
                <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex justify-center items-center"><Bot className="w-6 h-6" /></div>
                                Configuración de ChatBot IA
                            </h2>
                            <p className="text-slate-500 mt-2">Controla cómo interactúa tu asistente virtual con los clientes.</p>
                        </div>
                        <div className="flex bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold items-center border border-emerald-200 shadow-sm">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Desbloqueado
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center"><ShieldCheck className="w-5 h-5 mr-2 text-indigo-500" /> API y Proveedor</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Proveedor de IA</label>
                                        <select value={provider} onChange={e => setProvider(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 text-sm h-11 px-3 border bg-white">
                                            <option value="deepseek">DeepSeek (Recomendado)</option>
                                            <option value="openai">OpenAI (ChatGPT)</option>
                                            <option value="anthropic">Anthropic (Claude)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">API Key de {provider === 'deepseek' ? 'DeepSeek' : provider === 'openai' ? 'OpenAI' : 'Anthropic'}</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Key className="h-5 w-5 text-slate-400" /></div>
                                            <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." className="pl-10 h-11" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center"><MessageSquare className="w-5 h-5 mr-2 text-blue-500" /> Personalidad y Comportamiento</h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center justify-between">
                                        Prompt del Sistema
                                        <span onClick={() => setPrompt('Eres un asistente de ventas amable y persuasivo. Tu objetivo principal es ayudar a los clientes a encontrar y comprar los mejores productos.')} className="text-xs text-slate-400 bg-white px-2 cursor-pointer hover:text-indigo-600 rounded outline outline-1 outline-slate-200">Restablecer</span>
                                    </label>
                                    <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Escribe cómo quieres que se comporte tu chatbot..." className="resize-none min-h-[120px] shadow-inner bg-white" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-indigo-50 border-2 border-indigo-100 rounded-xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 rounded-full blur-3xl opacity-50 -mr-10 -mt-10" />
                                <h3 className="text-lg font-bold text-indigo-900 mb-2 relative z-10 flex items-center"><ShoppingBag className="w-5 h-5 mr-2 text-indigo-600" /> Acceso a Tienda</h3>
                                <div className="flex items-center justify-between bg-white/60 p-4 rounded-xl border border-indigo-200/50 backdrop-blur-sm relative z-10 my-4">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-800 text-sm">Vender Productos</span>
                                        <span className="text-xs text-slate-500">{allowProductAccess ? 'Activado' : 'Apagado'}</span>
                                    </div>
                                    <Switch checked={allowProductAccess} onCheckedChange={setAllowProductAccess} />
                                </div>
                                <p className="text-indigo-700/80 text-xs relative z-10">Permite que la IA analice tu inventario para dar recomendaciones directas.</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col justify-center items-center text-center">
                                <Sparkles className="w-10 h-10 text-amber-500 mb-3" />
                                <h4 className="font-semibold text-slate-800 mb-1">Optimizando con IA</h4>
                                <p className="text-sm text-slate-500">La IA puede aumentar las conversiones guiando clientes indecisos.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 hover:bg-slate-800 text-white min-w-[160px] shadow-md h-11">
                            {isSaving ? 'Guardando...' : 'Guardar y Probar Chat'}
                        </Button>
                    </div>
                </div>
            ) : (
                /* ── CHAT TEST VIEW with sidebar ── */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300" style={{ height: '640px' }}>
                    <div className="flex h-full">

                        {/* ── SIDEBAR: Conversation History ── */}
                        <div className={cn(
                            "border-r border-slate-100 flex flex-col bg-slate-50 transition-all duration-300 flex-shrink-0",
                            sidebarOpen ? "w-64" : "w-0 overflow-hidden"
                        )}>
                            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversaciones</span>
                                <button onClick={handleNewConversation} title="Nueva conversación" className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors flex-shrink-0">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {conversations.map(conv => {
                                    const isActive = conv.id === activeConvId;
                                    const preview = conv.messages.find(m => m.role === 'user')?.content || 'Sin mensajes aún';
                                    const timeAgo = (() => {
                                        const diff = Date.now() - conv.createdAt;
                                        if (diff < 60000) return 'ahora';
                                        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
                                        return `${Math.floor(diff / 3600000)}h`;
                                    })();

                                    return (
                                        <div
                                            key={conv.id}
                                            onClick={() => setActiveConvId(conv.id)}
                                            className={cn(
                                                "group relative p-2.5 rounded-xl cursor-pointer transition-all text-left",
                                                isActive
                                                    ? "bg-indigo-50 border border-indigo-200"
                                                    : "hover:bg-white border border-transparent hover:border-slate-200"
                                            )}
                                        >
                                            <div className="flex items-start gap-2 pr-6">
                                                <MessagesSquare className={cn("w-4 h-4 mt-0.5 flex-shrink-0", isActive ? "text-indigo-500" : "text-slate-400")} />
                                                <div className="min-w-0">
                                                    <p className={cn("text-xs font-semibold truncate", isActive ? "text-indigo-800" : "text-slate-700")}>
                                                        {conv.title}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{preview}</p>
                                                    <p className="text-[10px] text-slate-300 mt-0.5 flex items-center gap-1">
                                                        <Clock className="w-2.5 h-2.5" /> {timeAgo}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Delete button */}
                                            <button
                                                onClick={e => handleDeleteConversation(conv.id, e)}
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded flex items-center justify-center hover:bg-red-100 hover:text-red-500"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* New conversation button (bottom) */}
                            <div className="p-3 border-t border-slate-100">
                                <button
                                    onClick={handleNewConversation}
                                    className="w-full py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Nueva conversación
                                </button>
                            </div>
                        </div>

                        {/* ── CHAT PANEL ── */}
                        <div className="flex-1 flex flex-col min-w-0">
                            {/* Header */}
                            <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <button
                                        onClick={() => setSidebarOpen(v => !v)}
                                        title={sidebarOpen ? 'Colapsar historial' : 'Ver historial'}
                                        className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                                    >
                                        {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                                    </button>
                                    <div className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm leading-tight">{activeConv?.title ?? 'Modo de Prueba IA'}</h3>
                                        <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> ONLINE · {provider}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleNewConversation}
                                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition-all"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Nuevo chat
                                    </button>
                                    <Button variant="ghost" size="sm" onClick={() => setActiveView('settings')} className="text-slate-500 gap-1.5 text-xs h-8">
                                        <ArrowLeft className="w-3.5 h-3.5" /> Ajustes
                                    </Button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                                {messages.map((m, i) => (
                                    <div key={i} className={cn(
                                        "flex flex-col max-w-[88%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                                        m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                    )}>
                                        <div className={cn(
                                            "p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed",
                                            m.role === 'user'
                                                ? "bg-slate-900 text-white rounded-br-none"
                                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                                        )}>
                                            {m.content}
                                            {m.products && m.products.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                                                    {m.products.map((p, idx) => (
                                                        <div key={idx} onClick={() => window.open(`/producto/${slugify(p.name)}`, '_blank')}
                                                            className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center gap-2 cursor-pointer hover:border-indigo-400 hover:bg-white transition-all w-full">
                                                            <div className="w-10 h-10 bg-white rounded-lg flex-shrink-0 border border-slate-100 p-1">
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
                                            {m.role === 'user' ? 'Tú (Prueba)' : (<><Sparkles className="w-3 h-3 text-indigo-400" /> Asistente AI</>)}
                                        </span>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex items-center gap-3 text-slate-400 text-xs italic p-3 bg-white/50 backdrop-blur-sm rounded-2xl w-fit border border-slate-100 animate-pulse">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150" />
                                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-300" />
                                        </div>
                                        El bot está analizando...
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-3.5 border-t border-slate-200 bg-white flex-shrink-0">
                                <div className="flex gap-2">
                                    <Input
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Escribe un mensaje para probar la IA..."
                                        className="rounded-xl h-11 shadow-sm border-slate-200 focus:border-indigo-500"
                                    />
                                    <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white w-11 h-11 rounded-xl flex-shrink-0 shadow-md">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-center text-[10px] text-slate-400 mt-2">
                                    Prueba cómo responderá la IA · <button onClick={handleNewConversation} className="text-indigo-500 hover:underline">+ Nuevo chat</button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBotManager;
