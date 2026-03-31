import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Plus,
    Search,
    Building2,
    Mail,
    Phone,
    Trash2,
    MoreVertical,
    RotateCcw,
    MapPin,
    Briefcase,
    Share2,
    Copy,
    ExternalLink
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/hooks/use-toast';
import { db } from '@/firebase';
import { cn } from '@/lib/utils';

interface Supplier {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    category?: string;
    notes?: string;
    status: 'active' | 'inactive';
    createdAt: string;
}

export const SupplierManager: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newSupplier, setNewSupplier] = useState<{
        name: string;
        email: string;
        phone: string;
        address: string;
        category: string;
        notes: string;
        status: 'active' | 'inactive';
    }>({
        name: '',
        email: '',
        phone: '',
        address: '',
        category: '',
        notes: '',
        status: 'active'
    });

    const isSupabase = typeof (db as any)?.from === 'function';

    const loadSuppliers = async () => {
        try {
            setLoading(true);
            if (isSupabase) {
                const { data, error } = await db
                    .from('suppliers')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    if (error.code === 'PGRST116' || error.message.includes('relation "suppliers" does not exist')) {
                        // Table doesn't exist, handle gracefully
                        console.warn('Suppliers table not found in Supabase');
                        setSuppliers([]);
                    } else {
                        throw error;
                    }
                } else if (data) {
                    setSuppliers(data.map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        email: s.email,
                        phone: s.phone,
                        address: s.address,
                        category: s.category,
                        notes: s.notes,
                        status: s.status || 'active',
                        createdAt: s.created_at
                    })));
                }
            } else {
                // Firebase fallback
                const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
                const q = query(collection(db, 'suppliers'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const data: Supplier[] = [];
                querySnapshot.forEach((doc) => {
                    const s = doc.data();
                    data.push({
                        id: doc.id,
                        name: s.name,
                        email: s.email,
                        phone: s.phone,
                        address: s.address,
                        category: s.category,
                        notes: s.notes,
                        status: s.status || 'active',
                        createdAt: s.createdAt?.toDate()?.toISOString() || new Date().toISOString()
                    });
                });
                setSuppliers(data);
            }
        } catch (error) {
            console.error('Error loading suppliers:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudieron cargar los proveedores.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSuppliers();
    }, []);

    const handleSaveSupplier = async () => {
        if (!newSupplier.name.trim()) {
            toast({ title: 'Error', description: 'El nombre es obligatorio', variant: 'destructive' });
            return;
        }

        try {
            setIsSaving(true);
            if (isSupabase) {
                const { data, error } = await db.from('suppliers').insert([{
                    name: newSupplier.name,
                    email: newSupplier.email,
                    phone: newSupplier.phone,
                    address: newSupplier.address,
                    category: newSupplier.category,
                    notes: newSupplier.notes,
                    status: newSupplier.status,
                    created_at: new Date().toISOString()
                }]).select();

                if (error) throw error;
                if (data) {
                    await loadSuppliers();
                }
            } else {
                const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
                await addDoc(collection(db, 'suppliers'), {
                    ...newSupplier,
                    createdAt: serverTimestamp()
                });
                await loadSuppliers();
            }

            toast({ title: 'Éxito', description: 'Proveedor agregado correctamente' });
            setIsAddDialogOpen(false);
            setNewSupplier({ name: '', email: '', phone: '', address: '', category: '', notes: '', status: 'active' as const });
        } catch (error) {
            console.error('Error saving supplier:', error);
            toast({ title: 'Error', description: 'No se pudo guardar el proveedor', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSupplier = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este proveedor?')) return;

        try {
            if (isSupabase) {
                const { error } = await db.from('suppliers').delete().eq('id', id);
                if (error) throw error;
            } else {
                const { deleteDoc, doc } = await import('firebase/firestore');
                await deleteDoc(doc(db, 'suppliers', id));
            }
            setSuppliers(prev => prev.filter(s => s.id !== id));
            toast({ title: 'Éxito', description: 'Proveedor eliminado' });
        } catch (error) {
            console.error('Error deleting supplier:', error);
            toast({ title: 'Error', description: 'No se pudo eliminar el proveedor', variant: 'destructive' });
        }
    };

    const handleShareForm = (supplier: Supplier) => {
        const url = `${window.location.origin}/supplier-upload/${supplier.id}`;
        navigator.clipboard.writeText(url);
        toast({
            title: 'Enlace copiado',
            description: `Se ha copiado el enlace para que ${supplier.name} cargue su catálogo.`,
        });
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <Building2 className="h-8 w-8 text-blue-600" />
                        Proveedores
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Administra la información de tus proveedores y suministros.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={loadSuppliers} className="border-slate-200">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Actualizar
                    </Button>
                    <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md active:scale-95"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Proveedor
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nombre, email o categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-slate-200 focus:ring-blue-500"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredSuppliers.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200 py-20 text-center">
                    <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-slate-900 font-bold text-lg">No hay proveedores</h3>
                    <p className="text-slate-500">Comienza agregando tu primer proveedor para gestionar tus compras.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSuppliers.map((supplier) => (
                        <Card key={supplier.id} className="overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group">
                            <CardContent className="p-0">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl border border-blue-100">
                                            {supplier.name.charAt(0).toUpperCase()}
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-slate-400">
                                                    <MoreVertical className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                                <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleShareForm(supplier)}>
                                                    <Share2 className="h-4 w-4 mr-2 text-blue-500" />
                                                    Compartir Formulario
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => window.open(`/supplier-upload/${supplier.id}`, '_blank')}>
                                                    <ExternalLink className="h-4 w-4 mr-2 text-sky-500" />
                                                    Abrir Formulario
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => window.open(`/supplier-catalog/${supplier.id}`, '_blank')}>
                                                    <Briefcase className="h-4 w-4 mr-2 text-indigo-500" />
                                                    Catálogo
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteSupplier(supplier.id)}>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 truncate mb-1">{supplier.name}</h3>
                                    {supplier.category && (
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 mb-4">
                                            {supplier.category}
                                        </Badge>
                                    )}

                                    <div className="space-y-3 mt-4">
                                        {supplier.email && (
                                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                                <span className="truncate">{supplier.email}</span>
                                            </div>
                                        )}
                                        {supplier.phone && (
                                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                                <Phone className="h-4 w-4 text-slate-400" />
                                                {supplier.phone}
                                            </div>
                                        )}
                                        {supplier.address && (
                                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                                <MapPin className="h-4 w-4 text-slate-400" />
                                                <span className="truncate">{supplier.address}</span>
                                            </div>
                                        )}
                                    </div>
                                    {supplier.notes && (
                                        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 italic border border-slate-100">
                                            "{supplier.notes}"
                                        </div>
                                    )}
                                </div>
                                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                        Registrado: {new Date(supplier.createdAt).toLocaleDateString()}
                                    </span>
                                    <div className={cn(
                                        "flex items-center gap-1 text-[10px] font-bold uppercase",
                                        supplier.status === 'active' ? "text-green-600" : "text-slate-400"
                                    )}>
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            supplier.status === 'active' ? "bg-green-500 animate-pulse" : "bg-slate-300"
                                        )}></div>
                                        {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Plus className="h-6 w-6 text-blue-600" />
                            Nuevo Proveedor
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-slate-700 font-bold">Nombre del Proveedor *</Label>
                            <Input
                                id="name"
                                value={newSupplier.name}
                                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                                placeholder="Nombre de la empresa o contacto"
                                className="border-slate-200"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-slate-700 font-bold">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={newSupplier.email}
                                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                                    placeholder="ejemplo@correo.com"
                                    className="border-slate-200"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone" className="text-slate-700 font-bold">Teléfono</Label>
                                <Input
                                    id="phone"
                                    value={newSupplier.phone}
                                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                                    placeholder="+57 300 0000000"
                                    className="border-slate-200"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category" className="text-slate-700 font-bold">Categoría de Suministro</Label>
                            <Input
                                id="category"
                                value={newSupplier.category}
                                onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
                                placeholder="Ej: Repuestos, Lubricantes, Herramientas"
                                className="border-slate-200"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address" className="text-slate-700 font-bold">Dirección / Ubicación</Label>
                            <Input
                                id="address"
                                value={newSupplier.address}
                                onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                                placeholder="Dirección física del proveedor"
                                className="border-slate-200"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes" className="text-slate-700 font-bold">Notas Adicionales</Label>
                            <Input
                                id="notes"
                                value={newSupplier.notes}
                                onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                                placeholder="Observaciones, acuerdos, etc."
                                className="border-slate-200"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="status"
                                checked={newSupplier.status === 'active'}
                                onChange={(e) => setNewSupplier({ ...newSupplier, status: e.target.checked ? 'active' : 'inactive' })}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor="status" className="text-slate-700 font-bold">Proveedor Activo</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-slate-200">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveSupplier}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Proveedor'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
