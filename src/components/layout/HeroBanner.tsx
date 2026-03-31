import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeroBannerProps {
  isCatalog?: boolean;
  setShowCatalog?: (show: boolean) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ isCatalog, setShowCatalog }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  useEffect(() => {
    // Autoplay disabled per user request
  }, [isCatalog, totalSlides]);

  return (
    <section className="w-full bg-white overflow-hidden mb-4 border-b border-gray-100 pb-1">
      <div className="container mx-auto px-4 md:px-8">
        <div className="relative w-full h-[280px] sm:h-[400px] md:h-[500px] lg:h-[550px] overflow-hidden flex justify-center bg-white shadow-sm rounded-lg mb-8">
          {isCatalog ? (
            <img
              src="/7-CARGO_.webp"
              alt="Catálogo"
              className="w-full h-full object-cover object-center"
              width="1920"
              height="1080"
              draggable={false}
              loading="eager"
              // @ts-ignore
              fetchpriority="high"
            />
          ) : (
            <>
              {/* Background Video that runs underneath everything continuously */}
              <video
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover object-center scale-[1.05] z-0"
                autoPlay
                loop
                muted
                playsInline
                draggable={false}
              >
                <source src="/lv_0_20260323110545.mp4" type="video/mp4" />
              </video>

              {/* -------------- SLIDE CONTENT ENVELOPE -------------- */}
              <div className="absolute inset-0 z-10 pointer-events-none perspective-1000 overflow-hidden">
                
                {/* ---------- SLIDE 0 (White Welcome Theme) ---------- */}
                {/* z-10 so it stays underneath the sweeping red background of Slide 1 */}
                <div className={`absolute inset-0 w-full h-full z-10 ${
                    currentSlide === 0 ? 'pointer-events-auto' : 'pointer-events-none'
                  }`}
                >
                  {/* Product Image */}
                  <div className={`absolute right-[2%] md:right-[5%] top-[48%] sm:top-1/2 -translate-y-1/2 z-30 w-[45%] sm:w-[50%] md:w-[45%] lg:w-[40%] xl:w-[35%] pointer-events-auto drop-shadow-2xl group cursor-pointer transition-all duration-[1000ms] delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    currentSlide === 0 ? 'translate-x-0 opacity-100' : 'translate-x-32 opacity-0'
                  }`}>
                    <img
                      src="/Picsart_26-03-23_11-29-33-104.webp"
                      alt="Repuestos y Autopartes"
                      className="w-full h-auto object-contain transition-all duration-700 ease-out transform group-hover:scale-[1.03] group-hover:-translate-y-1 group-hover:-translate-x-2 group-hover:-rotate-1"
                      draggable={false}
                    />
                  </div>

                  {/* Brand Logo */}
                  <div className={`absolute left-[5%] md:left-[10%] lg:left-[15%] top-[40%] -translate-y-1/2 z-30 w-[35%] sm:w-[30%] md:w-[25%] lg:w-[20%] pointer-events-none drop-shadow-xl flex justify-start transition-all duration-[1000ms] delay-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    currentSlide === 0 ? 'translate-x-0 opacity-100' : '-translate-x-32 opacity-0'
                  }`}>
                    <img
                      src="/logo.webp"
                      alt="R. Repuestos 24/7"
                      className="w-full max-w-[180px] md:max-w-[220px] h-auto object-contain bg-white/10 rounded-xl p-2 backdrop-blur-sm"
                      draggable={false}
                    />
                  </div>

                  {/* Top Texts */}
                  <div className={`absolute inset-0 z-30 flex flex-col justify-between pt-4 sm:pt-6 lg:pt-8 pb-[2%] sm:pb-[4%] px-[5%] md:px-[8%] lg:px-[12%] pointer-events-none transition-all duration-[1000ms] delay-100 ${
                    currentSlide === 0 ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'
                  }`}>
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 w-full text-center">
                      <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[56px] font-black text-black tracking-tighter uppercase leading-none drop-shadow-sm">
                        ¡BIENVENIDO!
                      </h1>
                      <h2 
                        className="text-lg sm:text-2xl md:text-3xl lg:text-[40px] font-black text-[#E2343E] tracking-tight uppercase leading-none mt-1 sm:mt-0 lg:mt-2 drop-shadow-md"
                        style={{ wordSpacing: '0.25em' }}
                      >
                        SOLICITA TU COTIZACIÓN
                      </h2>
                    </div>

                    <div className="w-full relative z-30 flex-1 flex items-end">
                      <div className="w-[55%] sm:w-1/2 text-left pb-2">
                        <p className="text-xs sm:text-xl md:text-2xl lg:text-[28px] font-bold text-black leading-tight tracking-tight drop-shadow-sm">
                          Encuentra Auto Partes<br />
                          Originales y Homologadas<br />
                          para tu vehículo...
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Button */}
                  <div className={`absolute bottom-4 sm:bottom-14 right-[12%] sm:right-[25%] md:right-[30%] lg:right-[35%] pointer-events-auto z-40 shadow-xl transition-all duration-[800ms] delay-400 ${
                    currentSlide === 0 ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
                  }`}>
                    <button
                      onClick={() => navigate('/cotizacion')}
                      className="bg-[#333333] hover:bg-black text-white px-4 md:px-6 py-1.5 md:py-2 rounded text-[10px] md:text-xs font-bold uppercase transition-colors"
                    >
                      Cotizar
                    </button>
                  </div>
                </div>

                {/* ---------- SLIDE 1 (Red Engine Theme) ---------- */}
                {/* z-20 so its sweeping backgrounds cover Slide 0 and Slide 2 */}
                <div className={`absolute inset-0 w-full h-full z-20 ${
                    currentSlide === 1 ? 'pointer-events-auto' : 'pointer-events-none'
                  }`}
                >
                  {/* Geometric Red Backgrounds (The Transition!) */}
                  <div 
                    className={`absolute top-0 left-0 w-[60%] h-full bg-[#d8191f] z-0 transition-transform duration-[1200ms] ease-[cubic-bezier(0.85,0,0.15,1)] ${
                      currentSlide === 1 ? 'translate-x-0' : '-translate-x-[110%]'
                    }`}
                    style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)' }}
                  />
                  <div 
                    className={`absolute top-0 right-0 w-[60%] h-full bg-[#d8191f] z-0 transition-transform duration-[1200ms] ease-[cubic-bezier(0.85,0,0.15,1)] ${
                      currentSlide === 1 ? 'translate-x-0' : 'translate-x-[110%]'
                    }`}
                    style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }}
                  />
                  
                  {/* Engine Product Image flying from right */}
                  <div className={`absolute right-[0%] md:right-[2%] top-1/2 -translate-y-1/2 z-30 w-[45%] sm:w-[50%] md:w-[45%] lg:w-[40%] xl:w-[45%] pointer-events-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)] group cursor-pointer transition-all duration-[1200ms] delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    currentSlide === 1 ? 'translate-x-0 opacity-100 scale-100 rotate-0' : 'translate-x-[60%] opacity-0 scale-75 rotate-12'
                  }`}>
                    <img
                      src="/Picsart_26-03-23_12-11-41-981.webp"
                      alt="Motor Excelente"
                      className="w-full h-auto object-contain transform scale-110 transition-all duration-700 ease-out group-hover:scale-[1.13] group-hover:-translate-y-1 group-hover:-translate-x-3 group-hover:-rotate-1"
                      draggable={false}
                    />
                  </div>

                  {/* Left Texts sweeping from left */}
                  <div className={`absolute inset-0 z-30 flex flex-col justify-center px-[8%] md:px-[12%] lg:px-[15%] pointer-events-none pt-[5%] sm:pt-0 transition-all duration-[1000ms] delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    currentSlide === 1 ? 'translate-x-0 opacity-100' : '-translate-x-32 opacity-0'
                  }`}>
                    <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-[50px] font-black text-white tracking-widest uppercase leading-tight drop-shadow-md mb-0 lg:mb-2">
                      SOLO LO MEJOR
                    </h2>
                    <h3 className="text-lg sm:text-2xl md:text-3xl lg:text-[34px] font-bold text-white tracking-widest uppercase leading-tight drop-shadow-md lg:mb-4">
                      PARA TU MOTOR
                    </h3>
                    
                    <div className="text-[70px] sm:text-[90px] md:text-[130px] lg:text-[180px] font-black text-[#FFCC00] tracking-tighter leading-none -ml-1 sm:-ml-2 drop-shadow-md my-1 lg:my-0">
                      100%
                    </div>
                    
                    <h4 className="text-lg sm:text-2xl md:text-3xl lg:text-[40px] font-black text-white tracking-widest uppercase leading-tight drop-shadow-md mt-0 lg:mt-4">
                      GARANTIZADO
                    </h4>
                  </div>
                </div>

                {/* ---------- SLIDE 2 (White "Comprar es Seguro") ---------- */}
                {/* z-10 so it's under Slide 1. The transition from 1 to 2 is simply Slide 1's red doors opening. */}
                <div className={`absolute inset-0 w-full h-full z-10 ${
                    currentSlide === 2 ? 'pointer-events-auto' : 'pointer-events-none'
                  }`}
                >
                  {/* Circular Product Image */}
                  <div className={`absolute right-[5%] top-1/2 -translate-y-1/2 z-30 w-[45%] sm:w-[50%] md:w-[45%] lg:w-[40%] xl:w-[35%] pointer-events-auto drop-shadow-2xl group cursor-pointer transition-all duration-[1000ms] delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    currentSlide === 2 ? 'translate-x-0 opacity-100 scale-100 rotate-0' : 'translate-x-[20%] opacity-0 scale-90 rotate-[10deg]'
                  }`}>
                    <img
                      src="/Picsart_26-03-23_13-05-55-419.webp"
                      alt="Repuestos Genuinos"
                      className="w-full h-auto object-contain transition-all duration-700 ease-out transform group-hover:scale-[1.03] group-hover:-translate-y-1 group-hover:rotate-6"
                      draggable={false}
                    />
                  </div>

                  {/* Left Texts */}
                  <div className={`absolute left-[5%] md:left-[8%] lg:left-[10%] top-1/2 -translate-y-1/2 z-30 flex flex-col justify-center pointer-events-none transition-all duration-[1000ms] delay-100 ${
                    currentSlide === 2 ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'
                  }`}>
                    <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-[50px] font-black text-black tracking-tighter uppercase leading-none drop-shadow-sm mb-1">
                      COMPRAR
                    </h2>
                    <h3 className="text-xl sm:text-3xl md:text-4xl lg:text-[36px] font-black text-[#E2343E] tracking-tight uppercase leading-none drop-shadow-sm">
                      ES FACIL Y
                    </h3>
                    
                    <div className="text-[70px] sm:text-[90px] md:text-[140px] lg:text-[180px] font-black text-black tracking-tighter leading-none my-1 drop-shadow-sm -ml-1">
                      100%
                    </div>
                    
                    <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-[50px] font-black text-black tracking-tighter uppercase leading-none drop-shadow-sm mb-4 lg:mb-6">
                      SEGURO
                    </h2>

                    <div className="w-full sm:max-w-[80%]">
                      <p className="text-sm sm:text-base md:text-xl lg:text-[22px] font-bold text-[#E2343E] leading-tight drop-shadow-sm">
                        Nuestra empresa cuenta<br />
                        con clientes a nivel<br />
                        nacional que nos<br />
                        recomiendan.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Slider Dots (Pagination) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center gap-3 pointer-events-auto">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className="group flex items-center justify-center w-5 h-5 focus:outline-none"
                    aria-label={`Ir a slide ${idx + 1}`}
                  >
                    <div 
                      className={`w-3 h-3 rounded-full border-[1.5px] border-black sm:border-white transition-all duration-300 ease-in-out flex items-center justify-center shadow-sm ${
                        currentSlide === idx ? 'bg-transparent scale-125' : 'bg-white/50 scale-100 hover:scale-110'
                      }`}
                    >
                      {currentSlide === idx && (
                        <div className="w-[4px] h-[4px] bg-black sm:bg-white rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
            </>
          )}
        </div>
        {isCatalog && (
          <div className="w-full text-center py-4 bg-gray-50 border-b border-gray-200 shadow-sm mb-4">
            <p className="text-sm md:text-base font-bold text-gray-800 uppercase tracking-widest">
              Envíos Rápidos
            </p>
          </div>
        )}
        {!isCatalog && (
          <div className="w-full border-b border-gray-200 pb-2"></div>
        )}
      </div>
    </section>
  );
};
