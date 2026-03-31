import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Upload,
    Plus,
    Trash2,
    Package,
    CheckCircle2,
    AlertCircle,
    FileSpreadsheet,
    Loader2,
    ChevronLeft,
    Image as ImageIcon
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { db } from '@/firebase';
import * as XLSX from 'xlsx';
import { parseFormattedPrice } from '@/lib/utils';

// Helper for SEO slug (copied from ProductFormWithWizard)
function slugify(text: string): string {
    return text
        .toString()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase();
}

export default function SupplierCatalogForm() {
    const { supplierId } = useParams<{ supplierId: string }>();
    const [supplier, setSupplier] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isSupabase = typeof (db as any)?.from === 'function';

    useEffect(() => {
        const fetchSupplier = async () => {
            try {
                if (isSupabase) {
                    const { data, error } = await db.from('suppliers').select('*').eq('id', supplierId).single();
                    if (error) throw error;
                    setSupplier(data);
                } else {
                    // Firebase fallback
                    const { getDoc, doc } = await import('firebase/firestore');
                    const docSnap = await getDoc(doc(db, 'suppliers', supplierId!));
                    if (docSnap.exists()) {
                        setSupplier({ id: docSnap.id, ...docSnap.data() });
                    }
                }
            } catch (err) {
                console.error("Error fetching supplier:", err);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No se pudo encontrar el proveedor especificado."
                });
            } finally {
                setLoading(false);
            }
        };

        if (supplierId) fetchSupplier();
    }, [supplierId]);

    const handleAddProduct = () => {
        setProducts([
            ...products,
            {
                id: Math.random().toString(36).substr(2, 9),
                name: '',
                description: '',
                price: '',
                stock: '1',
                image: ''
            }
        ]);
    };

    const handleRemoveProduct = (id: string) => {
        setProducts(products.filter(p => p.id !== id));
    };

    const handleProductChange = (id: string, field: string, value: any) => {
        setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        setImporting(true);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            const newItems: any[] = [];
            let startIdx = 0;
            // Basic header detection
            if (rows.length > 0 && (String(rows[0][0]).toLowerCase().includes('nombre') || String(rows[0][1]).toLowerCase().includes('precio'))) {
                startIdx = 1;
            }

            for (let i = startIdx; i < rows.length; i++) {
                const row = rows[i];
                if (!row[0]) continue;
                newItems.push({
                    id: Math.random().toString(36).substr(2, 9),
                    name: String(row[0]).trim(),
                    price: String(row[1] || '0'),
                    description: String(row[2] || ''),
                    stock: '1',
                    image: ''
                });
            }

            setProducts([...products, ...newItems]);
            toast({
                title: "Importación exitosa",
                description: `Se han añadido ${newItems.length} productos del archivo.`
            });
        } catch (err) {
            console.error("Error importing excel:", err);
            toast({
                variant: "destructive",
                title: "Error de importación",
                description: "No se pudo procesar el archivo Excel."
            });
        } finally {
            setImporting(false);
        }
    };

    const handleSubmit = async () => {
        if (products.length === 0) {
            toast({ title: "Atención", description: "Agrega al menos un producto." });
            return;
        }

        const invalidProducts = products.filter(p => !p.name.trim() || isNaN(parseFormattedPrice(p.price)));
        if (invalidProducts.length > 0) {
            toast({
                variant: "destructive",
                title: "Error de validación",
                description: "Asegúrate de que todos los productos tengan nombre y precio válido."
            });
            return;
        }

        setSubmitting(true);
        try {
            if (isSupabase) {
                const payloads = products.map(p => ({
                    name: p.name,
                    description: p.description,
                    price: parseFormattedPrice(p.price),
                    original_price: parseFormattedPrice(p.price),
                    stock: parseInt(p.stock) || 0,
                    image: p.image || null,
                    supplier_id: supplierId,
                    created_by: supplier?.email || 'supplier_upload',
                    is_published: false, // Default to false so admin reviews it
                    updated_at: new Date().toISOString()
                }));

                const { error } = await db.from('products').insert(payloads);
                if (error) throw error;
            } else {
                // Firebase logic...
                const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
                for (const p of products) {
                    await addDoc(collection(db, 'products'), {
                        name: p.name,
                        description: p.description,
                        price: parseFormattedPrice(p.price),
                        stock: parseInt(p.stock) || 0,
                        image: p.image || null,
                        supplierId: supplierId,
                        isPublished: false,
                        createdAt: serverTimestamp()
                    });
                }
            }

            toast({
                title: "¡Éxito!",
                description: "Tu catálogo ha sido enviado para revisión administrativa."
            });
            setProducts([]);
        } catch (err: any) {
            console.error("Error submitting catalog:", err);
            toast({
                variant: "destructive",
                title: "Error al enviar",
                description: err.message || "Ocurrió un error al intentar guardar los productos."
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!supplier) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-900">Enlace no válido</h1>
                <p className="text-slate-500 mt-2 text-center max-w-md">
                    Este enlace de carga no parece ser válido o ha expirado. Por favor contacta al administrador.
                </p>
                <Button className="mt-6 bg-orange-500 text-white" onClick={() => window.location.href = '/'}>
                    Volver al inicio
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-full mb-4">
                        <Upload className="h-8 w-8 text-orange-600" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Cargue de Catálogo - {supplier.name}
                    </h1>
                    <p className="text-slate-500 max-w-2xl mx-auto">
                        Sube tus productos directamente a nuestro sistema. Puedes agregarlos individualmente o importar un archivo Excel masivo.
                    </p>
                </div>

                {/* Actions Toolbar */}
                <Card className="border-none shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm sticky top-4 z-10 border border-orange-100">
                    <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex gap-2">
                            <Button
                                onClick={handleAddProduct}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar Producto
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".xlsx,.xls"
                                onChange={handleImportExcel}
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={importing}
                                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                            >
                                {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                                Importar Excel
                            </Button>
                        </div>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || products.length === 0}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 font-bold"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            Enviar Todo ({products.length})
                        </Button>
                    </CardContent>
                </Card>

                {/* Products List */}
                <div className="space-y-4">
                    {products.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-20 text-center">
                            <Package className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-slate-900 font-bold text-lg">Tu lista está vacía</h3>
                            <p className="text-slate-500 mb-6 px-4">Empieza agregando productos manualmente o importa un archivo Excel.</p>
                            <div className="flex justify-center gap-3">
                                <Button onClick={handleAddProduct} variant="outline" className="border-slate-300">
                                    Manual
                                </Button>
                                <Button onClick={() => fileInputRef.current?.click()} className="bg-orange-500 text-white">
                                    Importar Excel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        products.map((product, idx) => (
                            <Card key={product.id} className="overflow-hidden border border-slate-200 group hover:border-orange-300 transition-all shadow-sm">
                                <CardContent className="p-0">
                                    <div className="flex flex-col sm:flex-row">
                                        {/* Product Index/Image Placeholder */}
                                        <div className="w-full sm:w-48 bg-slate-50 flex items-center justify-center p-6 border-b sm:border-b-0 sm:border-r border-slate-100">
                                            <div className="text-center">
                                                <Badge className="mb-3 bg-slate-200 text-slate-700 hover:bg-slate-200"># {idx + 1}</Badge>
                                                <div className="w-20 h-20 bg-white rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300 mx-auto">
                                                    <ImageIcon className="h-8 w-8" />
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold">Imágen opcional</p>
                                            </div>
                                        </div>

                                        {/* Product Details Input */}
                                        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">Nombre del Producto</Label>
                                                    <Input
                                                        value={product.name}
                                                        onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
                                                        placeholder="Ej: Aceite de Motor 10W-40"
                                                        className="border-slate-200 focus:ring-orange-500"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">Descripción</Label>
                                                    <Textarea
                                                        value={product.description}
                                                        onChange={(e) => handleProductChange(product.id, 'description', e.target.value)}
                                                        placeholder="Detalles sobre el producto..."
                                                        className="border-slate-200 min-h-[80px]"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">Precio ($)</Label>
                                                        <Input
                                                            value={product.price}
                                                            onChange={(e) => handleProductChange(product.id, 'price', e.target.value)}
                                                            placeholder="0.00"
                                                            className="border-slate-200 font-bold text-green-600"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">Stock Inic.</Label>
                                                        <Input
                                                            type="number"
                                                            value={product.stock}
                                                            onChange={(e) => handleProductChange(product.id, 'stock', e.target.value)}
                                                            className="border-slate-200"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">URL de Imagen (Opcional)</Label>
                                                    <Input
                                                        value={product.image}
                                                        onChange={(e) => handleProductChange(product.id, 'image', e.target.value)}
                                                        placeholder="https://ejemplo.com/foto.jpg"
                                                        className="border-slate-200"
                                                    />
                                                </div>
                                                <div className="flex justify-end pt-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveProduct(product.id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Remover
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Footer Guide */}
                <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200 flex items-start gap-4">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                        <AlertCircle className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">Guía de envío</h4>
                        <p className="text-slate-500 text-sm mt-1">
                            Una vez pulses el botón "Enviar Todo", los productos quedarán en estado pendient de revisión. El administrador los activará en la tienda tras validar la información.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
