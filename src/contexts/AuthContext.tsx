import { auth, db, sendWelcomeEmail } from "@/firebase";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  departmentNumber: string;
  phone: string;
  address: string;
  isAdmin: boolean;
  subCuenta?: string;
  liberta?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  birthdate?: string;
  preferences?: string;
  notifications?: {
    email: boolean;
    sms: boolean;
    promotions: boolean;
  };
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

interface AuthContextType {
  user: User | null;
  currentUser: any;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'isAdmin'> & { password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    console.log('🔵 [AUTH] useEffect iniciado — pidiendo sesión a Supabase...');

    const applySession = async (supabaseUser: any) => {
      if (!mounted) return;
      console.log('🔵 [AUTH] applySession llamado, usuario:', supabaseUser?.email || 'ninguno');
      await handleAuthStateChange(supabaseUser);
    };

    auth.getSession()
      .then(({ data: { session } }) => {
        console.log('🟢 [AUTH] getSession OK — sesión:', session ? `usuario ${session.user?.email}` : 'sin sesión');
        return session?.user || null;
      })
      .then(user => { if (mounted) applySession(user); })
      .catch((err) => {
        console.error('🔴 [AUTH] getSession FALLÓ:', err);
        if (mounted) setLoading(false);
      });

    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('🔵 [AUTH] onAuthStateChange evento:', event, '| usuario:', session?.user?.email || 'ninguno');
      if (!mounted) return;
      await applySession(session?.user || null);
    });

    const timeout = setTimeout(() => {
      console.warn('⏰ [AUTH] TIMEOUT 5s — forzando setLoading(false). Si ves esto, Supabase no respondió.');
      if (mounted) setLoading(false);
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, []);

  const handleAuthStateChange = async (supabaseUser: any) => {
    console.log('🔵 [AUTH] handleAuthStateChange — usuario:', supabaseUser?.email || 'null');
    setCurrentUser(supabaseUser);
    if (supabaseUser) {
      const isAdmin = supabaseUser.email === "admin@gmail.com" || supabaseUser.email === "admin@tienda.com";
      console.log('🟢 [AUTH] Usuario autenticado. isAdmin:', isAdmin, '| subCuenta:', supabaseUser.user_metadata?.sub_cuenta);
      const baseUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || "Usuario",
        departmentNumber: "",
        phone: supabaseUser.user_metadata?.phone || "",
        address: supabaseUser.user_metadata?.address || "",
        isAdmin,
        subCuenta: supabaseUser.user_metadata?.sub_cuenta || undefined,
        liberta: undefined as string | undefined,
      };
      setUser(baseUser);
      console.log('✅ [AUTH] setUser(baseUser) llamado — llamando setLoading(false) AHORA');
      // ✅ Liberar la pantalla de carga INMEDIATAMENTE con los datos básicos de Supabase
      // El fetch al backend enriquece los datos en segundo plano sin bloquear la UI
      setLoading(false);
      console.log('✅ [AUTH] setLoading(false) ejecutado — el panel debería mostrarse ya');

      // Enriquecer datos desde el backend en segundo plano (sin bloquear)
      try {
        const { data: sessionData } = await auth.getSession();
        const token = sessionData?.session?.access_token;

        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 5000); // timeout 5s

        const response = await fetch(`${API_BASE_URL}/users/${supabaseUser.id}`, {
          signal: controller.signal,
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        clearTimeout(fetchTimeout);

        if (response.ok) {
          const dbData = await response.json();
          console.log("User data fetched from backend:", dbData);
          if (dbData) {
            setUser(prev => {
              const updated = prev ? {
                ...prev,
                ...dbData,
                name: dbData.name || dbData.nombre || prev.name,
                phone: dbData.phone || dbData.telefono || prev.phone,
                address: dbData.address || dbData.direccion || prev.address,
                city: dbData.city || prev.city || "",
                province: dbData.province || prev.province || "",
                postalCode: dbData.postal_code || dbData.postalCode || prev.postalCode || "",
                birthdate: dbData.birthdate || prev.birthdate || "",
                preferences: dbData.preferences || prev.preferences || "",
                notifications: dbData.notifications || prev.notifications || { email: true, sms: false, promotions: true },
                subCuenta: dbData.sub_cuenta || dbData.subCuenta || prev.subCuenta,
                liberta: dbData.liberta || prev.liberta
              } : prev;
              console.log("Updated user state:", updated);
              return updated;
            });
          }
        } else {
          console.warn("Failed to fetch user data from backend:", response.status);
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          console.warn("Backend fetch timeout – usando datos de Supabase solamente");
        } else {
          console.error("Error fetching user data from backend:", e);
        }
      }
    } else {
      setUser(null);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await auth.signInWithPassword({ email, password });
      if (error) throw error;
      return !!data.user;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (userData: Omit<User, 'id' | 'isAdmin'> & { password: string }): Promise<boolean> => {
    try {
      const { data, error: signupError } = await auth.signUp({
        email: userData.email,
        password: userData.password,
        options: { data: { name: userData.name } }
      });

      if (signupError) throw signupError;
      if (!data.user) throw new Error('No user returned from signup');

      // Backend record creation will be handled by Supabase trigger or a separate API call here if needed
      // For now, we rely on the backend to handle user persistence on signup if configured

      try {
        await sendWelcomeEmail(userData.email, userData.name || userData.email.split('@')[0]);
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
      }
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user?.id) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        setUser(prev => prev ? { ...prev, ...userData } : prev);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating user:", error);
      return false;
    }
  };

  const logout = async () => {
    console.log("⚠️ Iniciando proceso de cierre de sesión...");

    // Establecer un timeout de seguridad para forzar la recarga si algo se cuelga
    const safetyTimeout = setTimeout(() => {
      console.log("⏰ Timeout de seguridad: Forzando recarga...");
      window.location.href = '/';
    }, 3000);

    try {
      // 1. Limpieza de estado React
      setLoading(true);
      setUser(null);
      setCurrentUser(null);

      // 2. Firmar salida de Supabase (sin esperar indefinidamente)
      console.log("⏳ Notificando al servidor...");
      try {
        // Intentamos el signOut pero con un límite de tiempo
        await Promise.race([
          auth.signOut(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Supabase')), 1500))
        ]).catch(err => console.log("Supabase signOut result:", err.message));
      } catch (e) {
        console.warn("Error silenciado en signOut:", e);
      }

      // 3. Limpieza manual del Storage (usando Object.keys para evitar problemas de índice dinámico)
      console.log("🧹 Limpiando almacenamiento local...");
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        const lowerKey = key.toLowerCase();
        if (
          key.startsWith('sb-') ||
          lowerKey.includes('auth-token') ||
          lowerKey.includes('fuego_user_data') ||
          lowerKey.includes('supabase.auth') ||
          key === 'user' ||
          key === 'token'
        ) {
          // NO BORRAR chatbot_config ni settings similares
          if (!lowerKey.includes('chatbot')) {
            localStorage.removeItem(key);
          }
        }
      });

      sessionStorage.clear();

      // 4. Limpieza de cookies
      console.log("🍪 Limpiando cookies...");
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      console.log("✅ Cierre de sesión satisfactorio. Redirigiendo...");
      clearTimeout(safetyTimeout);

      // 5. Redirección final
      window.location.href = '/';

    } catch (error) {
      console.error("❌ Error crítico en logout:", error);
      clearTimeout(safetyTimeout);
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, currentUser, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
