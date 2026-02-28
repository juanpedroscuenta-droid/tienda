import React from 'react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

const SICPage = () => (
    <InfoPageLayout title="SIC — Superintendencia de Industria y Comercio" breadcrumb="Servicio al Cliente">
        <p>
            Como empresa colombiana, <strong>24/7</strong> está sujeta a la vigilancia y control de la
            Superintendencia de Industria y Comercio (SIC), entidad encargada de velar por los derechos
            de los consumidores en Colombia.
        </p>
        <h2>¿Qué es la SIC?</h2>
        <p>
            La SIC es la autoridad de protección al consumidor en Colombia. Ante ella puedes radicar quejas
            si consideras que tus derechos como consumidor han sido vulnerados y no has obtenido respuesta
            satisfactoria directamente con el proveedor.
        </p>
        <h2>¿Cuándo acudir a la SIC?</h2>
        <ul>
            <li>Cuando el proveedor no resuelve tu queja dentro de los tiempos legales.</li>
            <li>Cuando se niega injustificadamente a aplicar garantías.</li>
            <li>Cuando hay publicidad engañosa o información falsa.</li>
        </ul>
        <h2>¿Cómo radicar una queja ante la SIC?</h2>
        <ul>
            <li>🌐 Portal web: <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">www.sic.gov.co</a></li>
            <li>📞 Telefónica: 601 592 0400</li>
            <li>En persona: Carrera 13 # 27-00, Bogotá D.C.</li>
        </ul>
        <h2>Nuestro compromiso</h2>
        <p>
            Antes de acudir a la SIC, te invitamos a contactarnos directamente. En <strong>24/7</strong>
            resolvemos el 100% de las solicitudes de garantía y devolución dentro de los tiempos legales establecidos.
        </p>
    </InfoPageLayout>
);

export default SICPage;
