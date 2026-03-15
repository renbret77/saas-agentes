import { supabase } from "./supabase"

export type QuotaType = 'max_clients' | 'max_policies' | 'max_storage_mb'

export interface QuotaStatus {
    allowed: boolean
    current: number
    limit: number
    type: QuotaType
    message?: string
}

/**
 * Validates if an agency has reached its usage limit for a specific metric.
 */
export async function checkQuota(userId: string, type: QuotaType): Promise<QuotaStatus> {
    try {
        // 1. Get Agency and its limits
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select(`
                agency_id,
                agencies (
                    max_clients,
                    max_policies,
                    max_storage_mb
                )
            `)
            .eq('id', userId)
            .single()

        if (profileError || !profile?.agency_id) {
            return { allowed: true, current: 0, limit: 999999, type } // Fail safe for superadmins or unassigned users
        }

        const agency = profile.agencies as any
        const limit = agency[type] || 0

        // 2. Calculate current usage
        let current = 0

        if (type === 'max_clients') {
            const { count } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId) // Simplifying: counting per agent for now, or per agency if needed
            current = count || 0
        } 
        else if (type === 'max_policies') {
            const { count } = await supabase
                .from('policies')
                .select('*', { count: 'exact', head: true })
                .in('client_id', (
                    await supabase.from('clients').select('id').eq('user_id', userId)
                ).data?.map(c => c.id) || [])
            current = count || 0
        }

        const allowed = current < limit

        return {
            allowed,
            current,
            limit,
            type,
            message: allowed ? undefined : `Has alcanzado el límite de ${type.split('_')[1]} (${current}/${limit}). Adquiere un módulo de crecimiento para continuar.`
        }

    } catch (error) {
        console.error('Error checking quota:', error)
        return { allowed: true, current: 0, limit: 0, type }
    }
}
