"use server"

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// We create a custom server-side client to avoid session conflicts during signUp
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// We ideally need the SERVICE_ROLE_KEY to bypass RLS for creating users, 
// but if we only have ANON_KEY, we rely on the database triggers and RLS policies we set.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function inviteAssistant(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const agentId = formData.get("agent_id") as string
    const name = formData.get("name") as string

    // Note: Using Service Role Key is required for admin.createUser
    // If we only have Anon key, we use standard signUp
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    // 1. Create the user in Auth
    let userId = ""
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name, role: 'assistant' }
        })
        if (error) return { error: error.message }
        userId = data.user.id
    } else {
        const { data, error } = await supabaseAdmin.auth.signUp({
            email,
            password,
            options: { data: { full_name: name, role: 'assistant' } }
        })
        if (error) return { error: error.message }
        userId = data.user!.id
    }

    // 2. Update their profile to make them an assistant of this agent
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'assistant', parent_id: agentId })
        .eq('id', userId)

    if (profileError && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { error: "Created auth but failed to link profile: " + profileError.message }
    }

    // 3. Initialize default permissions
    const { error: permError } = await supabaseAdmin
        .from('assistant_permissions')
        .insert({
            assistant_id: userId,
            can_manage_clients: true,
            can_view_financials: false,
            can_manage_claims: true,
            can_manage_quotes: false
        })

    if (permError && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { error: "Failed to set default permissions: " + permError.message }
    }

    revalidatePath('/dashboard/admin/team')
    return { success: true }
}

export async function togglePermission(assistantId: string, permission: string, value: boolean) {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { error } = await supabaseAdmin
        .from('assistant_permissions')
        .update({ [permission]: value })
        .eq('assistant_id', assistantId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/admin/team')
    return { success: true }
}
