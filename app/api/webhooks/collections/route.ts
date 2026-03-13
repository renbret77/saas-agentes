import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCollectionMessage, PaymentMethod } from "@/lib/whatsapp-templates"

// Utiliza la llave secreta en lugar de la anónima si las políticas RLS son estrictas, 
// pero por fallback usa la anónima para desarrollo rápido
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xyzcompany.supabase.co"
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy_key"
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
    try {
        // 1. Verificación de Seguridad M2M (Machine to Machine)
        const authHeader = request.headers.get("authorization")
        // La llave debe ser configurada en Vercel. Si no está en .env, permitimos paso localmente, 
        // pero en producción exigiremos 'Bearer <N8N_API_KEY>'
        const expectedKey = process.env.N8N_API_KEY

        if (expectedKey) {
            // Check for case-insensitive 'bearer' handling
            const authPrefix = authHeader?.substring(0, 6)?.toLowerCase()
            const authToken = authHeader?.substring(7)?.trim()

            if (!authHeader || authPrefix !== 'bearer' || authToken !== expectedKey) {
                return NextResponse.json({ error: "Unauthorized access. Invalid N8N_API_KEY." }, { status: 401 })
            }
        } else {
            console.warn("N8N_API_KEY no detectada en entorno. Abriendo endpoint sin seguridad para pruebas.")
        }

        // 2. Extraccción de la información base
        const { data: policies, error } = await supabase
            .from('policies')
            .select(`
                id, 
                policy_number,
                premium_net, 
                premium_total,
                currency,
                start_date,
                end_date,
                payment_method,
                status,
                sub_branch,
                notes,
                total_installments,
                current_installment,
                payment_link,
                is_domiciled,
                policy_fee,
                surcharge_amount,
                discount_amount,
                vat_amount,
                clients (
                    first_name, 
                    last_name, 
                    phone,
                    additional_phones,
                    additional_emails,
                    profiles (country_code, default_currency)
                ),
                insurers (alias, name),
                insurance_lines (name)
            `)

        if (error) {
            throw error
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // 3. Procesamiento y Lógica Inteligente
        const notificationsToSent: any[] = []

        for (const policy of (policies || [])) {
            if (policy.status === 'Cancelada') continue

            const targetDate = new Date(policy.end_date)
            targetDate.setHours(0, 0, 0, 0)

            const diffTime = targetDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            // Supabase joins can return objects or arrays depending on schema mapping
            const clientRaw = policy.clients
            const client = Array.isArray(clientRaw) ? clientRaw[0] : clientRaw
            
            if (!client) continue

            const profileRaw = client.profiles
            const agentProfile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw
            
            const countryCode = agentProfile?.country_code || 'MX'
            const defaultCurrency = policy.currency || agentProfile?.default_currency || 'MXN'

            const clientName = client.first_name || 'Cliente'
            
            // --- Preparar Datos de Mensaje ---
            const insuranceLineRaw = policy.insurance_lines
            const insuranceLine = Array.isArray(insuranceLineRaw) ? insuranceLineRaw[0] : insuranceLineRaw
            const policyType = insuranceLine?.name || 'Seguro'

            const insurerRaw = policy.insurers
            const insurer = Array.isArray(insurerRaw) ? insurerRaw[0] : insurerRaw
            const insurerName = insurer?.alias || insurer?.name || 'Aseguradora'

            const amount = Number(policy.premium_total) || Number(policy.premium_net) || 0
            const paymentMethod = (policy.payment_method || 'Anual') as PaymentMethod

            let currencySymbol = '$'
            if (defaultCurrency === 'EUR') currencySymbol = '€'
            if (defaultCurrency === 'GBP') currencySymbol = '£'

            const messageStr = getCollectionMessage(
                clientName,
                policyType,
                insurerName,
                policy.policy_number,
                amount,
                paymentMethod,
                targetDate.toISOString(),
                policy.current_installment || 1,
                policy.total_installments || 1,
                0,
                policy.sub_branch,
                currencySymbol
            )

            if (!messageStr) continue

            const baseNotification = {
                policy_id: policy.id,
                client_name: clientName,
                message: messageStr,
                urgency_days: diffDays,
                payment_method: paymentMethod,
                is_domiciled: policy.is_domiciled,
                payment_link: policy.payment_link,
                receipt_number: `${policy.current_installment || 1}/${policy.total_installments || 1}`,
                currency: defaultCurrency
            }

            // --- Lógica de Telefonía Internacional (Helper) ---
            const formatPhone = (rawPhone: any) => {
                let p = (String(rawPhone || '')).replace(/\D/g, '')
                if (countryCode === 'MX') {
                    if (p.startsWith('52') && p.length === 12) p = '521' + p.substring(2)
                    else if (p.length === 10) p = '521' + p
                }
                return p
            }

            // 1. Canal Principal (WhatsApp)
            const mainPhone = formatPhone(client.phone)
            if (mainPhone) {
                notificationsToSent.push({ ...baseNotification, phone: mainPhone, channel: 'whatsapp' })
            }

            // 2. Canales Adicionales (WhatsApp)
            const additionalPhones = (client.additional_phones as any[]) || []
            additionalPhones.forEach(ap => {
                if (ap.notify && ap.phone) {
                    const p = formatPhone(ap.phone)
                    if (p) notificationsToSent.push({ ...baseNotification, phone: p, channel: 'whatsapp', recipient_name: ap.name })
                }
            })

            // 3. Canales de Email
            const additionalEmails = (client.additional_emails as any[]) || []
            additionalEmails.forEach(ae => {
                if (ae.notify && ae.email) {
                    notificationsToSent.push({ ...baseNotification, email: ae.email, channel: 'email', recipient_name: ae.name })
                }
            })
        }

        // 4. Retornar el volumen limpio a N8N
        return NextResponse.json({
            success: true,
            total_notifications: notificationsToSent.length,
            timestamp: new Date().toISOString(),
            data: notificationsToSent
        })

    } catch (err: any) {
        console.error("Error en Webhook Collections:", err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
