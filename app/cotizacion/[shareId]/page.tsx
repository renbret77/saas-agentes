import { createClient } from "@supabase/supabase-js"
import QuotePresentation from "@/components/QuotePresentation"
import { ShieldCheck, Info, Download, ExternalLink, ArrowRight } from "lucide-react"
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
    params: Promise<{ shareId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { shareId } = await params
    return {
        title: `Cotización Omni Elite | ID: ${shareId.substring(0, 8)}`,
        description: 'Análisis de Inteligencia OMNI 3.11 para tu Blindaje Patrimonial',
    }
}

export default async function PublicQuotePage({ params }: Props) {
    const { shareId } = await params
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ""
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ""
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Fetch Session
    const { data: session } = await (supabase
        .from('quote_sessions') as any)
        .select('*')
        .eq('public_share_id', shareId)
        .single()

    if (!session) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                <ShieldCheck className="w-16 h-16 text-slate-300 mb-6" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Cotización No Encontrada</h1>
                <p className="text-slate-500">Este enlace puede haber expirado o ser inválido.</p>
            </div>
        )
    }

    // 2. Fetch Agency
    if (session.agency_id) {
        const { data: agencyData } = await (supabase
            .from('agencies') as any)
            .select('name, logo_url')
            .eq('id', session.agency_id)
            .single()
        
        if (agencyData) {
            session.agencies = agencyData
        }
    }

    // 3. Fetch Items
    const { data: items } = await (supabase
        .from('quote_items') as any)
        .select('*')
        .eq('session_id', session.id)
        .order('premium_total', { ascending: true })

    const insuranceType = session.insurance_line || 'auto'
    const primaryItem = items?.[0] || {}

    return (
        <div className="min-h-screen bg-slate-900">
            {/* AUDIT LABEL (HIDDEN) */}
            <div className="hidden" data-version="v3.11-SERVER-OMNI-ELITE" />

            <QuotePresentation
                type={insuranceType}
                agencyName={session.agencies?.name || "Omni Elite Agente"}
                videoUrl={session.video_url}
                quoteData={{
                    total_premium: primaryItem?.premium_total?.toLocaleString() || '0',
                    currency: primaryItem?.currency || 'MXN',
                    omni_analysis: primaryItem?.parsed_data?.omni_analysis || session.omni_analysis,
                    coverages: primaryItem?.parsed_data?.coverages || []
                }}
            />

            <main className="max-w-7xl mx-auto px-4 py-12 -mt-20 relative z-20">
                {items && items.length > 1 && (
                    <div className="mb-20">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black text-white tracking-tight">Compara tus Opciones</h2>
                            <p className="text-slate-400">Hemos seleccionado {items.length} alternativas que se ajustan a tus necesidades.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {items.map((item: any, idx: number) => (
                                <div
                                    key={idx}
                                    className={`relative bg-white rounded-[40px] p-8 shadow-xl border-2 transition-all hover:translate-y-[-8px] ${idx === 0 ? "border-emerald-500 shadow-emerald-600/10" : "border-transparent"}`}
                                >
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-2xl font-black text-slate-900">{item.insurer_name}</h3>
                                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div className="p-6 bg-slate-900 rounded-[2.5rem]">
                                            <div className="flex items-baseline justify-center gap-2">
                                                <p className="text-4xl font-black text-white">${item.premium_total?.toLocaleString()}</p>
                                                <p className="text-xs font-bold text-emerald-400">{item.currency}</p>
                                            </div>
                                        </div>
                                        <button className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 ${idx === 0 ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-slate-900 text-white"}`}>
                                            Seleccionar Opción
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-20 p-10 bg-white rounded-[40px] border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
                    <div className="flex gap-4">
                        <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
                            <Info className="w-7 h-7 text-indigo-600" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-lg font-bold text-slate-900">¿Deseas formalizar tu protección?</h4>
                            <p className="text-slate-500">Nuestro equipo está listo para ayudarte a emitir tu póliza en minutos.</p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                         <button className="flex-1 md:flex-none px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                            <Download className="w-5 h-5" /> Descargar PDF
                        </button>
                        <button 
                            className="flex-1 md:flex-none px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                        >
                            Hablar con un Experto <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </main>

            <footer className="py-12 bg-white border-t border-slate-100 flex flex-col items-center justify-center gap-6 text-center px-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-[8px] font-black text-white rotate-3">RB</div>
                    <p className="text-xs font-black text-slate-900 tracking-tight uppercase">RB PROYECTOS ENGINE</p>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">© {new Date().getFullYear()} Soluciones de Inteligencia para Seguros • Tecnología Omni Elite</p>
            </footer>
        </div>
    )
}
