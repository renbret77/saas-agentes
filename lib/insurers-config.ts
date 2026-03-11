/**
 * Insurer Specific Rules and Payment Methods
 */

export interface InsurerConfig {
    id: string;
    name: string;
    installmentRule: 'standard' | 'first_payment_heavy' | 'prorated_surcharge';
    graceDaysFirst?: number; // Días de gracia 1er pago
    graceDaysSubsequent?: number; // Días de gracia subsecuentes
    paymentMethods: {
        type: 'link' | 'bank' | 'portal' | 'phone' | 'email';
        label: string;
        instructions: string;
        url?: string;
    }[];
    recommendations?: string[];
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
            { type: 'portal', label: 'Portal de Pagos Quálitas', instructions: 'Paga con tarjeta en su sitio oficial', url: 'https://www.qualitas.com.mx/web/qmx/pago-en-linea' },
            { type: 'phone', label: 'Call Center', instructions: 'Llama al 800 288 6700' }
        ],
        recommendations: ['En caso de siniestro llama al 800 800 2880', 'Ten a la mano tu número de póliza e inciso']
    },
    // Chubb
    'aba920310-dummy-chubb': {
        id: 'aba920310-dummy-chubb', // RFC base de la migración: ABA920310QW0
        name: 'Chubb',
        installmentRule: 'first_payment_heavy',
        graceDaysFirst: 30,
        graceDaysSubsequent: 30,
        paymentMethods: [
            { type: 'portal', label: 'Chubb Pay', instructions: 'Pago express con tarjeta', url: 'https://www.chubb.com/mx-es/pagar-mi-poliza.html' }
        ]
    },
    // Plan Seguro (Si no está en el mapa, usaremos estos valores por defecto para su nombre)
    'planseguro-template': {
        id: 'planseguro-template',
        name: 'Plan Seguro',
        installmentRule: 'standard',
        graceDaysFirst: 30,
        graceDaysSubsequent: 5,
        paymentMethods: [
            { type: 'portal', label: 'Portal Plan Seguro', instructions: 'Pago de primas en línea', url: 'https://www.planseguro.com.mx/' }
        ]
    }
};

export const getInsurerConfig = (id: string): InsurerConfig | undefined => {
    return INSURERS_CONFIG[id];
};
