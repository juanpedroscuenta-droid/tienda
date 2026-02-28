import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StepComponentProps } from '../types';

export const DescriptionStep: React.FC<StepComponentProps> = ({
    formData,
    setFormData,
    onValidationChange
}) => {
    // Validación en tiempo real
    React.useEffect(() => {
        const isValid = !!formData.description && formData.description.length > 10;
        onValidationChange?.(isValid);
    }, [formData.description, onValidationChange]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">
                            1
                        </span>
                        Descripción Detallada del Producto <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-medium">
                        {formData.description?.length || 0} caracteres
                    </span>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-sky-100 rounded-xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Escribe aquí todo lo que tu cliente necesita saber sobre el producto... (características principales, usos, materiales, etc.)"
                        required
                        className="relative min-h-[350px] w-full p-4 text-base bg-white border-2 border-slate-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 rounded-xl transition-all resize-y leading-relaxed shadow-sm"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                        <div className="mt-1">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-700 text-[10px] font-bold">!</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-900">Consejo Profesional</p>
                            <p className="text-xs text-amber-700 mt-1">
                                Una descripción detallada aumenta las posibilidades de venta en un 40%. Incluye beneficios, no solo características.
                            </p>
                        </div>
                    </div>
                    <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 flex items-start gap-3">
                        <div className="mt-1 text-sky-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-4.3-4.3" /><circle cx="11" cy="11" r="8" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-sky-900">Impacto SEO</p>
                            <p className="text-xs text-sky-700 mt-1">
                                Usa palabras clave relacionadas con el producto para que tus clientes te encuentren más fácil en Google.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
