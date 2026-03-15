import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const claimType = formData.get("claimType") as string || "General";

        if (!file) {
            return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!apiKey || !supabaseServiceKey) {
            return NextResponse.json({
                error: "Falta configuración de APIs en el servidor."
            }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 0. Autenticación
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

        if (!token) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash", 
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        // 1. Convertir el archivo a Base64
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Data = buffer.toString("base64");

        // 2. Prompt de extracción para Siniestros
        const prompt = `
        ANALISTA DE SINIESTROS IA (Capataz Intel v1)
        Tu objetivo es extraer información clave de este documento de siniestro (${claimType}).
        El documento puede ser un Informe Médico, Factura, Receta, Identificación o Acta.

        CAMPOS REQUERIDOS EN JSON:
        - document_type: Tipo de documento detectado (ej. "Informe Médico", "Factura", "Identificación").
        - claim_date: Fecha del siniestro o del documento (YYYY-MM-DD).
        - diagnosis: Diagnóstico principal detectado (si aplica).
        - symptoms_start_date: Fecha de inicio de síntomas (si es informe médico).
        - total_amount: Monto total si es una factura o recibo.
        - folio: Número de folio o factura detectado.
        - rfc_emisor: RFC de quien emite el documento (ej. Hospital o Médico).
        - insured_name_match: Nombre del paciente/asegurado detectado en el documento.
        - brief_summary: Resumen ejecutivo del hallazgo (máx 20 palabras).
        - isValid: booleano, true si el documento parece auténtico y legible.

        Responde ÚNICAMENTE el objeto JSON sin texto adicional.`;

        // 3. Generar contenido
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

        // 4. Descontar Créditos (Gasto: 1 crédito por análisis de siniestro)
        await (supabase.rpc('spend_ai_credits', {
            p_action_type: 'analyze_claim_doc_success',
            p_cost: 1,
            p_metadata: { file_name: file.name, claim_type: claimType },
            p_user_id: user.id
        }) as any);

        return NextResponse.json(content);

    } catch (error: any) {
        console.error("Gemini AI Claims Parse Error:", error);
        return NextResponse.json({ error: "Error procesando el documento: " + error.message }, { status: 500 });
    }
}
