import React from 'react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

const FacturacionPage = () => (
    <InfoPageLayout title="Facturación Electrónica" breadcrumb="Servicio al Cliente">
        <p>
            <strong>24/7</strong> emite factura electrónica válida ante la DIAN (Dirección de Impuestos y Aduanas
            Nacionales de Colombia) para todas las compras realizadas en nuestra plataforma.
        </p>
        <h2>¿Cuándo recibes tu factura?</h2>
        <p>
            La factura electrónica se envía automáticamente al correo electrónico registrado en tu cuenta,
            dentro de las 24 horas siguientes a la confirmación de pago.
        </p>
        <h2>¿No recibiste tu factura?</h2>
        <ul>
            <li>Revisa tu carpeta de spam o correo no deseado.</li>
            <li>Verifica que el correo de tu cuenta sea correcto.</li>
            <li>Si el problema persiste, escríbenos a <strong>contacto@regalaalgo.com</strong> con tu número de orden.</li>
        </ul>
        <h2>Facturas para empresas</h2>
        <p>
            Si necesitas factura a nombre de una empresa con NIT, indícanos los datos durante el proceso de compra
            o escríbenos antes de completar el pago.
        </p>
        <h2>Validez legal</h2>
        <p>
            Nuestras facturas electrónicas cumplen todos los requisitos del sistema CUFE establecidos por la DIAN
            y son válidas para efectos contables y tributarios.
        </p>
    </InfoPageLayout>
);

export default FacturacionPage;
