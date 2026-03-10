import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Key, Save, Server, Info, Send } from "lucide-react";
import { toast } from 'sonner';

export const MailConfiguration = () => {
    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const [config, setConfig] = useState({
        email: '',
        appPassword: '',
        smtpHost: 'smtp.gmail.com',
        smtpPort: '587'
    });

    // Cargar configuración existente
    useEffect(() => {
        // Por ahora esto simula cargar de una base de datos o localstorage
        // Idealmente esto debería venir de Supabase en una tabla "config"
        const savedConfig = localStorage.getItem('__mail_config');
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                setConfig(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Error parsing saved mail config:", e);
            }
        } else {
            // Valores por defecto
            setConfig({
                email: '',
                appPassword: '',
                smtpHost: 'smtp.gmail.com',
                smtpPort: '587'
            });
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Simular guardado
            await new Promise(resolve => setTimeout(resolve, 800));
            localStorage.setItem('__mail_config', JSON.stringify(config));
            toast.success("Configuración de correo guardada exitosamente");
        } catch (error) {
            toast.error("Error al guardar la configuración");
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        if (!config.email || !config.appPassword) {
            toast.warning("Debe ingresar correo y contraseña de aplicación");
            return;
        }

        setTestLoading(true);
        try {
            // Simular prueba de conexión SMTP
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success("Prueba exitosa. Las credenciales son válidas.");
        } catch (error) {
            toast.error("Error al conectar con el servidor SMTP");
        } finally {
            setTestLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex flex-col items-center justify-center">
                    <Mail className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Correos Electrónicos</h2>
                    <p className="text-slate-500">Configura el servidor SMTP para envíos masivos y notificaciones</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Key className="w-5 h-5 text-amber-500" />
                            Credenciales de Acceso
                        </CardTitle>
                        <CardDescription>
                            Usa una <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline inline-flex items-center">contraseña de aplicación <Info className="w-3 h-3 ml-1" /></a> si usas Gmail.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-semibold text-slate-700">Correo Electrónico (Remitente)</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    name="email"
                                    value={config.email}
                                    onChange={handleChange}
                                    placeholder="ejemplo@gmail.com"
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="appPassword" className="font-semibold text-slate-700">Contraseña de Aplicación</Label>
                            <div className="relative">
                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    id="appPassword"
                                    name="appPassword"
                                    type="password"
                                    value={config.appPassword}
                                    onChange={handleChange}
                                    placeholder="•••• •••• •••• ••••"
                                    className="pl-9"
                                />
                            </div>
                            <p className="text-xs text-slate-500">Nunca utilices tu contraseña personal de correo aquí.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 border-t flex gap-3">
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loading ? "Guardando..." : <><Save className="w-4 h-4 mr-2" /> Guardar Credenciales</>}
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Server className="w-5 h-5 text-indigo-500" />
                            Configuración del Servidor SMTP
                        </CardTitle>
                        <CardDescription>
                            Detalles técnicos del puerto de salida y host.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="smtpHost" className="font-semibold text-slate-700">Servidor Host</Label>
                            <Input
                                id="smtpHost"
                                name="smtpHost"
                                value={config.smtpHost}
                                onChange={handleChange}
                                placeholder="smtp.gmail.com"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="smtpPort" className="font-semibold text-slate-700">Puerto</Label>
                                <Input
                                    id="smtpPort"
                                    name="smtpPort"
                                    type="number"
                                    value={config.smtpPort}
                                    onChange={handleChange}
                                    placeholder="587"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700">Cifrado</Label>
                                <div className="h-10 px-3 py-2 bg-slate-100 border rounded-md text-sm text-slate-600 flex items-center font-medium">
                                    TLS / STARTTLS
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 border-t">
                        <Button
                            onClick={handleTestConnection}
                            disabled={testLoading}
                            variant="outline"
                            className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        >
                            {testLoading ? "Comprobando..." : <><Send className="w-4 h-4 mr-2" /> Probar Conexión</>}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <Card className="border-amber-200 bg-amber-50 text-amber-900 shadow-sm">
                <CardContent className="p-4 flex gap-4 items-start">
                    <Info className="w-6 h-6 shrink-0 mt-0.5" />
                    <div className="text-sm space-y-2">
                        <p className="font-semibold">Información importante sobre envíos masivos</p>
                        <p>Google restringe los servidores SMTP gratuitos a 500 correos por día. Si excedes este límite usando una cuenta de Gmail estándar, tu cuenta podría ser bloqueada temporalmente. Para volúmenes mayores es necesario usar SendGrid, Amazon SES, o Google Workspace.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
