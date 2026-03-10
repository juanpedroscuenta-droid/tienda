import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, AlertCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopPromoBar } from '@/components/layout/TopPromoBar';

// ePayco envía los parámetros de respuesta por query string en la URL de responseUrl
// Ref: https://docs.epayco.co/payments/checkout

type PaymentStatus = 'confirmed' | 'rejected' | 'pending' | 'failed' | 'unknown';

const STATUS_CONFIG: Record<PaymentStatus, {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    bg: string;
    color: string;
}> = {
    confirmed: {
        icon: <CheckCircle className="w-20 h-20 text-green-500" />,
        title: '¡Pago exitoso!',
        subtitle: 'Tu pedido ha sido confirmado. Te enviaremos los detalles a tu correo.',
        bg: 'bg-green-50',
        color: 'text-green-700',
    },
    pending: {
        icon: <Clock className="w-20 h-20 text-yellow-500" />,
        title: 'Pago en proceso',
        subtitle: 'Tu pago está siendo verificado. Te notificaremos cuando se confirme.',
        bg: 'bg-yellow-50',
        color: 'text-yellow-700',
    },
    rejected: {
        icon: <XCircle className="w-20 h-20 text-red-500" />,
        title: 'Pago rechazado',
        subtitle: 'Tu pago no fue aprobado. Verifica los datos de tu tarjeta e intenta de nuevo.',
        bg: 'bg-red-50',
        color: 'text-red-700',
    },
    failed: {
        icon: <AlertCircle className="w-20 h-20 text-orange-500" />,
        title: 'Error en el pago',
        subtitle: 'Ocurrió un error procesando tu pago. Por favor intenta de nuevo.',
        bg: 'bg-orange-50',
        color: 'text-orange-700',
    },
    unknown: {
        icon: <Clock className="w-20 h-20 text-gray-400" />,
        title: 'Estado desconocido',
        subtitle: 'No pudimos determinar el estado de tu pago. Contáctanos por WhatsApp.',
        bg: 'bg-gray-50',
        color: 'text-gray-600',
    },
};

export const PaymentResultPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [promoVisible, setPromoVisible] = useState(true);

    // ePayco pasa el código de respuesta como x_cod_respuesta
    // 1=Aceptada, 2=Rechazada, 3=Pendiente, 4=Fallida
    const codRespuesta = searchParams.get('x_cod_respuesta') || searchParams.get('cod_respuesta') || '';
    const refPayco = searchParams.get('x_ref_payco') || searchParams.get('ref_payco') || '';
    const amount = searchParams.get('x_amount') || searchParams.get('amount') || '';
    const transactionId = searchParams.get('x_transaction_id') || '';

    const getStatus = (cod: string): PaymentStatus => {
        switch (cod) {
            case '1': return 'confirmed';
            case '2': return 'rejected';
            case '3': return 'pending';
            case '4': return 'failed';
            case '6': return 'rejected'; // reversada
            default: return 'unknown';
        }
    };

    const status = getStatus(codRespuesta);
    const config = STATUS_CONFIG[status];

    return (
        <div className="min-h-screen bg-[#eaeded]">
            <TopPromoBar setPromoVisible={setPromoVisible} />

            <main className="max-w-xl mx-auto px-4 py-12 flex flex-col items-center">
                {/* Card de resultado */}
                <div className={`w-full rounded-2xl shadow-lg overflow-hidden ${config.bg} border border-white`}>
                    <div className="flex flex-col items-center text-center px-8 py-10 space-y-4">
                        {config.icon}
                        <h1 className={`text-2xl font-bold ${config.color}`}>{config.title}</h1>
                        <p className="text-gray-600 text-base leading-relaxed">{config.subtitle}</p>

                        {/* Detalles del pago */}
                        {(refPayco || amount || transactionId) && (
                            <div className="w-full bg-white/70 rounded-xl p-4 text-left space-y-2 text-sm text-gray-700 mt-2">
                                <p className="font-semibold text-gray-800 mb-2">Detalles de la transacción:</p>
                                {refPayco && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Referencia:</span>
                                        <span className="font-mono font-medium">{refPayco}</span>
                                    </div>
                                )}
                                {transactionId && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Transacción:</span>
                                        <span className="font-mono font-medium">{transactionId}</span>
                                    </div>
                                )}
                                {amount && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Monto:</span>
                                        <span className="font-bold text-gray-900">
                                            COP {Number(amount).toLocaleString('es-CO')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Acciones */}
                    <div className="px-8 pb-8 flex flex-col gap-3">
                        {status === 'rejected' || status === 'failed' ? (
                            <Button
                                onClick={() => navigate('/carrito')}
                                className="w-full bg-[#232f3e] hover:bg-[#131921] text-white rounded-full h-11"
                            >
                                Volver al carrito
                            </Button>
                        ) : (
                            <Button
                                onClick={() => navigate('/')}
                                className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] border border-[#fcd200] rounded-full h-11"
                            >
                                <ShoppingBag className="w-4 h-4 mr-2" />
                                Seguir comprando
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            onClick={() => navigate('/')}
                            className="w-full rounded-full h-10 text-[#007185] hover:text-[#c45500]"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Ir al inicio
                        </Button>
                    </div>
                </div>

                {/* Soporte */}
                <p className="mt-6 text-center text-sm text-gray-500">
                    ¿Tienes dudas? Contáctanos por{' '}
                    <a
                        href="https://wa.me/573212619434"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#25D366] font-semibold hover:underline"
                    >
                        WhatsApp
                    </a>
                </p>
            </main>
        </div>
    );
};
