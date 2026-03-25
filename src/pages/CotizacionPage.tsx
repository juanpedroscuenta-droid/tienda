import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdvancedHeader } from '@/components/layout/AdvancedHeader';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCategories } from '@/hooks/use-categories';
import { ChevronRight, Phone, Send } from 'lucide-react';
import { db } from '@/firebase';
import { toast } from '@/hooks/use-toast';

const CotizacionPage = () => {
    const navigate = useNavigate();
    const { categories, categoriesData, mainCategories, subcategoriesByParent, thirdLevelBySubcategory } = useCategories();
    
    const [formData, setFormData] = useState({
        sparePart: '',
        brand: '',
        line: '',
        modelYear: '',
        engineSize: '',
        name: '',
        city: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (type: 'whatsapp' | 'web') => {
        // Validar campos obligatorios
        if (!formData.sparePart || !formData.brand || !formData.line || !formData.modelYear || !formData.name) {
            toast({
                title: "Campos incompletos",
                description: "Por favor llena los campos obligatorios marcados con *",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            // Guardar en la base de datos (Supabase)
            const isSupabase = typeof (db as any)?.from === 'function';
            if (isSupabase) {
                const { error } = await (db as any).from('quotes').insert([{
                    spare_part: formData.sparePart,
                    brand: formData.brand,
                    line: formData.line,
                    model_year: formData.modelYear,
                    engine_size: formData.engineSize,
                    client_name: formData.name,
                    city: formData.city,
                    status: 'pending',
                    type: type // Guardamos el tipo de envío
                }]);
                
                if (error) throw error;
            }

            if (type === 'whatsapp') {
                const message = `*Nueva Solicitud de Cotización*%0A%0A` +
                    `*Repuesto:* ${formData.sparePart || 'No especificado'}%0A` +
                    `*Marca:* ${formData.brand || 'No especificada'}%0A` +
                    `*Línea:* ${formData.line || 'No especificada'}%0A` +
                    `*Modelo/Año:* ${formData.modelYear || 'No especificado'}%0A` +
                    `*Cilindraje:* ${formData.engineSize || 'No especificado'}%0A` +
                    `*Nombre:* ${formData.name || 'No especificado'}%0A` +
                    `*Ciudad:* ${formData.city || 'No especificada'}`;
                
                const whatsappNumber = "+573239447597";
                window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${message}`, '_blank');
                
                toast({
                    title: "Redirigiendo a WhatsApp",
                    description: "Tu cotización ha sido registrada."
                });
            } else {
                setIsSubmitted(true);
                toast({
                    title: "¡Solicitud Recibida!",
                    description: "Hemos recibido tu cotización. Un asesor te contactará pronto.",
                });
            }
        } catch (error) {
            console.error("Error saving quote:", error);
            if (type === 'whatsapp') {
                // Si falla el guardado pero es WhatsApp, igual dejamos que abra el chat
                const message = `*Nueva Solicitud de Cotización (Backup)*%0A%0A*Repuesto:* ${formData.sparePart}%0A*Marca:* ${formData.brand}`;
                window.open(`https://wa.me/+573239447597?text=${message}`, '_blank');
            } else {
                toast({
                    title: "Error de conexión",
                    description: "No pudimos registrar tu solicitud en la web. Por favor intenta por WhatsApp.",
                    variant: "destructive"
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            <AdvancedHeader
                categories={categories}
                selectedCategory=""
                setSelectedCategory={(cat) => navigate(`/categoria/${encodeURIComponent(cat)}`)}
                mainCategories={mainCategories}
                subcategoriesByParent={subcategoriesByParent}
                thirdLevelBySubcategory={thirdLevelBySubcategory}
                allCategoriesData={categoriesData}
            />

            <main className="flex-1 max-w-[800px] mx-auto w-full px-6 py-12">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-[13px] text-neutral-400 mb-12">
                    <span className="hover:text-black cursor-pointer" onClick={() => navigate('/')}>Home</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-black font-medium">Cotizacion</span>
                </div>

                <div className="space-y-10">
                    {/* Field 1 */}
                    <div className="space-y-3">
                        <label className="text-[14px] font-bold text-neutral-800 flex items-center gap-1">
                            <span className="text-red-500">*</span> ¿Qué Repuesto Buscas?
                        </label>
                        <Textarea 
                            name="sparePart"
                            value={formData.sparePart}
                            onChange={handleChange}
                            className="min-h-[120px] rounded-lg border-neutral-200 focus:ring-[#ba181b] focus:border-[#ba181b]" 
                            placeholder=""
                        />
                        <p className="text-[12px] text-neutral-400">(Descripción y cantidad)</p>
                    </div>

                    {/* Field 2 */}
                    <div className="space-y-3">
                        <label className="text-[14px] font-bold text-neutral-800 flex items-center gap-1">
                            <span className="text-red-500">*</span> ¿Qué Marca es tu vehículo?
                        </label>
                        <Input 
                            name="brand"
                            value={formData.brand}
                            onChange={handleChange}
                            className="h-12 rounded-lg border-neutral-200" 
                            placeholder="Chevrolet, Renault, Hyundai, Kia, Mazda, Ford, Toyota, Nissan ..." 
                        />
                    </div>

                    {/* Field 3 */}
                    <div className="space-y-3">
                        <label className="text-[14px] font-bold text-neutral-800 flex items-center gap-1">
                            <span className="text-red-500">*</span> ¿Qué linea es tu vehículo?
                        </label>
                        <Input 
                            name="line"
                            value={formData.line}
                            onChange={handleChange}
                            className="h-12 rounded-lg border-neutral-200" 
                            placeholder="Twingo, Aveo, Picanto..." 
                        />
                    </div>

                    {/* Field 4 */}
                    <div className="space-y-3">
                        <label className="text-[14px] font-bold text-neutral-800 flex items-center gap-1">
                            <span className="text-red-500">*</span> ¿Qué modelo es tu vehículo?
                        </label>
                        <Input 
                            name="modelYear"
                            value={formData.modelYear}
                            onChange={handleChange}
                            className="h-12 rounded-lg border-neutral-200" 
                            placeholder="" 
                        />
                    </div>

                    {/* Field 5 */}
                    <div className="space-y-3">
                        <label className="text-[14px] font-bold text-neutral-800 flex items-center gap-1">
                            ¿Qué Cilindraje es tu vehículo?
                        </label>
                        <Input 
                            name="engineSize"
                            value={formData.engineSize}
                            onChange={handleChange}
                            className="h-12 rounded-lg border-neutral-200" 
                            placeholder="C.C." 
                        />
                        <p className="text-[12px] text-neutral-400">(Opcional)</p>
                    </div>

                    {/* Field 6 */}
                    <div className="space-y-3">
                        <label className="text-[14px] font-bold text-neutral-800 flex items-center gap-1">
                            <span className="text-red-500">*</span> ¿Cuál es tu Nombre?
                        </label>
                        <Input 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="h-12 rounded-lg border-neutral-200" 
                            placeholder="" 
                        />
                    </div>

                    {/* Field 7 */}
                    <div className="space-y-3">
                        <label className="text-[14px] font-bold text-neutral-800 flex items-center gap-1">
                            ¿En que ciudad te encuentras?
                        </label>
                        <Input 
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="h-12 rounded-lg border-neutral-200" 
                            placeholder="" 
                        />
                    </div>

                    {/* Footer Section */}
                    <div className="pt-8 space-y-6">
                        {!isSubmitted ? (
                            <>
                                <div className="space-y-2">
                                    <h2 className="text-[28px] font-black text-black tracking-tight uppercase">Elige cómo enviar tu solicitud</h2>
                                    <p className="text-[15px] text-neutral-500 font-medium">Puedes enviarla a nuestro panel web o directamente por WhatsApp.</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button 
                                        onClick={() => handleSubmit('web')}
                                        disabled={isSubmitting}
                                        className="bg-neutral-900 hover:bg-black text-white h-14 px-8 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-wider shadow-lg transform active:scale-95 transition-all flex-1"
                                    >
                                        {isSubmitting ? (
                                            <div className="h-5 w-5 border-t-2 border-white rounded-full animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                        {isSubmitting ? 'Registrando...' : 'Enviar en la web'}
                                    </Button>

                                    <Button 
                                        onClick={() => handleSubmit('whatsapp')}
                                        disabled={isSubmitting}
                                        className="bg-[#25D366] hover:bg-[#128C7E] text-white h-14 px-8 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-wider shadow-lg transform active:scale-95 transition-all flex-1"
                                    >
                                        <Phone className="w-5 h-5 fill-white" />
                                        WhatsApp
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-100 p-10 rounded-2xl text-center space-y-4 animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                    <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin hidden" />
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-black text-emerald-900 uppercase">¡Solicitud Registrada!</h3>
                                <p className="text-emerald-700 max-w-sm mx-auto">
                                    Hemos recibido tu información correctamente. Uno de nuestros expertos te contactará a la brevedad posible.
                                </p>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setIsSubmitted(false);
                                        setFormData({
                                            sparePart: '',
                                            brand: '',
                                            line: '',
                                            modelYear: '',
                                            engineSize: '',
                                            name: '',
                                            city: ''
                                        });
                                    }}
                                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                >
                                    Enviar otra cotización
                                </Button>
                            </div>
                        )}

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CotizacionPage;
