import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Search, Bell, MessageCircle, Clock, CheckCircle, XCircle, Trash2, Check, RefreshCw, Filter, Mail, Calendar, Download, BarChart3, FileText, ShoppingBag, Plus, DollarSign, CreditCard, Tags, Eye, Package } from 'lucide-react';

import { useAuth } from "@/contexts/AuthContext";
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchOrders as fetchApiOrders, updateOrder as updateApiOrder, deleteOrder as deleteApiOrder, sendOrderConfirmationEmail } from '@/lib/api';
import { PhysicalPOS } from './PhysicalPOS';

// Extendemos la definición de jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface OrdersListProps {
  orders?: any[];
}

// CSS personalizado para ayudar con la responsividad
const responsiveStyles = `
  @media (max-width: 500px) {
    .responsive-table {
      font-size: 0.7rem;
    }
  }
`;

export const OrdersList: React.FC<OrdersListProps> = ({ orders: initialOrders }) => {
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>(initialOrders || []);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'confirmed'
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [currentTab, setCurrentTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Estados para el modal de venta física
  const [showPhysicalSaleModal, setShowPhysicalSaleModal] = useState(false);

  // Estados para ver detalles del pedido
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Cargar pedidos reales
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchApiOrders();
      setOrders((data || []).map((order: any) => ({
        ...order,
        id: order.id,
        createdAt: order.created_at || order.createdAt,
        deliveryFee: order.delivery_fee || order.deliveryFee,
        orderNotes: order.order_notes || order.orderNotes,
        userName: order.user_name || order.userName,
        userEmail: order.user_email || order.userEmail,
        userPhone: order.user_phone || order.userPhone || order.users?.phone || order.users?.telefono,
        confirmedAt: order.confirmed_at || order.confirmedAt,
        physicalSale: order.order_type === 'physical' || order.orderType === 'physical'
      })));
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error al cargar pedidos",
        description: "No se pudieron cargar los pedidos. Por favor, intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleOpenPhysicalSaleModal = () => {
    setShowPhysicalSaleModal(true);
  };



  // Confirmar pedido
  const handleConfirm = async (orderId: string) => {
    try {
      let orderData: any;
      orderData = await updateApiOrder(orderId, {
        status: "confirmed"
      });

      // Buscar el pedido completo para enviar el correo
      const fullOrder = orders.find(o => o.id === orderId);

      // Actualizar la UI
      setOrders(orders =>
        orders.map(order =>
          order.id === orderId ? {
            ...order,
            status: "confirmed",
            confirmedAt: new Date().toISOString()
          } : order
        )
      );

      toast({
        title: "Pedido confirmado",
        description: "El pedido ha sido confirmado exitosamente.",
        variant: "default"
      });

      // Enviar correo de confirmación al cliente
      if (fullOrder?.userEmail) {
        try {
          await sendOrderConfirmationEmail(fullOrder);
          toast({
            title: "📧 Correo enviado",
            description: `Se envió la confirmación a ${fullOrder.userEmail}`,
          });
        } catch (emailError: any) {
          console.error("Error enviando correo de confirmación:", emailError);
          toast({
            title: "⚠️ Pedido confirmado, correo no enviado",
            description: emailError.message || "No se pudo enviar el correo de confirmación.",
            variant: "destructive"
          });
        }
      }

      // Forzar actualización del dashboard
      const dashboardUpdateEvent = new CustomEvent('dashboardUpdate', {
        detail: {
          type: 'orderConfirmed',
          orderTotal: orderData.total || 0
        }
      });
      document.dispatchEvent(dashboardUpdateEvent);

      setTimeout(() => {
        const refreshButton = document.querySelector('.dashboard-refresh-button');
        if (refreshButton && refreshButton instanceof HTMLButtonElement) {
          console.log("Forzando recarga de estadísticas");
          refreshButton.click();
        }
      }, 500);
    } catch (error) {
      console.error("Error confirming order:", error);
      toast({
        title: "Error al confirmar",
        description: "No se pudo confirmar el pedido. Por favor, intente nuevamente.",
        variant: "destructive"
      });
    }
  };

  // Eliminar pedido
  const handleDelete = async (orderId: string) => {
    if (!confirm("¿Está seguro que desea eliminar este pedido? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await deleteApiOrder(orderId);
      setOrders(orders => orders.filter(order => order.id !== orderId));
      toast({
        title: "Pedido eliminado",
        description: "El pedido ha sido eliminado exitosamente.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el pedido. Por favor, intente nuevamente.",
        variant: "destructive"
      });
    }
  };

  // Manejar cambio en el notificador
  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    toast({
      title: "Función no disponible",
      description: "El notificador de pedidos por correos aún no está disponible en esta tienda.",
      variant: "destructive"
    });
  };

  // Exportar pedidos como CSV
  const exportToCSV = () => {
    setExporting(true);

    try {
      // Crear el contenido CSV
      const headers = ["ID", "Cliente", "Email", "Teléfono", "Productos", "Total", "Estado", "Fecha Creación", "Fecha Confirmación", "Notas"];

      const csvRows = [headers];

      // Agregar datos de pedidos
      filteredOrders.forEach(order => {
        const productsList = order.items && order.items.length > 0
          ? order.items.map((item: any) => `${item.name} x${item.quantity}`).join(", ")
          : "Sin productos";

        const row = [
          order.id || "",
          order.userName || "",
          order.userEmail || "",
          order.userPhone || "",
          productsList,
          typeof order.total === 'number' ? order.total.toLocaleString('es-CO') : '0',
          order.status === 'confirmed' ? 'Confirmado' : 'En espera',
          order.createdAt ? formatDate(order.createdAt) : 'N/A',
          order.confirmedAt ? formatDate(order.confirmedAt) : 'N/A',
          order.orderNotes || ""
        ];

        csvRows.push(row);
      });

      // Convertir array a string CSV
      const csvContent = csvRows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',')
      ).join('\n');

      // Crear el blob y descargarlo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportación exitosa",
        description: `Se han exportado ${filteredOrders.length} pedidos en formato CSV.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast({
        title: "Error en la exportación",
        description: "No se pudieron exportar los pedidos. Inténtelo nuevamente.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  // Exportar pedidos como PDF
  const exportToPDF = () => {
    setExporting(true);

    try {
      // Crear el documento PDF
      const doc = new jsPDF();

      // Añadir título
      doc.setFontSize(16);
      doc.text("Reporte de Pedidos", 14, 15);

      // Añadir fecha
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 14, 22);

      // Añadir filtros utilizados
      if (searchTerm || currentTab !== 'all') {
        let filtersText = "Filtros: ";
        if (searchTerm) filtersText += `Búsqueda: "${searchTerm}" `;
        if (currentTab !== 'all') filtersText += `Estado: ${currentTab === 'pending' ? 'Pendientes' : 'Confirmados'}`;
        doc.text(filtersText, 14, 27);
      }

      // Preparar datos para la tabla
      const tableColumn = ["Cliente", "Contacto", "Productos", "Total", "Estado", "Fecha"];
      const tableRows = filteredOrders.map(order => {
        const productsList = order.items && order.items.length > 0
          ? order.items.map((item: any) => `${item.name} x${item.quantity}`).join(", ")
          : "Sin productos";

        return [
          order.userName || "Cliente",
          `${order.userPhone || "No especificado"}\n${order.userEmail || ""}`,
          productsList.length > 40 ? `${productsList.substring(0, 40)}...` : productsList,
          typeof order.total === 'number' ? `$${order.total.toLocaleString('es-CO')}` : '$0',
          order.status === 'confirmed' ? 'Confirmado' : 'En espera',
          formatDate(order.createdAt)
        ];
      });

      // Crear tabla en el PDF
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 32,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        theme: 'grid',
        columnStyles: {
          0: { cellWidth: 30 },  // Cliente
          1: { cellWidth: 40 },  // Contacto
          2: { cellWidth: 60 },  // Productos
          3: { cellWidth: 15 },  // Total
          4: { cellWidth: 20 },  // Estado
          5: { cellWidth: 25 },  // Fecha
        }
      });

      // Añadir información al pie de página
      const finalY = doc.lastAutoTable.finalY || 32;
      doc.setFontSize(10);
      doc.text(`Total de pedidos: ${filteredOrders.length}`, 14, finalY + 10);

      // Añadir contador de estados
      const confirmedCount = filteredOrders.filter(order => order.status === 'confirmed').length;
      const pendingCount = filteredOrders.filter(order => order.status !== 'confirmed').length;
      doc.text(`Confirmados: ${confirmedCount} | Pendientes: ${pendingCount}`, 14, finalY + 16);

      // Guardar el PDF
      doc.save(`reporte_pedidos_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "Exportación exitosa",
        description: `Se han exportado ${filteredOrders.length} pedidos en formato PDF.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast({
        title: "Error en la exportación",
        description: "No se pudieron exportar los pedidos a PDF. Inténtelo nuevamente.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string, isPhysical: boolean) => {
    if (isPhysical) {
      return <Badge className="bg-[hsl(214,100%,38%)]/10 text-[hsl(214,100%,38%)] border-[hsl(214,100%,38%)]/20 font-medium rounded-lg">Venta Física</Badge>;
    }

    switch (status) {
      case 'confirmed':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium rounded-lg">Confirmado</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-medium rounded-lg">En espera</Badge>;
    }
  };

  const getStatusIcon = (status: string, isPhysical: boolean) => {
    if (isPhysical) {
      return <ShoppingBag className="h-4 w-4 text-[hsl(214,100%,38%)]" />;
    }

    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-amber-600" />;
    }
  };

  const formatDate = (dateString?: any) => {
    if (!dateString) return 'N/A';

    try {
      // Si es un timestamp de Firestore
      if (typeof dateString === 'object' && dateString.seconds) {
        return new Intl.DateTimeFormat('es-CO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date(dateString.seconds * 1000));
      }

      // Si es una cadena ISO
      const date = new Date(dateString);

      // Validar si la fecha es válida
      if (isNaN(date.getTime())) {
        // Intentar convertir de timestamp numérico si es un número
        if (!isNaN(Number(dateString))) {
          return new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date(Number(dateString)));
        }

        // Si llegamos aquí, no pudimos formatear la fecha
        console.error("Fecha inválida:", dateString);
        return new Date().toLocaleDateString('es-CO');
      }

      return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return new Date().toLocaleDateString('es-CO');
    }
  };

  const filteredOrders = orders
    .filter(order =>
      (order.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.userPhone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.id || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(order => {
      if (currentTab === 'all') return true;
      if (currentTab === 'pending') return order.status !== 'confirmed' && !order.physicalSale;
      if (currentTab === 'confirmed') return order.status === 'confirmed' && !order.physicalSale;
      if (currentTab === 'physical') return !!order.physicalSale || order.order_type === 'physical' || order.orderType === 'physical';
      return true;
    });

  return (
    <>
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
        <style>{responsiveStyles}</style>
        <CardHeader className="pb-0 bg-slate-50/50 border-b border-slate-200">
          {/* Encabezado responsivo */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(214,100%,38%)] flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-800 text-xl md:text-2xl font-bold">
                  Gestión de Pedidos
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs md:text-sm mt-0.5">
                  {refreshing ? 'Actualizando...' : `Total ${filteredOrders.length} ${filteredOrders.length === 1 ? 'pedido' : 'pedidos'}`}
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Button
                size="sm"
                variant="default"
                onClick={handleOpenPhysicalSaleModal}
                className="flex items-center gap-1.5 text-xs h-9 gradient-orange hover:opacity-90"
              >
                <ShoppingBag className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden xs:inline">Venta Física</span>
                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 xs:hidden" />
              </Button>



              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-xs h-9 border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 md:h-4 md:w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1.5 text-xs h-9 border-slate-200 hover:bg-slate-50"
                    disabled={exporting || filteredOrders.length === 0}
                  >
                    {exporting ? (
                      <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    )}
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-slate-200">
                  <DropdownMenuItem onClick={exportToCSV} disabled={exporting || filteredOrders.length === 0}>
                    Exportar como CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF} disabled={exporting || filteredOrders.length === 0}>
                    Exportar como PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="mt-4 md:mt-5">
            <TabsList className="mb-3 bg-slate-100 p-1 w-full h-10 md:h-11 rounded-xl border border-slate-200">
              <TabsTrigger value="all" className="text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[hsl(214,100%,38%)] rounded-lg">
                Todos
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[hsl(214,100%,38%)] rounded-lg">
                Pendientes
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[hsl(214,100%,38%)] rounded-lg">
                Confirmados
              </TabsTrigger>
              <TabsTrigger value="physical" className="text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[hsl(214,100%,38%)] rounded-lg">
                Ventas Físicas
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar pedido por cliente, contacto o ID..."
                  className="pl-10 text-sm h-10 border-slate-200 focus:border-[hsl(214,100%,38%)] focus:ring-[hsl(214,100%,38%)]/20 rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button size="icon" variant="outline" className="h-10 w-10 rounded-lg border-slate-200 hover:bg-slate-50">
                <Filter className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-4 px-4 md:px-6 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <RefreshCw className="h-7 w-7 animate-spin text-[hsl(214,100%,38%)]" />
              </div>
              <span className="text-slate-500 text-sm">Cargando pedidos...</span>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden overflow-x-auto responsive-table shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700 text-xs md:text-sm whitespace-nowrap">Cliente</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs md:text-sm whitespace-nowrap hidden sm:table-cell">Contacto</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs md:text-sm whitespace-nowrap hidden md:table-cell">Productos</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs md:text-sm whitespace-nowrap">Total</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs md:text-sm whitespace-nowrap hidden sm:table-cell">Fecha</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs md:text-sm whitespace-nowrap">Estado</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 text-xs md:text-sm whitespace-nowrap">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-slate-50/80 text-xs md:text-sm border-b border-slate-100">
                      {/* Cliente - Siempre visible */}
                      <TableCell className="py-2 md:py-4">
                        <div>
                          <div className="font-semibold text-xs md:text-sm line-clamp-1">
                            {order.userName || 'Cliente'}
                          </div>
                          <div className="text-[10px] md:text-xs text-muted-foreground mt-1 hidden xs:block">
                            ID: {order.id.substring(0, 6)}...
                          </div>
                        </div>
                      </TableCell>

                      {/* Contacto - Oculto en móvil */}
                      <TableCell className="hidden sm:table-cell py-2 md:py-4">
                        <div>
                          <div className="font-medium text-xs md:text-sm flex items-center gap-1 line-clamp-1">
                            {order.userPhone || 'No especificado'}
                          </div>
                          <div className="text-[10px] md:text-xs text-slate-500 mt-1 line-clamp-1">
                            {order.userEmail}
                          </div>
                        </div>
                      </TableCell>

                      {/* Productos - Oculto en móvil */}
                      <TableCell className="hidden md:table-cell py-2 md:py-4">
                        <div className="max-w-[140px] md:max-w-[200px] overflow-hidden">
                          {order.items && order.items.length > 0 ? (
                            <>
                              {order.items.slice(0, 2).map((item: any, idx: number) => (
                                <div key={idx} className="text-xs md:text-sm flex items-center gap-1 mb-1">
                                  <Badge variant="outline" className="px-1.5 py-0 h-4 md:h-5 text-[10px] md:text-xs rounded-lg border-slate-200 bg-slate-50">
                                    {item.quantity}
                                  </Badge>
                                  <span className="truncate max-w-[90px] md:max-w-[140px]" title={item.name}>
                                    {item.name}
                                  </span>
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <div className="text-[10px] md:text-xs text-slate-500">
                                  +{order.items.length - 2} más
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] md:text-xs text-muted-foreground">Sin productos</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Total - Siempre visible */}
                      <TableCell className="py-2 md:py-4">
                        <div className="font-semibold text-[hsl(214,100%,38%)] text-xs md:text-sm whitespace-nowrap">
                          ${typeof order.total === 'number' ? order.total.toLocaleString('es-CO') : '0'}
                        </div>
                        {order.discountType && order.discountType !== 'none' && (
                          <div className="text-[10px] md:text-xs text-red-500 mt-1 flex items-center gap-1">
                            <Tags className="h-3 w-3" />
                            {order.discountType === 'percentage' ?
                              `${order.discountValue}% desc.` :
                              `$${order.discountAmount?.toLocaleString('es-CO') || 0} desc.`}
                          </div>
                        )}
                      </TableCell>

                      {/* Fecha - Oculto en móvil */}
                      <TableCell className="hidden sm:table-cell py-2 md:py-4">
                        <div>
                          <div className="text-[10px] md:text-xs font-medium">
                            {formatDate(order.createdAt)}
                          </div>
                          {order.status === 'confirmed' && order.confirmedAt && (
                            <div className="text-[10px] md:text-xs text-slate-500 mt-1">
                              Conf: {formatDate(order.confirmedAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Estado - Siempre visible */}
                      <TableCell className="py-2 md:py-4">
                        <div className="flex items-center gap-1 md:gap-2">
                          {getStatusIcon(order.status || 'pending', !!order.physicalSale)}
                          {getStatusBadge(order.status || 'pending', !!order.physicalSale)}
                        </div>
                        {order.orderNotes && (
                          <div className="text-[10px] md:text-xs text-slate-500 mt-1 italic truncate max-w-[80px] md:max-w-[120px] hidden sm:block" title={order.orderNotes}>
                            "{order.orderNotes}"
                          </div>
                        )}
                        {order.paymentMethod && (
                          <div className="text-[10px] md:text-xs text-slate-500 mt-1 truncate max-w-[80px] md:max-w-[120px]">
                            Pago: {order.paymentMethod === 'efectivo' ? 'Efectivo' : order.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Transferencia'}
                          </div>
                        )}
                      </TableCell>

                      {/* Acciones - Siempre visible */}
                      <TableCell className="text-right py-2 md:py-4">
                        <div className="flex justify-end gap-1 md:gap-2">
                          {order.status !== "confirmed" && !order.physicalSale && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConfirm(order.id)}
                              className="text-green-600 border-green-300 hover:bg-green-50 h-7 w-7 p-0 md:h-8 md:w-8"
                              title="Confirmar pedido"
                            >
                              <Check className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setViewingOrder(order); setIsDetailsOpen(true); }}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 w-8 p-0 rounded-lg"
                            title="Ver detalles"
                          >
                            <Eye className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(order.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50 h-8 w-8 p-0 rounded-lg"
                            title="Eliminar pedido"
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredOrders.length === 0 && !loading && (
            <div className="text-center py-12 md:py-16 border border-slate-200 rounded-xl bg-slate-50/50">
              <div className="flex flex-col items-center max-w-[280px] md:max-w-md mx-auto px-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-700 text-base md:text-lg mb-2">No hay pedidos</h3>
                <span className="text-slate-500 text-sm mb-4 block">
                  No se encontraron pedidos con los criterios de búsqueda actuales.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentTab('all');
                  }}
                  className="text-sm h-9 border-slate-200 hover:bg-slate-100"
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        {/* Punto de Venta (POS) - Pantalla Completa */}
        {showPhysicalSaleModal && (
          <PhysicalPOS onClose={() => {
            setShowPhysicalSaleModal(false);
            loadOrders(); // Recargar después de una venta
          }} />
        )}
      </Card>

      {/* Diálogo de Detalles del Pedido */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[hsl(214,100%,38%)]" />
              Detalles del Pedido
            </DialogTitle>
            <DialogDescription>
              ID: {viewingOrder?.id} • {viewingOrder && formatDate(viewingOrder.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {viewingOrder && (
            <div className="space-y-6 py-4">
              {/* Información del Cliente */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cliente</h4>
                  <p className="font-semibold text-slate-900">{viewingOrder.userName || 'Cliente'}</p>
                  <p className="text-sm text-slate-600">{viewingOrder.userEmail}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contacto</h4>
                  <p className="font-semibold text-slate-900">{viewingOrder.userPhone || 'No especificado'}</p>
                  <p className="text-sm text-slate-600 italic">
                    {viewingOrder.physicalSale ? 'Venta Física' : 'Pedido Online'}
                  </p>
                </div>
              </div>

              {/* Lista de Productos */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Productos ({viewingOrder.items?.length || 0})
                </h4>
                <div className="space-y-2">
                  {viewingOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">Cantidad: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          ${(item.price * item.quantity).toLocaleString('es-CO')}
                        </p>
                        <p className="text-[10px] text-slate-500">${item.price.toLocaleString('es-CO')} c/u</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas del Pedido */}
              {viewingOrder.orderNotes && (
                <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Notas del Pedido
                  </h4>
                  <p className="text-sm text-amber-900 italic">"{viewingOrder.orderNotes}"</p>
                </div>
              )}

              {/* Resumen de Pago */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>${(viewingOrder.total - (viewingOrder.deliveryFee || 0)).toLocaleString('es-CO')}</span>
                </div>
                {viewingOrder.deliveryFee > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Envío</span>
                    <span>${viewingOrder.deliveryFee.toLocaleString('es-CO')}</span>
                  </div>
                )}
                {viewingOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Descuento</span>
                    <span>-${viewingOrder.discountAmount.toLocaleString('es-CO')}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-50">
                  <span>Total</span>
                  <span className="text-[hsl(214,100%,38%)]">${viewingOrder.total?.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex sm:justify-between items-center gap-3 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2">
              {getStatusBadge(viewingOrder?.status || 'pending', !!viewingOrder?.physicalSale)}
            </div>
            <Button onClick={() => setIsDetailsOpen(false)} className="bg-slate-900 text-white hover:bg-slate-800 px-8">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
