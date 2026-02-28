import React from 'react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

const PromocionesPage = () => (
    <InfoPageLayout title="Términos y Condiciones de Promociones" breadcrumb="Corporativo · Legal">
        <p><em>Última actualización: enero de 2025</em></p>
        <p>
            Las promociones publicadas en el Sitio de <strong>24/7</strong> están sujetas a los siguientes términos
            y condiciones.
        </p>
        <h2>1. Vigencia</h2>
        <p>
            Cada promoción tendrá una fecha de inicio y fin claramente indicada al momento de su publicación.
            Los precios especiales solo aplican durante el período vigente.
        </p>
        <h2>2. Disponibilidad</h2>
        <p>
            Las promociones están sujetas a disponibilidad de inventario. Una vez agotado el stock, la oferta
            no podrá ser exigida ni aplicada a compras posteriores.
        </p>
        <h2>3. Restricciones</h2>
        <ul>
            <li>Los descuentos no son acumulables salvo indicación expresa.</li>
            <li>Las promociones no aplican a pedidos ya confirmados con anterioridad.</li>
            <li>Los precios en promoción no aplican para compras al por mayor sin previo acuerdo comercial.</li>
        </ul>
        <h2>4. Modificaciones</h2>
        <p>
            24/7 se reserva el derecho de cancelar, modificar o suspender cualquier promoción en cualquier momento,
            sin previo aviso, cuando existan razones técnicas, legales o comerciales que así lo justifiquen.
        </p>
        <h2>5. Contacto</h2>
        <p>Para aclaraciones sobre una promoción específica: contacto@regalaalgo.com</p>
    </InfoPageLayout>
);

export default PromocionesPage;
