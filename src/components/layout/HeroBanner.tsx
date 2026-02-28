import React from 'react';

export const HeroBanner: React.FC = () => {
  return (
    <section className="w-full bg-white pt-0 pb-0 flex justify-center">
      {/* Banner Image Container restored to its standalone width */}
      <div className="w-full max-w-[1400px] mx-auto px-0 sm:px-4 md:px-6 lg:px-8">
        <div className="relative w-full h-[280px] sm:h-[160px] md:h-[200px] lg:h-[240px] shadow-sm">
          <img
            src="/WhatsApp-Image-2026-02-23-at-3.31.37-PM.webp"
            alt="R.REPUESTOS 24/7 Banner"
            className="w-full h-full object-cover object-center"
            draggable={false}
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
};
