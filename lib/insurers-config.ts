/**
 * Insurer Specific Rules and Payment Methods
 */

export interface InsurerConfig {
    id: string;
    name: string;
    installmentRule: 'standard' | 'first_payment_heavy' | 'prorated_surcharge';
    paymentMethods: {
        type: 'link' | 'bank' | 'portal' | 'phone';
        label: string;
        instructions: string;
        url?: string;
    }[];
    recommendations?: string[];
}

export const INSURERS_CONFIG: Record<string, InsurerConfig> = {
    // Quálitas
    '801ef4de-0485-4eba-977b-7b8f121e4f53': {
        id: '801ef4de-0485-4eba-977b-7b8f121e4f53',
        name: 'Quálitas',
        installmentRule: 'standard',
        paymentMethods: [
            { type: 'portal', label: 'Portal de Pagos Quálitas', instructions: 'Paga con tarjeta en su sitio oficial', url: 'https://www.qualitas.com.mx/web/qmx/pago-en-linea' },
            { type: 'phone', label: 'Call Center', instructions: 'Llama al 800 288 6700' }
        ],
        recommendations: ['En caso de siniestro llama al 800 800 2880', 'Ten a la mano tu número de póliza e inciso']
    },
    // Chubb (Ejemplo: Pago inicial mayor por derecho o seguro obligatorio)
    'chubb-uuid-template': {
        id: 'chubb-uuid-template',
        name: 'Chubb',
        installmentRule: 'first_payment_heavy',
        paymentMethods: [
            { type: 'portal', label: 'Chubb Pay', instructions: 'Pago express con tarjeta', url: 'https://www.chubb.com/mx-es/pagar-mi-poliza.html' }
        ]
    },
    // Seguros Monterrey (Ejemplo: Financiamiento prorrateado)
    'monterrey-uuid-template': {
        id: 'monterrey-uuid-template',
        name: 'Seguros Monterrey New York Life',
        installmentRule: 'prorated_surcharge',
        paymentMethods: [
            { type: 'portal', label: 'Portal de Clientes SMNYL', instructions: 'Ingresa con tu usuario y contraseña', url: 'https://conecta.smnyl.com.mx/' }
        ]
    }
};

export const getInsurerConfig = (id: string): InsurerConfig | undefined => {
    return INSURERS_CONFIG[id];
};
