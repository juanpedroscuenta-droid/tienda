import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { User, Mail, Lock, Phone, Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { auth, db } from "@/firebase";

type RegisterStep = 'personal' | 'account' | 'verification';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registerStep, setRegisterStep] = useState<RegisterStep>('personal');

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    acceptTerms: false
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: ''
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validatePhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: ''
    };

    if (registerStep === 'personal') {
      if (!registerData.name.trim()) {
        newErrors.name = 'El nombre es requerido';
      }

      if (!registerData.email || !validateEmail(registerData.email)) {
        newErrors.email = 'Email inválido';
      }

      if (!registerData.phone || !validatePhoneNumber(registerData.phone)) {
        newErrors.phone = 'Teléfono debe tener entre 8 y 15 dígitos';
      }

      if (newErrors.name || newErrors.email || newErrors.phone) {
        setErrors(newErrors);
        return;
      }

      setRegisterStep('account');
    } else if (registerStep === 'account') {
      if (!registerData.password || !validatePassword(registerData.password)) {
        newErrors.password = 'Contraseña debe tener al menos 6 caracteres';
      }

      if (registerData.password !== registerData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }

      if (newErrors.password || newErrors.confirmPassword) {
        setErrors(newErrors);
        return;
      }

      setRegisterStep('verification');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = { ...errors };

    if (!registerData.acceptTerms) {
      newErrors.acceptTerms = 'Debes aceptar los términos y condiciones';
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Create user with Supabase auth (including name and metadata)
      const { data: authData, error: authError } = await auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.name,
            phone: registerData.phone,
            address: registerData.address
          }
        }
      });

      if (authError) throw authError;

      // Sync with backend immediately if auth succeeded
      if (authData.user) {
        try {
          const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:3001/api';
          await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: authData.user.id,
              email: registerData.email,
              name: registerData.name,
              phone: registerData.phone,
              address: registerData.address
            })
          });
        } catch (syncError) {
          console.warn("Backend sync failed on registration:", syncError);
          // Don't fail the whole registration if sync fails
        }
      }

      // If we don't have a session, it might be because email confirmation is required
      let session = authData.session;

      if (!session) {
        // Try to sign in immediately (works if email confirmation is disabled)
        try {
          const { data: signInData } = await auth.signInWithPassword({
            email: registerData.email,
            password: registerData.password
          });
          session = signInData.session;
        } catch (err) {
          // Silent fail - likely email confirmation is actually required
        }
      }

      if (session) {
        toast({
          title: "¡Registro exitoso!",
          description: "Bienvenido, tu sesión ha iniciado automáticamente.",
        });
        setTimeout(() => navigate('/'), 1000);
      } else {
        toast({
          title: "¡Ya casi estás!",
          description: "Te hemos enviado un correo de confirmación. Por favor verifícalo para entrar.",
        });
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error: any) {
      toast({
        title: "Error en el registro",
        description: error.message || "No se pudo completar el registro",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] overflow-y-auto backdrop-blur-[1px]">
      {/* Landscape Modal Content - Yamaha Style (Register) */}
      <div className="bg-white rounded-[10px] shadow-2xl w-full max-w-[820px] min-h-[420px] overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in-95 duration-200">

        {/* Close Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-30 bg-gray-50 rounded-full p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side - Space to give it the landscape look */}
        <div className="hidden md:flex md:w-[40%] bg-white items-center justify-center p-8 border-r border-gray-50">
          <div className="w-full h-full flex items-center justify-center opacity-10">
            {/* Optional logo or decoration */}
          </div>
        </div>

        {/* Right Side - Form Content */}
        <div className="w-full md:w-[60%] p-8 md:p-12 flex flex-col justify-center bg-white relative">

          {/* Progress Indicator Dots */}
          <div className="flex gap-2 mb-6">
            <div className={`h-1.5 w-8 rounded-full transition-all ${registerStep === 'personal' ? 'bg-[#333]' : 'bg-gray-200'}`} />
            <div className={`h-1.5 w-8 rounded-full transition-all ${registerStep === 'account' ? 'bg-[#333]' : 'bg-gray-200'}`} />
            <div className={`h-1.5 w-8 rounded-full transition-all ${registerStep === 'verification' ? 'bg-[#333]' : 'bg-gray-200'}`} />
          </div>

          <div className="mb-6">
            <h1 className="text-[22px] font-bold text-[#333] mb-2">Crear cuenta</h1>
            <p className="text-[14px] leading-relaxed text-[#666]">
              {registerStep === 'personal' && 'Completa tu información personal'}
              {registerStep === 'account' && 'Configura tus credenciales'}
              {registerStep === 'verification' && 'Verifica los datos e ingresa'}
            </p>
          </div>

          <form onSubmit={registerStep === 'verification' ? handleRegister : handleNextStep} className="space-y-4">
            {/* Step 1: Personal Info */}
            {registerStep === 'personal' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#333] block">Nombre completo:</label>
                  <Input
                    placeholder="Tu nombre"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="w-full border-gray-300 rounded-[5px] h-11 px-4 text-[14px]"
                  />
                  {errors.name && <p className="text-red-500 text-[11px] font-medium">{errors.name}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#333] block">Email:</label>
                    <Input
                      placeholder="tu@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="w-full border-gray-300 rounded-[5px] h-11 px-4 text-[14px]"
                    />
                    {errors.email && <p className="text-red-500 text-[11px] font-medium">{errors.email}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#333] block">Teléfono:</label>
                    <Input
                      placeholder="Ej: 12345678"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      className="w-full border-gray-300 rounded-[5px] h-11 px-4 text-[14px]"
                    />
                    {errors.phone && <p className="text-red-500 text-[11px] font-medium">{errors.phone}</p>}
                  </div>
                </div>
                <div className="pt-4 flex items-center justify-between border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => navigate('/login')} className="text-[13px] text-[#333] font-bold underline">Ya tengo cuenta</button>
                  <Button type="submit" className="bg-[#333] hover:bg-black text-white rounded-[5px] h-11 px-8 text-[13px] font-bold uppercase transition-all">Siguiente</Button>
                </div>
              </div>
            )}

            {/* Step 2: Account */}
            {registerStep === 'account' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#333] block">Contraseña:</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="w-full border-gray-300 rounded-[5px] h-11 px-4 text-[14px]"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#333] block">Confirmar:</label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="w-full border-gray-300 rounded-[5px] h-11 px-4 text-[14px]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#333] block">Dirección:</label>
                  <Input
                    placeholder="Tu dirección"
                    value={registerData.address}
                    onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                    className="w-full border-gray-300 rounded-[5px] h-11 px-4 text-[14px]"
                  />
                </div>
                <div className="pt-4 flex items-center justify-between border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => setRegisterStep('personal')} className="text-[13px] text-[#333] hover:underline flex items-center gap-2">Atrás</button>
                  <Button type="submit" className="bg-[#333] hover:bg-black text-white rounded-[5px] h-11 px-8 text-[13px] font-bold uppercase transition-all">Siguiente</Button>
                </div>
              </div>
            )}

            {/* Step 3: Verification */}
            {registerStep === 'verification' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-[13px] text-gray-600 space-y-1">
                  <p><strong>Dato:</strong> {registerData.name}</p>
                  <p><strong>Email:</strong> {registerData.email}</p>
                  <p><strong>Telf:</strong> {registerData.phone}</p>
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox checked={registerData.acceptTerms} onCheckedChange={(c) => setRegisterData({ ...registerData, acceptTerms: c as boolean })} className="mt-0.5" />
                  <span className="text-[12px] text-gray-600">Acepto los términos y condiciones del servicio</span>
                </label>
                <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                  <button type="button" onClick={() => setRegisterStep('account')} className="text-[13px] text-[#333] hover:underline">Atrás</button>
                  <Button type="submit" disabled={isLoading} className="bg-[#333] hover:bg-black text-white rounded-[5px] h-11 px-10 text-[14px] font-bold uppercase transition-all">Finalizar</Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
