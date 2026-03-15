import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { transcribeAudio, processVoiceCommand } from "@/lib/ai-capataz"

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const textCommand = formData.get('text') as string

        let text = textCommand

        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer())
            text = await transcribeAudio(buffer)
        }

        if (!text) {
            return NextResponse.json({ error: "No text or audio provided" }, { status: 400 })
        }

        const analysis = await processVoiceCommand(text)

        // Ejecutar acción en la DB si aplica
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        let executionResult = null

        if (analysis.intent === 'agenda') {
            const { data, error } = await supabase
                .from('critical_tasks')
                .insert({
                    title: analysis.summary,
                    due_date: analysis.action_params?.date || new Date().toISOString(),
                    status: 'Pending',
                    priority: 'high',
                    user_id: (await supabase.auth.getUser()).data.user?.id // Fallback needed if called from web without auth context
                })
            executionResult = { type: 'task', success: !error, data }
        } else if (analysis.intent === 'nota') {
            // Lógica para guardar nota en cliente si tenemos el nombre
            executionResult = { type: 'note', success: true, message: "Nota guardada mentalmente por Capataz (Módulo en desarrollo)" }
        }

        return NextResponse.json({ 
            success: true, 
            text, 
            analysis,
            executionResult
        })

    } catch (error: any) {
        console.error("Voice Process Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
