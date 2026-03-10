import { useEffect, useRef, useCallback } from 'react';

declare global {
    interface Window {
        ePayco: any;
    }
}

const EPAYCO_SDK_URL = 'https://checkout.epayco.co/checkout.js';

/**
 * Hook que carga el SDK de ePayco de forma dinámica y expone
 * una función `openCheckout` para abrir el popup de pago.
 */
export function useEpayco() {
    const sdkLoaded = useRef(false);

    useEffect(() => {
        if (sdkLoaded.current || document.querySelector(`script[src="${EPAYCO_SDK_URL}"]`)) {
            sdkLoaded.current = true;
            return;
        }

        const script = document.createElement('script');
        script.src = EPAYCO_SDK_URL;
        script.async = true;
        script.onload = () => {
            sdkLoaded.current = true;
            console.log('[ePayco] SDK cargado correctamente');
        };
        script.onerror = () => {
            console.error('[ePayco] Error cargando el SDK');
        };
        document.head.appendChild(script);
    }, []);

    /**
     * Abre el checkout de ePayco con los datos de la orden.
     * La llave pública viene de las variables de entorno de Vite (segura).
     */
    const openCheckout = useCallback((params: {
        orderId: string;
        amount: number;
        description: string;
        userName: string;
        userEmail: string;
        userPhone?: string;
        urlConfirmation: string;   // URL del backend que ePayco llama al confirmar
        urlResponse: string;       // URL de la página de respuesta para el usuario
    }) => {
        if (!window.ePayco) {
            console.error('[ePayco] SDK no cargado aún. Reintentando...');
            // Intentar recargar el script
            const existing = document.querySelector(`script[src="${EPAYCO_SDK_URL}"]`);
            if (!existing) {
                const script = document.createElement('script');
                script.src = EPAYCO_SDK_URL;
                script.async = true;
                document.head.appendChild(script);
            }
            return false;
        }

        const pKey = import.meta.env.VITE_EPAYCO_P_KEY;
        const isTest = import.meta.env.VITE_EPAYCO_TEST !== 'false';

        if (!pKey) {
            console.error('[ePayco] VITE_EPAYCO_P_KEY no configurada');
            return false;
        }

        const handler = window.ePayco.checkout.configure({
            key: pKey,
            test: isTest,
        });

        handler.open({
            // ── Identificación ──────────────────────────────────
            name: params.description,
            description: params.description,
            invoice: params.orderId,

            // ── Monto ────────────────────────────────────────────
            currency: 'cop',
            amount: String(params.amount),
            tax_base: '0',
            tax: '0',
            country: 'co',

            // ── Cliente ───────────────────────────────────────────
            email_billing: params.userEmail,
            name_billing: params.userName,
            address_billing: 'Colombia',
            phone: params.userPhone || '',

            // ── URLs de retorno ──────────────────────────────────
            // ePayco llama a urlConfirmation con los datos del pago (POST)
            external: 'false',          // false = popup, true = redirección
            url_confirmation: params.urlConfirmation,
            url_response: params.urlResponse,

            // ── Extra: pasamos el orderId para identificar la orden al confirmar
            extra1: params.orderId,
            extra2: '',
            extra3: '',

            // ── Métodos de pago ───────────────────────────────────
            methodsDisable: [],
        });

        return true;
    }, []);

    return { openCheckout, sdkLoaded };
}
