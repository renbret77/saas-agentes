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
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        // 1. Convertir el archivo a Base64 para Gemini (OCR Nativo)
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Data = buffer.toString("base64");

        // 2. Prompt de extracción técnica - "Extraction v4" (SICAS Killer)
        // 2. Prompt de extracción técnica - "Extraction v5" (Branch Intelligence)
        const prompt = `
        ANALISTA DE PÓLIZAS IA (Executive Edition v5 "Branch Intelligence")
        Extrae la información de esta carátula de seguro de forma estructurada.

        CAMPOS REQUERIDOS EN JSON:
        - policy_number: El número de póliza tal cual aparece.
        - insurer_name: Nombre de la aseguradora (ej. GNP, Chubb, Monterrey).
        - client_name: Nombre completo del asegurado o contratante.
        - rfc: El RFC del asegurado (ej. VIDV720407N2A).
        - client_phone: Teléfono de contacto que aparezca en la póliza.
        - client_email: Correo electrónico que aparezca en la póliza.
        - ramo: El ramo de la póliza (ej. Vida, GMM, Autos, Daños, Transporte).
        - agent_name: Nombre del agente o promotoría.
        - agent_code: Número, clave o clave interna de agente.
        - asset_description: Descripción detallada del bien asegurado (ej. Nissan Altima 2010, Local Comercial #4, etc).
        - sub_ramo: Plan o sub-ramo específico (ej. Cobertura Amplia, Elite GMM).
        - start_date: Inicio de vigencia en formato ISO (YYYY-MM-DD).
        - end_date: Fin de vigencia en formato ISO (YYYY-MM-DD).
        - currency: "MXN", "USD", "EUR" o "UDI".
        - payment_method: "Contado", "Semestral", "Trimestral" o "Mensual".
        - premium_net: Prima neta del recibo actual o del año (número decimal).
        - policy_fee: Gasto de expedición / Derecho de póliza (número decimal).
        - surcharge_amount: Recargo financiero (número decimal).
        - vat_amount: IVA (número decimal).
        - premium_total: Prima total (número decimal).
        - first_installment_extract: Si el documento describe el desglose del PRIMER RECIBO, extrae el TOTAL DE ESE PRIMER RECIBO (ej. 3338.03). 
        - personality_note: Una breve nota ejecutiva (máximo 15 palabras) sobre la calidad de la póliza o un saludo sofisticado al agente.

        Responde únicamente con el objeto JSON. No incluyas explicaciones adicionales fuera del JSON.`;

        // 3. Generar contenido con Gemini
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

        // 4. Descontar Créditos (Gasto: 2 créditos) - SÓLO SI LA IA RESPONDIÓ CORRECTAMENTE
        // Esto hace el sistema robusto contra errores de red en la llamada a Gemini
        const { data: creditSpent, error: creditError } = await (supabase.rpc('spend_ai_credits', {
            p_action_type: 'parse_policy_v3_success',
            p_cost: 2,
            p_metadata: { file_name: file.name, model: "gemini-2.5-flash" },
            p_user_id: user.id
        }) as any);

        if (creditError || !creditSpent) {
            // Nota: El usuario ya obtuvo la respuesta pero se le informa que no podrá seguir sin créditos
            console.warn("Credit deduction failed after success:", creditError);
        }

        return NextResponse.json(content);

    } catch (error: any) {
        console.error("Gemini AI Policy Parse Error:", error);
        return NextResponse.json({ error: "Error procesando la póliza con Gemini: " + error.message }, { status: 500 });
    }
}
