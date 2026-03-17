import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, X, Mail, Lock } from 'lucide-react';
import { auth, supabase } from "@/firebase";

type LoginView = 'selection' | 'form' | 'forgot';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<LoginView>('selection');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [resetEmail, setResetEmail] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ email: '', password: '' });

    if (!loginData.email || !validateEmail(loginData.email)) {
      setErrors(prev => ({ ...prev, email: 'Email inválido' }));
      return;
    }
    if (!loginData.password || loginData.password.length < 6) {
      setErrors(prev => ({ ...prev, password: 'Contraseña debe tener al menos 6 caracteres' }));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });
      if (error) throw error;
      toast({ title: "¡Bienvenido!", description: "Sesión iniciada correctamente" });
      navigate('/');
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo iniciar sesión", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    try {
      const { error } = await auth.signInWithOAuth({
        provider,
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !validateEmail(resetEmail)) {
      toast({ title: "Email inválido", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await auth.resetPasswordForEmail(resetEmail);
      if (error) throw error;
      toast({ title: "Email enviado", description: "Revisa tu bandeja de entrada" });
      setView('selection');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[850px] min-h-[420px] overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in-95 duration-300">

        {/* Botón Cerrar */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-all z-20 bg-gray-50 hover:bg-gray-100 rounded-full p-2"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lado Izquierdo (Decorativo - Vacío como en la imagen) */}
        <div className="hidden md:flex md:w-[45%] bg-slate-50 border-r border-gray-100 p-12 items-center justify-center">
          <div className="opacity-10 grayscale">
            <img src="/logo.webp" alt="" className="w-32" />
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="w-full md:w-[55%] p-8 md:p-14 flex flex-col justify-center bg-white">
          {view === 'selection' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h1 className="text-[28px] font-black text-gray-900 tracking-tight mb-2">Iniciar sesión</h1>
                <p className="text-[14px] text-gray-500 font-medium">Elige alguna de las opciones para confirmar tu identidad</p>
              </div>

              <div className="flex flex-col gap-3">
                {/* Botón Google */}
                <button
                  onClick={() => handleOAuth('google')}
                  disabled={isLoading}
                  className="w-full group flex items-center justify-center gap-4 px-6 py-4 border-2 border-gray-100 rounded-2xl hover:border-gray-900 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <svg className="w-5 h-5 group-hover:drop-shadow-sm transition-all" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-[13px] font-bold text-gray-700 group-hover:text-gray-900">Ingresa con tu cuenta de Google</span>
                </button>


                {/* Botón Password */}
                <button
                  onClick={() => setView('form')}
                  className="w-full group flex items-center justify-center gap-4 px-6 py-4 border-2 border-gray-100 rounded-2xl hover:border-gray-900 transition-all active:scale-[0.98]"
                >
                  <Lock className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-all" />
                  <span className="text-[13px] font-bold text-gray-700 group-hover:text-gray-900">Ingresa con email y contraseña</span>
                </button>
              </div>
            </div>
          )}

          {view === 'form' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <button onClick={() => setView('selection')} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all mb-4">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>

              <div>
                <h2 className="text-[24px] font-black text-gray-900 tracking-tight">Tus credenciales</h2>
                <p className="text-[13px] text-gray-500 font-medium">Ingresa los datos de tu cuenta Yamaha</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <Input
                      type="email"
                      placeholder="ejemplo@mail.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="h-12 pl-12 rounded-xl border-gray-200 focus:ring-black"
                    />
                  </div>
                  {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Contraseña</label>
                    <button type="button" onClick={() => setView('forgot')} className="text-[10px] text-gray-400 hover:text-black font-bold uppercase tracking-wider">Olvidé mi clave</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="h-12 pl-12 pr-12 rounded-xl border-gray-200 focus:ring-black"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{errors.password}</p>}
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black shadow-xl shadow-gray-200 transition-all active:scale-[0.98]">
                  {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </div>
          )}

          {view === 'forgot' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <button onClick={() => setView('form')} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all mb-4">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>

              <div>
                <h2 className="text-[24px] font-black text-gray-900 tracking-tight">Recuperar cuenta</h2>
                <p className="text-[13px] text-gray-500 font-medium">Te enviaremos un enlace para restablecer tu clave</p>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Email</label>
                  <Input
                    type="email"
                    placeholder="ejemplo@mail.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="h-12 rounded-xl border-gray-200 focus:ring-black"
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all">
                  {isLoading ? '...' : 'Enviar correo'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
