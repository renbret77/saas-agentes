import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

// Use require for pdf-parse to avoid ESM/TypeScript default import issues in Next.js
const pdf = require("pdf-parse")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseKey)
        const formData = await req.formData()
        const files = formData.getAll("files") as File[]

        const { data: { user }, error: authError } = await supabase.auth.getUser(
            req.headers.get("Authorization")?.split(" ")[1] || ""
        )

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
        }

        // 0. Verificar y Descontar Créditos IA
        const { data: hasCredits, error: creditError } = await (supabase
            .rpc('spend_ai_credits', {
                p_action_type: 'quote_parse',
                p_cost: 1,
                p_metadata: { files_count: files.length }
            }) as any)

        if (creditError || !hasCredits) {
            return NextResponse.json({ error: "Créditos de IA insuficientes o error al procesar" }, { status: 402 })
        }

        // 1. Crear la Sesión de Cotización
        const { data: session, error: sessionError } = await (supabase
            .from("quote_sessions") as any)
            .insert({
                agency_id: user.user_metadata?.agency_id || (user as any).agency_id,
                agent_id: user.id,
                project_title: `Cotización ${new Date().toLocaleDateString('es-MX')}`,
                insurance_line: "GMM / Autos"
            })
            .select()
            .single()

        if (sessionError) throw sessionError

        const results = await Promise.all(
            files.map(async (file) => {
                const buffer = Buffer.from(await file.arrayBuffer())
                const data = await pdf(buffer)
                const text = data.text

                // 2. Extraer con IA
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `Eres un experto actuario de seguros en México. 
                            Tu tarea es extraer datos estructurados de una cotización de seguros en PDF.
                            Devuelve un JSON con el siguiente esquema:
                            {
                                "insurer": "Nombre de la aseguradora",
                                "policy_holder": "Nombre del prospecto",
                                "premium_total": number,
                                "currency": "MXN" | "USD",
                                "data": {
                                    "deductible": "string",
                                    "co-insurance": "string",
                                    "sum_insured": "string",
                                    "coverage_highlights": ["string"]
                                }
                            }`
                        },
                        {
                            role: "user",
                            content: `Extrae la información de este texto: \n\n${text.substring(0, 15000)}`
                        }
                    ],
                    response_format: { type: "json_object" }
                })

                const content = JSON.parse(response.choices[0].message.content || "{}")

                // 3. Guardar el Item Individual
                await (supabase.from("quote_items") as any).insert({
                    session_id: (session as any).id,
                    insurer_name: content.insurer,
                    parsed_data: content,
                    premium_total: content.premium_total,
                    currency: content.currency || "MXN"
                })

                return content
            })
        )

        return NextResponse.json({ success: true, results, sessionId: (session as any).id })
    } catch (error: any) {
        console.error("Error parsing quote:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
