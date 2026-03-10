import { NextRequest, NextResponse } from "next/server";
import { evolutionService } from "@/lib/evolution";
import { transcribeAudio, processVoiceCommand, generateSalesSnap } from "@/lib/ai-capataz";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { event, instance, data } = body;

        console.log(`[Capataz Webhook] Event: ${event} from Instance: ${instance}`);

        if (event === 'MESSAGES_UPSERT') {
            const message = data.message;
            const from = data.key.remoteJid;
            const isMe = data.key.fromMe;

            if (isMe) return NextResponse.json({ status: 'ignored_me' });

            // 1. Detect Audio (Voice Note)
            if (message.audioMessage) {
                console.log(`[Capataz] Audio detected from ${from}. Processing...`);

                // Signify receipt
                await evolutionService.sendMessage(instance, from, "⏳ Procesando tu nota de voz...");

                try {
                    // Download media
                    const mediaRes = await evolutionService.downloadMedia(instance, data);
                    // Evolution typically returns base64 or a buffer in their media endpoint
                    const buffer = Buffer.from(mediaRes.base64 || mediaRes.buffer, 'base64');

                    const transcription = await transcribeAudio(buffer);
                    const analysis = await processVoiceCommand(transcription);

                    let responseText = `📝 *Transcripción:* "${transcription}"\n\n`;
                    if (analysis.intent !== 'none') {
                        responseText += `🤖 *Capataz:* Entendido. He registrado esto como: *${analysis.summary}*.`;
                    } else {
                        responseText += `🤖 *Capataz:* Te escucho, pero no detecté una tarea clara. ¿Necesitas ayuda con algo específico?`;
                    }

                    await evolutionService.sendMessage(instance, from, responseText);
                } catch (err: any) {
                    await evolutionService.sendMessage(instance, from, "❌ Error al procesar el audio. Intenta de nuevo.");
                }
            }

            // 2. Detect Document (PDF)
            if (message.documentMessage && message.documentMessage.mimetype === 'application/pdf') {
                console.log(`[Capataz] PDF detected from ${from}. Creating Sales Snap...`);

                await evolutionService.sendMessage(instance, from, "🔍 Analizando póliza... Dame un segundo para crear tu *Sales Snap*.");

                try {
                    const mediaRes = await evolutionService.downloadMedia(instance, data);
                    // For PDF, we'll try to extract text or just give a simple summary if possible
                    // In a real scenario, we'd use a PDF parser here.
                    const snap = await generateSalesSnap("Contenido del PDF (Simulado para MVP)");

                    await evolutionService.sendMessage(instance, from, `✨ *SALES SNAP* ✨\n\n${snap}`);
                } catch (err: any) {
                    await evolutionService.sendMessage(instance, from, "❌ No pude leer este PDF correctamente.");
                }
            }
        }

        return NextResponse.json({ status: 'processed' });
    } catch (error: any) {
        console.error('[Capataz Webhook Error]', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
