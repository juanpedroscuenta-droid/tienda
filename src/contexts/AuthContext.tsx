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

    const applySession = async (supabaseUser: any) => {
      if (!mounted) return;
      await handleAuthStateChange(supabaseUser);
    };

    auth.getSession()
      .then(({ data: { session } }) => session?.user || null)
      .then(user => { if (mounted) applySession(user); })
      .catch(() => { if (mounted) setLoading(false); });

    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      await applySession(session?.user || null);
    });

    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, []);

  const handleAuthStateChange = async (supabaseUser: any) => {
    setCurrentUser(supabaseUser);
    if (supabaseUser) {
      const baseUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || "Usuario",
        departmentNumber: "",
        phone: supabaseUser.user_metadata?.phone || "",
        address: supabaseUser.user_metadata?.address || "",
        isAdmin: supabaseUser.email === "admin@gmail.com" || supabaseUser.email === "admin@tienda.com",
        subCuenta: supabaseUser.user_metadata?.sub_cuenta || undefined,
        liberta: undefined as string | undefined,
      };
      setUser(baseUser);

      try {
        const { data: sessionData } = await auth.getSession();
        const token = sessionData?.session?.access_token;

        const response = await fetch(`${API_BASE_URL}/users/${supabaseUser.id}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (response.ok) {
          const dbData = await response.json();
          console.log("User data fetched from backend:", dbData);
          if (dbData) {
            setUser(prev => {
              const updated = prev ? {
                ...prev,
                ...dbData, // Spread all data from DB
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
      } catch (e) {
        console.error("Error fetching user data from backend:", e);
      }
      setLoading(false);
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
    await auth.signOut();
    setUser(null);
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
