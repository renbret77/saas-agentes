import OpenAI from "openai";
import { Readable } from "stream";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
    try {
        const response = await openai.audio.transcriptions.create({
            file: await OpenAI.toFile(audioBuffer, 'voice.ogg', { type: 'audio/ogg' }),
            model: "whisper-1",
        });
        return response.text;
    } catch (error: any) {
        console.error("Transcribe Error:", error.message);
        throw error;
    }
}

export async function processVoiceCommand(text: string) {
    const prompt = `
    Eres Capataz, el asistente inteligente de una agencia de seguros (RB Proyectos).
    Tu tarea es analizar esta transcripción de voz de un agente y extraer la intención.
    
    Transcripción: "${text}"
    
    Identifica si es:
    1. Un recordatorio/cita (Agenda).
    2. Información de un cliente (Nota).
    3. Una solicitud de cotización.
    4. Charla informal (No hacer nada).

    Devuelve un JSON con:
    {
        "intent": "agenda" | "nota" | "cotizacion" | "none",
        "summary": "Resumen conciso del comando",
        "action_params": { ... } // Ej: date, time, client_name si aplica
    }
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
}

export async function generateSalesSnap(pdfContent: string): Promise<string> {
    const prompt = `
    Analiza esta información técnica de una póliza de seguros y crea un "Sales Snap" de alto impacto.
    
    El "Sales Snap" debe tener 3 secciones cortas para WhatsApp:
    1. 🚀 **Lo Bueno (El Gancho)**: Lo más atractivo de esta póliza en 1 línea.
    2. ⚠️ **Ojo Aquí**: Qué es lo más importante que el cliente debe saber (deducible, exclusión crítica).
    3. 💡 **Tip de Venta**: Una frase poderosa para cerrar la venta.

    Información:
    ${pdfContent.substring(0, 4000)} // Límite para evitar exceso de tokens
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || "No se pudo generar el resumen.";
}
