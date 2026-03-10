interface HeroBannerProps {
  isCatalog?: boolean;
  setShowCatalog?: (show: boolean) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ isCatalog, setShowCatalog }) => {
  return (
    <section className="w-full bg-white pt-0 pb-0 overflow-hidden">
      <div className="w-full">
        <div className="relative w-full h-auto shadow-sm">
          <img
            src={isCatalog ? "/7-CARGO_.webp" : "/WhatsApp-Image-2026-02-23-at-3.31.37-PM.webp"}
            alt={isCatalog ? "Catálogo Completo" : "R.REPUESTOS 24/7 Banner"}
            className="w-full h-full max-h-[450px] sm:max-h-[500px] md:max-h-[600px] object-cover object-top"
            draggable={false}
            loading="eager"
          />
          {setShowCatalog && (
            <div className="absolute bottom-[10%] left-[10%] sm:bottom-[15%] sm:left-[18%] md:bottom-[20%] md:left-[22%] z-20">
              <button
                onClick={() => setShowCatalog(true)}
                className="bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold px-6 sm:px-14 py-2.5 sm:py-4 rounded-full text-[9px] sm:text-xs uppercase tracking-[0.2em] shadow-xl transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap border border-[#fcd200]"
              >
                Ver Todo
              </button>
            </div>
          )}
        </div>
        {isCatalog && (
          <div className="w-full text-center py-4 bg-gray-50 border-b border-gray-200 shadow-sm mb-4">
            <p className="text-sm md:text-base font-bold text-gray-800 uppercase tracking-widest">
              Envíos Rápidos
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
