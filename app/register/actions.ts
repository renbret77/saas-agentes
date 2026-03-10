"use server"

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function registerFreeAgency(formData: FormData) {
    const agencyName = formData.get("agency_name") as string
    const adminEmail = formData.get("admin_email") as string
    const adminPassword = formData.get("admin_password") as string

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    // 1. Validaciones
    if (!agencyName || !adminEmail || !adminPassword) {
        return { error: "Faltan datos obligatorios." }
    }

    // 2. Determinar si es cuenta de prueba para auto-activarla
    const isTestAccount = /^prueba([1-9]|1[0-9]|20)@admin\.com$/.test(adminEmail);
    const initialStatus = isTestAccount ? 'active' : 'pending';

    // 3. Crear Agencia Free
    const maxUsers = 1;
    const maxClients = 20;

    const { data: newAgency, error: agencyError } = await supabaseAdmin
        .from('agencies')
        .insert({
            name: agencyName,
            license_type: 'free',
            status: initialStatus,
            max_users: maxUsers,
            max_clients: maxClients,
            max_policies: maxClients
        })
        .select('id')
        .single()

    if (agencyError || !newAgency) return { error: "Error creando Agencia: " + agencyError?.message }

    const agencyId = newAgency.id

    // 4. Crear el Agente (Dueño) en Authentication usando Service Key para saltar el email confirm
    let userId = ""
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { full_name: adminEmail.split('@')[0], role: 'admin' }
        })
        if (authError) return { error: "Agencia creada pero error en Auth: " + authError.message }
        userId = data.user.id
    } else {
        const { data, error: signUpError } = await supabaseAdmin.auth.signUp({
            email: adminEmail,
            password: adminPassword,
            options: { data: { full_name: adminEmail.split('@')[0], role: 'admin' } }
        })
        if (signUpError) return { error: "Error de registro: " + signUpError.message }
        userId = data.user!.id
    }

    // 5. Ligar Perfil a la Agencia
    await supabaseAdmin
        .from('profiles')
        .update({
            role: 'admin',
            agency_id: agencyId,
            requires_daily_mfa: true // Cuentas free siempre requieren MFA según las reglas
        })
        .eq('id', userId)

    return { success: true, isTestAccount }
}
