import { supabase } from "./supabase"

export interface CRMStage {
    id: string
    label: string
    color: string
    order: number
}

export async function getCRMSettings() {
    const { data: session } = await supabase.auth.getSession()
    const userId = session?.session?.user?.id

    if (!userId) return null

    const { data, error } = await supabase
        .from('crm_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching CRM settings:", error)
        return null
    }

    return data
}

export async function saveCRMSettings(stages: CRMStage[]) {
    const { data: session } = await supabase.auth.getSession()
    const userId = session?.session?.user?.id

    if (!userId) throw new Error("User not authenticated")

    const { error } = await supabase
        .from('crm_settings')
        .upsert({
            user_id: userId,
            stages: stages,
            updated_at: new Date().toISOString()
        })

    if (error) throw error
    return true
}
