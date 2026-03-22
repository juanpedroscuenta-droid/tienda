import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  MoreVertical, 
  Phone, 
  Mail, 
  Calendar,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  User,
  MapPin,
  Car
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { db } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Quote {
  id: string;
  spare_part: string;
  brand: string;
  line: string;
  model_year: string;
  engine_size?: string;
  client_name: string;
  city?: string;
  created_at: string;
  status: 'pending' | 'responded' | 'rejected';
  type: 'whatsapp' | 'web';
}

export const QuoteManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const isSupabase = typeof (db as any)?.from === 'function';

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      if (isSupabase) {
        const { data, error } = await (db as any)
          .from('quotes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          // Si la tabla no existe, mostraremos una lista vacía
          console.log('Tabla de cotizaciones no encontrada o error:', error.message);
          setQuotes([]);
        } else if (data) {
          setQuotes(data);
        }
      } else {
        // Mock data para desarrollo local sin base de datos real
        setQuotes([]);
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Quote['status']) => {
    try {
      if (isSupabase) {
        const { error } = await (db as any)
          .from('quotes')
          .update({ status: newStatus })
          .eq('id', id);
        
        if (error) throw error;
      }
      
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));
      toast({ title: 'Estado actualizado', description: `Cotización marcada como ${newStatus}` });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta solicitud?')) return;
    
    try {
      if (isSupabase) {
        const { error } = await (db as any)
          .from('quotes')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
      
      setQuotes(prev => prev.filter(q => q.id !== id));
      toast({ title: 'Solicitud eliminada' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la solicitud', variant: 'destructive' });
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      quote.client_name.toLowerCase().includes(searchLower) ||
      quote.spare_part.toLowerCase().includes(searchLower) ||
      quote.brand.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestión de Cotizaciones
          </h1>
          <p className="text-slate-500 mt-1">
            Revisa y gestiona las solicitudes de repuestos enviadas por tus clientes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-slate-200 shadow-sm"
            onClick={loadQuotes}
          >
            Refrescar
          </Button>
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Total: {quotes.length}
          </div>
        </div>
      </div>

      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="bg-white border-b px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por cliente o repuesto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-lg focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <Button 
                variant={statusFilter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="rounded-full text-xs font-bold"
              >
                Todas
              </Button>
              <Button 
                variant={statusFilter === 'pending' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('pending')}
                className="rounded-full text-xs font-bold flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                Pendientes
              </Button>
              <Button 
                variant={statusFilter === 'responded' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('responded')}
                className="rounded-full text-xs font-bold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Respondidas
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-slate-500 font-medium">Cargando solicitudes...</p>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 ring-1 ring-slate-100 shadow-inner">
                <ClipboardList className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">No se encontraron cotizaciones</h3>
              <p className="text-slate-500 mt-2 max-w-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? "Prueba a cambiar tus filtros de búsqueda." 
                  : "Las cotizaciones enviadas por tus clientes aparecerán aquí."}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 max-w-md">
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    <strong>Nota:</strong> Las cotizaciones actuales se reciben directamente en el WhatsApp del asesor. 
                    Estamos trabajando para integrarlas directamente en este panel para que lleves un mejor control.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredQuotes.map((quote) => (
                <div key={quote.id} className="p-6 hover:bg-slate-50 transition-all group">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge className={cn(
                          "px-2.5 py-1 font-bold text-[10px] uppercase tracking-wider",
                          quote.status === 'pending' ? "bg-amber-100 text-amber-700" :
                          quote.status === 'responded' ? "bg-green-100 text-green-700" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {quote.status === 'pending' ? 'Pendiente' : quote.status === 'responded' ? 'Respondida' : 'Rechazada'}
                        </Badge>
                        <Badge variant="outline" className={cn(
                            "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border-2",
                            quote.type === 'whatsapp' ? "border-emerald-200 text-emerald-600 bg-emerald-50" : "border-blue-200 text-blue-600 bg-blue-50"
                        )}>
                            {quote.type === 'whatsapp' ? 'WhatsApp' : 'Web'}
                        </Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium ml-auto lg:ml-0">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(quote.created_at)}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="text-xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                          {quote.spare_part}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                            <Car className="w-3.5 h-3.5 text-blue-500" />
                            {quote.brand} {quote.line} {quote.model_year}
                          </div>
                          {quote.engine_size && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                              Cilindraje: {quote.engine_size}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                            {quote.client_name.charAt(0)}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-800">{quote.client_name}</span>
                            {quote.city && (
                              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                <MapPin className="w-3 h-3" />
                                {quote.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col items-center gap-2 shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full lg:w-40 h-10 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-2"
                        onClick={() => window.open(`https://wa.me/573212619434?text=Hola, estoy respondiendo a tu solicitud de cotizacion: ${quote.spare_part}`, '_blank')}
                      >
                        <Phone className="w-4 h-4 text-green-500" />
                        Responder
                      </Button>
                      
                      <div className="flex w-full lg:w-40 gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex-1 h-10 border border-slate-200 hover:bg-slate-50">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(quote.id, 'responded')}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              Marcar respondida
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(quote.id, 'pending')}>
                              <Clock className="mr-2 h-4 w-4 text-amber-500" />
                              Marcar pendiente
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteQuote(quote.id)} className="text-red-500">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuoteManager;
