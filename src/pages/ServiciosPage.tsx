import React from 'react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

const ServiciosPage = () => (
    <InfoPageLayout title="24/7 Servicios" breadcrumb="Corporativo">
        <p>
            Nuestro compromiso va más allá de la venta. En <strong>24/7</strong> ofrecemos un ecosistema de servicios
            para que tu experiencia de compra sea completa, segura y satisfactoria.
        </p>
        <h2>lo que ofrecemos</h2>
        <ul>
            <li><strong>Envíos a todo el país:</strong> Despachos a domicilio con seguimiento en tiempo real.</li>
            <li><strong>Atención 24/7:</strong> Soporte vía WhatsApp y correo electrónico todos los días.</li>
            <li><strong>Catálogo digital:</strong> Más de cientos de productos disponibles permanentemente en línea.</li>
            <li><strong>Facturación electrónica:</strong> Emitimos factura electrónica válida ante la DIAN.</li>
            <li><strong>Garantía en productos:</strong> Todos nuestros productos cuentan con garantía según la ley colombiana.</li>
            <li><strong>Cambios y devoluciones:</strong> Proceso claro y rápido cuando lo necesites.</li>
        </ul>
        <h2>Contáctanos</h2>
        <p>📞 +57 321 2619434 · ✉️ contacto@regalaalgo.com</p>
    </InfoPageLayout>
);

export default ServiciosPage;
