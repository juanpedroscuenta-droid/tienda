import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Search, Filter,
  MoreVertical, Phone, Mail,
  Send, Paperclip, CheckCheck,
  MessageCircle, Star,
  CheckSquare, Settings,
  AlertCircle
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const CRMWhatsAppPanel = () => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [currentChatDetail, setCurrentChatDetail] = useState<any>(null);
  const [messageInput, setMessageInput] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChatDetail?.messages]);

  const BACKEND_URL = '/api/crm/chats';

  const fetchChats = async () => {
    try {
      const res = await fetch(BACKEND_URL);
      const data = await res.json();
      setChats(data);
      if (!activeChat && data.length > 0) {
        setActiveChat(data[0].id);
      }
    } catch (e) {
      console.error('Error fetching chats:', e);
    }
  };

  const fetchChatDetail = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/${id}`);
      const data = await res.json();
      setCurrentChatDetail(data);
    } catch (e) {
      console.error('Error fetching chat detail:', e);
    }
  };

  // Optimized Polling Logic
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;


    const poll = async () => {
      // Evitar peticiones concurrentes si una ya está en curso
      if (isFetchingRef.current) return;

      // Solo poll si la ventana está activa y visible
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        try {
          isFetchingRef.current = true;
          await fetchChats();
          if (activeChat) {
            await fetchChatDetail(activeChat);
          }
        } finally {
          isFetchingRef.current = false;
        }
      }


      if (isMounted) {
        // Reducimos frecuencia si no hay foco para ahorrar recursos (ej. 10s)
        const delay = document.hasFocus() ? 3000 : 10000;
        timeoutId = setTimeout(poll, delay);
      }
    };

    poll();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [activeChat]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChat) return;
    try {
      const res = await fetch(`${BACKEND_URL}/${activeChat}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: messageInput, sender: 'agent' })
      });
      if (res.ok) {
        setMessageInput('');
        fetchChatDetail(activeChat);
        fetchChats(); // Update last message in the list
      }
    } catch (e) {
      console.error('Error sending message:', e);
    }
  };

  const handleStopAgent = async () => {
    if (!activeChat) return;
    try {
      await fetch(`/api/crm/chats/stop/${activeChat}`, {
        method: 'POST'
      });
      fetchChatDetail(activeChat);
    } catch (e) {
      console.error('Error stopping agent:', e);
    }
  };

  const handleReleaseToAgent = async () => {
    if (!activeChat) return;
    try {
      await fetch(`/api/crm/chats/release/${activeChat}`, {
        method: 'POST'
      });
      fetchChatDetail(activeChat);
    } catch (e) {
      console.error('Error releasing chat:', e);
    }
  };

  const handleSimulateConnect = async () => {
    setIsConnectModalOpen(false);
    setIsSettingsModalOpen(false);
    try {
      await fetch('/api/crm/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          phoneId,
          businessId
        })
      });
      fetchChats();
    } catch (e) {
      console.error('Error connecting API:', e);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-[#F8FAFC] border border-slate-200 rounded-xl overflow-hidden shadow-sm font-inter">

      {/* Inbox List Sidebar */}
      <div className="w-[320px] lg:w-[380px] bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">

        {/* Inbox Header */}
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Bandeja de entrada
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" title="Nueva conversación">
                <CheckSquare className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                <Filter className="h-5 w-5" />
              </Button>
              <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" title="Configuración Meta">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  {/* ... content remains same ... */}
                  <DialogHeader>
                    <DialogTitle>Credenciales Meta API</DialogTitle>
                    <DialogDescription>
                      Actualiza tu Access Token y Phone ID para enviar mensajes reales.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label className="text-xs font-semibold">Access Token</Label>
                      <Input placeholder="EAAIExxx..." value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold">Phone ID</Label>
                        <Input placeholder="1029384..." value={phoneId} onChange={(e) => setPhoneId(e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold">Business ID</Label>
                        <Input placeholder="987654..." value={businessId} onChange={(e) => setBusinessId(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)}>Cancelar</Button>
                    <Button className="bg-[#2563EB] text-white" onClick={handleSimulateConnect}>Guardar y Conectar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex items-center gap-2 border border-slate-100 bg-slate-50 rounded-lg px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              className="bg-transparent border-none outline-none flex-1 text-slate-600 placeholder:text-slate-400 font-medium"
            />
            <span className="text-[10px] bg-white px-1.5 py-0.5 border border-slate-200 rounded text-slate-400 font-bold uppercase">ctrl + k</span>
          </div>

          <div className="flex items-center gap-6 border-b border-slate-100 pb-0 text-[13px] font-semibold text-slate-500">
            <button className="text-blue-600 border-b-2 border-blue-600 pb-2 px-1 relative">
              Todo
            </button>
            <button className="pb-2 px-1 hover:text-slate-800 transition-colors">No leído</button>
            <button className="pb-2 px-1 hover:text-slate-800 transition-colors">Recientes</button>
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`flex gap-3 px-4 py-4 cursor-pointer transition-all border-l-2 ${activeChat === chat.id
                    ? 'bg-blue-50/60 border-blue-600'
                    : 'hover:bg-slate-50 border-transparent'
                  }`}
              >
                <div className="relative">
                  <Avatar className="h-11 w-11 border border-slate-200 bg-slate-100 ring-2 ring-white">
                    <AvatarFallback className="text-slate-500 font-bold text-sm bg-slate-100">{chat.avatar}</AvatarFallback>
                  </Avatar>
                  {chat.platform === 'wpp' && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-[#25D366] rounded-full p-0.5 border-[1.5px] border-white shadow-sm">
                      <MessageCircle className="h-3 w-3 text-white fill-current" />
                    </div>
                  )}
                  {chat.needsIntervention && (
                    <div className={`absolute -top-1 -left-1 rounded-full p-1 border-2 border-white shadow-md animate-bounce ${chat.interventionType === 'payment' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                      <AlertCircle className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className={`text-[14px] truncate pr-2 ${activeChat === chat.id ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                      {chat.name}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">{chat.time}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[12.5px] truncate max-w-[180px] ${chat.unread > 0 ? 'text-slate-700 font-semibold italic' : 'text-slate-500'}`}>
                      {chat.lastMessage}
                    </p>
                    {chat.unread > 0 && (
                      <Badge className="h-[18px] min-w-[18px] px-1 bg-blue-600 hover:bg-blue-600 rounded-full text-[10px] font-bold flex items-center justify-center border-none">
                        {chat.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Conversation Area */}
      <div className="flex-1 flex flex-col bg-[#F9FAFB]">
        {currentChatDetail ? (
          <>
            {/* Chat Header */}
            <div className="h-[auto] min-h-[73px] bg-white border-b border-slate-200 flex flex-col px-6 py-2 flex-shrink-0 shadow-sm z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className={`h-10 w-10 border bg-slate-150 text-slate-600 ring-2 transition-all ${currentChatDetail.needsIntervention && currentChatDetail.interventionType === 'payment'
                        ? 'ring-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)] border-green-200'
                        : 'ring-slate-50 border-slate-100'
                      }`}>
                      <AvatarFallback className="font-bold text-sm">{currentChatDetail.avatar}</AvatarFallback>
                    </Avatar>
                    {currentChatDetail.needsIntervention && (
                      <div className={`absolute -top-1 -left-1 rounded-full p-1 border-2 border-white shadow-sm animate-bounce ${currentChatDetail.interventionType === 'payment' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                        <AlertCircle className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[15px] font-bold text-slate-900 uppercase tracking-wide leading-tight">{currentChatDetail.name}</h3>
                    {currentChatDetail.needsIntervention && currentChatDetail.interventionType === 'payment' ? (
                      <p className="text-[11px] text-green-600 font-bold flex items-center gap-1.5 mt-0.5">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        💸 PAGO PENDIENTE DE COMPROBAR
                      </p>
                    ) : (
                      <p className="text-[11px] text-green-500 font-bold flex items-center gap-1.5 mt-0.5">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        En línea a través de WhatsApp
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant={currentChatDetail.needsIntervention ? "default" : "outline"}
                    onClick={currentChatDetail.needsIntervention ? handleReleaseToAgent : handleStopAgent}
                    className={`h-9 px-4 font-bold text-[11px] gap-2 shadow-sm uppercase tracking-tighter transition-all ${currentChatDetail.needsIntervention
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      }`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {currentChatDetail.needsIntervention ? "ACTIVAR AGENTE IA" : "DETENER AGENTE IA"}
                  </Button>
                </div>
              </div>

              {currentChatDetail.needsIntervention && (
                <div className={`mt-2 mb-1 border rounded-lg p-2.5 flex items-center gap-3 animate-in slide-in-from-top-2 ${currentChatDetail.interventionType === 'payment'
                    ? 'bg-green-50 border-green-100'
                    : 'bg-red-50 border-red-100'
                  }`}>
                  <div className={`${currentChatDetail.interventionType === 'payment' ? 'bg-green-500' : 'bg-red-500'} p-1.5 rounded-full`}>
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-[12px] font-bold uppercase tracking-tight ${currentChatDetail.interventionType === 'payment' ? 'text-green-800' : 'text-red-900'}`}>
                      {currentChatDetail.interventionType === 'payment' ? '💸 PAGO Y COMPROBANTE' : 'Intervención Humana Requerida'}
                    </p>
                    <p className={`text-[11px] font-medium ${currentChatDetail.interventionType === 'payment' ? 'text-green-700' : 'text-red-700'}`}>
                      {currentChatDetail.interventionReason || 'El cliente requiere atención de un asesor.'}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge className={`text-[10px] ${currentChatDetail.interventionType === 'payment'
                        ? 'bg-green-100 text-green-600 border-green-200'
                        : 'bg-red-100 text-red-600 border-red-200'
                      }`}>
                      {currentChatDetail.interventionType === 'payment' ? 'PAGO PENDIENTE' : 'ALERTA CRÍTICA'}
                    </Badge>
                    <Button
                      onClick={handleReleaseToAgent}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] h-7 px-3 font-bold rounded-lg transition-all shadow-sm"
                    >
                      ACTIVAR AGENTE IA
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 bg-[#F0F2F5] px-6 py-6" id="chat-messages-area" ref={scrollAreaRef}>
              <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-4">

                <div className="flex justify-center mb-4 mt-2">
                  <span className="bg-white border border-slate-200 text-slate-500 text-[11px] font-bold py-1 px-4 rounded-full shadow-sm">
                    HOY
                  </span>
                </div>

                {currentChatDetail.messages.map((msg: any) => (
                  <React.Fragment key={msg.id}>
                    {(msg.sender === 'user' || msg.sender === 'customer' || msg.sender === 'client') ? (
                      /* Inbound Message */
                      <div className="flex items-end gap-2 max-w-[80%]">
                        <Avatar className="h-8 w-8 mb-1 border-none shadow-sm flex-shrink-0">
                          <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">{currentChatDetail.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="bg-white border border-slate-200/80 p-1 rounded-2xl rounded-bl-sm shadow-sm relative group max-w-sm">
                          {msg.imageUrl && (
                            msg.content === 'Nota de voz' ? (
                              <div className="mt-2 min-w-[200px]">
                                <audio controls className="h-8 w-full">
                                  <source src={`/api/proxy-image?url=${encodeURIComponent(msg.imageUrl)}`} type="audio/ogg" />
                                  Tu navegador no soporta el audio.
                                </audio>
                              </div>
                            ) : (
                              <img
                                src={`/api/proxy-image?url=${encodeURIComponent(msg.imageUrl)}`}
                                alt="Adjunto"
                                className="rounded-xl mb-1.5 w-full object-cover max-h-[300px] border border-slate-100 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setSelectedImageUrl(`/api/proxy-image?url=${encodeURIComponent(msg.imageUrl)}`)}
                              />
                            )
                          )}
                          <div className="px-3 py-1.5">
                            <p className="text-[14.5px] text-slate-800 leading-relaxed font-medium">
                              {msg.content}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">{msg.time}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (msg.sender === 'assistant' || msg.sender === 'bot') ? (
                      /* Bot/Agent Outbound (Grey style or specific) */
                      <div className="flex items-end gap-2 max-w-[85%] self-end">
                        <div className="bg-[#f0f0f0] border border-slate-300/50 py-2.5 px-4 rounded-2xl rounded-br-sm shadow-sm relative group">
                          <p className="text-[14.5px] text-slate-700 leading-relaxed font-bold italic">
                            🤖 {msg.content}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1.5">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">{msg.time}</span>
                            <CheckCheck className="h-3 w-3 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    ) : msg.isCampaign ? (
                      /* Campaign Outbound */
                      <div className="flex items-end gap-2 max-w-[85%] self-end">
                        <div className="bg-[#E7F3FF] border border-blue-200/50 p-1.5 rounded-2xl rounded-br-sm shadow-sm relative w-[340px]">
                          <div className="bg-white rounded-xl p-3.5 mb-1.5 border border-blue-50">
                            <p className="text-sm font-bold text-slate-900 mb-1">{msg.campaignTitle}</p>
                            <p className="text-[13px] text-slate-600 line-clamp-3 leading-relaxed">{msg.content}</p>
                          </div>
                          <div className="flex items-center justify-between px-3 pb-1 pt-1">
                            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">Campaña Activa</span>
                            <span className="text-[10px] text-blue-700 font-bold flex items-center gap-1 uppercase">
                              {msg.time} {msg.read && <CheckCheck className="h-3.5 w-3.5 fill-current" />}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Regular Outbound */
                      <div className="flex items-end gap-2 max-w-[85%] self-end">
                        <div className="bg-[#E7F3FF] border border-blue-100 py-2.5 px-4 rounded-2xl rounded-br-sm shadow-sm relative group ring-1 ring-blue-50">
                          <p className="text-[14.5px] text-slate-800 leading-relaxed font-medium">
                            {msg.content}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1.5">
                            <span className="text-[10px] text-blue-700 font-bold uppercase">{msg.time}</span>
                            {msg.read && <CheckCheck className="h-4 w-4 text-blue-500 fill-current opacity-80" />}
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}

                {/* Scroll Bottom Anchor */}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-end gap-3 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 flex-shrink-0">
                <Paperclip className="h-5 w-5" />
              </Button>

              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl flex items-end focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all p-1">
                <textarea
                  placeholder="Escribe un mensaje..."
                  className="w-full bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] py-2.5 px-3 text-[15px] text-slate-700 placeholder:text-slate-400"
                  rows={1}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>

              <Button
                className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex-shrink-0"
                onClick={handleSendMessage}
              >
                <Send className="h-5 w-5 ml-0.5" />
              </Button>
            </div>
          </>
        ) : chats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-white">
            <div className="bg-slate-50 p-8 rounded-full mb-6 relative">
              <MessageSquare className="h-16 w-16 text-slate-300" />
              <div className="absolute -bottom-2 -right-2 bg-[#25D366] rounded-full p-2 border-4 border-white">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Conecta tu Bandeja de entrada</h3>
            <p className="text-slate-500 max-w-sm text-center mb-8">
              Sincroniza tu cuenta de WhatsApp API o Meta para empezar a recibir y enviar mensajes directamente desde tu tienda.
            </p>
            <Dialog open={isConnectModalOpen} onOpenChange={setIsConnectModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2 font-bold px-8 py-6 text-base rounded-full shadow-lg shadow-green-500/20">
                  <MessageCircle className="h-5 w-5" />
                  Conectar WhatsApp
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Configuración de WhatsApp API</DialogTitle>
                  <DialogDescription>
                    Ingresa tus credenciales de Meta Graph API para sincronizar tu cuenta con el panel de tu tienda.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="accessToken" className="text-xs text-slate-500 font-semibold">Access Token Temporal/Permanente</Label>
                    <Input id="accessToken" placeholder="EAAIExxx..." className="col-span-3 text-sm" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="phoneId" className="text-xs text-slate-500 font-semibold">Identificador Teléfono</Label>
                      <Input id="phoneId" placeholder="1029384756" className="text-sm" value={phoneId} onChange={(e) => setPhoneId(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bussinessId" className="text-xs text-slate-500 font-semibold">ID Cuenta Business</Label>
                      <Input id="bussinessId" placeholder="9876543210" className="text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)} />
                    </div>
                  </div>
                </div>
                <DialogFooter className="sm:justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsConnectModalOpen(false)}>Cancelar</Button>
                  <Button type="button" className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold" onClick={handleSimulateConnect}>
                    Guardar y Autenticar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-medium">
            <MessageSquare className="h-12 w-12 text-slate-200 mb-4" />
            Selecciona una conversación para ver los mensajes.
          </div>
        )}
      </div>

      {/* Full Size Image Modal */}
      <Dialog open={!!selectedImageUrl} onOpenChange={(open) => !open && setSelectedImageUrl(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-1 bg-transparent border-none shadow-none flex items-center justify-center">
          {selectedImageUrl && (
            <img
              src={selectedImageUrl}
              alt="Full view"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
