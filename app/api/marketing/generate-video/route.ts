
import { NextResponse } from 'next/server'
import OpenAI from "openai"

export async function POST(req: Request) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    try {
        const { templateId, agentName } = await req.json()

        const prompts: Record<string, string> = {
            'recruit': `Crea un guion publicitario de 30 segundos para video vertical (TikTok/Reels). 
                        Objetivo: Reclutar agentes de seguros. 
                        Tono: Poderoso, innovador, futurista. 
                        Mensaje: "Deja de vender como en los 80s. Con el portal de ${agentName}, tienes una IA (Capataz) que califica prospectos por ti 24/7. Sé un agente Pro."`,
            'auto': `Crea un guion publicitario de 15 segundos para video vertical. 
                     Objetivo: Vender seguros de auto. 
                     Tono: Rápido, seguro, confiable. 
                     Mensaje: "¿Chocaste? Reporta con un comando de voz. El seguro de ${agentName} no solo te protege, te entiende."`,
            'gmm': `Crea un guion publicitario de 20 segundos para video vertical. 
                    Objetivo: Vender Gastos Médicos Mayores. 
                    Tono: Inteligente, calmado, premium. 
                    Mensaje: "La salud de tu familia no es un juego. Protege tu patrimonio con el blindaje inteligente de ${agentName}."`,
            'tech': `Crea un guion publicitario de 20 segundos para video vertical. 
                     Objetivo: Mostrar la tecnología del portal. 
                     Tono: Geek, innovador, Wow. 
                     Mensaje: "Este no es un portal de seguros. Es una neurona digital trabajando para ti. Capataz by ${agentName}."`,
            'efficiency': `Crea un guion publicitario de 15 segundos para video vertical. 
                           Objetivo: Destacar la eficiencia del agente. 
                           Tono: Profesional, directo. 
                           Mensaje: "Recupera 10 horas a la semana. Automatiza tu cobranza con ${agentName}."`
        }

        const prompt = prompts[templateId] || prompts['tech']

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Eres un experto en Marketing Digital y Copywriting publicitario para video de impacto." },
                { role: "user", content: prompt }
            ],
        })

        const script = response.choices[0].message.content

        // Mock video URL for demo (in production this would be the HeyGen / ElevenLabs output)
        const mockVideoUrl = "/videos/commercial_placeholder.mp4"

        return NextResponse.json({
            success: true,
            script,
            videoUrl: mockVideoUrl,
            message: "Comercial generado con éxito por la Red Neuronal Capataz."
        })

    } catch (error: any) {
        console.error("Video Generation Error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
