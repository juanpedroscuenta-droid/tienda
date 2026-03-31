import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import {
  User, Mail, Lock, Phone, Eye, EyeOff, AlertCircle,
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, Home
} from 'lucide-react';
import { auth, db } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification
} from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";

type RegisterStep = 'personal' | 'account' | 'verification';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">(
    searchParams.get('tab') === 'register' ? 'register' : 'login'
  );
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [registerStep, setRegisterStep] = useState<RegisterStep>('personal');

  // Form validation states
  const [errors, setErrors] = useState({
    loginEmail: '',
    loginPassword: '',
    registerName: '',
    registerEmail: '',
    registerPhone: '',
    registerPassword: '',
    resetEmail: ''
  });

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    acceptTerms: false
  });

  const [resetPasswordEmail, setResetPasswordEmail] = useState('');

  const handleQuickAdminLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, 'admin@gmail.com', 'admin123');
      toast({
        title: "¡Acceso de administrador!",
        description: "Bienvenido al panel de administración",
      });
      setTimeout(() => {
        navigate('/admin');
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo acceder como administrador",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };

  const validatePhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
  };

  // Handle login with email and password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrors({
      ...errors,
      loginEmail: '',
      loginPassword: ''
    });

    let hasErrors = false;

    if (!validateEmail(loginData.email)) {
      setErrors(prev => ({ ...prev, loginEmail: 'Ingresa un email válido' }));
      hasErrors = true;
    }

    if (!loginData.password) {
      setErrors(prev => ({ ...prev, loginPassword: 'La contraseña es obligatoria' }));
      hasErrors = true;
    }

    if (hasErrors) return;

    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', loginData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
      });
      navigate('/');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setErrors(prev => ({ ...prev, loginEmail: 'No existe una cuenta con este email' }));
      } else if (error.code === 'auth/wrong-password') {
        setErrors(prev => ({ ...prev, loginPassword: 'Contraseña incorrecta' }));
      } else if (error.code === 'auth/too-many-requests') {
        toast({
          title: "Demasiados intentos",
          description: "Has realizado demasiados intentos fallidos. Prueba más tarde o restablece tu contraseña.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo iniciar sesión. Verifica tus credenciales.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrors({
      ...errors,
      resetEmail: ''
    });

    if (!validateEmail(resetPasswordEmail)) {
      setErrors(prev => ({ ...prev, resetEmail: 'Ingresa un email válido' }));
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, resetPasswordEmail);
      toast({
        title: "Correo enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña",
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setErrors(prev => ({ ...prev, resetEmail: 'No existe una cuenta con este email' }));
      } else {
        toast({
          title: "Error",
          description: "No se pudo enviar el correo de recuperación",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle register
  const validateRegisterForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    if (registerStep === 'personal') {
      if (!registerData.name.trim()) {
        newErrors.registerName = 'El nombre es obligatorio';
        isValid = false;
      } else if (registerData.name.length < 3) {
        newErrors.registerName = 'El nombre debe tener al menos 3 caracteres';
        isValid = false;
      }

      if (!validatePhoneNumber(registerData.phone)) {
        newErrors.registerPhone = 'Teléfono debe tener entre 8 y 15 dígitos';
        isValid = false;
      }
    }

    if (registerStep === 'account') {
      if (!validateEmail(registerData.email)) {
        newErrors.registerEmail = 'Ingresa un email válido';
        isValid = false;
      }

      if (!validatePassword(registerData.password)) {
        newErrors.registerPassword = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número';
        isValid = false;
      } else if (registerData.password !== registerData.confirmPassword) {
        newErrors.registerPassword = 'Las contraseñas no coinciden';
        isValid = false;
      }

      if (!registerData.acceptTerms) {
        toast({
          title: "Términos y condiciones",
          description: "Debes aceptar los términos y condiciones para continuar",
          variant: "destructive",
        });
        isValid = false;
      }
    }

    setErrors({ ...newErrors });
    return isValid;
  };

  const advanceRegisterStep = () => {
    if (!validateRegisterForm()) return;

    if (registerStep === 'personal') {
      setRegisterStep('account');
    } else if (registerStep === 'account') {
      handleRegisterSubmit();
    }
  };

  const handleRegisterSubmit = async () => {
    setIsLoading(true);

    const { email, password, name, phone, address } = registerData;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name,
        email,
        phone,
        address: address || '',
        createdAt: new Date(),
        emailVerified: true
      });

      toast({
        title: "¡Cuenta creada!",
        description: "¡Bienvenido a nuestra tienda!",
      });

      setRegisterStep('verification');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrors(prev => ({ ...prev, registerEmail: 'Este email ya está en uso' }));
        setRegisterStep('account');
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear tu cuenta. Intenta nuevamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    advanceRegisterStep();
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setLoginData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Lado izquierdo - Imagen */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white w-full">
          <div className="mb-8 text-center">
            <h1 className="text-6xl font-black mb-4 drop-shadow-lg">TIENDA 24-7</h1>
            <p className="text-2xl text-orange-100 font-medium">Tu tienda online de confianza</p>
          </div>
          <div className="w-full max-w-lg mb-8 flex items-center justify-center">
            <div className="relative w-full aspect-square max-w-md">
              <img
                src="/logo-nuevo.png"
                alt="TIENDA 24-7 Logo"
                className="w-full h-full object-contain drop-shadow-2xl"
                onError={(e) => {
                  // Si no hay imagen, ocultar y mostrar texto alternativo
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><div class="text-6xl font-black text-white/80">RA</div></div>';
                  }
                }}
              />
            </div>
          </div>
          <div className="mt-4 text-center max-w-md">
            <p className="text-xl text-orange-100 font-light leading-relaxed">
              Encuentra los mejores productos para tu hogar con envíos rápidos y los mejores precios
            </p>
          </div>
        </div>
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl -ml-64 -mb-64"></div>
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-2xl"></div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-start justify-center pt-12 md:pt-16 lg:pt-20 p-6 md:p-12 bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="w-full max-w-md">
          {/* Botón para volver al inicio - solo visible en móvil */}
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 lg:hidden text-orange-600 hover:text-orange-700"
          >
            <Home className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>

          {/* Card principal */}
          <Card className="shadow-2xl border-0 overflow-hidden">
            <div className="gradient-orange h-2"></div>

            <CardHeader className="bg-gradient-to-r from-orange-50 to-white pb-4">
              <CardTitle className="text-3xl md:text-4xl font-bold text-center gradient-text-orange">
                Bienvenido a TIENDA 24-7
              </CardTitle>
              <p className="text-center text-gray-600 mt-2">
                {showForgotPassword
                  ? 'Recupera tu contraseña'
                  : registerStep === 'verification'
                    ? '¡Cuenta creada exitosamente!'
                    : activeTab === 'login'
                      ? 'Accede a tu cuenta para comprar'
                      : 'Crea una cuenta para empezar a comprar'}
              </p>
            </CardHeader>

            <CardContent className="p-6 md:p-8">
              {/* Forgot password form */}
              {showForgotPassword ? (
                <div className="space-y-6">
                  <Button
                    variant="ghost"
                    className="mb-4"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                  </Button>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-orange-400" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="tu@email.com"
                          className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400 h-12"
                          value={resetPasswordEmail}
                          onChange={(e) => setResetPasswordEmail(e.target.value)}
                        />
                        {errors.resetEmail && (
                          <div className="text-sm text-red-500 mt-1 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.resetEmail}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gradient-orange hover:opacity-90 transition-opacity h-12 text-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enviando...</>
                      ) : (
                        'Enviar enlace de recuperación'
                      )}
                    </Button>
                  </form>
                </div>
              ) : registerStep === 'verification' ? (
                <div className="text-center space-y-6 py-8">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-4">
                      <CheckCircle2 className="h-16 w-16 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-green-600">¡Bienvenido a nuestra tienda!</h3>
                  <p className="text-gray-600 text-lg">
                    Hemos enviado un correo de bienvenida a <span className="font-semibold">{registerData.email}</span>.
                    Tu cuenta ya está activa y puedes comenzar a comprar de inmediato.
                  </p>
                  <Button
                    className="w-full gradient-orange hover:opacity-90 transition-opacity h-12 text-lg"
                    onClick={() => {
                      navigate('/');
                      setRegisterStep('personal');
                    }}
                  >
                    Comenzar a comprar
                  </Button>
                  <p className="text-sm text-gray-500">
                    Si tienes alguna pregunta, no dudes en contactarnos a través de nuestro servicio de atención al cliente.
                  </p>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                    <TabsTrigger value="login" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-base font-medium">
                      Iniciar Sesión
                    </TabsTrigger>
                    <TabsTrigger value="register" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-base font-medium">
                      Crear Cuenta
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="mt-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-base font-medium">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 h-5 w-5 text-orange-400" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="tu@email.com"
                            className={`pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400 h-12 ${errors.loginEmail ? 'border-red-500' : ''
                              }`}
                            value={loginData.email}
                            onChange={(e) => {
                              setLoginData({ ...loginData, email: e.target.value });
                              setErrors({ ...errors, loginEmail: '' });
                            }}
                          />
                          {errors.loginEmail && (
                            <div className="text-sm text-red-500 mt-1 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {errors.loginEmail}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password" className="text-base font-medium">
                            Contraseña
                          </Label>
                          <Button
                            type="button"
                            variant="link"
                            className="p-0 text-orange-500 h-auto text-sm"
                            onClick={() => setShowForgotPassword(true)}
                          >
                            ¿Olvidaste tu contraseña?
                          </Button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 h-5 w-5 text-orange-400" />
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className={`pl-10 pr-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400 h-12 ${errors.loginPassword ? 'border-red-500' : ''
                              }`}
                            value={loginData.password}
                            onChange={(e) => {
                              setLoginData({ ...loginData, password: e.target.value });
                              setErrors({ ...errors, loginPassword: '' });
                            }}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                          {errors.loginPassword && (
                            <div className="text-sm text-red-500 mt-1 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {errors.loginPassword}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember-me"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked === true)}
                        />
                        <Label htmlFor="remember-me" className="text-sm text-gray-600">
                          Recordar mi correo
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        className="w-full gradient-orange hover:opacity-90 transition-opacity h-12 text-lg font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Iniciando sesión...</>
                        ) : (
                          'Iniciar Sesión'
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="mt-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        {registerStep === 'personal' ? (
                          <>Información Personal</>
                        ) : (
                          <>Datos de Cuenta</>
                        )}
                        <span className="text-sm text-gray-500 font-normal">
                          Paso {registerStep === 'personal' ? '1/2' : '2/2'}
                        </span>
                      </h3>
                    </div>
                    <form onSubmit={handleRegister} className="space-y-4">
                      {registerStep === 'personal' ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="register-name" className="text-base font-medium">
                              Nombre Completo
                            </Label>
                            <div className="relative">
                              <User className="absolute left-3 top-3.5 h-5 w-5 text-orange-400" />
                              <Input
                                id="register-name"
                                placeholder="Juan Pérez"
                                className={`pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400 h-12 ${errors.registerName ? 'border-red-500' : ''
                                  }`}
                                value={registerData.name}
                                onChange={(e) => {
                                  setRegisterData({ ...registerData, name: e.target.value });
                                  setErrors({ ...errors, registerName: '' });
                                }}
                              />
                              {errors.registerName && (
                                <div className="text-sm text-red-500 mt-1 flex items-center">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  {errors.registerName}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="register-phone" className="text-base font-medium">
                              Teléfono
                            </Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3.5 h-5 w-5 text-orange-400" />
                              <Input
                                id="register-phone"
                                type="tel"
                                placeholder="Ej: 3001234567"
                                className={`pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400 h-12 ${errors.registerPhone ? 'border-red-500' : ''
                                  }`}
                                value={registerData.phone}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  setRegisterData({ ...registerData, phone: value });
                                  setErrors({ ...errors, registerPhone: '' });
                                }}
                              />
                              {errors.registerPhone && (
                                <div className="text-sm text-red-500 mt-1 flex items-center">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  {errors.registerPhone}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="register-address" className="text-base font-medium">
                              Dirección <span className="text-sm text-gray-500">(opcional)</span>
                            </Label>
                            <Input
                              id="register-address"
                              placeholder="Calle 123 #45-67"
                              className="border-orange-200 focus:border-orange-400 focus:ring-orange-400 h-12"
                              value={registerData.address}
                              onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="register-email" className="text-base font-medium">
                              Email
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-orange-400" />
                              <Input
                                id="register-email"
                                type="email"
                                placeholder="tu@email.com"
                                className={`pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400 h-12 ${errors.registerEmail ? 'border-red-500' : ''
                                  }`}
                                value={registerData.email}
                                onChange={(e) => {
                                  setRegisterData({ ...registerData, email: e.target.value });
                                  setErrors({ ...errors, registerEmail: '' });
                                }}
                              />
                              {errors.registerEmail && (
                                <div className="text-sm text-red-500 mt-1 flex items-center">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  {errors.registerEmail}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="register-password" className="text-base font-medium">
                              Contraseña
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-orange-400" />
                              <Input
                                id="register-password"
                                type={showRegisterPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className={`pl-10 pr-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400 h-12 ${errors.registerPassword ? 'border-red-500' : ''
                                  }`}
                                value={registerData.password}
                                onChange={(e) => {
                                  setRegisterData({ ...registerData, password: e.target.value });
                                  setErrors({ ...errors, registerPassword: '' });
                                }}
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                              >
                                {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                            {errors.registerPassword ? (
                              <div className="text-sm text-red-500 mt-1 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {errors.registerPassword}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 mt-1">
                                Debe contener al menos 8 caracteres, una mayúscula, una minúscula y un número
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="register-confirm-password" className="text-base font-medium">
                              Confirmar Contraseña
                            </Label>
                            <Input
                              id="register-confirm-password"
                              type={showRegisterPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="border-orange-200 focus:border-orange-400 focus:ring-orange-400 h-12"
                              value={registerData.confirmPassword}
                              onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="accept-terms"
                              checked={registerData.acceptTerms}
                              onCheckedChange={(checked) =>
                                setRegisterData({ ...registerData, acceptTerms: checked === true })
                              }
                            />
                            <Label htmlFor="accept-terms" className="text-sm text-gray-600">
                              Acepto los <a href="#" className="text-orange-500 hover:underline">términos y condiciones</a>
                            </Label>
                          </div>
                        </>
                      )}

                      <div className="flex gap-3 pt-2">
                        {registerStep === 'account' && (
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-12"
                            onClick={() => setRegisterStep('personal')}
                          >
                            <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
                          </Button>
                        )}

                        <Button
                          type="submit"
                          className="flex-1 gradient-orange hover:opacity-90 transition-opacity h-12 text-lg font-semibold"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...</>
                          ) : registerStep === 'personal' ? (
                            <>Siguiente <ArrowRight className="h-4 w-4 ml-1" /></>
                          ) : (
                            'Crear Cuenta'
                          )}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

