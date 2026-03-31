import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/scroll-optimization.css'
import { preventAutomaticTranslation } from './lib/translation-blocker'

// Prevenir traducción automática para evitar problemas de UI
preventAutomaticTranslation();

// Registrar Service Worker para mejoras de rendimiento
if ('serviceWorker' in navigator) {
  // DESACTIVADO PARA DESARROLLO: El service worker está cacheando versiones antiguas de los chunks y causando el error "Invalid hook call"
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      for (let registration of registrations) {
        registration.unregister().then(
          function (boolean) { console.log('Service Worker desregistrado:', boolean); },
          function (error) { console.log('Error desregistrando:', error); }
        );
      }
    });
  });
}

// Agregar manejo de errores global para evitar pantalla blanca
const renderApp = () => {
  try {
    createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Error crítico al renderizar la aplicación:", error);
    // Mostrar una página de error amigable en lugar de pantalla blanca
    document.body.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:Arial,sans-serif;">
        <h1 style="color:#e53e3e;">Oops, algo salió mal</h1>
        <p>Hubo un problema al cargar la aplicación. Por favor intente:</p>
        <ul style="margin-bottom:20px;">
          <li>Recargar la página</li>
          <li>Limpiar el caché del navegador</li>
          <li>Desactivar extensiones de traducción</li>
        </ul>
        <button 
          onclick="window.location.reload()" 
          style="background:#3182ce; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer;"
        >
          Recargar página
        </button>
      </div>
    `;
  }
};

// Componente para manejar errores y prevenir pantalla blanca
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error capturado en boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{
          padding: '20px',
          margin: '20px',
          borderRadius: '8px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #F87171',
          color: '#B91C1C'
        }}>
          <h2 style={{ marginBottom: '16px' }}>Algo salió mal</h2>
          <p>Ha ocurrido un error en la aplicación. Por favor, intente recargar la página.</p>
          <p style={{ fontSize: '14px', marginTop: '16px' }}>Si el problema persiste, contacte al administrador.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#3182CE',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Recargar página
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '16px', fontSize: '12px' }}>
              <summary>Detalles del error (solo desarrollo)</summary>
              <p>{this.state.error && this.state.error.toString()}</p>
              <pre style={{ whiteSpace: 'pre-wrap' }}>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

renderApp();
