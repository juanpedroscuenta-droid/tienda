import React from 'react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

const MarcasPage = () => (
    <InfoPageLayout title="Nuestras Marcas" breadcrumb="Corporativo">
        <p>
            En <strong>24/7</strong> trabajamos con marcas nacionales e internacionales cuidadosamente seleccionadas
            por su calidad, innovación y confiabilidad. Nuestro objetivo es ofrecerte siempre lo mejor del mercado.
        </p>
        <h2>Marcas asociadas</h2>
        <ul>
            <li><strong>Fragancias selectas:</strong> Marcas reconocidas en perfumería nacional e importada.</li>
            <li><strong>Hogar y decoración:</strong> Productores locales con diseños modernos y funcionales.</li>
            <li><strong>Regalería:</strong> Líneas exclusivas para momentos especiales.</li>
        </ul>
        <h2>¿Quieres ser parte de nuestro catálogo?</h2>
        <p>
            Si representas una marca y deseas unirte a nuestra plataforma, escríbenos a <strong>contacto@regalaalgo.com</strong>.
            Evaluamos cada propuesta con atención y te responderemos en menos de 48 horas hábiles.
        </p>
    </InfoPageLayout>
);

export default MarcasPage;
