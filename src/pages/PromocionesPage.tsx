import React from 'react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

const PromocionesPage = () => (
    <InfoPageLayout title="Términos y Condiciones de Promociones" breadcrumb="Corporativo · Legal">
        <div className="space-y-8 text-slate-700 pb-12">
            <header className="border-b border-slate-200 pb-4">
                <p className="text-sm text-slate-500 italic">Última actualización: enero de 2025</p>
                <p className="mt-4 text-lg leading-relaxed">
                    En <strong>24/7 Repuestos</strong>, valoramos la transparencia. Las siguientes disposiciones regulan todas las ofertas,
                    descuentos y actividades promocionales realizadas a través de nuestra plataforma digital y canales oficiales.
                    Al participar en nuestras promociones, el usuario acepta de manera íntegra estos términos.
                </p>
            </header>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">1. Ámbito de Aplicación</h2>
                <p className="leading-relaxed">
                    Estos términos aplican exclusivamente a las compras realizadas en el sitio oficial de 24/7. Las promociones
                    vigentes en canales físicos o distribuidores autorizados pueden variar y no son vinculantes para la tienda virtual,
                    a menos que se especifique lo contrario.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">2. Vigencia y Temporalidad</h2>
                <p className="leading-relaxed">
                    Toda actividad promocional tiene una duración limitada. El inicio y fin de la misma se comunicará mediante banners,
                    relojes de cuenta regresiva o en la descripción del producto. 24/7 procesará las órdenes según la hora legal de Colombia.
                    Cualquier pedido iniciado antes o después de los límites de tiempo establecidos no gozará del beneficio promocional.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">3. Disponibilidad de Inventario (Stock)</h2>
                <p className="leading-relaxed mb-4">
                    Nuestras ofertas están sujetas a la disponibilidad de existencias reales en bodega. La inclusión de un producto en
                    el carrito de compras no garantiza la reserva del mismo ni el precio promocional.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm italic">
                    <li>Si el inventario se agota durante el proceso de pago, el sistema cancelará automáticamente el beneficio.</li>
                    <li>No se realizan "lluvias de sobres" o reservas manuales sobre productos en liquidación.</li>
                    <li>24/7 se reserva el derecho de limitar la cantidad de unidades vendidas por cliente o por pedido.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">4. Exclusiones y Restricciones</h2>
                <p className="leading-relaxed mb-4">Para garantizar una competencia justa y el acceso de todos los usuarios, aplicamos las siguientes reglas:</p>
                <ul className="list-disc pl-5 space-y-3">
                    <li><strong>No Acumulación:</strong> Los descuentos de campañas específicas (como "Cyber Monday" o "Aniversario") no se suman a otros cupones o beneficios activos.</li>
                    <li><strong>Pedidos Anteriores:</strong> El beneficio de una nueva promoción no tiene efecto retroactivo sobre compras ya facturadas o en proceso de envío.</li>
                    <li><strong>Mayoristas:</strong> Los precios de promoción están destinados al consumidor final. Si se detecta un comportamiento de compra masiva con fines de reventa, 24/7 podrá anular la transacción.</li>
                    <li><strong>Marcas Excluidas:</strong> Algunas marcas premium o repuestos de alta gama pueden estar excluidos de descuentos generales por políticas del fabricante.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">5. Errores Manifiestos en Precios</h2>
                <p className="leading-relaxed border-l-4 border-amber-500 pl-4 bg-amber-50 py-2">
                    En caso de que un producto sea publicado con un precio incorrecto debido a un error tipográfico, técnico o de sistema
                    (por ejemplo, un costo de $0 o un descuento desproporcionado del 99% que no corresponda a la realidad del mercado),
                    <strong> 24/7 se reserva el derecho de cancelar la orden</strong>, reembolsando el dinero al usuario en su totalidad.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">6. Cupones y Códigos de Descuento</h2>
                <p className="leading-relaxed">
                    Los códigos deben ingresarse en el campo correspondiente antes de finalizar la transacción. No es posible aplicar
                    cupones manualmente después de que el pago ha sido procesado. Cada cupón tiene sus propias reglas de uso (monto mínimo
                    de compra, categorías específicas o único uso por usuario).
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">7. Cambios y Devoluciones de Productos en Oferta</h2>
                <p className="leading-relaxed mb-4">
                    Los productos adquiridos en promoción conservan su garantía legal por defectos de fábrica. Sin embargo:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>En cambios por gusto o error del cliente (compatibilidad), se reconocerá el valor pagado en la factura, no el precio comercial vigente al momento del cambio.</li>
                    <li>Los costos de envío por devoluciones no relacionadas con garantía corren por cuenta del comprador.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">8. Contacto y Soporte</h2>
                <p className="leading-relaxed mb-4">
                    Si tienes dudas sobre el funcionamiento de una oferta o crees que se aplicó un descuento incorrecto,
                    nuestro equipo de soporte comercial está listo para ayudarte:
                </p>
                <div className="bg-slate-100 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <p className="text-sm font-bold uppercase text-slate-500">Correo Electrónico</p>
                        <p className="text-blue-700 font-bold">promociones@repuestos247.com</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold uppercase text-slate-500">Horario de Atención</p>
                        <p className="text-slate-700">Lunes a Viernes: 8:00 AM - 6:00 PM</p>
                    </div>
                </div>
            </section>
        </div>
    </InfoPageLayout>
);

export default PromocionesPage;
