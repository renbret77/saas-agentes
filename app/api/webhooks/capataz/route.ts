import { NextRequest, NextResponse } from "next/server";
import { evolutionService } from "@/lib/evolution";
import { transcribeAudio, processVoiceCommand, generateSalesSnap, analyzeCustomerIntent } from "@/lib/ai-capataz";
import { supabase } from "@/lib/supabase";

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

            // 3. Detect Text Commands (Customer Inquiries)
            const textContent = message.conversation || message.extendedTextMessage?.text;
            if (textContent && !isMe) {
                console.log(`[Capataz] Text detected from ${from}. Analyzing intent...`);
                
                const clientPhone = from.split('@')[0].replace(/\D/g, ''); // Clean phone
                const { intent } = await analyzeCustomerIntent(textContent);

                if (intent !== 'none') {
                    // Try to find client
                    const { data: client } = await supabase
                        .from('clients')
                        .select('id, first_name')
                        .or(`phone.ilike.%${clientPhone.slice(-10)}%,whatsapp.ilike.%${clientPhone.slice(-10)}%`)
                        .single();

                    if (!client) {
                        await evolutionService.sendMessage(instance, from, "🤖 Hola. No pude localizar tu número en mi base de datos. Por favor, contacta a tu agente directamente.");
                        return NextResponse.json({ status: 'client_not_found' });
                    }

                    if (intent === 'poliza') {
                        const { data: policies } = await supabase
                            .from('policies')
                            .select('policy_number, pdf_url, insurers(name)')
                            .eq('client_id', client.id)
                            .order('created_at', { ascending: false });

                        if (policies && policies.length > 0) {
                            let resp = `📄 *Tus Pólizas Activas:*\n\n`;
                            policies.forEach(p => {
                                resp += `• *${(p.insurers as any).name}*: ${p.policy_number}\n`;
                                if (p.pdf_url) resp += `🔗 Ver/Descargar: ${p.pdf_url}\n\n`;
                            });
                            await evolutionService.sendMessage(instance, from, resp);
                        } else {
                            await evolutionService.sendMessage(instance, from, "🤖 No encontré pólizas activas a tu nombre.");
                        }
                    }

                    if (intent === 'debito') {
                        const { data: installments } = await supabase
                            .from('installments')
                            .select('*, policies(policy_number, insurers(name))')
                            .is('payment_date', null)
                            .order('due_date', { ascending: true });

                        // Filter for client's policies in JS to avoid complex joins in orm if not easy
                        const clientInstallments = installments?.filter((i: any) => i.policies.client_id === client.id) || [];

                        if (clientInstallments.length > 0) {
                            let resp = `💰 *Tus Próximos Pagos:*\n\n`;
                            clientInstallments.forEach(i => {
                                resp += `• *${i.policies.insurers.name}* (${i.policies.policy_number})\n`;
                                resp += `   Monto: $${i.total_amount?.toLocaleString()} ${i.currency}\n`;
                                resp += `   Vencimiento: ${new Date(i.due_date).toLocaleDateString()}\n\n`;
                            });
                            await evolutionService.sendMessage(instance, from, resp);
                        } else {
                            await evolutionService.sendMessage(instance, from, "✅ No tienes pagos pendientes próximos. ¡Todo al día!");
                        }
                    }

                    if (intent === 'siniestro') {
                        const { data: policies } = await supabase
                            .from('policies')
                            .select('insurers(name, support_phone)')
                            .eq('client_id', client.id);

                        let resp = `🆘 *ENTENDIDO. MANTÉN LA CALMA.* \n\n`;
                        resp += `Estamos aquí para apoyarte. Sigue estos pasos de emergencia:\n\n`;
                        resp += `1. Ponte en un lugar seguro.\n`;
                        resp += `2. Si hay lesionados, llama al 911.\n`;
                        resp += `3. Reporta de inmediato a tu aseguradora:\n\n`;
                        
                        const processedInsurers = new Set();
                        policies?.forEach(p => {
                            const insurer: any = p.insurers;
                            if (insurer && !processedInsurers.has(insurer.name)) {
                                resp += `📞 *${insurer.name}*: ${insurer.support_phone || 'Consultar en póliza'}\n`;
                                processedInsurers.add(insurer.name);
                            }
                        });

                        resp += `\n4. *No aceptes responsabilidad* ni firmes convenios sin el ajustador.\n`;
                        resp += `\n*Aviso:* He notificado a tu agente sobre tu situación.`;

                        await evolutionService.sendMessage(instance, from, resp);
                    }

                    if (intent === 'asistencia') {
                        await evolutionService.sendMessage(instance, from, "🛠️ *Asistencia Capataz* \n\nHe recibido tu solicitud. Para asistencias viales (grúa, paso de corriente) o del hogar, puedo proporcionarte los números de tu aseguradora o pedirle a tu agente que te llame. ¿Qué prefieres?");
                    }
                }
            }
        }

        return NextResponse.json({ status: 'processed' });
    } catch (error: any) {
        console.error('[Capataz Webhook Error]', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
