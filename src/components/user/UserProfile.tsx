import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AdvancedHeader } from "@/components/layout/AdvancedHeader";
import { Footer } from "@/components/layout/Footer";
import { TopPromoBar } from "@/components/layout/TopPromoBar";
import { useCategories } from "@/hooks/use-categories";
import { db } from "@/firebase";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User as UserIcon, Mail, Phone, MapPin, Gift, Package, Heart,
  Edit, Save, AlertCircle, CheckCircle2, Home as HomeIcon, Truck, ChevronRight,
  Calendar as CalendarIcon, ShoppingBag, BadgeCheck, History,
  Trash2, Star, Plus, Check, X, CreditCard, MapPinned
} from "lucide-react";
import { CustomClock } from '@/components/ui/CustomClock';
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Product } from "@/contexts/CartContext";
import { slugify, parseFormattedPrice } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

// Tipo para las órdenes recientes
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  date: Date;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[] | number;
  trackingNumber?: string;
}

// Tipo para los productos favoritos
interface FavoriteProduct {
  id: string;
  name: string;
  image: string;
  price: number;
}

// Tipo para direcciones guardadas
interface SavedAddress {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

export const UserProfile: React.FC = () => {
  const isSupabase = typeof (db as any)?.from === 'function';
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [promoVisible, setPromoVisible] = useState(true);
  const {
    categories,
    mainCategories,
    subcategoriesByParent,
    thirdLevelBySubcategory,
  } = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    province: "",
    postalCode: "",
    address: "",
    birthdate: "",
    preferences: "",
    notifications: {
      email: true,
      sms: false,
      promotions: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const { favorites: favoriteProducts, toggleFavorite } = useFavorites();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [newAddress, setNewAddress] = useState({
    name: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    isDefault: false
  });
  const [addingAddress, setAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        if (isSupabase) {
          // Fetch main user data from backend to get extra fields
          const response = await fetch(`${API_BASE_URL}/users/${user.id}`);
          let dbData: any = {};
          if (response.ok) {
            dbData = await response.json() || {};
          }

          setFormData(prev => ({
            ...prev,
            name: dbData.name || user.name || "",
            email: dbData.email || user.email || "",
            phone: dbData.phone || user.phone || "",
            address: dbData.address || user.address || "",
            city: dbData.city || (user as any).city || "",
            province: dbData.province || (user as any).province || "",
            postalCode: dbData.postal_code || dbData.postalCode || (user as any).postalCode || "",
            birthdate: dbData.birthdate || (user as any).birthdate || "",
          }));

          // Fetch Orders from backend
          try {
            const ordersRes = await fetch(`${API_BASE_URL}/orders?userId=${user.id}`);
            if (ordersRes.ok) {
              const ordersData = await ordersRes.json();
              setRecentOrders(ordersData.map((d: any) => ({
                id: d.id,
                date: new Date(d.created_at),
                total: parseFormattedPrice(d.total ?? 0),
                status: d.status || 'pending',
                items: Array.isArray(d.items) ? d.items : [],
                trackingNumber: d.tracking_number
              })));
            }
          } catch (e) { console.error("Error fetching orders:", e); }

          // Fetch Addresses from Supabase
          try {
            const { data: addressesData, error: addrError } = await (db as any)
              .from('user_addresses')
              .select('*')
              .eq('user_id', user.id);

            if (!addrError && addressesData && addressesData.length > 0) {
              const mapped = addressesData.map((d: any) => ({
                id: d.id,
                name: d.name,
                address: d.address,
                city: d.city,
                province: d.province,
                postalCode: d.postal_code,
                isDefault: d.is_default
              }));
              setSavedAddresses(mapped);

              // Si el perfil no tiene dirección en tabla users, usar la predeterminada de user_addresses
              const defaultAddr = mapped.find((a: any) => a.isDefault) || mapped[0];
              if (!dbData.address && defaultAddr) {
                setFormData(prev => ({
                  ...prev,
                  address: defaultAddr.address,
                  city: defaultAddr.city || prev.city,
                  province: defaultAddr.province || prev.province,
                  postalCode: defaultAddr.postalCode || prev.postalCode,
                }));
              }
            } else if (dbData.address && (!addressesData || addressesData.length === 0)) {
              // Fallback to main address if no separate addresses exist
              setSavedAddresses([{
                id: 'primary',
                name: 'Principal',
                address: dbData.address,
                city: dbData.city || '',
                province: dbData.province || '',
                postalCode: dbData.postal_code || '',
                isDefault: true
              }]);
            }
          } catch (e) {
            console.error("Error fetching addresses:", e);
          }

        } else {
          const userDoc = await getDoc(doc(db, "users", user.id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFormData(prev => ({
              ...prev,
              name: userData.name || userData.nombre || "",
              email: userData.email || userData.correo || user.email || "",
              phone: userData.phone || "",
              address: userData.address || "",
              birthdate: userData.birthday || userData.birthdate || "",
              notifications: {
                email: userData.notifications?.email ?? true,
                sms: userData.notifications?.sms ?? false,
                promotions: userData.notifications?.promotions ?? true
              }
            }));
            const addressesSnap = await getDocs(query(
              collection(db, "userAddresses"),
              where("userId", "==", user.id)
            ));
            const addressesData: SavedAddress[] = addressesSnap.docs.map(d => {
              const dta = d.data();
              return {
                id: d.id,
                name: dta.name || "",
                address: dta.address || "",
                city: dta.city || "",
                province: dta.province || "",
                postalCode: dta.postalCode || "",
                isDefault: !!dta.isDefault
              };
            });
            setSavedAddresses(addressesData);
            const ordersSnap = await getDocs(query(
              collection(db, "orders"),
              where("userId", "==", user.id),
              orderBy("createdAt", "desc"),
              limit(5)
            ));
            const ordersData: Order[] = ordersSnap.docs.map(d => {
              const data = d.data();
              return {
                id: d.id,
                date: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                total: parseFormattedPrice(data.total ?? 0),
                status: (data.status as Order['status']) || 'processing',
                items: Array.isArray(data.items) ? data.items : [],
                trackingNumber: data.trackingNumber
              };
            });
            setRecentOrders(ordersData);
          }
        }
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
        toast({
          title: "Error al cargar perfil",
          description: "No pudimos cargar tu información. Intenta de nuevo más tarde.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNotificationChange = (type: string, value: boolean) => {
    setFormData({
      ...formData,
      notifications: {
        ...formData.notifications,
        [type]: value
      }
    });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingAddress) {
      setEditingAddress({
        ...editingAddress,
        [e.target.name]: e.target.value
      });
    } else {
      setNewAddress({
        ...newAddress,
        [e.target.name]: e.target.value
      });
    }
  };

  const toggleDefaultAddress = () => {
    if (editingAddress) {
      setEditingAddress({
        ...editingAddress,
        isDefault: !editingAddress.isDefault
      });
    } else {
      setNewAddress({
        ...newAddress,
        isDefault: !newAddress.isDefault
      });
    }
  };

  const addNewAddress = async () => {
    if (!user) return;
    setAddressLoading(true);

    try {
      if (isSupabase) {
        // Si es dirección predeterminada, actualizar las demás primero
        if (newAddress.isDefault) {
          await (db as any)
            .from('user_addresses')
            .update({ is_default: false })
            .eq('user_id', user.id);
        }

        const { data, error } = await (db as any)
          .from('user_addresses')
          .insert([{
            user_id: user.id,
            name: newAddress.name,
            address: newAddress.address,
            city: newAddress.city,
            province: newAddress.province,
            postal_code: newAddress.postalCode,
            is_default: newAddress.isDefault
          }])
          .select();

        if (error) throw error;

        if (data && data[0]) {
          const added = data[0];
          setSavedAddresses([
            ...savedAddresses,
            {
              id: added.id,
              name: added.name,
              address: added.address,
              city: added.city,
              province: added.province,
              postalCode: added.postal_code,
              isDefault: added.is_default
            }
          ]);
        }
      } else {
        const addressRef = collection(db, "userAddresses");
        const newAddressData = {
          ...newAddress,
          userId: user.id,
          createdAt: Timestamp.now()
        };

        // Si es dirección predeterminada, actualizar las demás
        if (newAddress.isDefault) {
          const batch = writeBatch(db);
          const addressesQuery = query(
            collection(db, "userAddresses"),
            where("userId", "==", user.id),
            where("isDefault", "==", true)
          );
          const snapshot = await getDocs(addressesQuery);
          snapshot.forEach(doc => {
            batch.update(doc.ref, { isDefault: false });
          });
          await batch.commit();
        }

        // Añadir la nueva dirección
        const docRef = await addDoc(addressRef, newAddressData);

        // Actualizar la UI
        setSavedAddresses([
          ...savedAddresses,
          { id: docRef.id, ...newAddress }
        ]);
      }

      // Limpiar formulario
      setNewAddress({
        name: "",
        address: "",
        city: "",
        province: "",
        postalCode: "",
        isDefault: false
      });

      setAddingAddress(false);
      toast({
        title: "Dirección añadida",
        description: "Tu nueva dirección ha sido guardada correctamente."
      });
    } catch (error) {
      console.error("Error al añadir dirección:", error);
      toast({
        title: "Error",
        description: "No pudimos guardar tu nueva dirección.",
        variant: "destructive"
      });
    } finally {
      setAddressLoading(false);
    }
  };

  const updateSavedAddress = async () => {
    if (!user || !editingAddress) return;
    setAddressLoading(true);

    try {
      if (isSupabase) {
        // Si es dirección predeterminada, actualizar las demás primero
        if (editingAddress.isDefault) {
          await (db as any)
            .from('user_addresses')
            .update({ is_default: false })
            .eq('user_id', user.id);
        }

        const { error } = await (db as any)
          .from('user_addresses')
          .update({
            name: editingAddress.name,
            address: editingAddress.address,
            city: editingAddress.city,
            province: editingAddress.province,
            postal_code: editingAddress.postalCode,
            is_default: editingAddress.isDefault
          })
          .eq('id', editingAddress.id);

        if (error) throw error;
      } else {
        const addressRef = doc(db, "userAddresses", editingAddress.id);

        if (editingAddress.isDefault) {
          const batch = writeBatch(db);
          const addressesQuery = query(
            collection(db, "userAddresses"),
            where("userId", "==", user.id),
            where("isDefault", "==", true)
          );
          const snapshot = await getDocs(addressesQuery);
          snapshot.forEach(doc => {
            if (doc.id !== editingAddress.id) {
              batch.update(doc.ref, { isDefault: false });
            }
          });
          await batch.commit();
        }

        await updateDoc(addressRef, {
          name: editingAddress.name,
          address: editingAddress.address,
          city: editingAddress.city,
          province: editingAddress.province,
          postalCode: editingAddress.postalCode,
          isDefault: editingAddress.isDefault,
          updatedAt: Timestamp.now()
        });
      }

      // Actualizar UI
      setSavedAddresses(savedAddresses.map(addr =>
        addr.id === editingAddress.id ? editingAddress : addr
      ));

      setEditingAddress(null);
      toast({
        title: "Dirección actualizada",
        description: "Los cambios han sido guardados correctamente."
      });
    } catch (error) {
      console.error("Error al actualizar dirección:", error);
      toast({
        title: "Error",
        description: "No pudimos guardar los cambios de la dirección.",
        variant: "destructive"
      });
    } finally {
      setAddressLoading(false);
    }
  };

  const setAddressAsDefault = async (addressId: string) => {
    if (!user) return;
    setAddressLoading(true);

    try {
      if (isSupabase) {
        // Quitar predeterminado de todas
        await (db as any)
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);

        // Poner predeterminado a la elegida
        const { error } = await (db as any)
          .from('user_addresses')
          .update({ is_default: true })
          .eq('id', addressId);

        if (error) throw error;
      } else {
        // Quitar predeterminado de todas las direcciones
        const batch = writeBatch(db);
        const addressesQuery = query(
          collection(db, "userAddresses"),
          where("userId", "==", user.id)
        );
        const snapshot = await getDocs(addressesQuery);
        snapshot.forEach(doc => {
          batch.update(doc.ref, { isDefault: doc.id === addressId });
        });
        await batch.commit();
      }

      // Actualizar UI
      const updatedAddresses = savedAddresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      }));
      setSavedAddresses(updatedAddresses);

      toast({
        title: "Dirección actualizada",
        description: "Dirección predeterminada actualizada correctamente."
      });
    } catch (error) {
      console.error("Error al actualizar dirección:", error);
      toast({
        title: "Error",
        description: "No pudimos actualizar tu dirección predeterminada.",
        variant: "destructive"
      });
    } finally {
      setAddressLoading(false);
    }
  };

