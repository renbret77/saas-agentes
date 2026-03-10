import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // --- CREDIT DEDUCTION START ---
        const { data: creditSpent, error: creditError } = await supabase.rpc('spend_ai_credits', {
            p_action_type: 'parse_quote_pro',
            p_cost: 2, // Analysis costs 2 credits
            p_metadata: { file_name: file.name }
        });

        if (creditError || !creditSpent) {
            return NextResponse.json({
                error: "Créditos insuficientes. El análisis Pro consume 2 créditos."
            }, { status: 403 });
        }
        // --- CREDIT DEDUCTION END ---

        // 1. Reading File Content
        const buffer = Buffer.from(await file.arrayBuffer());
        let extractedText = "";

        if (file.type === "application/pdf") {
            try {
                const pdf = require("pdf-parse");
                const data = await pdf(buffer);
                extractedText = data.text;
            } catch (err) {
                console.error("Error parsing PDF:", err);
                // Fallback: If text-based parse fails, Gemini can handle images directly if we send base64
            }
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        Eres un experto en seguros de Gastos Médicos Mayores (GMM), Autos y SEGUROS EMPRESARIALES (PyME, RC, Carga) en México.
        Analiza este documento de cotización y extrae la información en JSON.
        
        INSTRUCCIONES DE TONO POR RAMO:
        - GMM: Tono humano, enfocado en tranquilidad y red hospitalaria.
        - Autos: Tono práctico, enfocado en asistencia y valor del vehículo.
        - EMPRESARIAL: Tono técnico-ejecutivo, enfocado en mitigación de riesgos, activos y continuidad de negocio.
        
        Si detectas que es GMM:
        1. Identifica el NIVEL HOSPITALARIO (ej: Amplia, Integra, VIP, Esencial).
        2. Identifica el ESTADO/CIUDAD de residencia del cliente.
        
        FORMATO JSON REQUERIDO:
        {
            "client_name": "Nombre extraído",
            "branch": "GMM", "Autos" o "Empresarial",
            "location": "Ciudad/Estado",
            "options": [
                {
                    "company": "Nombre Aseguradora",
                    "price": "$0,000.00",
                    "plan": "Nombre del Plan",
                    "hospital_level": "Nivel detectado",
                    "coverage_summary": "Resumen corto de beneficios principales"
                }
            ],
            "ai_analysis": "Un párrafo persuasivo explicando por qué estas opciones son buenas."
        }

        TEXTO DEL DOCUMENTO:
        ${extractedText || "Contenido binario (usa visión si es posible)"}
        `;

        // If extractedText is empty, we send the media parts directly
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: file.type
                }
            }
        ]);

        const response = await result.response;
        let aiResult = JSON.parse(response.text().replace(/```json\n?|```/g, '').trim());

        // 2. ENRICHMENT: Consult hospital catalogs if branch is GMM
        if (aiResult.branch === "GMM") {
            const { data: hospitalData } = await supabase
                .from('hospital_catalogs')
                .select('*')
                .ilike('region', `%${aiResult.location || 'Monterrey'}%`);

            if (hospitalData && hospitalData.length > 0) {
                // Enrich each option with hospital details if they match
                aiResult.options = aiResult.options.map((opt: any) => {
                    const match = hospitalData.find(h =>
                        opt.hospital_level?.toLowerCase().includes(h.hospital_level?.toLowerCase()) ||
                        opt.plan?.toLowerCase().includes(h.plan_name?.toLowerCase())
                    );
                    if (match) {
                        opt.main_hospitals = match.main_hospitals;
                    }
                    return opt;
                });
            }
        }

        return NextResponse.json(aiResult);

    } catch (error: any) {
        console.error("AI Quote Analyzer Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
