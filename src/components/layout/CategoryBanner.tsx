import React from 'react';

interface CategoryBannerProps {
  name: string;
  image?: string | null;
}

export const CategoryBanner: React.FC<CategoryBannerProps> = ({ name, image }) => {
  return (
    <section className="relative w-full min-h-[160px] sm:min-h-[200px] md:min-h-[240px] lg:min-h-[280px] overflow-hidden bg-gray-900">
      {image && (
        <img
          src={image}
          alt=""
          width="1600"
          height="300"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          loading="eager"
        />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20"
        aria-hidden
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white uppercase tracking-wide drop-shadow-lg px-4 text-center">
          {name}
        </h1>
      </div>
    </section>
  );
};
