import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { recordWebsiteVisit } from '@/lib/product-analytics';

/**
 * Componente que rastrea las visitas generales al sitio web
 * Se monta una vez y registra cada cambio de página
 */
export const WebsiteVisitTracker = () => {
  const location = useLocation();
  const { user } = useAuth();

  const recordInProgress = React.useRef<{ [key: string]: number }>({});

  useEffect(() => {
    const pageUrl = window.location.pathname; // Usar pathname para evitar re-registro por cambios en query/params si no se desea

    // NO registrar visitas de administradores para no inflar las estadísticas
    if (user?.isAdmin) {
      console.log('[WebsiteVisitTracker] 🛡️ Modo administrador: omitiendo registro de visita');
      return;
    }

    const userId = user?.id || 'anonymous';
    const key = `${pageUrl}-${userId}`;
    const now = Date.now();

    // Evitar registrar la misma página para el mismo usuario más de una vez cada 10 segundos
    // Esto previene los múltiples disparos durante la hidratación del AuthContext
    if (recordInProgress.current[key] && (now - recordInProgress.current[key] < 10000)) {
      console.log('[WebsiteVisitTracker] ⏩ Omitiendo registro duplicado reciente:', key);
      return;
    }

    recordInProgress.current[key] = now;

    const pageTitle = document.title;

    const recordVisit = () => {
      console.log('[WebsiteVisitTracker] 🚀 Registrando visita:', pageUrl);
      recordWebsiteVisit(
        window.location.href,
        pageTitle,
        user?.id,
        user?.email || null,
        user?.name || null
      );
    };

    // Usar requestIdleCallback o setTimeout para diferir el registro
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => recordVisit(), { timeout: 2000 });
    } else {
      const timer = setTimeout(recordVisit, 2000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, user?.id]);

  return null; // Este componente no renderiza nada
};
