import React from 'react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

const MarcasPage = () => (
    <InfoPageLayout title="Nuestras Marcas" breadcrumb="Corporativo">
        <div className="space-y-10 text-slate-700 pb-12">
            <p className="text-lg leading-relaxed">
                En <strong>24/7 Repuestos</strong>, consolidamos alianzas con los fabricantes más importantes del mundo para ofrecerle
                al mercado colombiano la mayor variedad de repuestos y accesorios. Trabajamos con marcas de equipo original (OEM) y opciones
                homologadas de alta calidad para todas las marcas de vehículos que circulan en el país.
            </p>

            {/* SECCIÓN VEHÍCULOS */}
            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-blue-600 inline-block">Principales Líneas de Vehículos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
                    <div>
                        <h3 className="font-bold text-blue-800 mb-2 italic text-sm uppercase tracking-wider">Americanos</h3>
                        <p className="text-sm">Ford, Chevrolet, Jeep, Dodge, RAM, Chrysler, GMC, Lincoln, Cadillac.</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-800 mb-2 italic text-sm uppercase tracking-wider">Japoneses</h3>
                        <p className="text-sm">Toyota, Nissan, Mazda, Suzuki, Honda, Mitsubishi, Isuzu, Subaru, Hino, Lexus.</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-800 mb-2 italic text-sm uppercase tracking-wider">Coreanos</h3>
                        <p className="text-sm">Kia, Hyundai, SsangYong, Daewoo.</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-800 mb-2 italic text-sm uppercase tracking-wider">Europeos</h3>
                        <p className="text-sm">Renault, Volkswagen, BMW, Mercedes-Benz, Audi, Volvo, Peugeot, Citroën, Fiat, Seat, Land Rover.</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-800 mb-2 italic text-sm uppercase tracking-wider">Chinos</h3>
                        <p className="text-sm">Great Wall, Chery, BYD, JAC, Foton, Geely, Changan, DFSK, MG, Baic, JMC, Faw.</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-800 mb-2 italic text-sm uppercase tracking-wider">Pesados</h3>
                        <p className="text-sm">Kenworth, International, Freightliner, Mack, Volvo Trucks, Scania, Iveco.</p>
                    </div>
                </div>
            </section>

            {/* SECCIÓN ESPECIALIDADES */}
            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-blue-600 inline-block">Especialidades y Categorías</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10 mt-6">

                    <div>
                        <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> Aceites y Lubricantes
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 mb-2">Mobil, Castrol, Shell, Motul, Terpel, Chevron, Valvoline, Total, Elf, Havoline, Petrobras, Ipone, Liqui Moly.</p>
                        <p className="text-[11px] text-slate-400 uppercase font-medium">Aceites Motor, Transmisión, Hidráulicos, Grasas.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> Motor y Componentes Internos
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 mb-2">Mahle, Federal Mogul, Victor Reinz, Melling, Clevite, Hastings, NPR, Taiho, Daido, Kolbenschmidt, Ajusa, Corteco.</p>
                        <p className="text-[11px] text-slate-400 uppercase font-medium leading-tight">
                            Anillos, Pistones y Bielas, Culatas, Bloque, Cigueñal, Ejes Motor, Válvulas, Balancines, Casquetes, Piñones, Volante, Carter, Bomba aceite, Empaques, Correas.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> Alimentación y Combustible
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 mb-2">Bosch, Denso, Delphi, Magneti Marelli, Hitachi, VDO, Walbro, Senfineco.</p>
                        <p className="text-[11px] text-slate-400 uppercase font-medium">Bomba combustible, Inyectores, Cuerpo acelerador, Ductos, Turbo cargadores.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> Distribución
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 mb-2">Gates, Continental, Ina, Dayco, SKF, Mitsuboshi.</p>
                        <p className="text-[11px] text-slate-400 uppercase font-medium italic">Kit de distribución para carro, Cadena, Tensores, Poleas.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> Dirección y Suspensión
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 mb-2">KYB, Monroe, Gabriel, Moog, TRW, Lemförder, Nakata, Thompson, CTR, 555, Sankei, SYD.</p>
                        <p className="text-[11px] text-slate-400 uppercase font-medium leading-tight">Amortiguadores, Tijeras, Terminales, Soportes de caja y motor, Axiales.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> Refrigeración y Exosto
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 mb-2">Gates, Valeo, Behr, Nissens, Delphi, ACDelco, Mahle, Spectra Premium, GMB.</p>
                        <p className="text-[11px] text-slate-400 uppercase font-medium leading-tight">Radiadores, Bombas de agua, Termostatos, Bloque y exosto.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> Caja y Transmisión
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 mb-2">Luk, Sachs, Exedy, Valeo, Aisin, Seco, PHC Valeo.</p>
                        <p className="text-[11px] text-slate-400 uppercase font-medium">Kit de Clutch, Volante motor, Soportes, Piñoneria, Caja y transmisión.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> Sistemas de Frenado
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 mb-2">Incolbest, Brembo, Bosch, Akebono, Wagner, Raybestos, Fremax, Fras-le, Textar, Bendix.</p>
                        <p className="text-[11px] text-slate-400 uppercase font-medium text-blue-500/60 leading-tight italic">Pastillas, Discos, Campanas, Cilindros, Mordazas.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> Carrocería y Eléctricos
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 mb-2">TYC, DEPO, Tong Yang, Bosch, Denso, NGK, Magneti Marelli, Stanley.</p>
                        <p className="text-[11px] text-slate-400 uppercase font-medium leading-tight text-blue-500/60 italic">Bujías, Bobinas de encendido, Farolas, Retenes, Bomperes, Sensores.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> Filtración y Accesorios
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 mb-2">Mann Filter, Wix, Fram, 3M, Meguiar's, Simoniz, Partmo, Donaldson.</p>
                        <p className="text-[11px] text-slate-400 uppercase font-medium leading-tight text-blue-500/60 italic">Filtros (Aire, Aceite, Gasolina), Estética Automotriz, Plumillas.</p>
                    </div>


                </div>
            </section>

            <section className="bg-slate-50 p-10 rounded-2xl border border-slate-200 shadow-sm mt-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Aliados en Crecimiento</h2>
                <p className="mb-6">
                    Constantemente buscamos ampliar nuestra red de proveedores para ofrecer la mejor garantía y respaldo a nuestros clientes.
                    Si eres importador o fabricante oficial, contáctanos para formar parte de nuestro catálogo.
                </p>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-tighter">Contacto Comercial</p>
                        <a href="mailto:compras@regalaalgo.com" className="text-lg font-bold text-blue-700 hover:text-blue-800 transition-colors">compras@regalaalgo.com</a>
                    </div>
                </div>
            </section>
        </div>
    </InfoPageLayout>
);

export default MarcasPage;
