"use server"

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function createAgencyAndAdmin(formData: FormData) {
    const agencyName = formData.get("agency_name") as string
    const licenseType = formData.get("license_type") as string
    const adminEmail = formData.get("admin_email") as string
    const adminPassword = formData.get("admin_password") as string
    const adminPhone = formData.get("admin_phone") as string
    const cnsfLicense = formData.get("cnsf_license") as string

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    // 1. Validaciones previas para anti-abuso (Teléfono y CNSF únicos)
    if (adminPhone) {
        const { data: phoneCheck } = await supabaseAdmin.from('agencies').select('id').eq('admin_phone', adminPhone).single()
        if (phoneCheck) return { error: "Este número de teléfono ya está asociado a otra Promotoría/Agencia." }
    }

    if (cnsfLicense) {
        const { data: cnsfCheck } = await supabaseAdmin.from('agencies').select('id').eq('cnsf_license', cnsfLicense).single()
        if (cnsfCheck) return { error: "Esta cédula de la CNSF ya está registrada en otra cuenta." }
    }

    // 2. Crear Agencia
    const maxUsers = licenseType === 'free' ? 1 : licenseType === 'pro' ? 10 : 100;
    const maxClients = licenseType === 'free' ? 20 : 99999;

    const { data: newAgency, error: agencyError } = await supabaseAdmin
        .from('agencies')
        .insert({
            name: agencyName,
            license_type: licenseType,
            status: licenseType === 'free' ? 'pending' : 'active',
            admin_phone: adminPhone || null,
            cnsf_license: cnsfLicense || null,
            max_users: maxUsers,
            max_clients: maxClients,
            max_policies: maxClients // Simplificamos: límites iguales por ahora
        })
        .select('id')
        .single()

    if (agencyError || !newAgency) return { error: "Error creando Agencia: " + agencyError?.message }

    const agencyId = newAgency.id

    // 3. Crear el Agente (Dueño) en Authentication
    let userId = ""
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { full_name: `Admin de ${agencyName}`, role: 'admin' }
        })
        if (authError) return { error: "Agencia creada pero error en Auth: " + authError.message }
        userId = data.user.id
    } else {
        const { data, error: signUpError } = await supabaseAdmin.auth.signUp({
            email: adminEmail,
            password: adminPassword,
            options: { data: { full_name: `Admin de ${agencyName}`, role: 'admin' } }
        })
        if (signUpError) return { error: "Error de registro: " + signUpError.message }
        userId = data.user!.id
    }

    // 4. Ligar Perfil a la Agencia
    await supabaseAdmin
        .from('profiles')
        .update({
            role: 'admin',
            agency_id: agencyId,
            requires_daily_mfa: licenseType === 'free'  // Regla MFA para cuentas Free
        })
        .eq('id', userId)

    revalidatePath('/dashboard/superadmin')
    return { success: true }
}


export async function updateAgencyStatus(agencyId: string, status: string) {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { error } = await supabaseAdmin
        .from('agencies')
        .update({ status })
        .eq('id', agencyId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/superadmin')
    return { success: true }
}

export async function addAgencyCredits(agencyId: string, amount: number) {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // 1. Encontrar al admin de la agencia para recargar sus créditos individuales
    // (En este modelo, los créditos viven en user_credits ligados al user_id del admin)
    const { data: adminProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('agency_id', agencyId)
        .eq('role', 'admin')
        .single()

    if (profileError || !adminProfile) {
        return { error: "No se encontró un administrador para esta agencia." }
    }

    // 2. Incrementar créditos usando una función RPC o directamente si existe la fila
    // Buscamos si ya tiene fila en user_credits
    const { data: currentCredits } = await supabaseAdmin
        .from('user_credits')
        .select('balance')
        .eq('user_id', adminProfile.id)
        .single()

    if (currentCredits) {
        const { error: updateError } = await supabaseAdmin
            .from('user_credits')
            .update({ balance: (currentCredits.balance || 0) + amount })
            .eq('user_id', adminProfile.id)
        
        if (updateError) return { error: updateError.message }
    } else {
        const { error: insertError } = await supabaseAdmin
            .from('user_credits')
            .insert({ user_id: adminProfile.id, balance: amount })
        
        if (insertError) return { error: insertError.message }
    }

    revalidatePath('/dashboard/superadmin')
    return { success: true }
}
