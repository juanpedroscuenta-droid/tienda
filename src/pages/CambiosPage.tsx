import React from 'react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

const CambiosPage = () => (
    <InfoPageLayout title="Cambios y Devoluciones" breadcrumb="Servicio al Cliente">
        <p>
            En <strong>24/7</strong> queremos que estés 100% satisfecho con tu compra. Si el producto no cumple
            tus expectativas o tiene algún defecto, te ayudamos a realizar el cambio o devolución.
        </p>
        <h2>Plazo para solicitar cambio o devolución</h2>
        <p>
            Tienes hasta <strong>5 días hábiles</strong> desde la fecha de recepción del producto para
            solicitar un cambio o devolución.
        </p>
        <h2>Condiciones</h2>
        <ul>
            <li>El producto debe estar sin uso, en su empaque original y con todos sus accesorios.</li>
            <li>Se debe presentar la factura de compra.</li>
            <li>Los productos personalizados o de higiene íntima no aplican para devolución, salvo defecto de fábrica.</li>
        </ul>
        <h2>Proceso de devolución</h2>
        <ol>
            <li>Contáctanos por WhatsApp o email con tu número de orden y la razón de la devolución.</li>
            <li>Te indicaremos cómo enviar el producto.</li>
            <li>Una vez recibido y verificado, procesamos el reembolso o cambio en máximo 5 días hábiles.</li>
        </ol>
        <h2>Reembolsos</h2>
        <p>
            Los reembolsos se realizan por el mismo medio de pago utilizado en la compra.
        </p>
        <h2>Contacto</h2>
        <p>📞 +57 321 2619434 · ✉️ contacto@regalaalgo.com</p>
    </InfoPageLayout>
);

export default CambiosPage;
