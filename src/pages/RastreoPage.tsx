import React from 'react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

const RastreoPage = () => (
    <InfoPageLayout title="Rastreo de Pedidos" breadcrumb="Asistencia">
        <p>
            Cuando tu pedido ha sido despachado, recibirás un correo electrónico con el número de guía
            y el enlace para rastrear tu envío en tiempo real.
        </p>
        <h2>¿Cómo rastrear mi pedido?</h2>
        <ol>
            <li>Ingresa a tu cuenta en <strong>24/7</strong> y ve a "Mis pedidos".</li>
            <li>Selecciona el pedido que deseas rastrear.</li>
            <li>Haz clic en el botón <strong>"Ver seguimiento"</strong> para ir directamente a la transportadora.</li>
        </ol>
        <h2>Transportadoras aliadas</h2>
        <ul>
            <li>Servientrega</li>
            <li>Coordinadora</li>
            <li>TCC</li>
            <li>Envia.com</li>
        </ul>
        <h2>¿No recibiste tu número de guía?</h2>
        <p>
            Escríbenos a <strong>contacto@regalaalgo.com</strong> o al WhatsApp <strong>+57 321 2619434</strong>
            con tu número de orden y te ayudaremos de inmediato.
        </p>
    </InfoPageLayout>
);

export default RastreoPage;
