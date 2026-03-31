import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Sparkles, Send, User, Clock, ChevronRight, Inbox, MessageSquare, ShieldCheck, MailSearch, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { fetchInboundEmails, syncInboundEmails, generateEmailReplyDraft, sendBulkEmail } from '@/lib/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InboundEmail {
    id: string;
    from_email: string;
    from_name: string;
    subject: string;
    body_text: string;
    received_at: string;
    is_replied: boolean;
    ai_draft?: string;
    body_html?: string;
    status: 'unread' | 'read' | 'replied' | 'archived';
}

const EmailBody = ({ email }: { email: InboundEmail }) => {
    const rawContent = email.body_html || email.body_text || '';
    
    // Mejor detección de HTML: buscar etiquetas estructurales comunes en lugar de cualquier <
    const htmlTagsRegex = /<(html|body|div|p|table|br|section|main|title|head|!doctype)/i;
    const isHtml = htmlTagsRegex.test(rawContent);

    if (isHtml) {
        const htmlWithCharset = rawContent.includes('charset=') 
            ? rawContent 
            : `<meta charset="UTF-8">${rawContent}`;

        return (
            <div className="w-full h-full bg-white rounded-xl overflow-hidden min-h-[500px] border border-slate-200 shadow-sm">
                <iframe
                    title="Email Content"
                    srcDoc={htmlWithCharset}
                    className="w-full h-full border-none min-h-[650px]"
                    sandbox="allow-popups allow-same-origin"
                />
            </div>
        );
    }

    // Procesa el texto plano para convertirlo en una serie de tarjetas (Threaded Cards)
    const renderMessageThreads = (text: string) => {
        const decoded = text
            .replace(/&nbsp;/g, ' ')
            .replace(/&zwnj;/g, '')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
            .replace(/&([a-z]+);/gi, (match, entity) => {
                const entities: Record<string, string> = { 
                    'aacute': 'á', 'eacute': 'é', 'iacute': 'í', 'oacute': 'ó', 'uacute': 'ú',
                    'Aacute': 'Á', 'Eacute': 'É', 'Iacute': 'Í', 'Oacute': 'Ó', 'Uacute': 'Ú',
                    'ntilde': 'ñ', 'Ntilde': 'Ñ', 'iexcl': '¡', 'iquest': '¿'
                };
                return entities[entity] || match;
            });

        // Intentar dividir por bloques de firma de respuesta común
        const lineas = decoded.split('\n');
        const bloques: { header?: string; content: string[] }[] = [];
        let bloqueActual: { header?: string; content: string[] } = { content: [] };

        lineas.forEach((linea) => {
            // Limpieza agresiva de > y espacios al inicio
            const sinQuotes = linea.replace(/^(\s*[>|]\s*)+/g, '');
            const trimmed = sinQuotes.trim();
            
            // Detectar inicio de un mensaje anterior (incluyendo variaciones de Gmail/Outlook)
            const esCabecera = trimmed.match(/^(On\s.*wrote:|El\s.*escribió:|De:|From:|Subject:|Asunto:|Sent:|Enviado el:)/i) || 
                             (trimmed.startsWith('---') && trimmed.toLowerCase().includes('original message'));

            if (esCabecera) {
                if (bloqueActual.content.length > 0) {
                    bloques.push(bloqueActual);
                }
                bloqueActual = { header: trimmed, content: [] };
            } else {
                if (sinQuotes || linea === '') {
                    bloqueActual.content.push(sinQuotes);
                }
            }
        });
        
        if (bloqueActual.content.length > 0 || bloqueActual.header) {
            bloques.push(bloqueActual);
        }

        return (
            <div className="space-y-6">
                {bloques.map((bloque, idx) => (
                    <div 
                        key={idx} 
                        className={cn(
                            "group transition-all duration-300",
                            idx === 0 
                                ? "bg-white border-slate-200 shadow-md ring-1 ring-slate-200/50" 
                                : "bg-slate-50/40 border-slate-100 opacity-80 hover:opacity-100",
                            "rounded-2xl border p-6 md:p-8 relative"
                        )}
                    >
                        {/* Header del bloque (si existe) */}
                        {bloque.header && (
                            <div className="mb-4 pb-3 border-b border-slate-100 font-medium text-[11px] uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                                {bloque.header}
                            </div>
                        )}
                        
                        {/* Contenido del bloque */}
                        <div className={cn(
                            "leading-relaxed",
                            idx === 0 ? "text-slate-700 text-[15px]" : "text-slate-500 text-[14px]"
                        )}>
                            {bloque.content.map((l, lIdx) => (
                                <div key={lIdx} className={l.trim() === '' ? 'h-3' : 'mb-1'}>
                                    {l}
                                </div>
                            ))}
                        </div>

                        {/* Indicador visual de "Mensaje Anterior" */}
                        {idx > 0 && (
                            <div className="absolute -top-3 left-8 px-3 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-bold rounded-full border border-slate-200 uppercase tracking-tighter">
                                Historial
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-transparent min-h-full font-sans">
            {renderMessageThreads(rawContent)}
        </div>
    );
};

const EmailInbox = () => {
    const [emails, setEmails] = useState<InboundEmail[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Draft actual editable
    const [replyDraft, setReplyDraft] = useState('');
    const [showMobileDetail, setShowMobileDetail] = useState(false);
    const [hasConfig, setHasConfig] = useState(true);

    const checkConfig = () => {
        const savedConfig = localStorage.getItem('__mail_config');
        if (!savedConfig) return false;
        try {
            const config = JSON.parse(savedConfig);
            return !!(config.email && config.appPassword);
        } catch {
            return false;
        }
    };

    const loadEmails = async () => {
        const configValid = checkConfig();
        setHasConfig(configValid);

        if (!configValid) {
            setEmails([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        console.log('[EmailInbox] Iniciando carga de correos...');
        try {
            const data = await fetchInboundEmails();
            console.log(`[EmailInbox] ${data.length} correos cargados desde la DB:`, data);
            setEmails(data);
        } catch (error) {
            console.error('[EmailInbox] Error al cargar correos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadEmails();
        
        // Listener para cambios en localStorage por si se configura en otra pestaña
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === '__mail_config') {
                loadEmails();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const selectedEmail = emails.find(e => e.id === selectedId);

    const handleSync = async () => {
        if (!checkConfig()) {
            toast({ 
                title: "Configuración requerida", 
                description: "Debes configurar tu correo y contraseña de aplicación para sincronizar.",
                variant: "destructive"
            });
            return;
        }

        setIsSyncing(true);
        console.log('[EmailInbox] Iniciando sincronización IMAP...');
        try {
            const result = await syncInboundEmails();
            console.log('[EmailInbox] Sincronización exitosa:', result);
            toast({ title: "Buzón Sincronizado", description: result.message || "Se han descargado los correos más recientes." });
            loadEmails();
        } catch (error: any) {
            console.error('[EmailInbox] Error de sincronización:', error);
            toast({
                title: "Error de Sincronización",
                description: error.message || "No se pudo conectar al servidor IMAP. Revisa tu configuración.",
                variant: "destructive"
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!selectedId) return;
        setIsGenerating(true);
        try {
            const { draft } = await generateEmailReplyDraft(selectedId);
            setReplyDraft(draft);
            toast({ title: "Borrador Generado", description: "La IA ha analizado el correo y propuesto una respuesta." });
        } catch (error: any) {
            toast({ title: "Error IA", description: error.message, variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendReply = async () => {
        if (!selectedEmail || !replyDraft) return;
        setIsSending(true);
        try {
            await sendBulkEmail([selectedEmail.from_email], `Re: ${selectedEmail.subject}`, replyDraft);
            toast({ title: "Respuesta Enviada", description: `Se envió el correo a ${selectedEmail.from_email} correctamente.` });

            // Marcar como respondido localmente
            setEmails(prev => prev.map(e => e.id === selectedId ? { ...e, is_replied: true, status: 'replied' } : e));
            setReplyDraft('');
        } catch (error: any) {
            toast({ title: "Error al enviar", description: error.message, variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] min-h-[750px] bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Header - More compact */}
            <div className="p-4 md:p-5 border-b border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-10 h-10 text-white rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform",
                        hasConfig ? "bg-gradient-to-br from-indigo-600 to-violet-700 shadow-indigo-100" : "bg-slate-300 shadow-none"
                    )}>
                        <Inbox className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Buzón de Atención</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                hasConfig ? "bg-green-500 animate-pulse" : "bg-slate-300"
                            )}></span>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Email 24/7 Automation</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSync}
                        disabled={isSyncing || !hasConfig}
                        className={cn(
                            "bg-white hover:bg-slate-50 gap-2 border-slate-200 h-10 px-4 rounded-xl shadow-sm font-bold text-xs",
                            !hasConfig ? "text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed" : "text-slate-700"
                        )}
                    >
                        <RefreshCw className={cn("w-4 h-4 text-indigo-600", isSyncing && "animate-spin", !hasConfig && "text-slate-300")} />
                        {isSyncing ? "Sincronizando..." : "Sincronizar"}
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 min-h-0 bg-slate-50/50">
                {/* Listado Izquierdo */}
                <div className={cn(
                    "w-full md:w-[350px] border-r border-slate-100 flex flex-col bg-slate-50/30",
                    showMobileDetail && "hidden md:flex"
                )}>
                    <div className="p-4 border-b border-slate-200/50">
                        <div className="relative">
                            <MailSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none shadow-sm"
                                placeholder="Buscar en recibidos..."
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-400 italic text-sm animate-pulse">Cargando mensajes...</div>
                        ) : !hasConfig ? (
                             <div className="p-8 text-center">
                                <ShieldCheck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-tight leading-relaxed">Configuración Necesaria</p>
                                <p className="text-slate-400 text-[10px] mt-1">Ingresa tus credenciales SMTP para activar el buzón.</p>
                            </div>
                        ) : emails.length === 0 ? (
                            <div className="p-12 text-center">
                                <Mail className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-400 text-xs font-medium">No hay mensajes recibidos aún.</p>
                                <Button variant="link" onClick={handleSync} className="text-indigo-600 text-xs">Sincronizar ahora</Button>
                            </div>
                        ) : (
                            emails.map(email => (
                                <div
                                    key={email.id}
                                    onClick={() => {
                                        setSelectedId(email.id);
                                        setReplyDraft(email.ai_draft || '');
                                        setShowMobileDetail(true);
                                    }}
                                    className={cn(
                                        "p-3 rounded-xl cursor-pointer transition-all border group",
                                        selectedId === email.id
                                            ? "bg-white border-indigo-200 shadow-sm"
                                            : "border-transparent hover:bg-white hover:border-slate-100"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full shrink-0",
                                                email.is_replied ? "bg-slate-300" : "bg-indigo-500 shadow-lg shadow-indigo-200"
                                            )} />
                                            <span className="text-xs font-bold text-slate-800 truncate">{email.from_name || email.from_email}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{format(new Date(email.received_at), 'HH:mm')}</span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-600 truncate">{email.subject || '(Sin Asunto)'}</p>
                                    <p className="text-[10px] text-slate-400 truncate mt-1 leading-relaxed">{email.body_text}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Detalle Derecho */}
                <div className={cn(
                    "flex-1 flex flex-col min-w-0 bg-white",
                    !showMobileDetail && "hidden md:flex"
                )}>
                    {selectedEmail ? (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Email Header - Compact */}
                            <div className="p-5 md:p-6 border-b border-slate-100 flex-shrink-0 bg-white">
                                <div className="flex flex-col gap-4">
                                    {/* Back button for mobile */}
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="md:hidden self-start -ml-2 text-slate-500 gap-1"
                                        onClick={() => setShowMobileDetail(false)}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Volver al buzón
                                    </Button>

                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl font-black border border-indigo-100">
                                                {(selectedEmail.from_name || selectedEmail.from_email).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="space-y-0.5">
                                                <h3 className="font-black text-slate-900 text-xl leading-tight tracking-tight">{selectedEmail.subject || '(Sin Asunto)'}</h3>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-lg">
                                                        <span className="text-xs font-bold text-slate-600">{selectedEmail.from_email}</span>
                                                    </div>
                                                    <span className="text-slate-300 hidden md:inline">•</span>
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        {format(new Date(selectedEmail.received_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={selectedEmail.is_replied ? "outline" : "default"} className={cn(
                                            "py-1 px-3 text-[9px] font-black uppercase tracking-widest rounded-lg",
                                            selectedEmail.is_replied ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-indigo-600 shadow-md shadow-indigo-100"
                                        )}>
                                            {selectedEmail.is_replied ? 'Respondido' : 'Pendiente'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Email Contents - Max Space */}
                            <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-slate-50/20">
                                <EmailBody email={selectedEmail} />
                            </div>

                            {/* Reply Editor - More compact to prioritize reading space */}
                            <div className="p-6 md:p-7 border-t border-slate-100 bg-white flex-shrink-0 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> Respuesta Automática
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleGenerateAI}
                                        disabled={isGenerating}
                                        className="h-9 px-3 text-indigo-600 hover:bg-indigo-50 gap-2 border border-indigo-100 rounded-xl font-bold text-xs"
                                    >
                                        <Sparkles className={cn("w-3.5 h-3.5 text-orange-400", isGenerating && "animate-pulse")} />
                                        {isGenerating ? 'IA...' : 'Auto-IA'}
                                    </Button>
                                </div>

                                <div className="relative group">
                                    <textarea
                                        value={replyDraft}
                                        onChange={(e) => setReplyDraft(e.target.value)}
                                        placeholder="Escribe o genera una respuesta..."
                                        className="w-full h-24 p-5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none shadow-inner font-medium text-slate-800"
                                    />
                                    {isGenerating && (
                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-0" />
                                                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-150" />
                                                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-300" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleSendReply}
                                        disabled={isSending || !replyDraft}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-3 px-8 h-12 rounded-xl shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95 font-black uppercase tracking-widest text-[10px]"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        {isSending ? 'Enviando...' : 'Enviar Respuesta'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl m-4 border-2 border-dashed border-slate-100">
                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                                <Inbox className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="font-bold text-slate-800 mb-1">Selecciona un mensaje</h3>
                            <p className="text-slate-400 text-xs max-w-xs mx-auto">Selecciona una conversación a la izquierda para ver el contenido y generar una respuesta con inteligencia artificial.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailInbox;
