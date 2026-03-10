import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!apiKey || !supabaseServiceKey) {
            return NextResponse.json({
                error: "Falta la llave GOOGLE_GENERATIVE_AI_API_KEY en Vercel. Por favor agrégala para usar Gemini 1.5 Flash."
            }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 0. Autenticación (v75)
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

        if (!token) {
            return NextResponse.json({ error: "No autorizado (Falta Token)" }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "No autorizado (Token Inválido)" }, { status: 401 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        // 1. Descontar Créditos (Gasto: 2 créditos por lectura de póliza)
        const { data: creditSpent, error: creditError } = await (supabase.rpc('spend_ai_credits', {
            p_action_type: 'parse_policy_v2',
            p_cost: 2,
            p_metadata: { file_name: file.name },
            p_user_id: user.id // Pass the explicitly identified user
        }) as any);

        if (creditError || !creditSpent) {
            return NextResponse.json({
                error: creditError?.message || "No tienes créditos suficientes para procesar pólizas con IA."
            }, { status: 403 });
        }

        // 2. Convertir el archivo a Base64 para Gemini (OCR Nativo)
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Data = buffer.toString("base64");

        // 3. Prompt de extracción técnica
        const prompt = `Analiza esta carátula de póliza de seguros y extrae la información técnica de forma estructurada. 
        IMPORTANTE: Si no encuentras un dato, devuélvelo como null.
        
        MAPEO DE CAMPOS (JSON):
        - policy_number: Número de póliza.
        - insurer_name: Nombre de la aseguradora (ej. GNP, Chubb, Monterrey).
        - client_name: Nombre completo del asegurado o contratante.
        - agent_name: Nombre del agente que aparece en la póliza.
        - agent_code: Número o clave de agente que aparece en la póliza.
        - start_date: Inicio de vigencia en formato ISO (YYYY-MM-DD).
        - end_date: Fin de vigencia en formato ISO (YYYY-MM-DD).
        - currency: "MXN", "USD", "EUR" o "UDI".
        - payment_method: "Contado", "Semestral", "Trimestral" o "Mensual".
        - premium_net: Prima neta (número decimal).
        - policy_fee: Gasto de expedición / Derecho de póliza (número decimal).
        - surcharge_amount: Recargo financiero (número decimal).
        - vat_amount: IVA (generalmente 16%) (número decimal).
        - premium_total: Prima total (número decimal).

        Responde estrictamente con un objeto JSON.`;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type || "application/pdf",
                },
            },
            prompt,
        ]);

        const responseText = result.response.text();
        const content = JSON.parse(responseText);

        return NextResponse.json(content);

    } catch (error: any) {
        console.error("Gemini AI Policy Parse Error:", error);
        return NextResponse.json({ error: "Error procesando la póliza con Gemini: " + error.message }, { status: 500 });
    }
}
