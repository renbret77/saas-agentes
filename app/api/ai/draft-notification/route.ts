import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { tone, type, currentText } = await req.json();

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Eres el CEREBRO ESTRATÉGICO de un sistema de notificaciones PREMIUM para agentes de seguros ÉLITE. 
            Tu tarea es redactar 3 "PATRONES SEMILLA" de mensajes de WhatsApp que sirvan de base para generar infinitas variantes dinámicas.
            
            CONTEXTO DEL CASO:
            - Tipo: ${type === 'pre_due' ? 'Recordatorio preventivo' : type === 'grace_period' ? 'Aviso de periodo de gracia' : 'Aviso de recuperación/apoyo'}.
            - Tono solicitado: ${tone}
            
            REGLAS DE ORO DE VARIACIÓN (ANTI-BAN):
            1. No te limites a cambiar una palabra. Cambia la ESTRUCTURA y el ORDEN de las oraciones en cada variante.
            2. Las 3 variantes deben ser SEMÁNTICAMENTE iguales pero SINTÁCTICAMENTE muy distintas. Esto permite al motor de envío crear infinitas combinaciones únicas.
               
            REGLAS DE IDENTIFICACIÓN (OBLIGATORIAS):
            - {{aseguradora}}: Compañía.
            - {{descripción}}: El Bien Asegurado ( Mazda, de Vida, Global, etc).
            - {{ramo}}: Tipo de seguro.
            - {{póliza}}, {{monto}}, {{moneda}}, {{nombre_cliente}}, {{vencimiento}}.
            
            LÓGICA DE NEGOCIO (EL VALOR AGREGADO):
            - PERIODOS DE GRACIA: EDUCA sobre el riesgo de siniestro sin pago liquidado (pago inmediato o reembolso). Usa {{fecha_limite}}.
            - VENCIDOS: SÉ EMPÁTICO. No ataques. Ofrece ayuda para rehabilitar y recuperar la protección.
            
            FORMATO DE SALIDA:
            - Un ARREGLO JSON de strings. Ejemplo: ["patrón 1", "patrón 2", "patrón 3"]
            - NO incluyas explicaciones. Solo el JSON.
            
            Referencia de contenido: "${currentText}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Clean possible markdown code blocks
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const variants = JSON.parse(cleanedText);
            return NextResponse.json({ variants });
        } catch (e) {
            // Fallback if AI fails to return proper JSON
            return NextResponse.json({ variants: [text, text, text] });
        }
    } catch (error: any) {
        console.error("Error generating notification draft:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
