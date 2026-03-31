import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type RegisterStep = 'personal' | 'account' | 'verification';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
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
      if (!registerData.name.trim()) newErrors.name = 'El nombre es requerido';
      if (!registerData.email || !validateEmail(registerData.email)) newErrors.email = 'Email inválido';
      if (!registerData.phone || !validatePhoneNumber(registerData.phone)) newErrors.phone = 'Teléfono debe tener entre 8 y 15 dígitos';

      if (newErrors.name || newErrors.email || newErrors.phone) {
        setErrors(newErrors);
        return;
      }
      setRegisterStep('account');
    } else if (registerStep === 'account') {
      if (!registerData.password || !validatePassword(registerData.password)) newErrors.password = 'Contraseña debe tener al menos 6 caracteres';
      if (registerData.password !== registerData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';

      if (newErrors.password || newErrors.confirmPassword) {
        setErrors(newErrors);
        return;
      }
      setRegisterStep('verification');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerData.acceptTerms) {
      setErrors(prev => ({ ...prev, acceptTerms: 'Debes aceptar los términos' }));
      return;
    }

    setIsLoading(true);
    try {
      const success = await register({
        email: registerData.email,
        password: registerData.password,
        name: registerData.name,
        phone: registerData.phone,
        address: registerData.address
      });

      if (success) {
        toast({ title: "¡Epa!", description: "Registro completado. Ahora puedes iniciar sesión." });
        navigate('/login');
      } else {
        throw new Error("No se pudo completar el registro");
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
      <div className="bg-white rounded-[10px] shadow-2xl w-full max-w-[820px] min-h-[420px] overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in-95 duration-200">

        <button onClick={() => navigate('/')} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-30 bg-gray-50 rounded-full p-1">
          <X className="w-5 h-5" />
        </button>

        <div className="hidden md:flex md:w-[40%] bg-white items-center justify-center p-8 border-r border-gray-50">
          <div className="w-full h-full flex items-center justify-center opacity-10 grayscale">
            <img src="/logo.webp" alt="" className="w-32" />
          </div>
        </div>

        <div className="w-full md:w-[60%] p-8 md:p-12 flex flex-col justify-center bg-white relative">
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

            {registerStep === 'account' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#333] block">Contraseña:</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="w-full border-gray-300 rounded-[5px] h-11 px-4 text-[14px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#333] block">Confirmar:</label>
                    <Input
                      type="password"
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

            {registerStep === 'verification' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-[13px] text-gray-600 space-y-1">
                  <p><strong>Dato:</strong> {registerData.name}</p>
                  <p><strong>Email:</strong> {registerData.email}</p>
                  <p><strong>Telf:</strong> {registerData.phone}</p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox checked={registerData.acceptTerms} onCheckedChange={(c) => setRegisterData({ ...registerData, acceptTerms: c as boolean })} className="mt-0.5" />
                    <span className="text-[12px] text-gray-600">Acepto los términos y condiciones del servicio</span>
                  </label>
                  {errors.acceptTerms && <p className="text-red-500 text-[11px] font-medium">{errors.acceptTerms}</p>}
                </div>
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
