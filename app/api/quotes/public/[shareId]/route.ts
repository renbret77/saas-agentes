import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ shareId: string }> }) {
    try {
        const { shareId } = await params
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

        console.log(`[PublicAPI] Fetching shareId: ${shareId}`)

        if (!supabaseUrl || !supabaseKey) {
            console.error("[PublicAPI] Missing environment variables")
            return NextResponse.json({ error: "Server missing config" }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Fetch Session
        const { data: session, error: sessionError } = await (supabase
            .from('quote_sessions') as any)
            .select('*')
            .eq('public_share_id', shareId)
            .single()

        if (sessionError || !session) {
            console.error(`[PublicAPI] Session not found for ID: ${shareId}`, sessionError)
            return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
        }

        // 2. Fetch Agency (Optional/Resilient)
        if (session.agency_id) {
            const { data: agencyData } = await (supabase
                .from('agencies') as any)
                .select('name, logo_url')
                .eq('id', session.agency_id)
                .single()
            
            if (agencyData) {
                session.agencies = agencyData
            }
        }

        // 3. Fetch Items
        const { data: items, error: itemsError } = await (supabase
            .from('quote_items') as any)
            .select('*')
            .eq('session_id', session.id)
            .order('premium_total', { ascending: true })

        if (itemsError) {
            console.error("[PublicAPI] Error fetching items", itemsError)
            return NextResponse.json({ error: "Error recuperando detalles" }, { status: 500 })
        }

        return NextResponse.json({ success: true, session, items })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
