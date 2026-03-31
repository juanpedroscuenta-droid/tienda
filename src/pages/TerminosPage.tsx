import React from 'react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

const TerminosPage = () => (
    <InfoPageLayout title="Términos y Condiciones del Sitio" breadcrumb="Corporativo · Legal">
        <p><em>Última actualización: enero de 2025</em></p>
        <p>
            Al utilizar el sitio web de <strong>24/7</strong> (en adelante, "el Sitio"), aceptas los presentes
            Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, te pedimos que no utilices el Sitio.
        </p>
        <h2>1. Uso del Sitio</h2>
        <p>
            El Sitio es de uso exclusivo para personas mayores de 18 años o con autorización de un adulto responsable.
            Está prohibido utilizarlo para fines ilegales, fraudulentos o que vulneren derechos de terceros.
        </p>
        <h2>2. Propiedad intelectual</h2>
        <p>
            Todo el contenido del Sitio (textos, imágenes, logos, diseños) es propiedad de <strong>24/7</strong>
            o de sus licenciantes, y está protegido por las leyes de propiedad intelectual vigentes en Colombia.
        </p>
        <h2>3. Responsabilidad</h2>
        <p>
            24/7 no se responsabiliza por daños derivados del uso incorrecto del Sitio, interrupciones técnicas,
            o contenido de terceros enlazado desde el mismo.
        </p>
        <h2>4. Modificaciones</h2>
        <p>
            Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios serán publicados
            en esta misma página y entrarán en vigor de inmediato.
        </p>
        <h2>5. Legislación aplicable</h2>
        <p>
            Este acuerdo se rige por las leyes de la República de Colombia. Cualquier controversia será resuelta
            ante los jueces competentes de Colombia.
        </p>
    </InfoPageLayout>
);

export default TerminosPage;
