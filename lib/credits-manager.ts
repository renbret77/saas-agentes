import { supabase } from "./supabase"

export type CreditAction = 
    | 'policy_upload' 
    | 'whatsapp_notification' 
    | 'ai_renewal_suggestion'

const CREDIT_COSTS: Record<CreditAction, number> = {
    policy_upload: 1,
    whatsapp_notification: 0.2,
    ai_renewal_suggestion: 1
}

/**
 * Centrally manages agent/agency credits and licensing limits
 */
export const creditsManager = {
    /**
     * Checks if the user has enough credits or hasn't hit their license limit
     */
    async canPerform(action: CreditAction, agencyId: string): Promise<{ allowed: boolean, reason?: string }> {
        // 1. Get user/agency status
        const { data: agency } = await supabase
            .from('agencies')
            .select('license_type, policy_limit')
            .eq('id', agencyId)
            .single()

        // 2. Get current credits
        const { data: credits } = await supabase
            .from('user_credits')
            .select('balance')
            // This normally needs a user_id, assuming current session user for now
            // In a real scenario, we'd pass the user_id or use the agency's credit pool
            .single()

        const cost = CREDIT_COSTS[action]
        const balance = credits?.balance || 0

        if (balance < cost) {
            return { 
                allowed: false, 
                reason: `Créditos insuficientes (${balance}/${cost}). Por favor compra un Pack de Créditos.` 
            }
        }

        return { allowed: true }
    },

    /**
     * Consumes credits from the user balance
     */
    async consume(action: CreditAction, userId: string, agencyId: string): Promise<boolean> {
        const cost = CREDIT_COSTS[action]
        
        // This should be done via a Postgres Trigger or a secured RPC 
        // to prevent balance from going negative
        const { data, error } = await supabase.rpc('consume_user_credits', {
            p_user_id: userId,
            p_amount: cost,
            p_reason: `Action: ${action}`
        })

        if (error) {
            console.error("Error consuming credits:", error)
            return false
        }

        return true
    }
}
