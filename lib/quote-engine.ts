export interface QuoteData {
    vehicleName: string
    modelYear: number
    basePremium: number
    valorConvenido: number
    valorComercial: number
    discount: number
    paymentFrequency: 'contado' | 'semestral' | 'trimestral' | 'mensual'
}

export class QuoteEngine {
    // Gastos de expedición fijos reales de Quálitas según cotizaciones proporcionadas
    static readonly GASTOS_EXP = 670
    static readonly IVA_RATE = 0.16
    /**
     * Coberturas que NO llevan Descuento Comercial (45%)
     * Estas son las ÚNICAS que quedan fuera según el PDF FULL.
     */
    static readonly NO_DISCOUNT_COVERAGES = [
        'asistencia', 
        'asistencia_vial',
        'asistencia_plus', 
        'auto_sustituto', 
        'auto_agencia'
    ]

    static calculateFullInvoice(
        coverages: { id: string, premium: number }[],
        discount: number = 0,
        frequency: QuoteData['paymentFrequency'] = 'contado'
    ) {
        // Asegurar que el descuento comercial sea un entero
        const cleanDiscount = Math.round(discount)

        // 1. Clasificar coberturas para el Descuento Comercial
        const discountable = coverages.filter(c => !this.NO_DISCOUNT_COVERAGES.includes(c.id))
        const nonDiscountable = coverages.filter(c => this.NO_DISCOUNT_COVERAGES.includes(c.id))

        // 2. Sumar primas
        const sumDiscountable = discountable.reduce((acc, c) => acc + c.premium, 0)
        const sumNonDiscountable = nonDiscountable.reduce((acc, c) => acc + c.premium, 0)

        // 3. Aplicar Descuento Comercial (solo a elegibles)
        const netDiscountable = sumDiscountable * (1 - (cleanDiscount / 100))
        
        // 4. Prima Neta Base (Suma de todo tras descuento comercial)
        const primaNetaBase = netDiscountable + sumNonDiscountable

        // 5. Tasa Financiera (Universal: Aplica a TODO)
        // - Contado: -2% (Descuento real identificado)
        // - Semestral/Trimestral/Mensual: Recargos
        const surcharges = {
            'contado': -0.02,
            'semestral': 0.024,
            'trimestral': 0.048,
            'mensual': 0.064
        }
        
        // Aplica al total de la Prima Neta Base
        const tasaFin = primaNetaBase * surcharges[frequency]

        // 6. Cálculo Final
        const subtotal = primaNetaBase + tasaFin + this.GASTOS_EXP
        const iva = subtotal * this.IVA_RATE
        const total = subtotal + iva

        return {
            primaNeta: Number(primaNetaBase.toFixed(2)),
            tasaFin: Number(tasaFin.toFixed(2)),
            gastosExp: this.GASTOS_EXP,
            subtotal: Number(subtotal.toFixed(2)),
            iva: Number(iva.toFixed(2)),
            total: Number(total.toFixed(2)),
            effectiveDiscount: cleanDiscount
        }
    }

    /**
     * Ingeniería Inversa: Descubre el descuento aplicado leyendo PN base y PN final
     * Descuento ≈ 1 - (PN_final / PN_base)
     */
    static reverseEngineerDiscount(pnBase: number, pnFinal: number): number {
        if (pnBase === 0) return 0
        const disc = (1 - (pnFinal / pnBase)) * 100
        return Math.round(disc)
    }

    static getMockQuote(): QuoteData {
        return {
            vehicleName: "FORD EXPLORER XLT 2020",
            modelYear: 2020,
            basePremium: 28392.43, // Prima Neta Base del PDF (Sin descuento)
            valorConvenido: 608350,
            valorComercial: 441000, // Libro Azul
            discount: 45,           // Descuento Master
            paymentFrequency: 'contado'
        }
    }

    /**
     * Datos reales de la cotización "FULL" (1112804048)
     * Estos valores son los que obtendrá el RPA
     */
    static getFullQuoteCoverages() {
        return [
            // Coberturas Básicas (Estandar)
            { id: 'dmg', name: 'Daños Materiales', premium: 8913.94, standard: true },
            { id: 'rob_t', name: 'Robo Total', premium: 11466.58, standard: true },
            { id: 'rc', name: 'Resp. Civil', premium: 6212.88, standard: true },
            { id: 'leg', name: 'Gastos Legales', premium: 464.00, standard: true },
            { id: 'med', name: 'Gastos Médicos', premium: 606.23, standard: true },
            { id: 'asistencia', name: 'Asistencia Vial', premium: 599.00, standard: true },
            { id: 'death', name: 'Muerte Conductor', premium: 129.81, standard: true },
            
            // Coberturas Adicionales (Opcionales)
            { id: 'rob_p', name: 'Robo Parcial', premium: 2530.19, standard: false },
            { id: 'cade', name: 'CADE', premium: 5420.40, standard: false },
            { id: 'exencion', name: 'Exención Deducible RT', premium: 8130.79, standard: false },
            { id: 'llantas', name: 'Llantas', premium: 2688.71, standard: false },
            { id: 'rines', name: 'Rines', premium: 2912.11, standard: false },
            { id: 'agencia', name: 'Reparación en Agencia', premium: 1746.24, standard: false },
            { id: 'sustituto', name: 'Auto Sustituto', premium: 813.66, standard: false },
            { id: 'rc_ext', name: 'Extensión RC', premium: 382.00, standard: false },
            { id: 'rc_viajero', name: 'RC Complementaria Personas', premium: 600.96, standard: false },
        ]
    }

    /**
     * Datos reales del multicotizador Click Seguros
     */
    static getComparisonData() {
        return [
            { 
                name: 'CHUBB', 
                normal: 24268.00,
                total: 13347.77, 
                discount: 45,
                coverage: 'Amplia', 
                value: 'Comercial',
                standardCoverages: ['DM', 'RT', 'RC', 'Legales', 'GM']
            },
            { 
                name: 'HDI SEGUROS', 
                normal: 33068.00,
                total: 19841.01, 
                discount: 40,
                coverage: 'Amplia', 
                value: 'Comercial',
                standardCoverages: ['DM', 'RT', 'RC', 'Legales', 'GM', 'Asist']
            },
            { 
                name: 'AFIRME', 
                normal: 36343.00,
                total: 21806.27, 
                discount: 40,
                coverage: 'Amplia', 
                value: 'Comercial',
                standardCoverages: ['DM', 'RT', 'RC', 'Legales', 'GM']
            },
        ]
    }
}
