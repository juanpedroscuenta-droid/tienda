interface HeroBannerProps {
  isCatalog?: boolean;
  setShowCatalog?: (show: boolean) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ isCatalog, setShowCatalog }) => {
  return (
    <section className="w-full bg-white pt-0 pb-0 overflow-hidden">
      <div className="w-full">
        <div className="relative w-full max-h-[520px] sm:max-h-[680px] md:max-h-[830px] overflow-hidden shadow-sm">
          <img
            src={isCatalog ? "/7-CARGO_.webp" : "/WhatsApp-Image-2026-02-23-at-3.31.37-PM.webp"}
            alt={isCatalog ? "Catálogo Completamente" : "R.REPUESTOS 24/7 Banner"}
            className="w-full h-full object-cover object-center"
            width="1920"
            height="1080"
            draggable={false}
            loading="eager"
            // @ts-ignore
            fetchpriority="high"
          />
          {setShowCatalog && (
            <div className="absolute bottom-[10%] left-[10%] sm:left-[15%] md:left-[20%] z-20">
              <button
                onClick={() => setShowCatalog(true)}
                className="bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold px-8 sm:px-14 py-3 sm:py-4 rounded-full text-[10px] sm:text-xs uppercase tracking-[0.2em] shadow-2xl transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap border-2 border-[#fcd200]"
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
