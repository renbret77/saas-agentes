/**
 * Insurer Specific Rules and Payment Methods
 */

export interface InsurerConfig {
    id: string;
    name: string;
    installmentRule: 'standard' | 'first_payment_heavy' | 'prorated_surcharge';
    graceDaysFirst?: number; // Días de gracia 1er pago
    graceDaysSubsequent?: number; // Días de gracia subsecuentes
    policyFeeRule?: 'first_installment' | 'prorated';
    paymentMethods: {
        type: 'link' | 'bank' | 'portal' | 'phone' | 'email';
        label: string;
        instructions: string;
        url?: string;
    }[];
    recommendations?: string[];
    fractionalRates?: {
        semestral?: number;
        trimestral?: number;
        mensual?: number;
    };
    logoUrl?: string;
    manualExtraNotes?: string[];
}

export const INSURERS_CONFIG: Record<string, InsurerConfig> = {
    // Quálitas - ID Real detectado en logs previos
    '801ef4de-0485-4eba-977b-7b8f121e4f53': {
        id: '801ef4de-0485-4eba-977b-7b8f121e4f53',
        name: 'Quálitas',
        installmentRule: 'standard',
        graceDaysFirst: 14,
        graceDaysSubsequent: 0,
        paymentMethods: [
            { 
                type: 'portal', 
                label: 'Portal de Pagos Quálitas', 
                instructions: 'Ingresa tu número de póliza, llena tus datos de contacto y recibirás una liga de pago. Te sugerimos usar TARJETA DIGITAL desde tu App bancaria, ya que algunos bancos rechazan cobros en línea con tarjeta física por seguridad.', 
                url: 'https://www.qualitas.com.mx/web/qmx/pago-en-linea' 
            },
            { 
                type: 'bank', 
                label: 'App Bancaria - Pago de Servicios', 
                instructions: 'Desde tu App bancaria, busca "Pago de Servicios" y el Convenio CIE 1267639 (BBVA). Usa tu número de póliza como Referencia y el monto exacto del recibo.' 
            },
            { 
                type: 'phone', 
                label: 'Atención Telefónica - Cobranza', 
                instructions: 'Llama al 800 800 2021 para pago asistido o dudas. Horario: L-V 8:30 a 18:30 (Sábados no labora sistema de cobro).' 
            },
            { 
                type: 'portal', 
                label: 'App QMóvil Quálitas', 
                instructions: 'Descarga QMóvil para gestionar tus pólizas, ver recibos y pagar de forma inmediata.' 
            },
            { 
                type: 'bank', 
                label: 'Transferencia Directa (Concentradoras)', 
                instructions: 'Transferencias SPEI a nombre de Quálitas Cía de Seguros:\n• BBVA: 012180004466917308\n• HSBC: 021180041008041958\n• SANTANDER: 014180655000418584\nINDISPENSABLE enviar comprobante por este chat.' 
            }
        ],
        recommendations: [
            'USO DE UNIDAD: El uso (Particular, App/Plataforma, Reparto) debe coincidir con tu póliza. Un uso incorrecto puede invalidar tu cobertura.',
            'ADAPTACIONES: Declara siempre equipo especial (bola de remolque, estribos, burreras). Si no están en póliza, no están cubiertos.',
            'SINIESTROS: En caso de accidente, NO admitas responsabilidad. Espera a tu ajustador; es el único facultado para negociar.',
            'LICENCIA: Mantén tu licencia vigente y del tipo correcto. En camiones (>5t), conducir con licencia vencida DUPLICA el deducible.',
            'EQUIPO PESADO: Maneja con precaución de noche (23:00 - 05:00); en algunos riesgos el deducible puede aumentar o existir exclusiones.',
            'ALCOHOLEMIA: Evita conducir bajo influencia. En autos aumenta drásticamente el deducible; en camiones es EXCLUSIÓN total.',
            'Tus recibos con vigencia y lugares de convenio (OXXO, etc.) están al final de tu póliza PDF.'
        ],
        fractionalRates: {
            semestral: 6.5,
            trimestral: 8.5,
            mensual: 11.5
        },
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Qualitas_Logo.png'
    },
    // Chubb - ID Real detectado en DB
    '5d90964d-982f-4b64-9c0a-264f7f8156b4': {
        id: '5d90964d-982f-4b64-9c0a-264f7f8156b4',
        name: 'Chubb',
        installmentRule: 'first_payment_heavy',
        graceDaysFirst: 30,
        graceDaysSubsequent: 30,
        paymentMethods: [
            { 
                type: 'portal', 
                label: 'Chubb Pay (Oficial)', 
                instructions: 'Ingresa tu número de póliza e inciso para pagar con tarjeta de crédito o débito de forma segura.', 
                url: 'https://aba.chubb.com/pago-poliza' 
            },
            { 
                type: 'phone', 
                label: 'Atención Telefónica Chubb', 
                instructions: 'Llama al 800 223 2001 para asistencia en pagos y aclaraciones.' 
            }
        ],
        recommendations: [
            'COBERTURA: Verifica que el uso declarado sea el correcto para evitar rechazos en siniestros.',
            'PAGOS: En pólizas fraccionadas, el primer pago suele incluir derechos de póliza y es más elevado.',
            'APP: Descarga la App de Chubb para tener tu póliza digital siempre disponible.',
            'ASISTENCIA: Reporta cualquier incidente de inmediato al 800 00 24822.'
        ],
        fractionalRates: {
            semestral: 7.0,
            trimestral: 9.0,
            mensual: 12.0
        }
    },
    // Plan Seguro - ID Real detectado en DB
    '96820c98-0182-4688-bab3-8cfa243de9dc': {
        id: '96820c98-0182-4688-bab3-8cfa243de9dc',
        name: 'Plan Seguro',
        installmentRule: 'standard',
        graceDaysFirst: 30,
        graceDaysSubsequent: 5,
        paymentMethods: [
            { 
                type: 'portal', 
                label: 'Portal Plan Seguro', 
                instructions: 'Pago de primas en línea desde el portal oficial.', 
                url: 'https://www.planseguro.com.mx/' 
            }
        ]
    },
    // MAPRE MEXICO - ID Real detectado en DB
    'dcac780c-fc88-4f51-b847-a87f7a824769': {
        id: 'dcac780c-fc88-4f51-b847-a87f7a824769',
        name: 'Mapfre',
        installmentRule: 'standard', // Ahora prorratea el recargo financiero
        graceDaysFirst: 30,
        graceDaysSubsequent: 30,
        paymentMethods: [
            { 
                type: 'portal', 
                label: 'Portal de Pagos MAPFRE', 
                instructions: 'Ingresa tu número de póliza y referencia para pagar en línea.', 
                url: 'https://www.mapfre.com.mx/particulares/servicios-en-linea/pago-en-linea/' 
            }
        ],
        recommendations: [
            'DEDUCIBLE: En Mapfre, recuerda que el deducible puede variar según el taller (Agencia vs Multimarca).',
            'ASISTENCIA: Reporta al 800 0627 373 disponible 24/7.',
            'RECIBOS: Tus recibos de Mapfre vienen al final del PDF, el recargo financiero viene ya dividido.'
        ]
    },
    // Seguros Monterrey - ID Genérico
    'seguros-monterrey-id': {
        id: 'seguros-monterrey-id',
        name: 'Seguros Monterrey',
        installmentRule: 'standard',
        policyFeeRule: 'prorated',
        graceDaysFirst: 30,
        graceDaysSubsequent: 30,
        paymentMethods: [
            { 
                type: 'portal', 
                label: 'Portal Seguros Monterrey', 
                instructions: 'Ingresa a tu portal de cliente para realizar el pago de tu póliza.', 
                url: 'https://www.mnyl.com.mx/' 
            }
        ]
    }
};

export const getInsurerConfig = (id: string): InsurerConfig | undefined => {
    return INSURERS_CONFIG[id];
};
