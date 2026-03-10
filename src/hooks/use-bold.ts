import { useCallback, useRef } from 'react';

/**
 * Hook para integrar Bold Checkout en React.
 *
 * Estrategia correcta documentada por Bold para React/SPAs:
 * - Se inyecta un <script data-bold-button src="sdk"> con todos los atributos de pago
 * - Bold reemplaza ese script con un botón real en el DOM
 * - El botón DEBE estar en un elemento VISIBLE para que Bold lo procese
 * - Mostramos un modal temporal con el botón y lo clickeamos automáticamente
 */
export function useBold() {
    const modalRef = useRef<HTMLDivElement | null>(null);

    const cleanup = () => {
        if (modalRef.current) {
            modalRef.current.remove();
            modalRef.current = null;
        }
        // Limpiar también cualquier script Bold anterior
        document.querySelectorAll('[data-bold-injected]').forEach(el => el.remove());
    };

    const openCheckout = useCallback((params: {
        orderId: string;
        amount: string;
        currency: string;
        description?: string;
        apiKey: string;
        integritySignature: string;
        redirectionUrl: string;
        userEmail?: string;
        userName?: string;
    }) => {
        try {
            cleanup();

            const cleanDescription = (params.description || 'Compra en Tienda 24-7')
                .replace(/[#<>&"]/g, '')
                .slice(0, 100);

            console.log('[Bold] 🚀 Iniciando pago:', {
                orderId: params.orderId,
                amount: params.amount,
                currency: params.currency,
                apiKey: params.apiKey?.slice(0, 8) + '...',
                hash: params.integritySignature?.slice(0, 8) + '...',
            });

            // --- Crear modal VISIBLE (Bold requiere que el elemento esté visible) ---
            const overlay = document.createElement('div');
            overlay.setAttribute('data-bold-injected', 'true');
            overlay.style.cssText = [
                'position:fixed',
                'top:0', 'left:0',
                'width:100vw', 'height:100vh',
                'display:flex',
                'align-items:center',
                'justify-content:center',
                'background:rgba(0,0,0,0.6)',
                'z-index:99999',
            ].join(';');

            const box = document.createElement('div');
            box.style.cssText = [
                'background:#fff',
                'border-radius:12px',
                'padding:32px 40px',
                'text-align:center',
                'min-width:280px',
            ].join(';');

            const msg = document.createElement('p');
            msg.innerText = '⏳ Conectando con Bold...';
            msg.style.cssText = 'margin:0 0 16px 0;font-family:sans-serif;font-size:15px;color:#333;';
            box.appendChild(msg);

            // Contenedor donde Bold renderizará el botón real
            const btnContainer = document.createElement('div');
            btnContainer.id = 'bold-btn-target';
            box.appendChild(btnContainer);

            // Botón para cerrar el modal si el usuario quiere cancelar
            const cancelBtn = document.createElement('button');
            cancelBtn.innerText = 'Cancelar';
            cancelBtn.style.cssText = 'margin-top:14px;background:none;border:none;color:#666;cursor:pointer;font-size:13px;text-decoration:underline;';
            cancelBtn.onclick = cleanup;
            box.appendChild(cancelBtn);

            overlay.appendChild(box);
            modalRef.current = overlay;
            document.body.appendChild(overlay);

            // --- Inyectar el script de Bold con todos los atributos de pago ---
            const script = document.createElement('script');
            script.setAttribute('data-bold-button', 'dark-L');
            script.setAttribute('data-api-key', params.apiKey);
            script.setAttribute('data-order-id', params.orderId);
            script.setAttribute('data-currency', params.currency);
            script.setAttribute('data-amount', String(params.amount));
            script.setAttribute('data-integrity-signature', params.integritySignature);
            script.setAttribute('data-redirection-url', params.redirectionUrl);
            script.setAttribute('data-description', cleanDescription);
            if (params.userEmail || params.userName) {
                const cd: Record<string, string> = {};
                if (params.userEmail) cd.email = params.userEmail;
                if (params.userName) cd.fullName = params.userName;
                script.setAttribute('data-customer-data', JSON.stringify(cd));
            }
            btnContainer.appendChild(script);

            // --- Cargar el SDK de Bold que procesará el script anterior ---
            const sdkScript = document.createElement('script');
            sdkScript.src = 'https://checkout.bold.co/library/boldPaymentButton.js';

            sdkScript.onload = () => {
                console.log('[Bold] ✅ SDK cargado. Buscando botón...');
                msg.innerText = 'Haz clic en el botón para continuar.';

                const tryClick = (attempt: number) => {
                    // Bold reemplaza el <script> por un <button> o <a>
                    const btn = btnContainer.querySelector('button') as HTMLElement
                        || btnContainer.querySelector('a') as HTMLElement
                        || document.querySelector('#bold-btn-target button') as HTMLElement;

                    if (btn) {
                        console.log(`[Bold] ✅ Botón encontrado (intento ${attempt}). Clickeando...`);
                        btn.click();
                        // Cerrar el modal después de que Bold toma el control
                        setTimeout(cleanup, 2000);
                    } else if (attempt < 15) {
                        setTimeout(() => tryClick(attempt + 1), 400);
                    } else {
                        console.error('[Bold] ❌ Bold no renderizó el botón. Verifica claves en el panel de Bold.');
                        msg.innerText = '❌ Error al procesar. Verifica tus credenciales de Bold.';
                        msg.style.color = 'red';
                    }
                };

                tryClick(1);
            };

            sdkScript.onerror = () => {
                console.error('[Bold] ❌ No se pudo cargar el SDK de Bold.');
                msg.innerText = '❌ Error de conexión con Bold. Intenta de nuevo.';
                msg.style.color = 'red';
            };

            document.head.appendChild(sdkScript);
            return true;

        } catch (error) {
            console.error('[Bold] Error fatal:', error);
            cleanup();
            return false;
        }
    }, []);

    return { openCheckout, sdkLoaded: true };
}
