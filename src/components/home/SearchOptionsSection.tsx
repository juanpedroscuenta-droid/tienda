import React, { useState } from 'react';
import { Car, Search, Camera, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { VehicleFilterBar } from './VehicleFilterBar';
import { PartNumberSearchBar } from './PartNumberSearchBar';

export const SearchOptionsSection = () => {
  const [activeTab, setActiveTab] = useState<'vehicle' | 'part' | null>(null);

  const toggleTab = (tab: 'vehicle' | 'part') => {
    const newTab = activeTab === tab ? null : tab;
    setActiveTab(newTab);

    if (newTab) {
      setTimeout(() => {
        const element = document.getElementById('search-filter-anchor');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const options = [
    {
      id: 'vehicle',
      title: 'Buscar por vehículo',
      description: 'Marca, Modelo y Año',
      icon: <Car className="w-12 h-12 text-zinc-800" strokeWidth={1} />,
      onClick: () => toggleTab('vehicle')
    },
    {
      id: 'part',
      title: 'Número de parte / referencia',
      description: 'Búsqueda técnica OEM',
      icon: <Search className="w-12 h-12 text-zinc-800" strokeWidth={1} />,
      onClick: () => toggleTab('part')
    },
    {
      id: 'photo',
      title: 'Enviar foto por WhatsApp',
      description: 'Asesoría inmediata',
      icon: <div className="relative">
        <Camera className="w-12 h-12 text-zinc-800" strokeWidth={1} />
        <div className="absolute -right-1 -bottom-1 bg-green-500 rounded-full p-1 border-2 border-white">
          <MessageSquare className="w-3 h-3 text-white fill-current" />
        </div>
      </div>,
      href: 'https://wa.me/573212619434?text=Hola,%20quisiera%20encontrar%20un%20repuesto%20para%20mi%20vehículo.%20Aquí%20adjunto%20una%20foto.'
    }
  ];

  return (
    <section className="w-full bg-white py-14 border-b border-gray-100 transition-all duration-500">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2
            className="text-4xl md:text-5xl lg:text-[64px] font-black text-black tracking-tight uppercase mb-8"
            style={{ wordSpacing: '0.25em' }}
          >
            SELECCIONA TU VEHÍCULO
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 lg:gap-24 mb-6">
          {options.map((option, index) => {
            const isWhatsApp = option.id === 'photo';
            const isActive = activeTab === option.id;
            const Component = isWhatsApp ? 'a' : 'button';
            const extraProps = isWhatsApp ? {
              href: option.href,
              target: '_blank',
              rel: 'noopener noreferrer'
            } : {
              onClick: option.onClick
            };

            return (
              <Component
                key={index}
                {...extraProps}
                className={`group flex flex-col items-center p-6 rounded-2xl transition-all duration-500 border text-center ${isActive
                  ? 'bg-zinc-50 border-[#ba181b] shadow-lg'
                  : 'bg-white border-transparent hover:bg-zinc-50 hover:border-zinc-100 hover:shadow-md'
                  }`}
              >
                <div className="mb-6 transform group-hover:scale-110 transition-transform duration-500 ease-out group-hover:text-[#ba181b]">
                  {React.cloneElement(option.icon as React.ReactElement, {
                    className: (option.icon as React.ReactElement).props.className + " transition-colors duration-500 " + (isActive ? "text-[#ba181b]" : "group-hover:text-[#ba181b]")
                  })}
                </div>
                <h3 className={`text-sm font-black uppercase tracking-wider mb-2 transition-colors ${isActive ? 'text-[#ba181b]' : 'text-zinc-900 group-hover:text-[#ba181b]'}`}>
                  {option.title}
                  {(option.id === 'vehicle' || option.id === 'part') && (
                    <span className="ml-2 inline-block transition-transform duration-300">
                      {isActive ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                  {option.description}
                </p>
              </Component>
            );
          })}
        </div>

        <div id="search-filter-anchor" className="h-1" />

        <div className="mt-8 transition-all duration-500">
          {activeTab === 'vehicle' && (
            <div className="animate-in fade-in slide-in-from-top-6 duration-500 ease-out">
              <VehicleFilterBar />
            </div>
          )}
          {activeTab === 'part' && (
            <div className="animate-in fade-in slide-in-from-top-6 duration-500 ease-out">
              <PartNumberSearchBar />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
