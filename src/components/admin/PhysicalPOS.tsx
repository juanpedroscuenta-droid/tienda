import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search,
    X,
    Plus,
    PlusCircle,
    Heart,
    Trash2,
    RefreshCw,
    Barcode,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Printer,
    CreditCard,
    DollarSign,
    User as UserIcon,
    Package,
    ShoppingCart,
    CheckCircle2,
    AlertCircle,
    Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { fetchAdminProducts, createOrder as createApiOrder } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface POSItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    barcode?: string;
    image?: string;
}

interface Ticket {
    id: number;
    items: POSItem[];
    customerName: string;
    paymentMethod: string;
    paidWith: number;
}

export const PhysicalPOS: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user } = useAuth();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState<Ticket[]>([
        { id: 1, items: [], customerName: 'Cliente General', paymentMethod: 'efectivo', paidWith: 0 }
    ]);
    const [activeTicketIndex, setActiveTicketIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const activeTicket = tickets[activeTicketIndex];

    // Cargar productos al inicio
    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            try {
                const data = await fetchAdminProducts();
                setProducts(data || []);
            } catch (error) {
                console.error("Error loading products for POS:", error);
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, []);

    // Autofocus en el buscador
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [activeTicketIndex]);

    const handleAddProduct = useCallback((product: any) => {
        setTickets(prev => {
            const newTickets = [...prev];
            const ticket = { ...newTickets[activeTicketIndex] };
            const items = [...ticket.items];

            const existingItemIndex = items.findIndex(item => item.id === product.id);

            if (existingItemIndex > -1) {
                items[existingItemIndex] = {
                    ...items[existingItemIndex],
                    quantity: items[existingItemIndex].quantity + 1
                };
            } else {
                items.push({
                    id: product.id,
                    name: product.name,
                    price: Number(product.price) || 0,
                    quantity: 1,
                    barcode: product.barcode || product.id.slice(0, 8),
                    image: product.image
                });
            }

            ticket.items = items;
            newTickets[activeTicketIndex] = ticket;
            return newTickets;
        });
        setSearchQuery('');
    }, [activeTicketIndex]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        // Si hay resultados filtrados, tomamos el primero o el que sea match exacto
        const exactMatch = products.find(p =>
            p.name?.toLowerCase() === searchQuery.toLowerCase() ||
            p.barcode?.toLowerCase() === searchQuery.toLowerCase()
        );

        const product = exactMatch || (searchResults.length > 0 ? searchResults[0] : null);

        if (product) {
            handleAddProduct(product);
            setSearchResults([]);
        } else {
            toast({
                title: "Producto no encontrado",
                description: `No se encontró ningún producto relacionado con "${searchQuery}"`,
                variant: "destructive"
            });
        }
    };

    // Actualizar resultados de búsqueda mientras escribe
    useEffect(() => {
        if (searchQuery.trim().length > 1) {
            const filtered = products.filter(p =>
                p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 10);
            setSearchResults(filtered);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, products]);

    const handleUpdateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity < 0) return;

        setTickets(prev => {
            const newTickets = [...prev];
            const ticket = { ...newTickets[activeTicketIndex] };
            const items = ticket.items.map(item =>
                item.id === productId ? { ...item, quantity: newQuantity } : item
            ).filter(item => item.quantity > 0);

            ticket.items = items;
            newTickets[activeTicketIndex] = ticket;
            return newTickets;
        });
    };

    const calculateSubtotal = () => {
        return activeTicket.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal();
    };

    const handleFinishSale = async () => {
        if (activeTicket.items.length === 0) return;
        if (isProcessing) return;

        const orderPayload = {
            user_id: user?.id,
            user_name: activeTicket.customerName,
            userName: activeTicket.customerName,
            user_email: "pos@tienda.com",
            userEmail: "pos@tienda.com",
            items: activeTicket.items.map(item => ({
                id: item.id,
                name: item.name,
                price: Number(item.price),
                quantity: item.quantity,
                image: item.image || ""
            })),
            total: Number(calculateTotal()),
            delivery_fee: 0,
            status: 'confirmed',
            order_type: 'physical',
            payment_method: activeTicket.paymentMethod,
            created_at: new Date().toISOString()
        };

        setIsProcessing(true);
        console.log("Iniciando finalización de venta...", orderPayload);

        try {
            const response = await createApiOrder(orderPayload);
            console.log("Respuesta del servidor:", response);

            if (response && !response.error) {
                toast({
                    title: "Venta Finalizada",
                    description: `Venta por $${calculateTotal().toLocaleString('es-CO')} guardada correctamente.`,
                });

                const event = new CustomEvent('dashboardUpdate', {
                    detail: {
                        type: 'orderConfirmed',
                        orderTotal: calculateTotal()
                    }
                });
                document.dispatchEvent(event);

                setTickets(prev => {
                    const newTickets = [...prev];
                    newTickets[activeTicketIndex] = {
                        id: activeTicket.id,
                        items: [],
                        customerName: 'Cliente General',
                        paymentMethod: 'efectivo',
                        paidWith: 0
                    };
                    return newTickets;
                });
            } else {
                throw new Error(response?.error || "Error desconocido en el servidor");
            }
        } catch (error: any) {
            console.error("Error saving physical sale:", error);
            toast({
                title: "Error al Procesar Venta",
                description: error.message || "No se pudo comunicar con el servidor.",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const addNewTicket = useCallback(() => {
        const newId = tickets.length + 1;
        setTickets(prev => [...prev, {
            id: newId,
            items: [],
            customerName: 'Cliente General',
            paymentMethod: 'efectivo',
            paidWith: 0
        }]);
        setActiveTicketIndex(tickets.length);
    }, [tickets.length]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'F12') {
            e.preventDefault();
            handleFinishSale();
        }
        if (e.key === 'F4') {
            e.preventDefault();
            addNewTicket();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    }, [activeTicket, addNewTicket, handleFinishSale, onClose]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="fixed inset-0 z-[100] bg-[#f0f4f8] flex flex-col font-sans select-none overflow-hidden text-slate-800">

            {/* 2. BREADCRUMB / SUB-HEADER */}
            <div className="bg-[#789fcf] text-white px-2 sm:px-4 py-1.5 text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between shadow-inner gap-2 sm:gap-0">
                <span className="font-medium uppercase tracking-wider text-center sm:text-left w-full sm:w-auto">VENTA - Ticket {activeTicket.id}</span>
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right text-[10px] sm:text-xs text-white/90">
                        <span className="opacity-70">Le atiende: </span>
                        <span className="font-bold">{user?.name || 'admin'}</span>
                    </div>
                    <Button
                        variant="ghost"
                        className="text-white hover:bg-white/20 uppercase font-bold text-[10px] sm:text-xs h-6 sm:h-7 px-2 sm:px-4 rounded-none border border-white/30"
                        onClick={onClose}
                    >
                        SALIR (ESC)
                    </Button>
                </div>
            </div>

            {/* 3. SEARCH SECTION */}
            <div className="bg-white p-2 sm:p-4 border-b border-slate-300 flex flex-col sm:flex-row items-stretch gap-2 sm:gap-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-1">
                    <span className="text-slate-600 font-bold text-xs sm:text-sm whitespace-nowrap">Nombre del Producto</span>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row w-full sm:flex-1 items-stretch group gap-2 sm:gap-0">
                        <div className="relative flex-1">
                            <div className="absolute left-0 inset-y-0 w-10 sm:w-12 flex items-center justify-center border border-slate-300 border-r-0 bg-slate-50 text-slate-400 group-focus-within:border-[#2196f3] transition-colors">
                                <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <Input
                                ref={searchInputRef}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Escribe el nombre..."
                                className="pl-12 sm:pl-14 h-10 sm:h-11 text-base sm:text-lg font-bold border-slate-300 rounded-none focus-visible:ring-0 focus:border-[#2196f3] transition-colors shadow-none w-full"
                            />
                        </div>
                    </form>
                </div>
            </div>

            {/* 4. SEARCH RESULTS SECTION (Only when searching) */}
            {searchQuery.trim().length > 0 && (
                <div className="bg-white px-2 sm:px-8 py-4 border-b border-slate-200 overflow-y-auto max-h-[40vh] shadow-inner bg-slate-50/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                        <h3 className="text-[#1a2b3c] font-bold text-xs sm:text-sm tracking-widest uppercase flex items-center gap-2">
                            <Search className="w-4 h-4 text-[#2196f3]" />
                            Resultados <span className="hidden sm:inline">para: </span><span className="text-[#2196f3] normal-case">"{searchQuery}"</span>
                        </h3>
                        <span className="text-[10px] text-slate-400 font-bold">{searchResults.length} encontrados</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
                        {searchResults.map(product => (
                            <div
                                key={product.id}
                                onClick={() => {
                                    handleAddProduct(product);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className="bg-white border border-slate-200 rounded-xl p-2 sm:p-3 flex flex-col items-center cursor-pointer hover:shadow-lg hover:border-[#2196f3] hover:-translate-y-1 transition-all group relative"
                            >
                                <div className="absolute top-1 right-1">
                                    <button className="bg-[#2196f3] text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center mb-2">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain" />
                                    ) : (
                                        <Package className="h-6 w-6 sm:h-8 sm:w-8 text-slate-200" />
                                    )}
                                </div>
                                <div className="text-center w-full">
                                    <h4 className="text-[10px] font-bold text-slate-800 uppercase mb-0.5 line-clamp-2 h-6 leading-tight">{product.name}</h4>
                                    <p className="text-[9px] text-slate-400 mb-1 font-medium hidden sm:block">Ref: {product.barcode || product.id.slice(0, 8)}</p>
                                    <p className="text-xs font-black text-[#2196f3]">${product.price.toLocaleString('es-CO')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {searchResults.length === 0 && searchQuery.length > 2 && (
                        <div className="py-12 text-center flex flex-col items-center gap-2">
                            <AlertCircle className="w-8 h-8 text-slate-300" />
                            <p className="text-slate-400 text-sm font-bold">No encontramos coincidencias para "{searchQuery}"</p>
                            <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="text-xs">Limpiar búsqueda</Button>
                        </div>
                    )}
                </div>
            )}

            {/* 5. CONTENT AREA */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden m-4 border border-slate-300 shadow-sm relative">
                {/* TABS TICKET */}
                <div className="bg-[#f8f9fa] border-b border-slate-300 flex items-center h-10">
                    {tickets.map((t, idx) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTicketIndex(idx)}
                            className={cn(
                                "px-6 h-full text-xs font-bold border-r border-slate-300 transition-colors uppercase tracking-wider",
                                activeTicketIndex === idx ? "bg-white text-[#2196f3] border-t-2 border-t-[#2196f3]" : "text-slate-500 hover:bg-slate-100"
                            )}
                        >
                            Ticket {t.id}
                        </button>
                    ))}
                    <button
                        onClick={addNewTicket}
                        className="px-4 h-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 border-r border-slate-300"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                {/* PRODUCT TABLE */}
                <div className="flex-1 overflow-auto bg-[#e8f0f8]">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[#e8f0f8] text-slate-800 border-b border-slate-300">
                                <th className="py-4 sm:py-6 px-2 sm:px-4 text-lg sm:text-2xl md:text-3xl font-normal w-[45%] sm:w-1/2">Artículo</th>
                                <th className="py-4 sm:py-6 px-2 sm:px-4 text-lg sm:text-2xl md:text-3xl font-normal text-center w-[25%] sm:w-auto">Precio</th>
                                <th className="py-4 sm:py-6 px-1 sm:px-4 text-lg sm:text-2xl md:text-3xl font-normal text-center w-[30%] sm:w-auto">Cant.</th>
                                <th className="py-4 sm:py-6 px-2 sm:px-4 text-lg sm:text-2xl md:text-3xl font-normal text-center hidden sm:table-cell">Unids.</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {activeTicket.items.map((item) => (
                                <tr key={item.id} className="border-b border-slate-100/50 hover:bg-blue-50/50 group transition-colors">
                                    <td className="py-4 px-2 sm:px-4 pr-1">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            {item.image && <img src={item.image} className="hidden sm:block w-12 h-12 sm:w-14 sm:h-14 object-cover rounded border border-slate-200 shrink-0" alt="" />}
                                            <span className="text-lg sm:text-xl md:text-3xl font-medium leading-tight sm:leading-normal">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-1 sm:px-4 text-center text-lg sm:text-xl md:text-3xl font-medium border-l border-slate-100/30">
                                        ${item.price.toLocaleString('es-CO')}
                                    </td>
                                    <td className="py-4 px-1 sm:px-4 text-center border-l border-slate-100/30">
                                        <div className="flex items-center justify-center gap-1 sm:gap-4">
                                            <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="text-[#2196f3] hover:bg-blue-100 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 bg-slate-50 text-xl font-bold">-</button>
                                            <span className="text-xl sm:text-2xl md:text-4xl font-bold min-w-[30px] sm:min-w-[50px] text-center">{item.quantity}</span>
                                            <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="text-[#2196f3] hover:bg-blue-100 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 bg-slate-50 text-xl font-bold">+</button>
                                        </div>
                                    </td>
                                    <td className="py-4 px-2 sm:px-4 text-center text-lg sm:text-xl md:text-3xl hidden sm:table-cell border-l border-slate-100/30">pz</td>
                                </tr>
                            ))}
                            {[...Array(Math.max(0, 10 - activeTicket.items.length))].map((_, i) => (
                                <tr key={`empty-${i}`} className="border-b border-slate-50 opacity-10">
                                    <td className="py-5 sm:py-8"></td>
                                    <td className="py-5 sm:py-8"></td>
                                    <td className="py-5 sm:py-8"></td>
                                    <td className="py-5 sm:py-8 hidden sm:table-cell"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 6. FOOTER */}
            <div className="bg-[#f0f4f8] border-t border-slate-300 p-2 sm:p-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 pb-4 sm:pb-4">
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 text-slate-700 font-bold w-full xl:w-auto">
                    <div className="flex sm:flex-1 xl:flex-none items-center justify-between sm:justify-start gap-4 bg-white px-3 sm:px-4 py-2 border border-slate-200 shadow-sm min-h-[48px]">
                        <span className="text-xs sm:text-sm uppercase opacity-70">Total:</span>
                        <span className="text-xl sm:text-2xl text-[hsl(214,100%,38%)]">${calculateTotal().toLocaleString('es-CO')}</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-4 h-full w-full xl:w-auto mt-2 xl:mt-0">
                    <Button
                        className="bg-[#2196f3] hover:bg-[#1976d2] rounded-none uppercase font-bold min-h-[48px] px-8 flex flex-1 sm:flex-none justify-center items-center gap-2 shadow-sm border border-[#1976d2] text-sm sm:text-base order-2 sm:order-1"
                        onClick={handleFinishSale}
                        disabled={isProcessing || activeTicket.items.length === 0}
                    >
                        {isProcessing ? <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
                        F12 - Pagar
                    </Button>

                    <div className="bg-white border-2 border-[#2196f3] px-4 py-2 sm:px-6 sm:py-2 min-w-0 sm:min-w-[250px] flex items-center justify-center shadow-md sm:shadow-lg transform sm:scale-110 ml-0 sm:ml-8 order-1 sm:order-2 self-center sm:self-auto w-full sm:w-auto">
                        <span className="text-[#2196f3] text-4xl sm:text-5xl font-bold tracking-tighter truncate max-w-full">
                            ${calculateTotal().toLocaleString('es-CO')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface POSNavButtonProps {
    label: string;
    active?: boolean;
    color?: 'blue' | 'gray';
}

const POSNavButton: React.FC<POSNavButtonProps> = ({ label, active, color = 'gray' }) => (
    <button className={cn(
        "px-3 h-full border border-slate-300 transition-all font-medium text-xs whitespace-nowrap outline-none",
        active ? "bg-white text-[#2196f3] border-b-white z-10 -mb-[1px]" : "bg-white/50 text-slate-700 hover:bg-white"
    )}>
        <span className={cn(color === 'blue' && "text-[#2196f3] font-bold")}>
            {label}
        </span>
    </button>
);

interface ActionKeyButtonProps {
    label: string;
    color?: 'blue' | 'gray';
    onClick?: () => void;
}

const ActionKeyButton: React.FC<ActionKeyButtonProps> = ({ label, color = 'blue', onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            "px-6 h-9 font-bold text-xs uppercase tracking-tight transition-all border shadow-sm",
            color === 'blue' ? "bg-[#2196f3] border-[#1976d2] text-white hover:bg-[#1976d2]" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
        )}
    >
        {label}
    </button>
);
