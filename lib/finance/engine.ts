import { supabase } from "@/lib/supabase"

export interface CommissionRule {
    insurerId: string;
    lineId: string;
    percentage: number;
}

/**
 * Motor de Cálculo Financiero (El Liquidador)
 * Encargado de transformar primas en proyecciones de ingresos reales.
 */
export const FinancialEngine = {
    /**
     * Calcula la comisión estimada para una póliza
     */
    calculateEstimatedCommission: (premiumNet: number, rate: number): number => {
        return (premiumNet * rate) / 100;
    },

    /**
     * Obtiene la proyección de ingresos por comisiones para un rango de fecha
     */
    getCommissionProjection: async (userId: string, daysHead: number = 30) => {
        const { data, error } = await supabase
            .from('v_financial_cashflow_projection')
            .select('*')
            .eq('agent_id', userId)
            .lte('due_date', new Date(Date.now() + daysHead * 24 * 60 * 60 * 1000).toISOString());

        if (error) {
            console.error("Error fetching financial projection:", error);
            return [];
        }

        return data;
    },

    /**
     * Calcula la rentabilidad neta (Comisiones - Gasto Marketing)
     * @param commissions Total de comisiones cobradas
     * @param marketingSpend Gasto en Ads/Credits
     */
    calculateNetProfit: (commissions: number, marketingSpend: number): number => {
        return commissions - marketingSpend;
    }
}
