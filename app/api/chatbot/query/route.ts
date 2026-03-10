import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Endpoint para que el Chatbot (n8n/Evolution API) consulte info de un cliente.
 * El bot enviará el número de teléfono del cliente que le escribe en WhatsApp.
 */
export async function POST(req: Request) {
    try {
        const { phone } = await req.json()

        if (!phone) {
            return NextResponse.json({ error: "Número de teléfono requerido" }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // 1. Buscar al cliente por teléfono
        // Limpiamos el teléfono del cliente (quitamos +, espacios, etc.)
        const cleanPhone = phone.replace(/\D/g, '').slice(-10) // Tomamos los últimos 10 dígitos

        const { data: clients, error: clientError } = await supabase
            .from('clients')
            .select(`
                id,
                first_name,
                last_name,
                policies (
                    policy_number,
                    status,
                    premium_total,
                    end_date,
                    insurers (name)
                )
            `)
            .ilike('phone', `%${cleanPhone}%`)
            .limit(1)

        if (clientError) throw clientError

        if (!clients || clients.length === 0) {
            return NextResponse.json({
                found: false,
                message: "No se encontró cliente con ese número."
            })
        }

        const client = clients[0]

        // 2. Formatear respuesta amigable para el bot
        return NextResponse.json({
            found: true,
            client_name: `${client.first_name} ${client.last_name}`,
            active_policies: client.policies?.filter((p: any) => p.status === 'Vigente').length || 0,
            summary: {
                policies: client.policies?.map((p: any) => ({
                    number: p.policy_number,
                    insurer: (p as any).insurers?.name,
                    expires: p.end_date,
                    status: p.status
                }))
            }
        })

    } catch (error: any) {
        console.error("Chatbot API Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
