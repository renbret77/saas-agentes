import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { PROMPT_QUOTE_MASTER } from "@/lib/insurance-knowledge"

// --- OMNI SERVER POLYFILLS (MASTER BLINDAGE) ---
if (typeof (global as any).DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix {
        a: number; b: number; c: number; d: number; e: number; f: number;
        constructor() { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; }
        multiply() { return this; }
        translate() { return this; }
        scale() { return this; }
        rotate() { return this; }
        inverse() { return this; }
        static fromFloat32Array() { return new DOMMatrix(); }
        static fromFloat64Array() { return new DOMMatrix(); }
    };
    (global as any).DOMMatrixReadOnly = (global as any).DOMMatrix;
}
if (typeof (global as any).DOMPoint === 'undefined') {
    (global as any).DOMPoint = class DOMPoint {
        x: number; y: number; z: number; w: number;
        constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; }
    };
    (global as any).DOMPointReadOnly = (global as any).DOMPoint;
}
if (typeof (global as any).DOMRect === 'undefined') {
    (global as any).DOMRect = class DOMRect {
        x: number; y: number; width: number; height: number;
        top: number; right: number; bottom: number; left: number;
        constructor(x = 0, y = 0, width = 0, height = 0) { 
            this.x = x; this.y = y; this.width = width; this.height = height;
            this.top = y; this.left = x; this.bottom = y + height; this.right = x + width;
        }
    };
    (global as any).DOMRectReadOnly = (global as any).DOMRect;
}

if (typeof (global as any).Path2D === 'undefined') {
    (global as any).Path2D = class Path2D { addPath() {} };
}
// ------------------------------------------------

// Helper: Native PDF Text Extraction (Node-Safe)
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const loadingTask = pdfjs.getDocument({
            data: new Uint8Array(buffer),
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
            disableFontFace: true
        });
        const doc = await loadingTask.promise;
        let fullText = "";
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(' ') + "\n";
        }
        return fullText;
    } catch (error: any) {
        console.error("[Extraction Error]:", error);
        return ""; 
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
        const openaiApiKey = process.env.OPENAI_API_KEY

        if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)
        const formData = await req.formData()
        const files = formData.getAll("files") as File[]
        const category = formData.get("category") as string || "GMM / Autos"
        const clientName = formData.get("clientName") as string || ""

        const { data: { user }, error: authError } = await (supabase.auth as any).getUser(
            req.headers.get("Authorization")?.split(" ")[1] || ""
        )

        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        if (!files || files.length === 0) return NextResponse.json({ error: "No files uploaded" }, { status: 400 })

        // Agency ID Logic
        let agencyId = user.user_metadata?.agency_id || (user as any).agency_id
        if (!agencyId && user.email === 'admin@admin.com') {
            const { data: firstAgency } = await (supabase.from("agencies") as any).select("id").limit(1).single()
            agencyId = firstAgency?.id
        }
        if (!agencyId) {
             const { data: profile } = await (supabase.from("profiles") as any).select("agency_id").eq("id", user.id).single()
             agencyId = profile?.agency_id
        }
        if (!agencyId) return NextResponse.json({ error: "Configuración incompleta" }, { status: 403 })

        // Credits Check
        if (user.email !== 'admin@admin.com') {
            const { data: hasCredits } = await (supabase.rpc('spend_ai_credits', { 
                p_action_type: 'quote_parse', p_cost: 1, p_metadata: { files: files.length, client: clientName } 
            }) as any)
            if (!hasCredits) return NextResponse.json({ error: "Sin créditos" }, { status: 402 })
        }

        const { data: session } = await (supabase.from("quote_sessions") as any).insert({
            agency_id: agencyId, 
            agent_id: user.id,
            project_title: clientName ? `Comparativa para ${clientName}` : `Cotización ${new Date().toLocaleDateString('es-MX')}`,
            insurance_line: category
        }).select().single()

        const results = await Promise.all(
            files.map(async (file) => {
                const buffer = Buffer.from(await file.arrayBuffer())
                let text = await extractTextFromPDF(buffer)
                let content: any = null

                const genAI = new GoogleGenerativeAI(geminiApiKey)
                const model = genAI.getGenerativeModel({ 
                    model: "gemini-2.5-flash", 
                    generationConfig: { responseMimeType: "application/json" }
                })

                // VISION Fallback or Low Text
                if (!text || text.trim().length <= 50) {
                    console.log(`[Parse] OMNI VISION 2.5: ${file.name}`)
                    const result = await model.generateContent([
                        { inlineData: { data: buffer.toString('base64'), mimeType: "application/pdf" } },
                        { text: PROMPT_QUOTE_MASTER }
                    ])
                    content = JSON.parse(result.response.text() || "{}")
                } else {
                    console.log(`[Parse] OMNI TEXT 2.5: ${file.name}`)
                    const result = await model.generateContent(`${PROMPT_QUOTE_MASTER}\n\nTexto: ${text.substring(0, 30000)}`)
                    content = JSON.parse(result.response.text() || "{}")
                }

                // Normalización Crítica (Unificación de Keys del Portal de Pólizas)
                const insurer = content.insurer_name || content.insurer
                
                // Heurística de Rescate Final
                let finalInsurer = insurer
                if (!finalInsurer) {
                    const lowText = text.toLowerCase()
                    if (lowText.includes("qualitas")) finalInsurer = "Qualitas"
                    else if (lowText.includes("gnp")) finalInsurer = "GNP"
                    else if (lowText.includes("axa")) finalInsurer = "AXA"
                }

                if (!finalInsurer) {
                    throw new Error(`No se pudo identificar la aseguradora en ${file.name}. Verifique que sea una cotización de Quálitas o GNP.`)
                }

                await (supabase.from("quote_items") as any).insert({
                    session_id: (session as any).id,
                    insurer_name: finalInsurer,
                    parsed_data: {
                        ...content,
                        omni_analysis: content.omni_analysis || "Análisis especializado en proceso..."
                    },
                    premium_total: content.premium_total,
                    currency: content.currency || "MXN"
                })

                return content
            })
        )

        return NextResponse.json({ success: true, results, sessionId: (session as any).id })
    } catch (error: any) {
        console.error("Master Parse Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
