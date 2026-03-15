import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
    try {
        const { addon_type } = await req.json()
        
        if (!addon_type) {
            return NextResponse.json({ error: "No addon specified" }, { status: 400 })
        }

        // 1. Get current user session
        const authHeader = req.headers.get("Authorization")
        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader?.split(" ")[1] || ""
        )

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Get User Agency
        const { data: profile } = await supabase
            .from('profiles')
            .select('agency_id, role')
            .eq('id', user.id)
            .single()

        if (!profile?.agency_id || profile.role !== 'admin') {
            return NextResponse.json({ error: "Only agency admins can activate modules" }, { status: 403 })
        }

        // 3. Activate Addon (Upsert into agency_addons)
        // In a real scenario, this would involve a Stripe checkout session
        // For now, we simulate activation for the demo
        const { data, error } = await supabase
            .from('agency_addons')
            .upsert({
                agency_id: profile.agency_id,
                addon_type: addon_type,
                status: 'active',
                updated_at: new Date().toISOString()
            }, { onConflict: 'agency_id, addon_type' })

        if (error) throw error

        return NextResponse.json({ success: true, message: `Módulo ${addon_type} activado con éxito.` })

    } catch (error: any) {
        console.error("[Marketplace API Error]", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
