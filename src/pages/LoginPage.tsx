import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, X, AlertTriangle } from 'lucide-react';
import { auth } from "@/firebase";
import { useEffect } from 'react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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

    const newErrors = {
      email: '',
      password: ''
    };

    if (!loginData.email || !validateEmail(loginData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!loginData.password || loginData.password.length < 6) {
      newErrors.password = 'Contraseña debe tener al menos 6 caracteres';
    }

    if (newErrors.email || newErrors.password) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (error) throw error;

      toast({
        title: "¡Bienvenido!",
        description: "Sesión iniciada correctamente",
      });

      setIsLoading(false);
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error de login",
        description: error.message || "No se pudo iniciar sesión",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail || !validateEmail(resetEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await auth.resetPasswordForEmail(resetEmail);

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "Revisa tu email para restablecer tu contraseña",
      });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // No force background, we want to see the page behind
    return () => { };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] overflow-y-auto backdrop-blur-[1px]">
      {/* Landscape Modal Content - Yamaha Style (Reduced Height) */}
      <div className="bg-white rounded-[10px] shadow-2xl w-full max-w-[820px] min-h-[350px] overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in-95 duration-200">

        {/* Close Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-20 bg-gray-50 rounded-full p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side - Space to give it the landscape look */}
        <div className="hidden md:flex md:w-[45%] bg-white items-center justify-center p-4 border-r border-gray-50">
          <div className="w-full h-full flex items-center justify-center opacity-10">
            {/* You could put a logo here if desired, but image shows white/empty */}
          </div>
        </div>

        {/* Right Side - Form Content */}
        <div className="w-full md:w-[55%] p-6 md:px-12 md:py-8 flex flex-col justify-center bg-white">
          {!showForgotPassword ? (
            <>
              <div className="mb-6">
                <h1 className="text-[22px] font-bold text-[#333] mb-4">Iniciar sesión</h1>
                <p className="text-[14px] leading-relaxed text-[#555]">
                  Elige alguna de las opciones para confirmar tu identidad
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-[13px] font-bold text-[#333] block">
                    Email:
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ej.: ejemplo@mail.com"
                    value={loginData.email}
                    onChange={(e) => {
                      setLoginData({ ...loginData, email: e.target.value });
                      setErrors({ ...errors, email: '' });
                    }}
                    className="w-full border-gray-300 rounded-[5px] focus:ring-1 focus:ring-black h-11 px-4 text-[14px] placeholder:text-gray-300"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-[13px] font-bold text-[#333] block">
                    Contraseña:
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ingrese su contraseña"
                      value={loginData.password}
                      onChange={(e) => {
                        setLoginData({ ...loginData, password: e.target.value });
                        setErrors({ ...errors, password: '' });
                      }}
                      className="w-full border-gray-300 rounded-[5px] focus:ring-1 focus:ring-black h-11 px-4 pr-12 text-[14px] placeholder:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-800"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Reset & Register Links (Top right of the button area) */}
                <div className="flex flex-col items-end space-y-1 pt-1 opacity-80">
                  <button type="button" onClick={() => setShowForgotPassword(true)} className="text-[11px] text-[#666] hover:underline">
                    Olvidé mi contraseña
                  </button>
                  <button type="button" onClick={() => navigate('/register')} className="text-[12px] text-[#333] font-bold underline decoration-1 underline-offset-4">
                    Registrarme
                  </button>
                </div>

                {/* Action Block - Horizontal */}
                <div className="pt-6 flex items-center justify-between border-t border-gray-100 mt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-[13px] text-[#333] hover:underline flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Volver
                  </button>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#333] hover:bg-black text-white rounded-[5px] h-12 px-10 text-[14px] font-bold uppercase tracking-widest transition-all"
                  >
                    {isLoading ? '...' : 'INGRESAR'}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-[22px] font-bold text-[#333] mb-2 text-center md:text-left">Restablecer contraseña</h1>
              </div>
              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="reset-email" className="text-[13px] font-bold text-[#333] block">Email:</label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="ejemplo@mail.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full border-gray-300 rounded-[5px] h-11 text-[14px]"
                  />
                </div>
                <div className="pt-6 flex items-center justify-between">
                  <button type="button" onClick={() => setShowForgotPassword(false)} className="text-[13px] text-[#333] hover:underline">Cancelar</button>
                  <Button type="submit" disabled={isLoading} className="bg-[#333] hover:bg-black text-white rounded-[5px] h-12 px-10 text-[14px] font-bold uppercase tracking-widest">ENVIAR</Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
