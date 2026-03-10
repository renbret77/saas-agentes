import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

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
                error: "Faltan llaves de API (Gemini o Supabase Service Role). Contacta a soporte."
            }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Descontar Créditos (Gasto: 1 crédito por lectura de póliza)
        const { data: creditSpent, error: creditError } = await supabase.rpc('spend_ai_credits', {
            p_action_type: 'parse_quote',
            p_cost: 2, // Analysis costs 2 credits now
            p_metadata: { file_name: file.name }
        });

        if (creditError || !creditSpent) {
            return NextResponse.json({
                error: "No tienes créditos suficientes para procesar pólizas con IA."
            }, { status: 403 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let extractedText = "";

        if (file.type === "application/pdf") {
            try {
                // Importación dinámica para evitar problemas en Edge Runtime si existieran
                const pdf = require("pdf-parse");
                const data = await pdf(buffer);
                extractedText = data.text;
            } catch (err) {
                console.error("Error al leer el PDF:", err);
                return NextResponse.json({ error: "No se pudo extraer texto del PDF." }, { status: 500 });
            }
        } else {
            return NextResponse.json({ error: "Por ahora, solo se soporta formato PDF." }, { status: 400 });
        }

        if (!extractedText || extractedText.trim() === "") {
            return NextResponse.json({ error: "El PDF parece ser una imagen escaneada sin texto seleccionable." }, { status: 400 });
        }

        // Limpiar el texto para optimizar tokens
        extractedText = extractedText.replace(/\s+/g, ' ').substring(0, 20000);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const prompt = `
Eres un experto en pólizas de seguros mexicanas (Quálitas, GNP, AXA, etc.).
Tu tarea es analizar el texto extraído de una póliza y extraer la información clave en formato JSON.

REGLAS CRÍTICAS:
1. Devuelve estrictamente un objeto JSON válido.
2. Si un dato no existe o no es claro, devuélvelo como null.
3. Convierte todos los montos a números puramente decimales (ej. "$1,200.50" -> 1200.5).
4. Las fechas deben estar en formato YYYY-MM-DD.

MAPEO DE CAMPOS:
- policy_number: Número de póliza.
- insurer_name: Nombre de la aseguradora.
- start_date: Inicio de vigencia (vigencia desde).
- end_date: Fin de vigencia (vigencia hasta).
- currency: "MXN", "USD", "EUR" o "UDI".
- payment_method: "Contado", "Semestral", "Trimestral" o "Mensual".
- premium_net: Prima neta.
- policy_fee: Gasto de expedición o derecho de póliza.
- surcharge_amount: Recargo financiero.
- vat_amount: IVA.
- premium_total: Prima total.

Texto de la póliza:
"""
${extractedText}
"""

Responde solo con el JSON:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const resultText = response.text();

        try {
            // Gemini a veces devuelve el json dentro de bloques markdown ```json ... ```
            const cleanJson = resultText.replace(/```json\n?|```/g, '').trim();
            const resultObj = JSON.parse(cleanJson);
            return NextResponse.json(resultObj);
        } catch (parseError) {
            console.error("JSON Parse Error from Gemini:", resultText);
            return NextResponse.json({ error: "La IA devolvió un formato inválido" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Error en AI Parse Master:", error);
        return NextResponse.json({ error: "Error interno procesando la póliza: " + error.message }, { status: 500 });
    }
}
