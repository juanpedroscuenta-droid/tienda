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
    status: 'unread' | 'read' | 'replied' | 'archived';
}

const EmailInbox = () => {
    const [emails, setEmails] = useState<InboundEmail[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Draft actual editable
    const [replyDraft, setReplyDraft] = useState('');

    const loadEmails = async () => {
        setIsLoading(true);
        try {
            const data = await fetchInboundEmails();
            setEmails(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadEmails();
    }, []);

    const selectedEmail = emails.find(e => e.id === selectedId);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncInboundEmails();
            toast({ title: "Buzón Sincronizado", description: "Se han descargado los correos más recientes." });
            loadEmails();
        } catch (error: any) {
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
        <div className="flex flex-col h-[700px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                        <Inbox className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Buzón de Atención</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Email 24/7 Automation</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="bg-white hover:bg-slate-50 gap-2 border-slate-200"
                    >
                        <RefreshCw className={cn("w-4 h-4 text-indigo-600", isSyncing && "animate-spin")} />
                        {isSyncing ? "Sincronizando..." : "Sincronizar"}
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 min-h-0">
                {/* Listado Izquierdo */}
                <div className="w-[350px] border-r border-slate-100 flex flex-col bg-slate-50/30">
                    <div className="p-3">
                        <div className="relative">
                            <MailSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                placeholder="Buscar en recibidos..."
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-400 italic text-sm animate-pulse">Cargando mensajes...</div>
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
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {selectedEmail ? (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Email Header */}
                            <div className="p-6 border-b border-slate-50 flex-shrink-0">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold border border-white shadow-sm ring-4 ring-slate-50">
                                            {(selectedEmail.from_name || selectedEmail.from_email).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg leading-tight">{selectedEmail.subject || '(Sin Asunto)'}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm font-medium text-slate-600">{selectedEmail.from_email}</span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(selectedEmail.received_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={selectedEmail.is_replied ? "outline" : "default"} className={cn(
                                        "py-1 px-3",
                                        selectedEmail.is_replied ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-indigo-500"
                                    )}>
                                        {selectedEmail.is_replied ? 'Respondido' : 'Pendiente'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Email Contents */}
                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm leading-relaxed text-slate-700 text-sm whitespace-pre-wrap">
                                    {selectedEmail.body_text}
                                </div>
                            </div>

                            {/* Reply Editor */}
                            <div className="p-6 border-t border-slate-100 bg-white flex-shrink-0 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <MessageSquare className="w-3.5 h-3.5" /> Respuesta Automática
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleGenerateAI}
                                        disabled={isGenerating}
                                        className="h-8 text-indigo-600 hover:bg-indigo-50 gap-2 border border-indigo-100"
                                    >
                                        <Sparkles className={cn("w-3.5 h-3.5", isGenerating && "animate-pulse")} />
                                        {isGenerating ? 'Generando...' : 'Generar con IA'}
                                    </Button>
                                </div>

                                <div className="relative group">
                                    <textarea
                                        value={replyDraft}
                                        onChange={(e) => setReplyDraft(e.target.value)}
                                        placeholder="Escribe o genera una respuesta..."
                                        className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none shadow-inner"
                                    />
                                    {isGenerating && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl animate-pulse">
                                            <Sparkles className="w-8 h-8 text-indigo-500 animate-bounce" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        onClick={handleSendReply}
                                        disabled={isSending || !replyDraft}
                                        className="bg-slate-900 hover:bg-slate-800 text-white gap-2 px-8 h-12 rounded-xl shadow-lg shadow-slate-200 disabled:opacity-50 transition-all hover:scale-[1.02]"
                                    >
                                        <Send className="w-4 h-4" />
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
