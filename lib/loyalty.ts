import { supabase } from "./supabase"

export type ChurnRisk = 'low' | 'medium' | 'high' | 'critical'

export interface LoyaltyStats {
    totalPoints: number
    referralCode: string
    churnRisk: ChurnRisk
    daysSinceLastContact: number
}

export class LoyaltyService {
    /**
     * Calcula el riesgo de deserción (Churn Risk) de un cliente
     */
    static calculateChurnRisk(lastContactedAt: string | null, totalOverdue: number): { risk: ChurnRisk, days: number } {
        if (!lastContactedAt) return { risk: 'high', days: 999 }

        const lastContact = new Date(lastContactedAt)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - lastContact.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (totalOverdue > 0 && diffDays > 30) return { risk: 'critical', days: diffDays }
        if (diffDays > 180) return { risk: 'critical', days: diffDays }
        if (diffDays > 90) return { risk: 'high', days: diffDays }
        if (diffDays > 45) return { risk: 'medium', days: diffDays }
        
        return { risk: 'low', days: diffDays }
    }

    /**
     * Registra un nuevo referido para un cliente
     */
    static async registerReferral(referrerId: string, agentId: string, data: { name: string, phone?: string, email?: string, notes?: string }) {
        const { error } = await supabase
            .from('client_referrals')
            .insert({
                referrer_id: referrerId,
                agent_id: agentId,
                referred_name: data.name,
                referred_phone: data.phone,
                referred_email: data.email,
                notes: data.notes
            })

        if (error) throw error

        // Premiar al cliente con puntos iniciales por referir
        await this.addPoints(referrerId, 50, `Referido registrado: ${data.name}`)
    }

    /**
     * Añade puntos de lealtad a un cliente
     */
    static async addPoints(clientId: string, points: number, reason: string) {
        // 1. Log transition
        await supabase.from('loyalty_logs').insert({
            client_id: clientId,
            points: points,
            reason: reason
        })

        // 2. Update client total
        // Nota: En un entorno real esto sería una función RPC para asegurar atomicidad
        const { data: client } = await supabase
            .from('clients')
            .select('loyalty_points')
            .eq('id', clientId)
            .single()

        const newTotal = (client?.loyalty_points || 0) + points

        await supabase
            .from('clients')
            .update({ loyalty_points: newTotal })
            .eq('id', clientId)
    }

    /**
     * Obtiene el resumen de lealtad de un cliente
     */
    static async getClientLoyalty(clientId: string): Promise<LoyaltyStats | null> {
        const { data: client, error } = await supabase
            .from('clients')
            .select('loyalty_points, referral_code, last_contacted_at, policies(total_premium)') // Simplificado para el ejemplo
            .eq('id', clientId)
            .single()

        if (error || !client) return null

        // Calcular deuda (esto es simplificado, debería venir de una query real de installments)
        const totalOverdue = 0 // Placeholder

        const { risk, days } = this.calculateChurnRisk(client.last_contacted_at, totalOverdue)

        return {
            totalPoints: client.loyalty_points || 0,
            referralCode: client.referral_code || '',
            churnRisk: risk,
            daysSinceLastContact: days
        }
    }
}
