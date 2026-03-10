import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    try {
        const { client_id, target_insurance, client_name } = await req.json();

        if (!client_id || !target_insurance || !client_name) {
            return NextResponse.json({ error: "Faltan datos (client_id, target_insurance o client_name)" }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Necesitamos el service role para descontar créditos de forma segura

        if (!apiKey || !supabaseServiceKey) {
            return NextResponse.json({ error: "Falta configuración de API (Gemini o Supabase Service Role)" }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Validar y Descontar Créditos (Costo: 1 crédito por campaña)
        const { data: creditSpent, error: creditError } = await supabase.rpc('spend_ai_credits', {
            p_action_type: 'generate_campaign',
            p_cost: 1,
            p_metadata: { client_id, target_insurance }
        });

        if (creditError || !creditSpent) {
            return NextResponse.json({
                error: "No tienes créditos suficientes o hubo un error al procesar tu billetera."
            }, { status: 403 });
        }

        // 2. Generar Contenido con Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
Eres un experto en marketing para agentes de seguros en México.
Tu tarea es escribir una propuesta de venta cruzada (Cross-Sell) personalizada para un cliente.

DATOS DEL CLIENTE:
- Nombre: ${client_name}
- Seguro a ofrecer: ${target_insurance}

REGLAS DE REDACCIÓN:
1. Tono profesional, cercano y persuasivo.
2. Usa emojis de forma moderada para WhatsApp.
3. No menciones precios específicos (di que tienes una cotización especial).
4. El mensaje debe ser corto (máximo 150 palabras).

Estructura tu respuesta exactamente así:
[ASUNTO_EMAIL]
(Escribe un asunto llamativo)

[CUERPO_EMAIL]
(Escribe el correo electrónico personalizado)

[WHATSAPP]
(Escribe el mensaje de WhatsApp directo)`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parsear la respuesta
        const asunto = text.match(/\[ASUNTO_EMAIL\]\n?(.*)/)?.[1] || "Propuesta de Seguro";
        const email = text.match(/\[CUERPO_EMAIL\]\n?([\s\S]*?)(?=\n\n\[WHATSAPP\])/)?.[1] || "";
        const whatsapp = text.match(/\[WHATSAPP\]\n?([\s\S]*)/)?.[1] || "";

        return NextResponse.json({
            asunto: asunto.trim(),
            email: email.trim(),
            whatsapp: whatsapp.trim()
        });

    } catch (error: any) {
        console.error("Campaign Generator Error:", error);
        return NextResponse.json({ error: "Error generando la campaña: " + error.message }, { status: 500 });
    }
}
