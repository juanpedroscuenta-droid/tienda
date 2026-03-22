import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-xl w-full text-center">
        {/* Large stylized 404 */}
        <div className="relative mb-8">
           <h1 className="text-[120px] md:text-[180px] font-black text-gray-50 leading-none select-none">
              404
           </h1>
           <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <AlertTriangle className="w-16 h-16 text-[#E53935] mb-4 animate-bounce" />
              <p className="text-[20px] md:text-[24px] font-black text-gray-900 uppercase tracking-tighter">
                 Oops! Página no encontrada
              </p>
           </div>
        </div>

        <p className="text-gray-500 font-bold uppercase tracking-widest text-[12px] mb-12 max-w-sm mx-auto leading-relaxed">
           Lo sentimos, el repuesto que buscas no está en esta ubicación o la página ya no existe.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
           <a 
              href="/" 
              className="w-full sm:w-auto px-10 py-4 bg-[#E53935] text-white font-black uppercase text-[12px] tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95"
           >
              <Home className="w-4 h-4" />
              Volver al Inicio
           </a>
           <button 
              onClick={() => window.history.back()}
              className="w-full sm:w-auto px-10 py-4 border-2 border-gray-900 text-gray-900 font-black uppercase text-[12px] tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-3 active:scale-95"
           >
              <ArrowLeft className="w-4 h-4" />
              Regresar
           </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
