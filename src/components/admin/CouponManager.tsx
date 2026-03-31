import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Tag,
    Plus,
    Trash2,
    RefreshCw,
    Calendar,
    Layers,
    ShoppingBag,
    Ticket,
    ChevronDown,
    CheckCircle2,
    AlertCircle,
    Eye,
    User,
    Clock,
    X,
    Search
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
    fetchCoupons,
    createCouponsBulk,
    deleteCoupon,
    fetchCategories,
    fetchAdminProducts,
    fetchCouponUsage
} from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const CouponManager = () => {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showGenerateForm, setShowGenerateForm] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // State for Usage Details
    const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null);
    const [usageHistory, setUsageHistory] = useState<any[]>([]);
    const [loadingUsage, setLoadingUsage] = useState(false);
    const [showUsageDialog, setShowUsageDialog] = useState(false);

    // Form states
    const [numCodes, setNumCodes] = useState(5);
    const [discountValue, setDiscountValue] = useState(10);
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [durationDays, setDurationDays] = useState(30);
    const [scopeType, setScopeType] = useState<'all' | 'categories' | 'products'>('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [generating, setGenerating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [couponsData, catsData, productsData] = await Promise.all([
                fetchCoupons(),
                fetchCategories(),
                fetchAdminProducts()
            ]);
            setCoupons(couponsData || []);
            setCategories(catsData || []);
            setProducts(productsData || []);
        } catch (error) {
            console.error("Error loading data:", error);
            toast({ title: "Error", description: "No se pudieron cargar los cupones", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleViewUsage = async (coupon: any) => {
        setSelectedCoupon(coupon);
        setShowUsageDialog(true);
        setLoadingUsage(true);
        try {
            const usage = await fetchCouponUsage(coupon.id);
            setUsageHistory(usage || []);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar el historial", variant: "destructive" });
        } finally {
            setLoadingUsage(false);
        }
    };

    const generateCodes = async () => {
        setGenerating(true);
        try {
            const newCoupons = [];
            const now = new Date();
            const expirationDate = new Date();
            expirationDate.setDate(now.getDate() + durationDays);

            for (let i = 0; i < numCodes; i++) {
                const code = Math.random().toString(36).substring(2, 10).toUpperCase();
                newCoupons.push({
                    code,
                    discount_value: discountValue,
                    discount_type: discountType,
                    valid_from: now.toISOString(),
                    valid_until: expirationDate.toISOString(),
                    applicable_categories: scopeType === 'categories' ? selectedIds : [],
                    applicable_products: scopeType === 'products' ? selectedIds : [],
                    is_active: true
                });
            }

            await createCouponsBulk(newCoupons);
            toast({ title: "Éxito", description: `${numCodes} cupones generados correctamente` });
            setShowGenerateForm(false);
            loadData();
        } catch (error) {
            console.error("Error generating codes:", error);
            toast({ title: "Error", description: "No se pudieron generar los cupones", variant: "destructive" });
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Estás seguro de eliminar este cupón?")) return;
        try {
            await deleteCoupon(id);
            setCoupons(coupons.filter(c => c.id !== id));
            toast({ title: "Eliminado", description: "El cupón ha sido eliminado" });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar el cupón", variant: "destructive" });
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const filteredCoupons = (coupons || []).filter(c =>
        (c.code || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Cupones</h1>
                    <p className="text-slate-500 text-sm mt-1">Crea y administra códigos de descuento para tu tienda</p>
                </div>
                <Button
                    onClick={() => setShowGenerateForm(!showGenerateForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95"
                >
                    {showGenerateForm ? "Cerrar Generador" : <><Plus className="w-4 h-4 mr-2" /> Generar Cupones</>}
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Buscar cupones por código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-200 shadow-sm"
                />
            </div>

            {showGenerateForm && (
                <Card className="border-blue-100 shadow-lg animate-in slide-in-from-top-4 duration-300">
                    <CardHeader className="bg-blue-50/50 border-b border-blue-100">
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                            <Ticket className="w-5 h-5" /> Configurar Generación Masiva
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Número de códigos</label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={numCodes}
                                    onChange={(e) => setNumCodes(parseInt(e.target.value))}
                                    className="border-slate-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Valor del descuento</label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(parseFloat(e.target.value))}
                                        className="flex-1 border-slate-200"
                                    />
                                    <select
                                        value={discountType}
                                        onChange={(e: any) => setDiscountType(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-md px-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="percentage">%</option>
                                        <option value="fixed">$</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Duración (días)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="number"
                                        value={durationDays}
                                        onChange={(e) => setDurationDays(parseInt(e.target.value))}
                                        className="pl-10 border-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 lg:col-span-3">
                                <label className="text-sm font-semibold text-slate-700">Válido para:</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <Button
                                        variant={scopeType === 'all' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => { setScopeType('all'); setSelectedIds([]); }}
                                        className="rounded-full"
                                    >
                                        <CheckCircle2 className={`w-4 h-4 mr-1 ${scopeType === 'all' ? 'block' : 'hidden'}`} /> Toda la tienda
                                    </Button>
                                    <Button
                                        variant={scopeType === 'categories' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => { setScopeType('categories'); setSelectedIds([]); }}
                                        className="rounded-full"
                                    >
                                        <Layers className="w-4 h-4 mr-1" /> Categorías específicas
                                    </Button>
                                    <Button
                                        variant={scopeType === 'products' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => { setScopeType('products'); setSelectedIds([]); }}
                                        className="rounded-full"
                                    >
                                        <ShoppingBag className="w-4 h-4 mr-1" /> Productos específicos
                                    </Button>
                                </div>

                                {scopeType !== 'all' && (
                                    <div className="mt-4 p-4 border rounded-lg bg-slate-50 max-h-48 overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {scopeType === 'categories' ? (
                                            categories.map(cat => (
                                                <div
                                                    key={cat.id}
                                                    onClick={() => toggleSelection(cat.id)}
                                                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${selectedIds.includes(cat.id) ? 'bg-blue-100 border-blue-300' : 'bg-white hover:bg-slate-100'}`}
                                                >
                                                    <CheckCircle2 className={`w-4 h-4 ${selectedIds.includes(cat.id) ? 'text-blue-600' : 'text-slate-200'}`} />
                                                    <span className="text-xs truncate">{cat.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            products.map(prod => (
                                                <div
                                                    key={prod.id}
                                                    onClick={() => toggleSelection(prod.id)}
                                                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${selectedIds.includes(prod.id) ? 'bg-blue-100 border-blue-300' : 'bg-white hover:bg-slate-100'}`}
                                                >
                                                    <CheckCircle2 className={`w-4 h-4 ${selectedIds.includes(prod.id) ? 'text-blue-600' : 'text-slate-200'}`} />
                                                    <span className="text-xs truncate">{prod.name}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3 pt-6 border-t">
                            <Button variant="ghost" onClick={() => setShowGenerateForm(false)}>Cancelar</Button>
                            <Button
                                onClick={generateCodes}
                                disabled={generating || (scopeType !== 'all' && selectedIds.length === 0)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                            >
                                {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Ticket className="w-4 h-4 mr-2" />}
                                Generar ahora
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-sm border-slate-200">
                <CardHeader className="border-b bg-slate-50/30">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Tag className="w-5 h-5 text-slate-500" /> Listado de Cupones
                        </CardTitle>
                        <Badge variant="outline" className="text-xs font-medium bg-white">
                            {searchTerm ? `${filteredCoupons.length} de ${coupons.length}` : `${coupons.length}`} existentes
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 border-b">
                                    <th className="px-6 py-4 font-semibold">Código</th>
                                    <th className="px-6 py-4 font-semibold">Descuento</th>
                                    <th className="px-6 py-4 font-semibold">Expira</th>
                                    <th className="px-6 py-4 font-semibold">Uso</th>
                                    <th className="px-6 py-4 font-semibold">Alcance</th>
                                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2" />
                                            Cargando cupones...
                                        </td>
                                    </tr>
                                ) : filteredCoupons.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p className="text-lg">No se encontraron cupones</p>
                                            <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCoupons.map((coupon) => (
                                        <tr key={coupon.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <code className="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100 font-bold tracking-wider">
                                                        {coupon.code}
                                                    </code>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-green-600">
                                                    {coupon.discount_type === 'percentage' ? '+' : '$'}{coupon.discount_value}{coupon.discount_type === 'percentage' && '%'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {coupon.valid_until ? (
                                                    <div className="flex flex-col">
                                                        <span>
                                                            {coupon.valid_until
                                                                ? (() => {
                                                                    const d = new Date(coupon.valid_until);
                                                                    return isNaN(d.getTime()) ? 'Sin fecha' : format(d, 'd MMM, yyyy', { locale: es });
                                                                })()
                                                                : 'Sin fecha'
                                                            }
                                                        </span>
                                                        <span className="text-[10px] uppercase font-bold text-slate-400">
                                                            {new Date(coupon.valid_until) < new Date() ? 'Expirado' : 'Vigente'}
                                                        </span>
                                                    </div>
                                                ) : '---'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500"
                                                            style={{ width: `${Math.min(100, (coupon.usage_count / (coupon.usage_limit || 100)) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-500">{coupon.usage_count}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {coupon.applicable_categories?.length > 0 ? (
                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100">
                                                        {coupon.applicable_categories.length} Cat.
                                                    </Badge>
                                                ) : coupon.applicable_products?.length > 0 ? (
                                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100">
                                                        {coupon.applicable_products.length} Prod.
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">Todo</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleViewUsage(coupon)}
                                                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                                        title="Ver usos"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(coupon.id)}
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Usage Details Dialog */}
            <Dialog open={showUsageDialog} onOpenChange={setShowUsageDialog}>
                <DialogContent className="max-w-2xl bg-white border-0 shadow-2xl rounded-2xl overflow-hidden p-0">
                    <DialogHeader className="p-6 bg-slate-50 border-b">
                        <DialogTitle className="text-xl flex items-center gap-2 text-slate-900">
                            <Eye className="w-6 h-6 text-blue-600" />
                            Historial de uso: <code className="text-blue-700">{selectedCoupon?.code}</code>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6">
                        {loadingUsage ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <RefreshCw className="w-10 h-10 animate-spin mb-4" />
                                <p>Cargando historial de usos...</p>
                            </div>
                        ) : usageHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <AlertCircle className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-lg">Este cupón aún no ha sido utilizado</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="grid grid-cols-1 gap-3">
                                    {usageHistory.map((usage) => (
                                        <div key={usage.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                <User className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-bold text-slate-900 truncate">
                                                        {usage.user_name || 'Usuario Anónimo'}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                                                        <Clock className="w-3 h-3" />
                                                        {format(new Date(usage.used_at), 'd MMM, HH:mm', { locale: es })}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-slate-500 truncate mb-2">{usage.user_email || 'Sin correo registrado'}</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200">
                                                        ID Orden: {usage.order_id?.substring(0, 8) || 'N/A'}
                                                    </Badge>
                                                    {usage.user_id && (
                                                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-100">
                                                            ID Usuario: {usage.user_id?.substring(0, 8)}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="mt-8 pt-6 border-t flex justify-end">
                            <Button onClick={() => setShowUsageDialog(false)} className="bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-xl shadow-lg transition-all active:scale-95">
                                Cerrar Ventana
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
