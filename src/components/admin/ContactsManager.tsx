import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Download,
  MoreVertical,
  Search,
  Filter,
  ArrowUpDown,
  Settings,
  List,
  Users,
  RotateCcw,
  CheckSquare,
  Mail,
  Phone,
  Calendar,
  Tag as TagIcon,
  User,
  History,
  Trash2,
  ChevronDown,
  Save,
  Circle,
  CheckCircle2,
  GripVertical,
  Clock
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
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { sendBulkEmail } from '@/lib/api';

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  lastActivity?: Date;
  tags?: string[];
  avatar?: string;
}

export const ContactsManager: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('smart-lists');
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({ title: '', dueDate: '', priority: 'Media', assignee: user ? ((user as any).displayName || (user as any).name || 'Yo') : 'Yo' });
  const [boardTasks, setBoardTasks] = useState<any[]>([]);

  // Estado para correos masivos
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const isSupabase = typeof (db as any)?.from === 'function';

  useEffect(() => {
    loadContacts();
    loadTasks();

    // Suscripción en tiempo real para actualizar cuando llegue un nuevo contacto
    if (isSupabase) {
      const channel = (db as any)
        .channel('contacts-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
          loadContacts();
        })
        .subscribe();

      return () => {
        (db as any).removeChannel(channel);
      };
    }
  }, []);

  const loadTasks = async () => {
    try {
      if (isSupabase) {
        const { data, error } = await db.from('tasks').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          setBoardTasks(data.map((t: any) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            dueDate: t.due_date,
            priority: t.priority,
            assignee: t.assignee
          })));
        }
      } else {
        const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
        const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fbTasks: any[] = [];
        querySnapshot.forEach((doc) => {
          const d = doc.data();
          fbTasks.push({ id: doc.id, title: d.title, status: d.status, dueDate: d.dueDate, priority: d.priority, assignee: d.assignee });
        });
        setBoardTasks(fbTasks);
      }
    } catch (e) {
      console.error('Error loading tasks:', e);
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      if (isSupabase) {
        const { data, error } = await db
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading contacts:', error);
        } else if (data) {
          setContacts(data.map((contact: any) => ({
            id: contact.id,
            name: contact.name || '',
            phone: contact.phone || '',
            email: contact.email || '',
            createdAt: contact.created_at ? new Date(contact.created_at) : new Date(),
            lastActivity: contact.last_activity ? new Date(contact.last_activity) : undefined,
            tags: contact.tags || [],
            avatar: contact.avatar || ''
          })));
        }
      } else {
        // Firebase fallback
        const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
        const contactsRef = collection(db, 'contacts');
        const q = query(contactsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const contactsData: Contact[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          contactsData.push({
            id: doc.id,
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            lastActivity: data.lastActivity?.toDate(),
            tags: data.tags || [],
            avatar: data.avatar || ''
          });
        });
        setContacts(contactsData);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los contactos.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('es-ES', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Hace menos de una hora';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} horas`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays} días`;
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      contact.phone?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower)
    );
  });

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };



  const handleSaveContact = async () => {
    if (!newContact.name.trim()) {
      toast({ title: 'Error', description: 'El nombre es obligatorio', variant: 'destructive' });
      return;
    }

    try {
      setIsSaving(true);
      if (isSupabase) {
        const { data, error } = await db.from('contacts').insert([{
          name: newContact.name,
          email: newContact.email,
          phone: newContact.phone,
          created_at: new Date().toISOString()
        }]).select();

        if (error) throw error;
        if (data && data.length > 0) {
          setContacts(prev => [{
            id: data[0].id,
            name: data[0].name || '',
            email: data[0].email || '',
            phone: data[0].phone || '',
            createdAt: new Date(data[0].created_at),
            tags: data[0].tags || [],
            avatar: data[0].avatar || ''
          }, ...prev]);
        }
      } else {
        const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
        const docRef = await addDoc(collection(db, 'contacts'), {
          name: newContact.name,
          email: newContact.email,
          phone: newContact.phone,
          createdAt: serverTimestamp(),
          tags: []
        });
        setContacts(prev => [{
          id: docRef.id,
          name: newContact.name,
          email: newContact.email,
          phone: newContact.phone,
          createdAt: new Date(),
          tags: []
        }, ...prev]);
      }

      toast({ title: 'Éxito', description: 'Contacto agregado correctamente' });
      setIsAddContactOpen(false);
      setNewContact({ name: '', email: '', phone: '' });
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({ title: 'Error', description: 'No se pudo guardar el contacto', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    setBoardTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      if (isSupabase) {
        await db.from('tasks').update({ status: newStatus }).eq('id', taskId);
      } else {
        const { updateDoc, doc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
      }
    } catch (e) {
      console.error('Error updating task status', e);
    }
  };

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      handleUpdateTaskStatus(taskId, newStatus);
    }
  };

  const handleAddNewTask = async () => {
    if (!newTaskForm.title.trim()) return;
    const newTask = {
      title: newTaskForm.title,
      status: 'todo',
      dueDate: newTaskForm.dueDate || 'Sin fecha',
      priority: newTaskForm.priority,
      assignee: newTaskForm.assignee || 'Yo'
    };

    try {
      if (isSupabase) {
        const { data, error } = await db.from('tasks').insert([{
          title: newTask.title,
          status: newTask.status,
          due_date: newTask.dueDate,
          priority: newTask.priority,
          assignee: newTask.assignee,
          created_at: new Date().toISOString()
        }]).select();

        if (!error && data && data.length > 0) {
          setBoardTasks(prev => [{ ...newTask, id: data[0].id }, ...prev]);
        }
      } else {
        const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
        const docRef = await addDoc(collection(db, 'tasks'), {
          ...newTask,
          createdAt: serverTimestamp()
        });
        setBoardTasks(prev => [{ ...newTask, id: docRef.id }, ...prev]);
      }

      setIsNewTaskOpen(false);
      setNewTaskForm({ title: '', dueDate: '', priority: 'Media', assignee: user ? ((user as any).displayName || (user as any).name || 'Yo') : 'Yo' });
      toast({ title: 'Éxito', description: 'Tarea creada en el tablero.' });
    } catch (e) {
      console.error('Error adding task:', e);
      toast({ title: 'Error', description: 'No se pudo crear la tarea', variant: 'destructive' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setBoardTasks(prev => prev.filter(t => t.id !== taskId));
    toast({ title: 'Tarea eliminada' });
    try {
      if (isSupabase) {
        await db.from('tasks').delete().eq('id', taskId);
      } else {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'tasks', taskId));
      }
    } catch (e) {
      console.error('Error deleting task', e);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!emailForm.subject.trim() || !emailForm.body.trim()) {
      toast({ title: 'Error', description: 'El asunto y el cuerpo del mensaje son obligatorios', variant: 'destructive' });
      return;
    }

    if (selectedContacts.length === 0) {
      toast({ title: 'Error', description: 'Debes seleccionar al menos un contacto', variant: 'destructive' });
      return;
    }

    setIsSendingEmail(true);
    try {
      const selectedEmails = contacts.filter(c => selectedContacts.includes(c.id) && c.email).map(c => c.email);
      if (selectedEmails.length === 0) {
        toast({ title: 'Aviso', description: 'Los contactos seleccionados no tienen correo electrónico registrado.', variant: 'destructive' });
        setIsSendingEmail(false);
        return;
      }

      // Llamada real a la API de envío conectada al backend
      await sendBulkEmail(selectedEmails, emailForm.subject, emailForm.body);

      toast({ title: 'Éxito', description: `Correos encolados y enviados exitosamente a ${selectedEmails.length} contactos.` });
      setIsEmailDialogOpen(false);
      setEmailForm({ subject: '', body: '' });
      setSelectedContacts([]); // Deseleccionar después de enviar
    } catch (e) {
      console.error('Error sending bulk email', e);
      toast({ title: 'Error', description: 'Error al enviar correos masivos', variant: 'destructive' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Contactos
          </h1>
          <p className="text-slate-500 mt-1">
            Gestiona tus contactos y listas inteligentes con herramientas avanzadas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-200 shadow-sm hidden sm:flex" onClick={loadContacts}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refrescar
          </Button>
          <Button variant="outline" className="border-slate-200 shadow-sm hidden sm:flex">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <div className="flex items-center gap-1">
            {selectedContacts.length > 0 && (
              <Button
                variant="outline"
                className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 shadow-sm transition-all"
                onClick={() => setIsEmailDialogOpen(true)}
              >
                <Mail className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Enviar Masivo</span>
                <Badge variant="secondary" className="ml-1 bg-indigo-100/50 text-indigo-700 px-1 py-0">{selectedContacts.length}</Badge>
              </Button>
            )}

            <Button
              onClick={() => setIsAddContactOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Contacto
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 border border-transparent hover:border-slate-200">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Acciones de gestión</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Gestionar listas inteligentes</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  <span>Restaurar / Restablecer</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 cursor-pointer">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Eliminar seleccionados</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-px">
          <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-2 sm:gap-6">
            <TabsTrigger
              value="smart-lists"
              className="px-2 py-3 text-sm font-semibold text-slate-500 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none transition-all"
            >
              Listas inteligentes
            </TabsTrigger>

            <TabsTrigger
              value="tasks"
              className="px-2 py-3 text-sm font-semibold text-slate-500 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none transition-all"
            >
              Tareas
            </TabsTrigger>

          </TabsList>

          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600 gap-2 shrink-0 self-start sm:self-auto">
            <Settings className="h-4 w-4" />
            <span>Configuración</span>
          </Button>
        </div>

        {/* Info Message */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
          Las opciones de menú «Gestionar listas inteligentes» y «Restaurar» cambian de sitio. A partir del 29 de enero de 2026, las encontrará en el menú de acciones (:) junto al botón «Añadir contacto».
        </div>

        <TabsContent value="smart-lists" className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">Todos los contactos</h2>
              <div className="flex items-center bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-blue-100">
                {filteredContacts.length}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                <Download className="h-3.5 w-3.5 mr-2 text-slate-500" />
                Importar
              </Button>
              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600 flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" />
                Filtros
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600 flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5" />
                Ordenar
              </Button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-3 flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg ring-1 ring-slate-200">
                <List className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Vista Predeterminada
                </span>
              </div>
            </div>

            <div className="lg:col-span-6 flex items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Busca por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white border-slate-200 rounded-lg shadow-sm focus-visible:ring-blue-500 h-10"
                />
              </div>
            </div>

            <div className="lg:col-span-3 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" className="h-10 text-slate-600 hover:text-blue-600 border-slate-200 hover:bg-slate-50">
                <Plus className="h-3.5 w-3.5 mr-2" />
                Lista
              </Button>
              <Button variant="outline" size="sm" className="h-10 text-slate-600 hover:text-blue-600 border-slate-200 hover:bg-slate-50">
                <Settings className="h-3.5 w-3.5 mr-2" />
                Campos
              </Button>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {filteredContacts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900">Sin contactos</h3>
                <p className="text-slate-500 text-sm">No hay resultados para tu búsqueda.</p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm active:bg-slate-50 transition-colors"
                  onClick={() => toggleContactSelection(contact.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {contact.avatar ? (
                        <img src={contact.avatar} className="w-10 h-10 rounded-full ring-2 ring-blue-50" />
                      ) : (
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold", getAvatarColor(contact.name))}>
                          {getInitials(contact.name)}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-900">{contact.name}</h4>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => { }} // Controlled by parent div click
                      className="rounded text-blue-600 h-4 w-4"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {contact.phone || '-'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Mail className="h-3 w-3 text-slate-400" />
                      <span className="truncate">{contact.email || '-'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex gap-1">
                      {contact.tags?.slice(0, 2).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 border-none">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-400">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Contacts Table - Desktop Only */}
          <Card className="shadow-sm border border-slate-200 hidden lg:block overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-4 text-left w-10">
                        <input
                          type="checkbox"
                          checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 transition-colors">
                          Contacto
                          <ChevronDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 transition-colors">
                          Teléfono
                          <ChevronDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 transition-colors">
                          Email
                          <ChevronDown className="h-3 w-3" />
                        </div>
                      </th>

                      <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 transition-colors">
                          Creado
                          <ChevronDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        Etiquetas
                      </th>
                      <th className="px-5 py-4 text-right">
                        <Settings className="h-4 w-4 text-slate-300 ml-auto" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredContacts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-20 text-center">
                          <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                            <div className="bg-slate-50 p-4 rounded-full mb-4">
                              <Users className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-slate-900 font-bold mb-1">No hay contactos</h3>
                            <p className="text-slate-500 text-sm">Prueba a cambiar los filtros o agrega un nuevo contacto para empezar.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredContacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-slate-50/50 transition-all cursor-pointer group">
                          <td className="px-5 py-4">
                            <input
                              type="checkbox"
                              checked={selectedContacts.includes(contact.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleContactSelection(contact.id);
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {contact.avatar ? (
                                <img
                                  src={contact.avatar}
                                  alt={contact.name}
                                  className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                                />
                              ) : (
                                <div className={cn(
                                  "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white",
                                  getAvatarColor(contact.name)
                                )}>
                                  {getInitials(contact.name)}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {contact.name || 'Sin nombre'}
                                </span>
                                {contact.tags && contact.tags.length > 0 && (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {contact.tags[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-700 font-medium">
                            {contact.phone || '-'}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {contact.email ? (
                              <span className="truncate block max-w-[180px] hover:text-blue-600 transition-colors">
                                {contact.email}
                              </span>
                            ) : '-'}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-700">{formatDate(contact.createdAt).split(',')[0]}</span>
                              <span className="text-[10px]">{formatDate(contact.createdAt).split(',')[1]}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {contact.tags?.slice(0, 2).map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-[10px] bg-slate-100 text-slate-600 border-none font-bold px-2 py-0"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {contact.tags && contact.tags.length > 2 && (
                                <span className="text-[10px] font-bold text-slate-400">+{contact.tags.length - 2}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Tabs Content */}


        <TabsContent value="reset" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              Restablecer
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CheckSquare className="h-6 w-6 text-blue-600" />
                Mis Tareas
              </h2>
              <p className="text-slate-500 text-sm">Gestiona tus tareas arrastrándolas entre columnas.</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsNewTaskOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-4 items-start select-none">
            {/* Column: To Do */}
            <div
              className="flex flex-col bg-slate-50/50 rounded-xl border border-slate-200 p-4 min-h-[500px] transition-colors hover:bg-slate-100/50"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, 'todo')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <Circle className="h-4 w-4 text-slate-400" />
                  Por hacer
                  <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-700">
                    {boardTasks.filter(t => t.status === 'todo').length}
                  </Badge>
                </h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => setIsNewTaskOpen(true)}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-col gap-3">
                {boardTasks.filter(t => t.status === 'todo').map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id)}
                    className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group cursor-grab active:cursor-grabbing hover:border-blue-300"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-slate-300 hover:text-green-500 transition-colors" onClick={() => handleUpdateTaskStatus(task.id, 'done')} />
                        <span className="font-semibold text-slate-800 text-sm">{task.title}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleUpdateTaskStatus(task.id, 'in-progress')}>Mover a En Curso</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateTaskStatus(task.id, 'done')}>Marcar Completada</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTask(task.id)}>Eliminar Tarea</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3 pl-7">
                      <Badge variant="outline" className={cn("text-[10px]",
                        task.priority === 'Alta' ? "text-red-600 border-red-200 bg-red-50" :
                          task.priority === 'Media' ? "text-amber-600 border-amber-200 bg-amber-50" : "text-slate-600 border-slate-200 bg-slate-50"
                      )}>{task.priority}</Badge>
                      <div className="flex items-center text-[10px] text-slate-500 gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Calendar className="h-3 w-3" /> {task.dueDate}
                      </div>
                      <div className="ml-auto">
                        <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold border border-blue-200" title={task.assignee}>
                          {task.assignee.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column: In Progress */}
            <div
              className="flex flex-col bg-slate-50/50 rounded-xl border border-slate-200 p-4 min-h-[500px] transition-colors hover:bg-blue-50/30"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, 'in-progress')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <Circle className="h-4 w-4 text-blue-500 fill-blue-100" />
                  En curso
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                    {boardTasks.filter(t => t.status === 'in-progress').length}
                  </Badge>
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                {boardTasks.filter(t => t.status === 'in-progress').map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id)}
                    className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-shadow group cursor-grab active:cursor-grabbing ring-1 ring-blue-50 leading-relaxed hover:border-blue-400"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-slate-300 hover:text-green-500 transition-colors" onClick={() => handleUpdateTaskStatus(task.id, 'done')} />
                        <span className="font-semibold text-slate-800 text-sm">{task.title}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-blue-50 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleUpdateTaskStatus(task.id, 'todo')}>Mover a Por hacer</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateTaskStatus(task.id, 'done')}>Marcar Completada</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTask(task.id)}>Eliminar Tarea</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3 pl-7">
                      <Badge variant="outline" className={cn("text-[10px]",
                        task.priority === 'Alta' ? "text-red-600 border-red-200 bg-red-50" :
                          task.priority === 'Media' ? "text-amber-600 border-amber-200 bg-amber-50" : "text-slate-600 border-slate-200 bg-slate-50"
                      )}>{task.priority}</Badge>
                      <div className="flex items-center text-[10px] text-blue-600 gap-1 bg-blue-50 px-2 py-0.5 rounded-md font-medium">
                        <Clock className="h-3 w-3" /> {task.dueDate}
                      </div>
                      <div className="ml-auto">
                        <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold border border-indigo-200" title={task.assignee}>
                          {task.assignee.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column: Done */}
            <div
              className="flex flex-col bg-slate-50/50 rounded-xl border border-slate-200 p-4 min-h-[500px] transition-colors hover:bg-green-50/30"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, 'done')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 fill-green-100" />
                  Completado
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                    {boardTasks.filter(t => t.status === 'done').length}
                  </Badge>
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                {boardTasks.filter(t => t.status === 'done').map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id)}
                    className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm opacity-75 group cursor-grab active:cursor-grabbing hover:border-green-300"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" onClick={() => handleUpdateTaskStatus(task.id, 'todo')} />
                        <span className="font-semibold text-slate-600 text-sm line-through decoration-slate-300">{task.title}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleUpdateTaskStatus(task.id, 'todo')}>Mover a Por hacer</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTask(task.id)}>Eliminar Tarea</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3 pl-7">
                      <div className="flex items-center text-[10px] text-slate-400 gap-1 bg-slate-200/50 px-2 py-0.5 rounded-md">
                        Completado {task.dueDate}
                      </div>
                      <div className="ml-auto opacity-70">
                        <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold border border-slate-300" title={task.assignee}>
                          {task.assignee.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>



        <TabsContent value="manage-lists" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              Gestionar listas inteligentes
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Agregar Contacto Modal */}
      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nuevo Contacto</DialogTitle>
            <DialogDescription>
              Ingresa los detalles del nuevo contacto.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre principal *</Label>
              <Input
                id="name"
                placeholder="Ej. Juan Pérez"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="Ej. 310 123 4567"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              />
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddContactOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveContact} disabled={isSaving || !newContact.name.trim()} className="bg-blue-600 hover:bg-blue-700">
              {isSaving ? 'Guardando...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Agregar Tarea Modal */}
      <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
            <DialogDescription>
              Añade una nueva tarea a tu tablero.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Título de la tarea *</Label>
              <Input
                id="task-title"
                placeholder="Ej. Llamar a Prospecto X"
                value={newTaskForm.title}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-priority">Prioridad</Label>
                <select
                  id="task-priority"
                  className="w-full border-slate-300 rounded-md h-10 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  value={newTaskForm.priority}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                >
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-dueDate">Vencimiento</Label>
                <Input
                  id="task-dueDate"
                  placeholder="Ej. Hoy, Mañana, 25 Nov"
                  value={newTaskForm.dueDate}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-assignee">Asignado a</Label>
              <Input
                id="task-assignee"
                placeholder="Ej. Juan, Ana..."
                value={newTaskForm.assignee}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, assignee: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTaskOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddNewTask} disabled={!newTaskForm.title.trim()} className="bg-blue-600 hover:bg-blue-700">
              Crear Tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Correos Masivos */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              Enviar Correo Masivo
            </DialogTitle>
            <DialogDescription>
              Se enviará un correo a {selectedContacts.length} contactos seleccionados.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Asunto del correo *</Label>
              <Input
                id="email-subject"
                placeholder="Ej. Promoción Especial de esta Semana"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-body">Cuerpo del mensaje *</Label>
              <textarea
                id="email-body"
                className="w-full min-h-[200px] border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y"
                placeholder="Escribe aquí el contenido del correo..."
                value={emailForm.body}
                onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
              />
              <p className="text-xs text-slate-500">
                Los contactos que no tengan una dirección de correo válida configurada serán omitidos automáticamente.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)} disabled={isSendingEmail}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendBulkEmail}
              disabled={isSendingEmail || !emailForm.subject.trim() || !emailForm.body.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSendingEmail ? (
                'Enviando...'
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar a {selectedContacts.length} contactos
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
