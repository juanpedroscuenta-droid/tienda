import React, { useEffect, useState } from "react";
import { TopPromoBar } from "@/components/layout/TopPromoBar";
import { AdvancedHeader } from "@/components/layout/AdvancedHeader";
import { useCategories } from "@/hooks/use-categories";
import { getInfoSection } from "@/lib/info-sections";
import { HelpCircle, ChevronRight, ChevronDown, Phone, Monitor, User } from "lucide-react";

const FAQPage = () => {
  const { categories, mainCategories, subcategoriesByParent, thirdLevelBySubcategory } = useCategories();
  const [selectedCategory, setSelectedCategory] = React.useState("Todos");
  const [promoVisible, setPromoVisible] = React.useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  // Hardcoded FAQs from the image
  const faqs = [
    {
      question: "QUIÉNES SOMOS?",
      answer: "Somos distribuidores de repuestos a nivel nacional, con más de 10 años de experiencia y contamos con personal altamente calificado en el mercado de Auto Partes. Vendemos repuestos originales y homologados."
    },
    {
      question: "DÓNDE ESTAMOS UBICADOS?",
      answer: "Nuestras oficinas principales y centro de distribución están ubicados estratégicamente para cubrir todo el país. Realizamos despachos inmediatos a cualquier ciudad de Colombia."
    },
    {
      question: "CUÁL ES EL TIEMPO DE ENTREGA?",
      answer: "El tiempo de entrega estándar es de 24 a 72 horas hábiles, dependiendo de la ciudad de destino y la disponibilidad del repuesto en nuestras bodegas."
    },
    {
      question: "CUÁLES SON SUS FORMAS DE PAGO?",
      answer: "Ofrecemos múltiples opciones de pago incluyendo Transferencias Bancarias, PSE, Tarjetas de Crédito y pagos mediante billeteras digitales como Nequi o Daviplata."
    }
  ];

  const loading = false; // Static content needs no loading state

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-gray-900">
      {promoVisible && <TopPromoBar setPromoVisible={setPromoVisible} />}
      <AdvancedHeader
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        promoVisible={promoVisible}
        mainCategories={mainCategories}
        subcategoriesByParent={subcategoriesByParent}
        thirdLevelBySubcategory={thirdLevelBySubcategory}
      />
      
      <main className="flex-1 bg-white pt-6 pb-24">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-[12px] font-bold mb-8">
            <a href="/" className="text-gray-400 hover:text-[#ba181b] transition-colors">Home</a>
            <span className="text-gray-300 mx-1">&gt;</span>
            <span className="text-[#ba181b]">FAQ</span>
          </nav>

          <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
            {/* Column 1: FAQ Content */}
            <div className="flex-1">
              <div className="mb-10 text-left">
                <h1 className="text-[54px] font-black text-[#ba181b] leading-tight tracking-tighter uppercase">
                  FAQ
                </h1>
                <p className="text-[14px] font-bold text-[#ba181b] uppercase tracking-wide">
                  Preguntas y respuestas
                </p>
              </div>

              <div className="flex flex-col border border-gray-100 divide-y divide-gray-100 mb-16">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="flex flex-col">
                    <button
                      onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
                      className={`w-full flex items-center justify-between px-6 py-4 text-left transition-all ${
                        activeIndex === idx ? "bg-[#ba181b] text-white" : "bg-[#f8f9fa] hover:bg-gray-100 text-gray-900"
                      }`}
                    >
                      <span className="text-[13px] font-black uppercase tracking-widest">
                        ¿{faq.question}?
                      </span>
                      <ChevronDown className={`w-5 h-5 ${activeIndex === idx ? "text-white" : "text-gray-900"}`} />
                    </button>
                    {activeIndex === idx && (
                      <div className="bg-white p-8">
                        <p className="text-[13px] leading-relaxed text-gray-500 font-medium">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pasos Section in Column 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-16 mb-16">
                 {[1,2,3,4,5,6].map(num => (
                    <div key={num} className="flex flex-col gap-2 group cursor-default">
                       <div className="flex items-center gap-3 relative h-8">
                          {/* Dot / Number Circle transition */}
                          <div className="w-2.5 h-2.5 rounded-full bg-[#ba181b] transition-all duration-300 group-hover:w-10 group-hover:h-10 group-hover:flex group-hover:items-center group-hover:justify-center group-hover:absolute group-hover:-left-4 group-hover:z-10">
                            <span className="hidden group-hover:block text-white text-[20px] font-black leading-none">
                              {num}
                            </span>
                          </div>
                          <h4 className="text-[18px] font-bold text-gray-900 transition-all duration-300 group-hover:pl-8">
                            Paso {num}
                          </h4>
                       </div>
                       <p className="text-[11px] font-medium text-gray-500 leading-tight pl-5.5 transition-all duration-300 group-hover:pl-8 group-hover:text-gray-900">
                          {num === 1 && "Empieza tu búsqueda"}
                          {num === 2 && "Encuentra el repuesto o realiza una cotización"}
                          {num === 3 && "En caso de dudas solicita nuestra asesoría."}
                          {num === 4 && "Realiza tu pago"}
                          {num === 5 && "Recibe notificaciones sobre el estado de tu pedido"}
                          {num === 6 && "Recibe tu repuesto y recomienda nuestro servicio"}
                       </p>
                    </div>
                 ))}
              </div>

              {/* Map in Column 1 */}
              <div className="w-full h-[500px] relative border border-gray-100 p-1 bg-white mb-20">
                <iframe 
                   src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.846560416!2d-74.0817!3d4.6097!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f990f1d564887%3A0xe5a363d6f1947a50!2sBogot%C3%A1%2C%20Colombia!5e0!3m2!1ses!2sco!4v1711050000000!5m2!1ses!2sco" 
                   className="w-full h-full border-0 grayscale"
                   loading="lazy"
                ></iframe>
                <div className="absolute top-8 left-8 bg-white p-6 shadow-2xl border border-gray-50 flex flex-col max-w-[280px]">
                   <span className="text-[14px] font-bold text-gray-900 uppercase mb-1">Repuestos 24/7</span>
                   <span className="text-[10px] font-bold text-[#ba181b] mb-4">(Bogotá, Colombia)</span>
                   <p className="text-[10px] text-gray-400 font-bold uppercase leading-tight mb-2">
                      SEDE PRINCIPAL - BOGOTÁ.<br/>
                      Bogotá, Colombia
                   </p>
                   <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold">5.0</span>
                      <div className="flex gap-0.5 text-yellow-400">
                         {"★★★★★".split("").map((s, i) => <span key={i} className="text-[10px]">{s}</span>)}
                      </div>
                      <span className="text-[10px] text-blue-500">(31)</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Column 2: Sidebar (Total Vertical Stack) */}
            <div className="w-full md:w-[320px] lg:w-[380px] flex flex-col gap-10">
              <div className="flex flex-col items-center">
                <div className="w-full relative flex flex-col items-center">
                  <img 
                    src="/Picsart_26-03-22_22-06-07-274.webp" 
                    alt="Agente Repuesto.co"
                    className="w-full h-auto max-w-[340px] rounded-2xl"
                  />
                </div>
              </div>

              <div className="w-full h-[1px] bg-gray-100" />

              <div className="text-center px-6">
                 <h3 className="text-[18px] font-black text-[#ba181b] uppercase tracking-tighter mb-2">
                    PREGUNTAS?
                 </h3>
                 <p className="text-[12px] font-bold text-gray-400 uppercase tracking-tight mb-10 leading-relaxed">
                    Nuestros expertos están listos para ayudar.
                 </p>

                 <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-full border-2 border-[#ba181b] flex items-center justify-center text-[#ba181b] mb-2">
                       <Phone className="w-6 h-6 fill-current" />
                    </div>
                    <span className="text-[14px] font-black text-gray-900 uppercase">Llamanos!</span>
                    <span className="text-[28px] font-black text-gray-900 tracking-tighter">
                       3136571338
                    </span>
                 </div>
              </div>

              {/* Form aligned in the same Column 2 */}
              <form className="space-y-4 px-2">
                 <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">Nombre (requerido)</label>
                    <input type="text" className="w-full h-11 border border-gray-100 px-4 focus:outline-none focus:border-[#ba181b]" required />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">Telefono (requerido)</label>
                    <input type="tel" className="w-full h-11 border border-gray-100 px-4 focus:outline-none focus:border-[#ba181b]" required />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">Email (requerido)</label>
                    <input type="email" className="w-full h-11 border border-gray-100 px-4 focus:outline-none focus:border-[#ba181b]" required />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">Consulta/Mensaje</label>
                    <textarea className="w-full border border-gray-100 px-4 py-2 focus:outline-none focus:border-[#ba181b] resize-none" rows={3} />
                 </div>
                 <button className="w-full py-3 bg-[#ba181b] text-white font-black uppercase text-[11px] tracking-widest hover:bg-black transition-all">
                    ENVIAR CONSULTA
                 </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FAQPage;