  const removeAddress = async (addressId: string) => {
    if (!user) return;
    setAddressLoading(true);

    try {
      if (isSupabase) {
        const { error } = await (db as any)
          .from('user_addresses')
          .delete()
          .eq('id', addressId);

        if (error) throw error;
      } else {
        await deleteDoc(doc(db, "userAddresses", addressId));
      }

      // Actualizar UI
      setSavedAddresses(savedAddresses.filter(addr => addr.id !== addressId));

      toast({
        title: "Dirección eliminada",
        description: "La dirección ha sido eliminada correctamente."
      });
    } catch (error) {
      console.error("Error al eliminar dirección:", error);
      toast({
        title: "Error",
        description: "No pudimos eliminar la dirección.",
        variant: "destructive"
      });
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isSupabase) {
        const success = await updateUser(formData);
        if (!success) throw new Error("Backend update failed");
      } else {
        await updateDoc(doc(db, "users", user.id), {
          name: formData.name,
          phone: formData.phone,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          address: formData.address,
          birthdate: formData.birthdate,
          preferences: formData.preferences,
          notifications: formData.notifications,
          updatedAt: new Date()
        });
        updateUser(formData); // Actualiza en el contexto
      }

      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido guardados correctamente."
      });
      setEditing(false);
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar tu perfil.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-amber-100 text-amber-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'En espera';
      case 'processing': return 'Procesando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return 'En espera';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="h-4 w-4" />;
      case 'pending': return <CustomClock className="h-4 w-4" />;
      case 'processing': return <CustomClock className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <CustomClock className="h-4 w-4" />;
    }
  };

  const sidebarItems = [
    { id: 'profile', label: 'Perfil', icon: UserIcon },
    { id: 'addresses', label: 'Direcciones', icon: MapPin },
    { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
    { id: 'logout', label: 'Salir', icon: X },
  ];

  const handleTabChange = async (tabId: string) => {
    if (tabId === 'logout') {
      try {
        await logout();
      } catch (e) {
        console.error('Logout error:', e);
      }
      navigate('/');
      return;
    }
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const tabLabel = sidebarItems.find(i => i.id === activeTab)?.label || '';

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans flex flex-col">
      <TopPromoBar setPromoVisible={setPromoVisible} />
      <AdvancedHeader
        categories={categories}
        selectedCategory="Todos"
        setSelectedCategory={() => { }}
        promoVisible={promoVisible}
        mainCategories={mainCategories}
        subcategoriesByParent={subcategoriesByParent}
        thirdLevelBySubcategory={thirdLevelBySubcategory}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-20">

        {/* Mobile: Back button + section title */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-gray-800 font-bold text-sm mb-3 hover:text-black transition-colors"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span className="underline underline-offset-2">Volver</span>
          </button>
          <h2 className="text-base font-black uppercase tracking-widest text-gray-900">{tabLabel}</h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* Sidebar - Desktop only */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden sticky top-24">
              <div className="bg-[#1a1a1a] p-5 text-center">
                <h3 className="text-white font-black text-lg uppercase tracking-[0.2em]">Hola!</h3>
              </div>

              <nav className="flex flex-col">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`flex items-center gap-4 px-6 py-4 text-sm font-bold border-l-4 transition-all uppercase tracking-wider ${isActive
                        ? 'bg-gray-50 border-gray-900 text-gray-900'
                        : 'bg-white border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <h2 className="hidden lg:block text-xl font-black text-gray-900 uppercase tracking-widest border-b-2 border-gray-100 pb-4">Perfil</h2>

                  <Card className="border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
                    <CardContent className="p-8 md:p-10">
                      <div className="relative group">
                        {editing ? (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nombre Completo</label>
                                <Input
                                  name="name"
                                  value={formData.name}
                                  onChange={handleChange}
                                  className="h-12 border-gray-100 focus:ring-black rounded-xl font-bold"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email (No editable)</label>
                                <Input
                                  value={user.email}
                                  disabled
                                  className="h-12 bg-gray-50 border-gray-100 rounded-xl font-bold text-gray-400"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Teléfono</label>
                                <Input
                                  name="phone"
                                  value={formData.phone}
                                  onChange={handleChange}
                                  className="h-12 border-gray-100 focus:ring-black rounded-xl font-bold"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fecha de Nacimiento</label>
                                <Input
                                  type="date"
                                  name="birthdate"
                                  value={formData.birthdate}
                                  onChange={handleChange}
                                  className="h-12 border-gray-100 focus:ring-black rounded-xl font-bold"
                                />
                              </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-4 border-t border-gray-50">
                              <Button
                                onClick={() => setEditing(false)}
                                variant="ghost"
                                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900"
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-black text-white hover:bg-gray-800 px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest"
                              >
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-4 text-gray-600">
                              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                                <span className="text-sm font-bold uppercase tracking-wider text-gray-400 min-w-[150px]">Email:</span>
                                <span className="text-sm font-black text-gray-900">{user.email}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                                <span className="text-sm font-bold uppercase tracking-wider text-gray-400 min-w-[150px]">Nombre:</span>
                                <span className="text-sm font-black text-gray-900">{formData.name || '-'}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                                <span className="text-sm font-bold uppercase tracking-wider text-gray-400 min-w-[150px]">Teléfono:</span>
                                <span className="text-sm font-black text-gray-900">{formData.phone || '-'}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                                <span className="text-sm font-bold uppercase tracking-wider text-gray-400 min-w-[150px]">Dirección:</span>
                                <span className="text-sm font-black text-gray-900">{formData.address || '-'}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => setEditing(true)}
                              className="absolute top-0 right-0 text-[10px] font-black uppercase tracking-widest text-gray-900 border-b-2 border-gray-900 hover:text-gray-500 hover:border-gray-500 transition-all pb-0.5"
                            >
                              Editar
                            </button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-100 pb-3">Boletín Informativo</h3>

                    <Card className="border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl">
                      <CardContent className="p-8">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 leading-relaxed">¿Quiere recibir boletines informativos promocionales?</p>
                        <div
                          className="flex items-center gap-4 group cursor-pointer"
                          onClick={() => handleNotificationChange('promotions', !formData.notifications.promotions)}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${formData.notifications.promotions ? 'bg-gray-900 border-gray-900' : 'border-gray-300 group-hover:border-gray-900'}`}>
                            {formData.notifications.promotions && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className="text-xs font-black text-gray-900 uppercase tracking-tight">Quiero recibir el boletín informativo con promociones.</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b-2 border-gray-100 pb-4">
                    <h2 className="hidden lg:block text-xl font-black text-gray-900 uppercase tracking-widest">Direcciones</h2>
                    {!addingAddress && (
                      <Button onClick={() => setAddingAddress(true)} className="bg-black text-white uppercase text-[10px] font-black tracking-widest px-6 h-9">Nueva Dirección</Button>
                    )}
                  </div>

                  {(addingAddress || editingAddress) && (
                    <Card className="border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden mb-8">
                      <CardHeader className="bg-gray-50/50 py-4 border-b border-gray-100">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">
                          {editingAddress ? 'Editar Dirección' : 'Añadir Nueva Dirección'}
                        </span>
                      </CardHeader>
                      <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Alias (Ej: Casa, Oficina)</label>
                            <Input
                              name="name"
                              value={editingAddress ? editingAddress.name : newAddress.name}
                              onChange={handleAddressChange}
                              className="h-12 border-gray-100 focus:ring-black rounded-xl font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Dirección</label>
                            <Input
                              name="address"
                              value={editingAddress ? editingAddress.address : newAddress.address}
                              onChange={handleAddressChange}
                              className="h-12 border-gray-100 focus:ring-black rounded-xl font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ciudad</label>
                            <Input
                              name="city"
                              value={editingAddress ? editingAddress.city : newAddress.city}
                              onChange={handleAddressChange}
                              className="h-12 border-gray-100 focus:ring-black rounded-xl font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Provincia</label>
                            <Input
                              name="province"
                              value={editingAddress ? editingAddress.province : newAddress.province}
                              onChange={handleAddressChange}
                              className="h-12 border-gray-100 focus:ring-black rounded-xl font-bold"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mb-8">
                          <Switch
                            checked={editingAddress ? editingAddress.isDefault : newAddress.isDefault}
                            onCheckedChange={toggleDefaultAddress}
                          />
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Establecer como predeterminada</span>
                        </div>
                        <div className="flex justify-end gap-4">
                          <Button
                            onClick={() => { setAddingAddress(false); setEditingAddress(null); }}
                            variant="ghost"
                            className="text-[10px] font-black uppercase tracking-widest text-gray-400"
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={editingAddress ? updateSavedAddress : addNewAddress}
                            disabled={addressLoading}
                            className="bg-black text-white px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest"
                          >
                            {addressLoading ? 'Guardando...' : (editingAddress ? 'Guardar Cambios' : 'Guardar Dirección')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedAddresses.map(addr => (
                      <Card key={addr.id} className="border border-gray-100 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow relative group">
                        <CardHeader className="bg-gray-50 py-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{addr.name}</span>
                            {addr.isDefault && <Badge className="bg-green-100 text-green-700 text-[8px] font-black uppercase tracking-widest">Predeterminada</Badge>}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6 pb-6 px-6">
                          <p className="text-sm font-bold text-gray-800 leading-relaxed mb-1">{addr.address}</p>
                          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{addr.city}, {addr.province}</p>

                          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingAddress(addr); setAddingAddress(false); }}
                              className="text-gray-300 hover:text-gray-900 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => removeAddress(addr.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {savedAddresses.length === 0 && (
                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-20 text-center">
                      <MapPin className="h-12 w-12 text-gray-100 mx-auto mb-4" />
                      <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">No tienes direcciones guardadas</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-8">
                  <h2 className="hidden lg:block text-xl font-black text-gray-900 uppercase tracking-widest border-b-2 border-gray-100 pb-4">Pedidos</h2>

                  {recentOrders.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-20 text-center">
                      <ShoppingBag className="h-12 w-12 text-gray-100 mx-auto mb-4" />
                      <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">No tienes pedidos aún</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {recentOrders.map((order) => (
                        <Card key={order.id} className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-all">
                          <div className="flex flex-col md:flex-row">
                            <div className="p-6 md:p-8 flex-1">
                              <div className="flex items-center justify-between mb-6">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Pedido #{order.id.substring(0, 8)}</span>
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                                  {getStatusIcon(order.status)}
                                  {getStatusText(order.status)}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-8">
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fecha</p>
                                  <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{format(order.date, 'dd/MM/yyyy')}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                                  <p className="text-sm font-black text-gray-900 uppercase tracking-tight">${order.total.toLocaleString('es-AR')}</p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 md:w-48 flex items-center justify-center border-t md:border-t-0 md:border-l border-gray-100">
                              <Button
                                variant="ghost"
                                onClick={() => { setViewingOrder(order); setIsDialogOpen(true); }}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-900 hover:bg-white w-full"
                              >
                                Ver Detalles
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Modal de Detalles del Pedido */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-0 shadow-2xl p-0">
          {viewingOrder && (
            <div className="flex flex-col">
              <div className="bg-[#1a1a1a] p-8 text-white relative">
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="absolute top-4 right-4 text-white/50 hover:text-white hover:bg-white/10 p-0 h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(viewingOrder.status)}`}>
                    {getStatusText(viewingOrder.status)}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Pedido #{viewingOrder.id.substring(0, 8)}</span>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Detalles del Pedido</h2>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-2">Realizado el {format(viewingOrder.date, 'dd/MM/yyyy HH:mm')}</p>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-100 pb-2">Productos ({Array.isArray(viewingOrder.items) ? viewingOrder.items.length : 0})</h3>
                    <div className="space-y-4">
                      {Array.isArray(viewingOrder.items) && viewingOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100/50 hover:bg-gray-50 transition-colors">
                          <div className="h-16 w-16 bg-white rounded-lg border border-gray-100 overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gray-50 p-4">
                                <Package className="text-gray-200" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-black text-gray-900 line-clamp-1">{item.name}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cantidad: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-gray-900">${(parseFormattedPrice(item.price) * item.quantity).toLocaleString('es-CO')}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${parseFormattedPrice(item.price).toLocaleString('es-CO')} c/u</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {viewingOrder.trackingNumber && (
                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50">
                      <div className="flex items-center gap-3 mb-2">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Información de Envío</span>
                      </div>
                      <p className="text-sm font-bold text-blue-900">Número de seguimiento: <span className="font-black selection:bg-blue-200">{viewingOrder.trackingNumber}</span></p>
                    </div>
                  )}

                  <div className="bg-gray-50 p-6 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-gray-500">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Resumen</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{Array.isArray(viewingOrder.items) ? viewingOrder.items.length : 0} Items</span>
                    </div>
                    <Separator className="bg-gray-200/50" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-gray-900 uppercase tracking-tighter">Total Pagado</span>
                      <span className="text-xl font-black text-gray-900">${viewingOrder.total.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <Button
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1 bg-black text-white hover:bg-gray-800 h-14 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
