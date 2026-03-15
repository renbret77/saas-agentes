import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: "Config error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        const { name, need, pain, urgency, qualification, phone } = await req.json()

        const { data, error } = await supabase
            .from('prospects')
            .upsert({
                name,
                line_of_business: need,
                projected_value: 0, // Se definirá en el CRM
                stage: 'lead',
                phone: phone || 'Sin teléfono',
                notes: `INTELIGENCIA CAPATAZ:
                - Dolor: ${pain}
                - Urgencia: ${urgency}
                - Calificación: ${qualification}`
            }, { onConflict: 'phone' })
            .select()

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error("Save Lead Error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
