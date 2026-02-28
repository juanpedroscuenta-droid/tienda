import React from 'react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

const ContactoPage = () => (
    <InfoPageLayout title="Contáctenos" breadcrumb="Servicio al Cliente">
        <p>
            Estamos disponibles para ayudarte con cualquier pregunta, solicitud o sugerencia.
            Elige el canal que más te convenga:
        </p>
        <h2>Canales de atención</h2>
        <ul>
            <li>📞 <strong>WhatsApp:</strong> +57 321 2619434</li>
            <li>✉️ <strong>Email:</strong> contacto@regalaalgo.com</li>
            <li>🕒 <strong>Horario de atención:</strong> Lunes a viernes 8am – 6pm · Sábados 9am – 2pm</li>
        </ul>
        <h2>¿Cuánto tardaremos en responderte?</h2>
        <p>
            Por WhatsApp respondemos en menos de 2 horas en horario de atención.
            Por correo, nuestra respuesta es de máximo 24 horas hábiles.
        </p>
        <h2>Reportar un problema con tu pedido</h2>
        <p>
            Si tienes un problema con un pedido ya realizado, indícanos tu número de orden y una descripción
            del inconveniente. Lo resolveremos de manera prioritaria.
        </p>
    </InfoPageLayout>
);

export default ContactoPage;
