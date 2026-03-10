import { NextRequest, NextResponse } from "next/server";
import { evolutionService } from "@/lib/evolution";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { event, instance, data } = body;

        // Security check (Example: check if instance belongs to a valid user)
        console.log(`[Capataz Webhook] Event: ${event} from Instance: ${instance}`);

        if (event === 'MESSAGES_UPSERT') {
            const message = data.message;
            const from = data.key.remoteJid;

            // 1. Detect Audio (Voice Note)
            if (message.audioMessage) {
                console.log(`[Capataz] Audio detected from ${from}. Processing with Whisper...`);
                // TODO: Download media and send to Whisper
                // await processAudio(message.audioMessage, from);
            }

            // 2. Detect Document (PDF)
            if (message.documentMessage && message.documentMessage.mimetype === 'application/pdf') {
                console.log(`[Capataz] PDF detected from ${from}. Creating Sales Snap...`);
                // TODO: Analyze PDF with GPT-4o
                // await processPdf(message.documentMessage, from);
            }

            // 3. Simple Text Commands
            if (message.conversation || message.extendedTextMessage?.text) {
                const text = message.conversation || message.extendedTextMessage?.text;
                if (text.toLowerCase().includes('capataz help')) {
                    // Send help menu
                }
            }
        }

        return NextResponse.json({ status: 'processed' });
    } catch (error: any) {
        console.error('[Capataz Webhook Error]', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
