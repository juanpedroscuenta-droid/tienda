import React from 'react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

const TransparenciaPage = () => (
    <InfoPageLayout title="Línea de Transparencia" breadcrumb="Corporativo">
        <p>
            En <strong>24/7</strong> creemos en la ética, la integridad y la transparencia como pilares fundamentales
            de nuestra operación. La Línea de Transparencia es el canal oficial para reportar conductas irregulares,
            conflictos de interés o prácticas contrarias a nuestros valores.
        </p>
        <h2>¿Qué puedes reportar?</h2>
        <ul>
            <li>Fraudes o comportamientos deshonestos</li>
            <li>Conflictos de interés</li>
            <li>Mal uso de recursos o información confidencial</li>
            <li>Acoso o discriminación</li>
            <li>Violaciones a nuestra política de privacidad</li>
        </ul>
        <h2>¿Cómo hacer un reporte?</h2>
        <p>
            Puedes comunicarte de manera confidencial a través de los siguientes canales:
        </p>
        <ul>
            <li>📧 Correo: <strong>transparencia@regalaalgo.com</strong></li>
            <li>📞 Línea directa: +57 321 2619434 (durante horario hábil)</li>
        </ul>
        <h2>Garantías</h2>
        <p>
            Todo reporte será tratado con absoluta confidencialidad. No se tomarán represalias contra quienes
            realicen reportes de buena fe. La información suministrada será usada únicamente para investigar
            y resolver la situación reportada.
        </p>
    </InfoPageLayout>
);

export default TransparenciaPage;
