import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { IMPORT_SCHEMAS } from "@/lib/import-schemas"

export async function POST(req: NextRequest) {
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const { importType, headers, sampleData } = await req.json()

        if (!importType || !headers || !sampleData) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const targetSchema = (IMPORT_SCHEMAS as any)[importType]
        if (!targetSchema) {
            return NextResponse.json({ error: "Invalid import type" }, { status: 400 })
        }

        const prompt = `
        Actúa como un experto en migración de datos para sistemas de seguros en México.
        Tengo un archivo CSV con las siguientes cabeceras:
        ${JSON.stringify(headers)}

        Aquí tienes las primeras 3 filas de ejemplo para contexto:
        ${JSON.stringify(sampleData)}

        Mi sistema necesita mapear estas columnas a nuestro esquema interno de "${importType}".
        Nuestro esquema es:
        ${JSON.stringify(targetSchema)}

        Tu tarea es devolver un objeto JSON que mapée cada 'key' de nuestro esquema a la 'cabecera' más probable del archivo del usuario.
        Si no encuentras una coincidencia clara, no incluyas la key en el mapeo.
        
        Además, para cada coincidencia, indica si los datos necesitan alguna "transformación" (ej: formato de fecha, limpiar símbolos de moneda).

        Devuelve SOLO un JSON con este formato:
        {
            "mapping": {
                "key_del_sistema": "cabecera_del_usuario",
                ...
            },
            "suggestions": [
                { "key": "key_del_sistema", "reason": "Explicación breve de por qué elegiste esta columna" }
            ],
            "confidence": 0.0 a 1.0
        }
        `

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Eres un asistente técnico experto en mapeo de datos JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        })

        const rawResult = response.choices[0].message.content || "{}"
        const result = JSON.parse(rawResult)

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("Error analyzing import mapping:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
