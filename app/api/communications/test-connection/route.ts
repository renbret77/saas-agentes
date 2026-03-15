import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { host, port, username, password } = await req.json();

        if (!host || !username || !password) {
            return NextResponse.json({ error: "Datos de conexión incompletos" }, { status: 400 });
        }

        const transporter = nodemailer.createTransport({
            host,
            port: port || 587,
            secure: port === 465,
            auth: {
                user: username,
                pass: password
            },
            connectTimeout: 10000 
        } as any);

        // verify connection configuration
        await transporter.verify();

        return NextResponse.json({ success: true, message: "Conexión exitosa" });
    } catch (error) {
        console.error("SMTP Test Error:", error);
        return NextResponse.json({ 
            error: (error as Error).message,
            code: (error as any).code 
        }, { status: 500 });
    }
}
