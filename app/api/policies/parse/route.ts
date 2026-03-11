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

        // 2. Prompt de extracción técnica - "Extraction v6" (Precision & SICAS Master)
        const prompt = `
        ANALISTA DE PÓLIZAS IA (Executive Edition v6 "Precision & SICAS Master")
        Tu objetivo es extraer con exactitud quirúrgica la información de esta carátula de seguro.
        
        INSTRUCCIONES CRÍTICAS:
        1. insurer_name: Extrae el nombre comercial o razón social de la aseguradora (ej. Quálitas, GNP, AXA, Chubb, HDI). Busca logotipos si el texto es ambiguo.
        2. agent_code: Busca términos como "Clave de Agente", "Conducto", "Clave Prod.", "Código de Agente" o simplemente una serie numérica/alfanumérica asociada al nombre del agente.
        3. personality_note: Sé breve, profesional y sofisticado. Maximiza el valor percibido del trabajo del agente.

        CAMPOS REQUERIDOS EN JSON:
        - policy_number: El número de póliza exacto.
        - insurer_name: Nombre de la aseguradora (ej. "Qualitas", "GNP", "Chubb").
        - client_name: Nombre completo del asegurado.
        - rfc: El RFC del asegurado (12 o 13 caracteres).
        - client_phone: Teléfono detectado.
        - client_email: Email detectado.
        - ramo: El ramo principal (Vida, GMM, Autos, Daños, Transporte).
        - agent_name: Nombre completo del agente o despacho.
        - agent_code: Clave, número o código de agente (Indispensable para vinculación).
        - asset_description: Lo que se está asegurando (ej. "Nissan Sentra 2022", "Residencia en Calle Olivos").
        - sub_ramo: Plan específico de la póliza.
        - start_date: Inicio de vigencia (YYYY-MM-DD).
        - end_date: Fin de vigencia (YYYY-MM-DD).
        - currency: "MXN", "USD", "EUR" o "UDI".
        - payment_method: "Contado", "Semestral", "Trimestral" o "Mensual".
        - premium_net: Prima neta antes de impuestos.
        - policy_fee: Derecho de póliza / Gasto de expedición.
        - surcharge_amount: Recargo financiero por pago fraccionado (número positivo).
        - discount_amount: Descuentos otorgados (número positivo).
        - vat_amount: IVA.
        - premium_total: Importe total a pagar.
        - first_installment_extract: Total del primer recibo si viene desglosado.
        - personality_note: Saludo ejecutivo breve (máximo 15 palabras).

        Responde ÚNICAMENTE el objeto JSON sin texto adicional.`;

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
