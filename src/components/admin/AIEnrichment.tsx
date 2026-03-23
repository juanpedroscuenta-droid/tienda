import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Image as ImageIcon, CheckCircle, AlertCircle, Play, Pause } from 'lucide-react';
import { fetchCategories, fetchAdminProducts } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export const AIEnrichment: React.FC = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [loading, setLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState<{current: number, total: number}>({current: 0, total: 0});
    const [productStatus, setProductStatus] = useState<Record<string, 'pending' | 'processing' | 'done' | 'error'>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar los primeros 200 para edición masiva (escalable)
            const [cats, result] = await Promise.all([fetchCategories(), fetchAdminProducts(200, 0)]);
            const { products: prods } = result;
            console.log(`[AI ENRICH] Loaded ${prods.length} products and ${cats.length} categories`);
            setCategories(cats);
            setProducts(prods);
        } catch (error: any) {
            console.error("[AI ENRICH] Data load error:", error.message);
            toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const catMatch = selectedCategory === 'all' || p.category_id === selectedCategory || p.category === selectedCategory;
        // Consider NULL, empty, placeholder or empty arrays as "no image"
        const noImage = !p.image || 
                       p.image === '' || 
                       p.image.includes('placeholder') || 
                       (Array.isArray(p.image) && p.image.length === 0);
        return catMatch && noImage;
    });

    const processSingleProduct = async (product: any) => {
        setIsProcessing(true);
        setProductStatus(prev => ({ ...prev, [product.id]: 'processing' }));
        try {
            const { imageUrl } = await import('@/lib/api').then(api => 
                api.generateAIImage(product.id, product.name, product.category_name || product.category)
            );
            await import('@/lib/api').then(api => 
                api.updateProduct(product.id, { ...product, image: imageUrl })
            );
            setProductStatus(prev => ({ ...prev, [product.id]: 'done' }));
            toast({ title: "Imagen Generada", description: `Se actualizó la imagen de ${product.name}` });
            loadData();
        } catch (error: any) {
            setProductStatus(prev => ({ ...prev, [product.id]: 'error' }));
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const startProcessing = async () => {
        if (filteredProducts.length === 0) return;
        
        setIsProcessing(true);
        setProcessingProgress({ current: 0, total: filteredProducts.length });
        
        const newStatus = { ...productStatus };
        filteredProducts.forEach(p => newStatus[p.id] = 'pending');
        setProductStatus(newStatus);

        for (let i = 0; i < filteredProducts.length; i++) {
            if (!isProcessing) break;
            
            const product = filteredProducts[i];
            setProductStatus(prev => ({ ...prev, [product.id]: 'processing' }));
            setProcessingProgress(prev => ({ ...prev, current: i + 1 }));

            try {
                // 1. LLAMAR A LA IA PARA GENERAR Y SUBIR
                const { imageUrl } = await import('@/lib/api').then(api => 
                    api.generateAIImage(product.id, product.name, product.category_name || product.category)
                );
                
                // 2. ACTUALIZAR PRODUCTO EN LA DB
                await import('@/lib/api').then(api => 
                    api.updateProduct(product.id, { ...product, image: imageUrl })
                );
                
                setProductStatus(prev => ({ ...prev, [product.id]: 'done' }));
            } catch (error: any) {
                console.error(`Error procesando ${product.id}:`, error.message);
                setProductStatus(prev => ({ ...prev, [product.id]: 'error' }));
            }
        }
        
        setIsProcessing(false);
        toast({ 
            title: "Proceso Completado", 
            description: "Las imágenes generadas han sido asociadas a los productos." 
        });
        loadData(); // Recargar para ver los cambios
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="h-8 w-8 text-blue-500" />
                        Enriquecedor IA 1 a 1
                    </h1>
                    <p className="text-slate-600 mt-1">Generación masiva de imágenes profesionales con fondo blanco e IA de Gemini.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[200px] bg-white border-2 border-slate-200">
                            <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las Categorías</SelectItem>
                            {categories.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    <Button 
                        onClick={startProcessing} 
                        disabled={isProcessing || filteredProducts.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6"
                    >
                        {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                        Generar {filteredProducts.length} Imágenes
                    </Button>
                </div>
            </div>

            {isProcessing && (
                <Card className="border-2 border-blue-200 bg-blue-50/50 shadow-md animate-in fade-in zoom-in duration-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-2xl">
                                    <ImageIcon className="h-6 w-6 text-blue-600 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Procesando Lote IA</h3>
                                    <p className="text-sm text-slate-500">Usando Gemini para generar imágenes...</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-blue-600">{Math.round((processingProgress.current / processingProgress.total) * 100)}%</span>
                                <p className="text-xs font-bold text-slate-400 capitalize">{processingProgress.current} de {processingProgress.total}</p>
                            </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                            <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500 ease-out"
                                style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white/70 backdrop-blur-sm border border-slate-100">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="py-5 pl-8">Producto</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Estado IA</TableHead>
                            <TableHead className="text-right pr-8">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-40 text-center py-20">
                                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-400" />
                                    <p className="text-slate-400 mt-4 font-medium italic">Analizando inventario...</p>
                                </TableCell>
                            </TableRow>
                        ) : filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-40 text-center py-20">
                                    <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                                    <p className="text-slate-600 font-bold text-xl uppercase tracking-tighter">¡Todo Listo!</p>
                                    <p className="text-slate-400 mt-1">Todos los productos tienen imagen asociada.</p>
                                </TableCell>
                            </TableRow>
                        ) : filteredProducts.map((p) => (
                            <TableRow key={p.id} className="hover:bg-blue-50/30 transition-colors border-slate-100 last:border-0 group">
                                <TableCell className="py-5 pl-8">
                                    <div>
                                        <p className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors uppercase tracking-tight text-sm">{p.name}</p>
                                        <p className="text-xs text-slate-400 font-medium">Lanzamiento Manual IA</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                                        {p.category_name || p.category}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {productStatus[p.id] === 'processing' ? (
                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1.5 w-fit border-none shadow-sm">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Generando...
                                        </Badge>
                                    ) : productStatus[p.id] === 'done' ? (
                                        <Badge className="bg-green-100 text-green-700 flex items-center gap-1.5 w-fit border-none shadow-sm">
                                            <CheckCircle className="h-3 w-3" />
                                            Listo
                                        </Badge>
                                    ) : productStatus[p.id] === 'error' ? (
                                        <Badge className="bg-red-100 text-red-700 flex items-center gap-1.5 w-fit border-none shadow-sm">
                                            <AlertCircle className="h-3 w-3" />
                                            Error
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-slate-100 text-slate-400 flex items-center gap-1.5 w-fit border-none shadow-sm">
                                            <Sparkles className="h-3 w-3" />
                                            Pendiente
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="text-blue-600 hover:bg-blue-50 font-bold text-xs uppercase" 
                                        disabled={isProcessing}
                                        onClick={() => processSingleProduct(p)}
                                    >
                                        Diseñar ahora
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
};
