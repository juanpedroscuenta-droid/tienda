import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Package,
    ArrowLeft,
    Search,
    Building2,
    Image as ImageIcon,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { db } from '@/firebase';

export default function SupplierCatalogView() {
    const { supplierId } = useParams<{ supplierId: string }>();
    const navigate = useNavigate();
    const [supplier, setSupplier] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const isSupabase = typeof (db as any)?.from === 'function';

    useEffect(() => {
        const fetchSupplierAndProducts = async () => {
            try {
                if (isSupabase) {
                    // Fetch Supplier
                    const { data: supplierData, error: supplierError } = await db
                        .from('suppliers')
                        .select('*')
                        .eq('id', supplierId)
                        .single();

                    if (supplierError) throw supplierError;
                    setSupplier(supplierData);

                    // Fetch Products
                    const { data: productsData, error: productsError } = await db
                        .from('products')
                        .select('*')
                        .eq('supplier_id', supplierId)
                        .order('created_at', { ascending: false });

                    if (productsError) throw productsError;
                    setProducts(productsData || []);
                } else {
                    // Firebase Fallback
                    const { getDoc, doc, collection, query, where, getDocs } = await import('firebase/firestore');

                    const docSnap = await getDoc(doc(db, 'suppliers', supplierId!));
                    if (docSnap.exists()) {
                        setSupplier({ id: docSnap.id, ...docSnap.data() });
                    } else {
                        throw new Error('Supplier not found');
                    }

                    const q = query(collection(db, 'products'), where('supplierId', '==', supplierId));
                    const querySnapshot = await getDocs(q);
                    const items: any[] = [];
                    querySnapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
                    setProducts(items);
                }
            } catch (err: any) {
                console.error("Error fetching supplier catalog:", err);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No se pudo cargar el catálogo del proveedor."
                });
            } finally {
                setLoading(false);
            }
        };

        if (supplierId) fetchSupplierAndProducts();
    }, [supplierId]);

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!supplier) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-900">Proveedor no encontrado</h1>
                <p className="text-slate-500 mt-2 text-center max-w-md">
                    El proveedor que buscas no existe o fue eliminado.
                </p>
                <Button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate(-1)}>
                    Regresar
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => window.close()} className="text-slate-500 hover:text-slate-700">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 font-bold text-xl">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                Catálogo de {supplier.name}
                            </h1>
                            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                {supplier.email || 'Sin correo asociado'}
                                <span className="text-slate-300">•</span>
                                {filteredProducts.length} productos registrados
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Buscar en el catálogo del proveedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 border-0 focus-visible:ring-0 shadow-none text-base bg-transparent h-12"
                        />
                    </div>
                </div>

                {filteredProducts.length === 0 ? (
                    <Card className="border-dashed border-2 border-slate-200 py-24 text-center bg-slate-50/50">
                        <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-slate-900 font-bold text-xl mb-2">No hay productos</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            Este proveedor aún no ha subido productos o no coinciden con tu búsqueda.
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((product) => (
                            <Card key={product.id} className="overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group">
                                <div className="aspect-square bg-slate-100 flex items-center justify-center relative overlow-hidden">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                                            <span className="text-sm font-medium">Sin imagen</span>
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        {product.is_published || product.isPublished ? (
                                            <Badge className="bg-green-500 hover:bg-green-600 shadow-sm border-0 font-bold text-[10px] px-2 py-0.5">Publicado</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-sm border border-amber-200 font-bold text-[10px] px-2 py-0.5">Borrador</Badge>
                                        )}
                                    </div>
                                </div>
                                <CardContent className="p-5">
                                    <h3 className="font-bold text-slate-900 line-clamp-2 min-h-12 mb-2 group-hover:text-blue-600 transition-colors">
                                        {product.name}
                                    </h3>

                                    {product.description && (
                                        <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                                            {product.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                                        <span className="text-lg font-black text-slate-900">
                                            ${Number(product.price || 0).toLocaleString('es-CO')}
                                        </span>
                                        <div className="flex items-center gap-1 text-sm font-medium text-slate-500">
                                            Stock: <span className="text-slate-700 font-bold">{product.stock || 0}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
