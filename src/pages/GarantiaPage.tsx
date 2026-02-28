import React from 'react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

const GarantiaPage = () => (
    <InfoPageLayout title="Garantía" breadcrumb="Asistencia">
        <p>
            Todos los productos vendidos en <strong>24/7</strong> cuentan con garantía legal mínima de un (1) año,
            conforme a las leyes de protección al consumidor vigentes en Colombia (Ley 1480 de 2011).
        </p>
        <h2>¿Qué cubre la garantía?</h2>
        <ul>
            <li>Defectos de fabricación</li>
            <li>Fallas en el funcionamiento del producto bajo uso normal</li>
            <li>Daños ocultos no evidentes al momento de la compra</li>
        </ul>
        <h2>¿Qué NO cubre la garantía?</h2>
        <ul>
            <li>Daños causados por mal uso o accidentes</li>
            <li>Productos con signos de manipulación, alteración o daño intencional</li>
            <li>Desgaste natural por uso</li>
            <li>Daños causados por voltaje incorrecto o agua</li>
        </ul>
        <h2>¿Cómo aplico la garantía?</h2>
        <p>
            Comunícate con nosotros antes de que expire el período de garantía, indicando tu número de orden y
            describiendo el problema. Puedes escribirnos a <strong>contacto@regalaalgo.com</strong> o al
            WhatsApp <strong>+57 321 2619434</strong>.
        </p>
    </InfoPageLayout>
);

export default GarantiaPage;
