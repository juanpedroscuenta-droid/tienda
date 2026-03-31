import React from 'react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

const HabeasDataPage = () => (
    <InfoPageLayout title="Habeas Data" breadcrumb="Corporativo · Legal">
        <p><em>Última actualización: enero de 2025</em></p>
        <p>
            En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia,
            <strong> 24/7</strong> informa su política de tratamiento de datos personales.
        </p>
        <h2>1. Responsable del tratamiento</h2>
        <p>
            <strong>24/7</strong> — contacto@regalaalgo.com — +57 321 2619434. Colombia.
        </p>
        <h2>2. Datos que recopilamos</h2>
        <ul>
            <li>Nombre completo</li>
            <li>Correo electrónico</li>
            <li>Número de teléfono</li>
            <li>Dirección de entrega</li>
            <li>Historial de compras</li>
        </ul>
        <h2>3. Finalidad del tratamiento</h2>
        <ul>
            <li>Procesar pedidos y envíos</li>
            <li>Comunicar el estado de las compras</li>
            <li>Enviar información de promociones (cuando el titular lo ha autorizado)</li>
            <li>Cumplir obligaciones legales y contables</li>
        </ul>
        <h2>4. Derechos del titular</h2>
        <p>
            El titular de los datos tiene derecho a conocer, actualizar, rectificar y suprimir la información
            que haya suministrado. Para ejercer estos derechos puede escribir a <strong>contacto@regalaalgo.com</strong>.
        </p>
        <h2>5. Transferencia de datos</h2>
        <p>
            Los datos no serán cedidos a terceros sin autorización del titular, salvo por obligación legal
            o para cumplir el servicio de entrega contratado.
        </p>
        <h2>6. Vigencia</h2>
        <p>
            Los datos serán conservados mientras dure la relación comercial y durante el tiempo que la ley exija.
        </p>
    </InfoPageLayout>
);

export default HabeasDataPage;
