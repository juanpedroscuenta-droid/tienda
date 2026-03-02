import React, { useState, useEffect } from 'react';
import {
    Key,
    Plus,
    Search,
    Copy,
    Eye,
    EyeOff,
    Trash2,
    Edit2,
    ExternalLink,
    Shield,
    Filter,
    MoreVertical,
    Check,
    AlertCircle
} from 'lucide-react';
import { db } from '@/firebase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    query,
    orderBy,
    Timestamp
} from 'firebase/firestore';

interface Credential {
    id: string;
    siteName: string;
    username: string;
    email: string;
    password: string;
    url?: string;
    notes?: string;
    tags?: string[];
    createdAt: any;
}

export const CredentialsManager: React.FC = () => {
    const { user } = useAuth();
    const isSupabase = typeof (db as any)?.from === 'function';

    useEffect(() => {
        console.log('[CredentialsManager] Componente montado. Usuario:', user?.email, 'isAdmin:', user?.isAdmin, 'subCuenta:', user?.subCuenta);
    }, [user]);

    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCredential, setCurrentCredential] = useState<Partial<Credential>>({
        siteName: '',
        username: '',
        email: '',
        password: '',
        url: '',
        notes: ''
    });
    const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
    const [submitting, setSubmitting] = useState(false);

    // Cargar credenciales
    const fetchCredentials = async () => {
        setLoading(true);
        console.log('[CredentialsManager] fetchCredentials iniciada. isSupabase:', isSupabase);
        try {
            if (isSupabase) {
                console.log('[CredentialsManager] Consultando tabla "credentials" en Supabase...');
                const { data, error } = await (db as any)
                    .from('credentials')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('[CredentialsManager] Error Supabase:', error);
                    // Si la tabla no existe en Supabase, mostramos un aviso pero no bloqueamos
                    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                        console.warn('La tabla credentials no existe en Supabase');
                        setCredentials([]);
                    } else {
                        throw error;
                    }
                } else {
                    console.log('[CredentialsManager] Datos recibidos de Supabase:', data?.length || 0, 'items');
                    // Adaptar formato Supabase a Credential interface
                    const adapted = (data || []).map((item: any) => ({
                        id: item.id,
                        siteName: item.site_name,
                        username: item.username,
                        email: item.email,
                        password: item.password,
                        url: item.url,
                        notes: item.notes,
                        tags: item.tags,
                        createdAt: item.created_at
                    }));
                    setCredentials(adapted);
                }
            } else {
                console.log('[CredentialsManager] Consultando colección "credentials" en Firestore (MOCK)...');
                const q = query(collection(db, 'credentials'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Credential[];
                console.log('[CredentialsManager] Datos recibidos de Firestore:', data.length, 'items');
                setCredentials(data);
            }
        } catch (error: any) {
            console.error('[CredentialsManager] Error fetching credentials:', error);
            toast({
                title: 'Error',
                description: 'No se pudieron cargar las contraseñas',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCredentials();
    }, [isSupabase]);

    // Manejar guardado (crear o editar)
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[CredentialsManager] handleSave iniciada. isEditing:', isEditing, 'isSupabase:', isSupabase);

        if (!currentCredential.siteName || !currentCredential.password) {
            console.warn('[CredentialsManager] Campos obligatorios faltantes');
            toast({
                title: 'Error',
                description: 'Nombre del sitio y contraseña son obligatorios',
                variant: 'destructive'
            });
            return;
        }

        setSubmitting(true);
        try {
            if (isEditing && currentCredential.id) {
                console.log('[CredentialsManager] Actualizando credencial existente:', currentCredential.id);
                // Editar
                if (isSupabase) {
                    const { error } = await (db as any)
                        .from('credentials')
                        .update({
                            site_name: currentCredential.siteName,
                            username: currentCredential.username,
                            email: currentCredential.email,
                            password: currentCredential.password,
                            url: currentCredential.url,
                            notes: currentCredential.notes,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', currentCredential.id);
                    if (error) throw error;
                    console.log('[CredentialsManager] Actualización exitosa en Supabase');
                } else {
                    const docRef = doc(db, 'credentials', currentCredential.id);
                    await updateDoc(docRef, {
                        siteName: currentCredential.siteName,
                        username: currentCredential.username,
                        email: currentCredential.email,
                        password: currentCredential.password,
                        url: currentCredential.url,
                        notes: currentCredential.notes,
                        updatedAt: Timestamp.now()
                    });
                    console.log('[CredentialsManager] Actualización exitosa en Firestore');
                }
                toast({ title: 'Éxito', description: 'Contraseña actualizada' });
            } else {
                console.log('[CredentialsManager] Creando nueva credencial. User ID:', user?.id);
                // Crear
                if (isSupabase) {
                    const payload = {
                        site_name: currentCredential.siteName,
                        username: currentCredential.username,
                        email: currentCredential.email,
                        password: currentCredential.password,
                        url: currentCredential.url,
                        notes: currentCredential.notes,
                        created_by: user?.id
                    };
                    console.log('[CredentialsManager] Insertando en Supabase:', payload);
                    const { data, error } = await (db as any)
                        .from('credentials')
                        .insert(payload)
                        .select();

                    if (error) {
                        console.error('[CredentialsManager] Error insertando en Supabase:', error);
                        throw error;
                    }
                    console.log('[CredentialsManager] Inserción exitosa en Supabase:', data);
                } else {
                    await addDoc(collection(db, 'credentials'), {
                        ...currentCredential,
                        createdAt: Timestamp.now(),
                        createdBy: user?.id
                    });
                    console.log('[CredentialsManager] Inserción exitosa en Firestore');
                }
                toast({ title: 'Éxito', description: 'Contraseña guardada' });
            }
            setShowAddDialog(false);
            fetchCredentials();
        } catch (error: any) {
            console.error('[CredentialsManager] Error detallado al guardar:', error);
            toast({
                title: 'Error',
                description: error.message || 'No se pudo guardar. Revisa la consola para más detalles.',
                variant: 'destructive'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Manejar eliminación
    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta contraseña?')) return;

        try {
            if (isSupabase) {
                const { error } = await (db as any)
                    .from('credentials')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } else {
                await deleteDoc(doc(db, 'credentials', id));
            }
            toast({ title: 'Eliminado', description: 'Contraseña eliminada correctamente' });
            setCredentials(credentials.filter(c => c.id !== id));
        } catch (error: any) {
            console.error('Error deleting credential:', error);
            toast({
                title: 'Error',
                description: 'No se pudo eliminar',
                variant: 'destructive'
            });
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copiado', description: `${label} copiado al portapapeles` });
    };

    const togglePasswordVisibility = (id: string) => {
        setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const openAddDialog = () => {
        setIsEditing(false);
        setCurrentCredential({
            siteName: '',
            username: '',
            email: '',
            password: '',
            url: '',
            notes: ''
        });
        setShowAddDialog(true);
    };

    const openEditDialog = (cred: Credential) => {
        setIsEditing(true);
        setCurrentCredential(cred);
        setShowAddDialog(true);
    };

    const filteredCredentials = credentials.filter(c =>
        (c.siteName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (c.username?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (c.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="h-6 w-6 text-blue-500" />
                        Gestor de Contraseñas
                    </h2>
                    <p className="text-slate-500 text-sm">Guarda y gestiona tus accesos de forma segura.</p>
                    <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] font-mono bg-slate-50">
                            DB: {isSupabase ? 'Supabase' : 'Firestore/Mock'}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] font-mono", user?.isAdmin ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50")}>
                            Rol: {user?.isAdmin ? 'Admin' : 'Subadmin'}
                        </Badge>
                    </div>
                </div>
                <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Contraseña
                </Button>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por sitio, usuario o email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white border-slate-200 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                            <p className="text-slate-400 text-sm">Cargando tus contraseñas...</p>
                        </div>
                    ) : filteredCredentials.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Key className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-700">No se encontraron contraseñas</h3>
                            <p className="text-slate-500 text-sm max-w-xs mt-1">
                                {searchQuery ? 'No hay resultados que coincidan con tu búsqueda.' : 'Comienza agregando tu primera contraseña de acceso.'}
                            </p>
                            {!searchQuery && (
                                <Button variant="outline" onClick={openAddDialog} className="mt-6 border-blue-200 text-blue-600 hover:bg-blue-50">
                                    Agregar ahora
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/30">
                                    <TableRow>
                                        <TableHead className="w-[200px]">Sitio / Servicio</TableHead>
                                        <TableHead>Usuario / Email</TableHead>
                                        <TableHead>Contraseña</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCredentials.map((cred) => (
                                        <TableRow key={cred.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-800">{cred.siteName}</span>
                                                    {cred.url && (
                                                        <a
                                                            href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
                                                        >
                                                            {cred.url.replace(/^https?:\/\//, '')}
                                                            <ExternalLink className="h-2.5 w-2.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {cred.username && (
                                                        <div className="flex items-center gap-2 group">
                                                            <span className="text-sm text-slate-600">{cred.username}</span>
                                                            <button
                                                                onClick={() => copyToClipboard(cred.username, 'Usuario')}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all"
                                                            >
                                                                <Copy className="h-3 w-3 text-slate-500" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {cred.email && (
                                                        <div className="flex items-center gap-2 group">
                                                            <span className="text-xs text-slate-400">{cred.email}</span>
                                                            <button
                                                                onClick={() => copyToClipboard(cred.email, 'Email')}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all"
                                                            >
                                                                <Copy className="h-2.5 w-2.5 text-slate-400" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono text-slate-700 min-w-[120px]">
                                                        {showPasswords[cred.id] ? cred.password : '••••••••••••'}
                                                    </code>
                                                    <button
                                                        onClick={() => togglePasswordVisibility(cred.id)}
                                                        className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-500"
                                                    >
                                                        {showPasswords[cred.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(cred.password, 'Contraseña')}
                                                        className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-500"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem onClick={() => openEditDialog(cred)} className="gap-2">
                                                            <Edit2 className="h-3.5 w-3.5" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(cred.id)}
                                                            className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog para agregar/editar */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Editar Acceso' : 'Nuevo Acceso'}</DialogTitle>
                        <DialogDescription>
                            Completa los datos de la cuenta que deseas guardar.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 py-2">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Nombre del Sitio / Servicio <span className="text-red-500">*</span></label>
                                <Input
                                    placeholder="Ej: Facebook, Gmail, Hosting..."
                                    value={currentCredential.siteName}
                                    onChange={(e) => setCurrentCredential({ ...currentCredential, siteName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Usuario</label>
                                    <Input
                                        placeholder="Username"
                                        value={currentCredential.username}
                                        onChange={(e) => setCurrentCredential({ ...currentCredential, username: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Email</label>
                                    <Input
                                        type="email"
                                        placeholder="email@example.com"
                                        value={currentCredential.email}
                                        onChange={(e) => setCurrentCredential({ ...currentCredential, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <label className="text-sm font-medium text-slate-700">Contraseña <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Input
                                        type={showPasswords['form'] ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={currentCredential.password}
                                        onChange={(e) => setCurrentCredential({ ...currentCredential, password: e.target.value })}
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('form')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPasswords['form'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">URL del Sitio</label>
                                <div className="relative">
                                    <Input
                                        placeholder="www.google.com"
                                        value={currentCredential.url}
                                        onChange={(e) => setCurrentCredential({ ...currentCredential, url: e.target.value })}
                                        className="pl-8"
                                    />
                                    <ExternalLink className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Notas</label>
                                <textarea
                                    className="w-full min-h-[80px] px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Información adicional relevante..."
                                    value={currentCredential.notes}
                                    onChange={(e) => setCurrentCredential({ ...currentCredential, notes: e.target.value })}
                                ></textarea>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]">
                                {submitting ? 'Guardando...' : 'Guardar Acceso'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CredentialsManager;
