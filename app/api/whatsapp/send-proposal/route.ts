import { NextResponse } from "next/server"
import { evolutionService } from "@/lib/evolution"

export async function POST(req: Request) {
    try {
        const { phoneNumber, clientName, vehicleName, proposalUrl, type = 'auto' } = await req.json()

        if (!phoneNumber || !proposalUrl) {
            return NextResponse.json({ error: "Número y URL requeridos" }, { status: 400 })
        }

        // 1. Limpiar número (formato Evolution)
        const cleanNumber = phoneNumber.replace(/\D/g, '')
        const finalNumber = cleanNumber.length === 10 ? `521${cleanNumber}` : cleanNumber

        // 2. Construir mensaje persuasivo Omni Elite
        const message = `🛡️ *PROPUESTA OMNI ELITE v3.0*\n\n` +
            `Hola *${clientName || 'Cliente'}*, te habla el asistente de tu agente.\n\n` +
            `He diseñado un blindaje estratégico exclusivo para tu *${vehicleName || 'patrimonio'}*.\n\n` +
            `🎯 *¿Qué incluye?*\n` +
            `• Cobertura Amplia Certificada\n` +
            `• Combo Builder Interactivo (Personalizable)\n` +
            `• Análisis de Riesgo Omni 2.5\n\n` +
            `Puedes ver, ajustar y descargar tu propuesta aquí:\n` +
            `🔗 ${proposalUrl}\n\n` +
            `*By Proyectos RB* | _Elite Partner Innovation_`

        // 3. Enviar vía Evolution API (Usamos instancia por defecto)
        const instanceName = process.env.EVOLUTION_DEFAULT_INSTANCE || "BotRene"
        
        await evolutionService.sendMessage(instanceName, finalNumber, message)

        return NextResponse.json({ 
            success: true, 
            message: "Propuesta enviada correctamente vía WhatsApp" 
        })

    } catch (error: any) {
        console.error("WhatsApp Send Error:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
