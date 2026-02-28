import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  MessageSquare,
  ShieldCheck,
  Mail,
  ArrowRight,
  PhoneCall,
  MailIcon,
  Truck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { toast } from '@/hooks/use-toast';

export const Footer: React.FC = () => {
  const { user } = useAuth();
  const isSupabase = typeof (db as any)?.from === 'function';

  const [email, setEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Si el usuario está logueado, pre-llenar su correo
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      // Verificar si ya está suscrito
      const subscribed = localStorage.getItem(`newsletter_${user.email}`);
      if (subscribed === 'true') setSubscribed(true);
    }
  }, [user]);

  const handleSubscribe = async () => {
    if (!email) {
      toast({ title: 'Correo requerido', description: 'Por favor ingresa tu correo electrónico.', variant: 'destructive' });
      return;
    }
    if (!accepted) {
      toast({ title: 'Acepta las políticas', description: 'Debes aceptar la política de tratamiento de datos.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const contactData: any = {
        email,
        tags: ['newsletter', 'suscriptor'],
      };

      // Si el usuario está logueado, agregar sus datos completos
      if (user) {
        contactData.name = user.name || user.email?.split('@')[0] || '';
        contactData.phone = user.phone || '';
        contactData.user_id = user.id;
      }

      if (isSupabase) {
        const { error } = await (db as any)
          .from('contacts')
          .insert([contactData]);

        if (error) {
          // Si el email ya existe (constraint unique), consideramos OK
          if (error.code === '23505') {
            // Ya estaba suscrito
          } else {
            console.error('Supabase contacts error:', error);
            throw new Error(error.message);
          }
        }

        // Guardar en localStorage para no repetir
        localStorage.setItem(`newsletter_${email}`, 'true');
      } else {
        console.warn('Backend no disponible para suscripción');
      }

      setSubscribed(true);
      toast({ title: '¡Suscripción exitosa!', description: 'Recibirás nuestras novedades en tu correo.' });
    } catch (err) {
      console.error('Error al suscribir:', err);
      toast({ title: 'Error', description: 'No pudimos processar tu suscripción. Intenta de nuevo.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="w-full bg-[#111111] text-white pt-10">
      <div className="max-w-[1200px] mx-auto px-4">

        {/* Top Feature Icons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-gray-800">
          <div className="flex items-center justify-center gap-3">
            <div className="bg-transparent border border-white/20 p-2 rounded-md">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Atención al cliente</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="bg-transparent border border-white/20 p-2 rounded-md">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Envío gratis a partir de $150.000</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="bg-transparent border border-white/20 p-2 rounded-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Compra 100% segura</span>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-10 bg-[#222222] rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex bg-white/10 p-4 rounded-full">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h4 className="text-lg font-bold mb-1">Sigamos conectados</h4>
              <p className="text-sm text-gray-400 max-w-sm">
                Suscríbete a nuestro boletín para recibir las últimas noticias y enterarte de nuestros lanzamientos.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-3">
            {subscribed ? (
              <div className="flex items-center gap-3 text-green-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                ¡Suscrito correctamente!
              </div>
            ) : (
              <>
                <div className="relative group">
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full md:w-[320px] bg-white text-black px-4 py-3 rounded-md focus:outline-none transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                  />
                  <button
                    onClick={handleSubscribe}
                    disabled={submitting}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white p-1.5 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-transparent accent-blue-500"
                  />
                  <label htmlFor="terms" className="text-[11px] text-gray-400 leading-tight">
                    Acepto la <Link to="/privacidad" className="underline hover:text-white transition-colors">Política de tratamiento de datos</Link> y <Link to="/terminos" className="underline hover:text-white transition-colors">Términos y condiciones</Link>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Links Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-10 pb-16">
          {/* Column 1 */}
          <div>
            <h5 className="text-sm font-bold uppercase tracking-wider mb-6 pb-2 border-b border-white/10">Corporativo</h5>
            <ul className="space-y-3 text-[13px] text-gray-400">
              <li><Link to="/nosotros" className="hover:text-white transition-colors">Nosotros</Link></li>
              <li><Link to="/marcas" className="hover:text-white transition-colors">Nuestras Marcas</Link></li>
              <li><Link to="/servicios" className="hover:text-white transition-colors">24/7 Servicios</Link></li>
              <li><Link to="/terminos" className="hover:text-white transition-colors">Términos y condiciones del sitio</Link></li>
              <li><Link to="/promociones" className="hover:text-white transition-colors">Términos y condiciones promociones</Link></li>
              <li><Link to="/habeas-data" className="hover:text-white transition-colors">Habeas data</Link></li>
              <li><Link to="/transparencia" className="hover:text-white transition-colors">Línea de transparencia</Link></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h5 className="text-sm font-bold uppercase tracking-wider mb-6 pb-2 border-b border-white/10">Asistencia</h5>
            <ul className="space-y-3 text-[13px] text-gray-400">
              <li><Link to="/preguntas-frecuentes" className="hover:text-white transition-colors">Preguntas frecuentes</Link></li>
              <li><Link to="/rastreo" className="hover:text-white transition-colors">Rastreo pedidos</Link></li>
              <li><Link to="/envios" className="hover:text-white transition-colors">Envíos</Link></li>
              <li><Link to="/devoluciones" className="hover:text-white transition-colors">Devoluciones</Link></li>
              <li><Link to="/garantia" className="hover:text-white transition-colors">Garantía</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h5 className="text-sm font-bold uppercase tracking-wider mb-6 pb-2 border-b border-white/10">Servicio al cliente</h5>
            <ul className="space-y-3 text-[13px] text-gray-400">
              <li><Link to="/contacto" className="hover:text-white transition-colors">Contáctenos</Link></li>
              <li><Link to="/facturacion" className="hover:text-white transition-colors">Facturación electrónica</Link></li>
              <li><Link to="/sic" className="hover:text-white transition-colors">SIC</Link></li>
              <li><Link to="/cambios" className="hover:text-white transition-colors">Cambios y Devoluciones</Link></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h5 className="text-sm font-bold uppercase tracking-wider mb-6 pb-2 border-b border-white/10">Atención al cliente</h5>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-400">
                <span className="text-[13px]">+57 321 2619434</span>
                <PhoneCall className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <span className="text-[13px] break-all">contacto@regalaalgo.com</span>
                <MailIcon className="w-4 h-4" />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                  <Youtube className="w-4 h-4" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Bar */}
      <div className="bg-white py-6">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Medios de pago y sitio seguro</span>
          <div className="flex flex-wrap items-center justify-center gap-8 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="h-4 flex items-center font-black text-gray-400 text-sm">24/7</div>
            <div className="h-4 flex items-center font-black text-gray-400 text-sm italic">Addi</div>
            <div className="h-4 flex items-center font-black text-gray-400 text-sm italic">VISA</div>
            <div className="h-4 flex items-center font-black text-gray-400 text-sm">mastercard</div>
            <div className="h-4 flex items-center font-black text-gray-400 text-sm">Diners Club</div>
            <div className="h-4 flex items-center font-black text-gray-400 text-sm">efecty</div>
            <div className="h-4 flex items-center font-black text-gray-400 text-sm">pse</div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-black py-4 border-t border-white/5">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-2 text-[11px] text-gray-500">
          <span>Todos los derechos reservados. Copyright © {new Date().getFullYear()}</span>
          <span className="hidden md:inline">•</span>
          <div className="flex items-center gap-2">
            <span>Tecnología:</span>
            <a
              href="https://www.linkedin.com/in/sebastian454?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white tracking-tighter hover:text-blue-400 transition-colors"
            >
              Sebastian Aguirre
            </a>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/573212619434"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3 rounded-full shadow-[0_4px_15px_rgba(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-all group flex items-center justify-center overflow-hidden h-[56px] min-w-[56px] hover:px-5"
      >
        <div className="flex items-center overflow-hidden max-w-0 group-hover:max-w-[120px] transition-all duration-300 ease-in-out">
          <span className="text-sm font-bold whitespace-nowrap mr-2">WhatsApp</span>
        </div>
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current flex-shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </footer>
  );
};
