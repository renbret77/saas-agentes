import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { logId, config, payload } = await req.json();

        if (!config || !config.host || !config.username) {
            return NextResponse.json({ error: "Configuración de correo incompleta" }, { status: 400 });
        }

        // 1. Create transporter
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port || 587,
            secure: config.port === 465,
            auth: {
                user: config.username,
                pass: config.password_encrypted // In a real app, this should be decrypted
            }
        });

        // 2. Send email
        const info = await transporter.sendMail({
            from: `"${config.from_name || 'Agente Capataz'}" <${config.from_email || config.username}>`,
            to: payload.to,
            cc: payload.cc,
            subject: payload.subject,
            html: payload.html,
            attachments: payload.attachments
        });

        console.log("Email sent: %s", info.messageId);

        return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error("Nodemailer Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
