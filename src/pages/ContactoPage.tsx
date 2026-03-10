import React from 'react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

const ContactoPage = () => (
    <InfoPageLayout title="Contáctenos" breadcrumb="Servicio al Cliente">
        <div className="space-y-12 text-slate-700 pb-12">
            <header className="max-w-3xl">
                <p className="text-lg leading-relaxed">
                    En <strong>24/7 Repuestos</strong>, nuestro compromiso es mantener tu vehículo en movimiento.
                    Contamos con un equipo de expertos listos para brindarte asesoría técnica y comercial personalizada.
                    Elige el canal que mejor se adapte a tus necesidades.
                </p>
            </header>

            {/* TARJETAS DE CONTACTO PRINCIPAL */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                        <span className="text-2xl">📞</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">WhatsApp Directo</h3>
                    <p className="text-sm text-slate-500 mb-4">Ideal para cotizaciones rápidas y fotos de repuestos.</p>
                    <a href="https://wa.me/573212619434" target="_blank" rel="noreferrer" className="text-green-600 font-bold text-lg hover:underline">
                        +57 321 2619434
                    </a>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                        <span className="text-2xl">✉️</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">Correo Electrónico</h3>
                    <p className="text-sm text-slate-500 mb-4">Para solicitudes formales, facturación y catálogos.</p>
                    <a href="mailto:contacto@regalaalgo.com" className="text-blue-600 font-bold hover:underline">
                        contacto@regalaalgo.com
                    </a>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                        <span className="text-2xl">🕒</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">Horarios de Atención</h3>
                    <p className="text-sm text-slate-600 space-y-1">
                        <span className="block italic font-medium">Zona Horaria: Colombia (GMT-5)</span>
                        <span className="block"><strong>Lunes a Viernes:</strong> 8:00 AM – 6:00 PM</span>
                        <span className="block"><strong>Sábados:</strong> 9:00 AM – 2:00 PM</span>
                        <span className="block text-slate-400">Domingos y Festivos: Cerrado</span>
                    </p>
                </div>
            </section>

            {/* DEPARTAMENTOS ESPECIALIZADOS */}
            <section className="bg-slate-50 rounded-[2rem] p-8 md:p-10 border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-8">Departamentos Especializados</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-sm">
                    <div>
                        <h4 className="font-bold text-slate-800 uppercase tracking-tighter mb-2">Ventas y Asesoría Técnica</h4>
                        <p className="text-slate-500 italic">Especialistas en compatibilidad de piezas por VIN y modelo.</p>
                        <p className="mt-2 font-medium">ventas@repuestos247.com</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 uppercase tracking-tighter mb-2">Garantías y Devoluciones</h4>
                        <p className="text-slate-500 italic">Gestión de trámites post-venta y reclamaciones técnicas.</p>
                        <p className="mt-2 font-medium">garantias@repuestos247.com</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 uppercase tracking-tighter mb-2">Alianzas y Proveedores</h4>
                        <p className="text-slate-500 italic">Para empresas interesadas en entrar a nuestro catálogo.</p>
                        <p className="mt-2 font-medium">compras@repuestos247.com</p>
                    </div>
                </div>
            </section>

            {/* COMPROMISO DE RESPUESTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Nuestro Compromiso</h2>
                    <p className="leading-relaxed mb-6">
                        Sabemos que un vehículo detenido es una urgencia. Por eso, hemos optimizado nuestros procesos internos
                        para brindarte respuestas en tiempos récord:
                    </p>
                    <ul className="space-y-4">
                        <li className="flex gap-4">
                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0"></div>
                            <p><strong>Consultas por WhatsApp:</strong> Menos de 2 horas (dentro de horario laboral).</p>
                        </li>
                        <li className="flex gap-4">
                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0"></div>
                            <p><strong>Soporte por Correo:</strong> Respuesta oficial en máximo 24 horas hábiles.</p>
                        </li>
                    </ul>
                </section>

                {/* REPORTE DE INCIDENCIAS */}
                <section className="bg-red-50 p-8 rounded-3xl border border-red-100">
                    <h2 className="text-xl font-bold text-red-900 mb-4">Reportar un problema con tu pedido</h2>
                    <p className="text-red-700 text-sm mb-6 leading-relaxed">
                        ¿Tu pedido llegó incompleto, dañado o no es el repuesto que esperabas?
                        Priorizamos estos casos para resolverlos en menos de 12 horas.
                    </p>
                    <div className="space-y-4 text-sm font-medium text-red-800">
                        <p>1. Ten a la mano tu <strong>Número de Orden</strong>.</p>
                        <p>2. Toma fotos del repuesto y del empaque original.</p>
                        <p>3. Envía los detalles vía WhatsApp para atención inmediata.</p>
                    </div>
                    <button className="mt-8 w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors">
                        Iniciar Reporte de Incidencia
                    </button>
                </section>
            </div>
        </div>
    </InfoPageLayout>
);

export default ContactoPage;
