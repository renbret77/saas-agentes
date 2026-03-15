import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { evolutionService } from "@/lib/evolution"
import { getCollectionMessage, getPreRenewalMessage } from "@/lib/whatsapp-templates"

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Obtener la agencia del usuario que dispara (podemos requerir Auth o API Key)
        // Por simplicidad en este MVP disparado desde Dashboard, asumimos que viene en el body o headers
        const { agencyId } = await req.json()

        if (!agencyId) {
            return NextResponse.json({ error: "agencyId is required" }, { status: 400 })
        }

        const results = {
            payments_sent: 0,
            renewals_sent: 0,
            errors: [] as string[]
        }

        // --- A. RECORDATORIOS DE PAGO (Próximos 3 días) ---
        const threeDaysFromNow = new Date()
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)

        const { data: installments } = await supabase
            .from('policy_installments')
            .select('*, policies(policy_number, branch, insurers(name), clients(first_name, phone, whatsapp))')
            .eq('status', 'Pending')
            .gte('due_date', tomorrow.toISOString().split('T')[0])
            .lte('due_date', threeDaysFromNow.toISOString().split('T')[0])

        if (installments) {
            for (const inst of installments) {
                const pol = inst.policies as any
                const client = pol.clients
                const phone = client.whatsapp || client.phone
                if (!phone) continue

                const message = getCollectionMessage(
                    client.first_name,
                    pol.branch || 'Seguro',
                    pol.insurers.name,
                    pol.policy_number,
                    inst.amount,
                    'Domiciliado', // Fallback
                    inst.due_date,
                    inst.installment_number,
                    inst.total_installments || 12,
                    30 // Default grace days
                )

                try {
                    // Aquí necesitamos el nombre de la instancia de la agencia
                    // Por ahora usamos una genérica o la buscamos en la tabla de agencias
                    const { data: agency } = await supabase.from('agencies').select('evolution_instance').eq('id', agencyId).single()
                    
                    if (agency?.evolution_instance) {
                        await evolutionService.sendMessage(agency.evolution_instance, `${phone}@s.whatsapp.net`, message)
                        results.payments_sent++
                        
                        // Marcar recordatorio enviado para evitar spam
                        // await supabase.from('policy_installments').update({ last_reminder_sent: new Date() }).eq('id', inst.id)
                    }
                } catch (err: any) {
                    results.errors.push(`Error enviando pago a ${phone}: ${err.message}`)
                }
            }
        }

        // --- B. RECORDATORIOS DE RENOVACIÓN (Próximos 30 días) ---
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

        const { data: renewals, error: renError } = await supabase
            .from('policies')
            .select('*, insurers(name), clients(first_name, phone, whatsapp)')
            .eq('status', 'Vigente')
            .gte('end_date', tomorrow.toISOString().split('T')[0])
            .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0])

        if (renewals) {
            for (const pol of renewals) {
                const client = (pol as any).clients
                const phone = client.whatsapp || client.phone
                if (!phone) continue

                const message = getPreRenewalMessage(
                    client.first_name,
                    pol.branch || 'Seguro',
                    pol.insurers.name,
                    pol.policy_number,
                    pol.end_date
                )

                try {
                    const { data: agency } = await supabase.from('agencies').select('evolution_instance').eq('id', agencyId).single()
                    if (agency?.evolution_instance) {
                        await evolutionService.sendMessage(agency.evolution_instance, `${phone}@s.whatsapp.net`, message)
                        results.renewals_sent++
                    }
                } catch (err: any) {
                    results.errors.push(`Error enviando renovación a ${phone}: ${err.message}`)
                }
            }
        }

        return NextResponse.json({ success: true, results })
    } catch (error: any) {
        console.error("Reminder Processing Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
