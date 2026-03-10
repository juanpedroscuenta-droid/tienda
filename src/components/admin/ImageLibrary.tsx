import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Folder,
    Image as ImageIcon,
    Search,
    Plus,
    ChevronRight,
    MoreVertical,
    Download,
    Trash2,
    ExternalLink,
    FolderPlus,
    ArrowLeft,
    Loader2,
    LayoutGrid,
    List,
    Filter,
    CheckCircle2,
    Copy,
    Maximize2,
    Upload
} from 'lucide-react';
import { db } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { uploadFile } from '@/lib/api';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";

interface ImageItem {
    id: string;
    url: string;
    name: string;
    productId: string;
    productName: string;
    category: string;
    categoryName: string;
    type: 'main' | 'additional';
}

interface ImageFolder {
    id: string;
    name: string;
    count: number;
    type: 'category' | 'custom';
}

export const ImageLibrary: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentFolder, setCurrentFolder] = useState<string | null>(null); // null means root (folders)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [customFolders, setCustomFolders] = useState<string[]>(() => {
        const saved = localStorage.getItem('admin_custom_image_folders');
        return saved ? JSON.parse(saved) : [];
    });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const isSupabase = typeof (db as any)?.from === 'function';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (isSupabase) {
                // Fetch categories first
                const { data: catData, error: catError } = await (db as any)
                    .from("categories")
                    .select("*");
                if (catError) throw catError;
                setCategories(catData || []);

                // Fetch products
                const { data: prodData, error: prodError } = await (db as any)
                    .from("products")
                    .select("id, name, image, additional_images, category_id, category_name");
                if (prodError) throw prodError;
                setProducts(prodData || []);
            }
        } catch (error) {
            console.error("Error fetching library data:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar las imágenes."
            });
        } finally {
            setLoading(false);
        }
    };

    const allImages = useMemo(() => {
        const images: ImageItem[] = [];
        products.forEach(p => {
            // Main image
            if (p.image) {
                images.push({
                    id: `${p.id}-main`,
                    url: p.image,
                    name: `${p.name} (Principal)`,
                    productId: p.id,
                    productName: p.name,
                    category: p.category_id || 'uncategorized',
                    categoryName: p.category_name || 'Sin categoría',
                    type: 'main'
                });
            }
            // Additional images
            if (p.additional_images && Array.isArray(p.additional_images)) {
                p.additional_images.forEach((img, idx) => {
                    if (img) {
                        images.push({
                            id: `${p.id}-add-${idx}`,
                            url: img,
                            name: `${p.name} (Adicional ${idx + 1})`,
                            productId: p.id,
                            productName: p.name,
                            category: p.category_id || 'uncategorized',
                            categoryName: p.category_name || 'Sin categoría',
                            type: 'additional'
                        });
                    }
                });
            }
        });

        // Add locally uploaded images
        const savedImages = localStorage.getItem('admin_library_local_images');
        if (savedImages) {
            const localImages = JSON.parse(savedImages);
            localImages.forEach((img: ImageItem) => {
                images.push(img);
            });
        }

        return images;
    }, [products, customFolders]);

    const folders = useMemo(() => {
        const categoryFolders: ImageFolder[] = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            type: 'category',
            count: allImages.filter(img => img.category === cat.id).length
        }));

        const uncategorizedCount = allImages.filter(img => img.category === 'uncategorized').length;
        if (uncategorizedCount > 0) {
            categoryFolders.push({
                id: 'uncategorized',
                name: 'Sin categoría',
                type: 'category',
                count: uncategorizedCount
            });
        }

        const custom = customFolders.map(name => ({
            id: `custom-${name}`,
            name: name,
            type: 'custom',
            count: allImages.filter(img => img.category === `custom-${name}`).length
        }));

        return [...categoryFolders, ...custom];
    }, [categories, allImages, customFolders]);

    const filteredItems = useMemo(() => {
        let items = currentFolder
            ? allImages.filter(img => img.category === currentFolder)
            : [];

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            items = items.filter(img =>
                img.name.toLowerCase().includes(lower) ||
                img.productName.toLowerCase().includes(lower)
            );
        }
        return items;
    }, [allImages, currentFolder, searchTerm]);

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        const updated = [...customFolders, newFolderName.trim()];
        setCustomFolders(updated);
        localStorage.setItem('admin_custom_image_folders', JSON.stringify(updated));
        setNewFolderName('');
        setShowCreateFolder(false);
        toast({ title: "Carpeta creada", description: `Carpeta "${newFolderName}" lista.` });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentFolder) return;

        setUploading(true);
        try {
            const result = await uploadFile(file, `library/${currentFolder}`);
            if (result && result.url) {
                const newImage: ImageItem = {
                    id: `local-${Date.now()}`,
                    url: result.url,
                    name: file.name,
                    productId: 'local',
                    productName: 'Subida manual',
                    category: currentFolder,
                    categoryName: folders.find(f => f.id === currentFolder)?.name || 'Carpeta Personalizada',
                    type: 'additional'
                };

                const savedImages = localStorage.getItem('admin_library_local_images');
                const localImages = savedImages ? JSON.parse(savedImages) : [];
                localImages.push(newImage);
                localStorage.setItem('admin_library_local_images', JSON.stringify(localImages));

                toast({ title: "Éxito", description: "Imagen subida correctamente." });
                // We don't need to re-fetch as useMemo will react to localStorage change if we force a re-render
                // SetProducts is just to force that update here
                setProducts([...products]);
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo subir la imagen." });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedImages(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        toast({ title: "Copiado", description: "URL de imagen copiada al portapapeles." });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Cargando biblioteca de imágenes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Toolbar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {currentFolder && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentFolder(null)}
                            className="h-9 w-9 p-0 rounded-full"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-emerald-600" />
                            {currentFolder ? folders.find(f => f.id === currentFolder)?.name : 'Biblioteca de Imágenes'}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            {currentFolder ? `${filteredItems.length} imágenes` : `${folders.length} carpetas`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar imágenes..."
                            className="pl-9 h-9 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 text-slate-600 border-slate-200"
                        onClick={() => setShowCreateFolder(true)}
                    >
                        <FolderPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">Nueva Carpeta</span>
                    </Button>

                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-7 w-7 p-0 rounded-md shadow-none", viewMode === 'grid' ? "bg-white shadow-sm" : "hover:bg-slate-200")}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-7 w-7 p-0 rounded-md shadow-none", viewMode === 'list' ? "bg-white shadow-sm" : "hover:bg-slate-200")}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="min-h-[400px]">
                {!currentFolder ? (
                    /* Folder Explorer View */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                onClick={() => setCurrentFolder(folder.id)}
                                className="group cursor-pointer"
                            >
                                <div className="aspect-square bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:border-emerald-200">
                                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="h-6 w-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-400">
                                            <MoreVertical className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                        <Folder className="h-8 w-8 text-emerald-600" />
                                    </div>

                                    <div className="text-center px-3">
                                        <p className="text-sm font-bold text-slate-800 truncate max-w-full" title={folder.name}>
                                            {folder.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                            {folder.count} Elementos
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Image Gallery View */
                    <div className="space-y-4">
                        {/* Action Bar for selection */}
                        {selectedImages.length > 0 && (
                            <div className="bg-emerald-600 text-white rounded-xl p-3 flex items-center justify-between shadow-lg sticky top-20 z-10 animate-in slide-in-from-top-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-6 bg-white/20 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-sm font-bold uppercase tracking-wider">
                                        {selectedImages.length} Seleccionados
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" className="h-8 text-white hover:bg-white/10 font-bold text-xs uppercase">
                                        Descargar zip
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-white hover:bg-red-500/20 text-red-100 font-bold text-xs uppercase"
                                        onClick={() => setSelectedImages([])}
                                    >
                                        Descartar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Folder Header Actions */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                Contenido de la carpeta
                            </h3>
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold text-xs uppercase"
                                >
                                    {uploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Upload className="h-4 w-4" />
                                    )}
                                    Subir Imagen
                                </Button>
                            </div>
                        </div>

                        {filteredItems.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <ImageIcon className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">Esta carpeta está vacía</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">No hay imágenes en esta carpeta. ¡Sube una ahora!</p>
                            </div>
                        ) : (
                            <div className={cn(
                                "grid gap-6",
                                viewMode === 'grid' ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8" : "grid-cols-1"
                            )}>
                                {filteredItems.map(item => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "group relative bg-white border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl",
                                            selectedImages.includes(item.id) ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200"
                                        )}
                                    >
                                        {/* Selection Checkbox */}
                                        <div
                                            className={cn(
                                                "absolute top-2 left-2 z-10 h-6 w-6 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center",
                                                selectedImages.includes(item.id)
                                                    ? "bg-emerald-500 border-emerald-500"
                                                    : "bg-white/50 border-white opacity-0 group-hover:opacity-100"
                                            )}
                                            onClick={(e) => toggleSelect(item.id, e)}
                                        >
                                            {selectedImages.includes(item.id) && <CheckCircle2 className="h-4 w-4 text-white" />}
                                        </div>

                                        {/* Image Thumbnail */}
                                        <div className={cn(
                                            "relative bg-slate-50 overflow-hidden",
                                            viewMode === 'grid' ? "aspect-square" : "h-16 w-16 float-left m-2 rounded-lg"
                                        )}>
                                            <img
                                                src={item.url}
                                                alt={item.name}
                                                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => copyToClipboard(item.url)}
                                                    className="p-1.5 bg-white rounded-lg text-slate-800 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                    title="Copiar URL"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 bg-white rounded-lg text-slate-800 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                                    title="Ver original"
                                                >
                                                    <Maximize2 className="h-4 w-4" />
                                                </a>
                                            </div>
                                        </div>

                                        {/* Image Details */}
                                        {viewMode === 'grid' ? (
                                            <div className="p-3">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">
                                                    {item.productName}
                                                </p>
                                                <h4 className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-2 min-h-[2.4em]" title={item.name}>
                                                    {item.name}
                                                </h4>
                                            </div>
                                        ) : (
                                            <div className="p-4 flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-800">{item.productName}</h4>
                                                    <p className="text-xs text-slate-400 font-medium">
                                                        {item.name} • URL: {item.url.substring(0, 40)}...
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.url)}>
                                                        <Copy className="h-4 w-4 mr-2" /> Copiar URL
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => window.open(item.url, '_blank')}>
                                                                <ExternalLink className="h-4 w-4 mr-2" /> Ver original
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <Download className="h-4 w-4 mr-2" /> Descargar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Dialog for Creating Folder */}
            <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
                <DialogContent className="sm:max-w-md rounded-2xl border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-800">
                            <FolderPlus className="h-5 w-5 text-emerald-600" />
                            Crear nueva carpeta
                        </DialogTitle>
                        <DialogDescription>
                            Organiza tus imágenes en carpetas personalizadas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 py-4">
                        <div className="grid flex-1 gap-2">
                            <Input
                                id="folderName"
                                placeholder="Nombre de la carpeta"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                            />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowCreateFolder(false)}
                            className="font-bold text-xs uppercase"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase"
                            onClick={handleCreateFolder}
                        >
                            Crear Carpeta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
