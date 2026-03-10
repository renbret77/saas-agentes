import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const pdf = require("pdf-parse");
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const openaiApiKey = process.env.OPENAI_API_KEY;

        if (!openaiApiKey || !supabaseServiceKey) {
            return NextResponse.json({
                error: "Faltan llaves de API (OpenAI o Supabase Service Role). Contacta a soporte."
            }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const openai = new OpenAI({ apiKey: openaiApiKey });

        // 1. Descontar Créditos (Gasto: 2 créditos por lectura de póliza)
        const { data: creditSpent, error: creditError } = await (supabase.rpc('spend_ai_credits', {
            p_action_type: 'parse_policy_v2',
            p_cost: 2,
            p_metadata: { file_name: file.name }
        }) as any);

        if (creditError || !creditSpent) {
            return NextResponse.json({
                error: creditError?.message || "No tienes créditos suficientes para procesar pólizas con IA."
            }, { status: 403 });
        }

        // 2. Extraer texto del PDF
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfData = await pdf(buffer);
        const extractedText = pdfData.text;

        if (!extractedText || extractedText.trim().length === 0) {
            return NextResponse.json({ error: "No se pudo extraer texto del PDF (posiblemente escaneado como imagen)" }, { status: 400 });
        }

        // 3. Analizar con OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Eres un experto actuario de seguros en México. 
                    Tu tarea es extraer datos estructurados de una carátula de póliza de seguros en PDF.
                    
                    MAPEO DE CAMPOS (Devuelve null si no existe):
                    - policy_number: Número de póliza.
                    - insurer_name: Nombre de la aseguradora (ej. GNP, Chubb, Monterrey).
                    - client_name: Nombre completo del asegurado o contratante.
                    - agent_name: Nombre del agente.
                    - agent_code: Clave o número de agente.
                    - start_date: Inicio de vigencia en formato ISO (YYYY-MM-DD).
                    - end_date: Fin de vigencia en formato ISO (YYYY-MM-DD).
                    - currency: "MXN", "USD", "EUR" o "UDI".
                    - payment_method: "Contado", "Semestral", "Trimestral" o "Mensual".
                    - premium_net: Prima neta (número).
                    - policy_fee: Gasto de expedición / Derecho de póliza (número).
                    - surcharge_amount: Recargo financiero (número).
                    - vat_amount: IVA (generalmente 16%) (número).
                    - premium_total: Prima total (número).

                    Responde UNICAMENTE con el objeto JSON.`
                },
                {
                    role: "user",
                    content: `Texto de la póliza: \n\n${extractedText.substring(0, 15000)}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const resultObj = JSON.parse(response.choices[0].message.content || "{}");
        return NextResponse.json(resultObj);

    } catch (error: any) {
        console.error("AI Policy Parse Error:", error);
        return NextResponse.json({ error: "Error procesando la póliza: " + error.message }, { status: 500 });
    }
}
