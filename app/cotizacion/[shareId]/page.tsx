"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    ShieldCheck, Sparkles, CheckCircle2,
    MessageCircle, Download, ExternalLink,
    ChevronDown, Info, ArrowRight
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useParams } from "next/navigation"
import QuotePresentation from "@/components/QuotePresentation"

export default function PublicQuotePage() {
    const { shareId } = useParams()
    const [session, setSession] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const detectInsuranceType = (title: string): string => {
        const t = title.toLowerCase()
        if (t.includes('pyme') || t.includes('negocio') || t.includes('empresa')) return 'segupyme'
        if (t.includes('auto') || t.includes('coche') || t.includes('vehiculo')) return 'auto'
        if (t.includes('camion') || t.includes('carga') || t.includes('pesado')) return 'camiones'
        if (t.includes('retiro') || t.includes('ppr') || t.includes('pension')) return 'retiro'
        if (t.includes('rc') || t.includes('contratista') || t.includes('responsabilidad')) return 'rc_contratista'
        if (t.includes('credito')) return 'credito'
        if (t.includes('funerarios') || t.includes('muerte') || t.includes('fallecimiento') || t.includes('sepelio')) return 'gastos_funerarios'
        if (t.includes('educacion') || t.includes('universidad') || t.includes('estudios') || t.includes('beca')) return 'educacion'
        if (t.includes('escuela') || t.includes('colegio') || t.includes('instituto') || t.includes('plantel')) return 'escuelas'
        if (t.includes('ferreteria') || t.includes('herramientas') || t.includes('tlapaleria')) return 'ferreteria'
        if (t.includes('oficina') || t.includes('despacho') || t.includes('consultorio')) return 'oficinas'
        if (t.includes('restaurante') || t.includes('cafeteria') || t.includes('comida') || t.includes('bar')) return 'restaurantes'
        if (t.includes('taller') || t.includes('mecanico') || t.includes('reparacion')) return 'talleres'
        if (t.includes('viaje') || t.includes('turismo') || t.includes('vuelo') || t.includes('pasaporte')) return 'viajero'
        if (t.includes('agricola') || t.includes('siembra') || t.includes('cosecha') || t.includes('campo')) return 'agricultura'
        if (t.includes('mercancia') || t.includes('logistica') || t.includes('transporte') || t.includes('embarque')) return 'mercancias'
        if (t.includes('profesional') || t.includes('medico') || t.includes('abogado') || t.includes('ingeniero')) return 'rc_profesional'
        return 'auto' // Default
    }

    useEffect(() => {
        fetchQuoteData()
    }, [shareId])

    const fetchQuoteData = async () => {
        try {
            // Fetch the session using the public share ID
            const { data: sessionData, error: sessionError } = await (supabase
                .from('quote_sessions') as any)
                .select('*, agencies(name, logo_url)')
                .eq('public_share_id', shareId)
                .single()

            if (sessionError) throw sessionError
            setSession(sessionData)

            // Fetch the items for this session
            const { data: itemsData, error: itemsError } = await (supabase
                .from('quote_items') as any)
                .select('*')
                .eq('session_id', sessionData.id)
                .order('premium_total', { ascending: true })

            if (itemsError) throw itemsError
            setItems(itemsData)
        } catch (error) {
            console.error("Error fetching public quote:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
                />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                <ShieldCheck className="w-16 h-16 text-slate-300 mb-6" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Cotización No Encontrada</h1>
                <p className="text-slate-500">Este enlace puede haber expirado o ser inválido.</p>
            </div>
        )
    }

    const insuranceType = session ? detectInsuranceType(session.project_title || '') : 'auto'

    return (
        <div className="min-h-screen bg-slate-50">
            {/* NEW PRESENTATION HEADER */}
            <QuotePresentation
                type={insuranceType}
                agencyName={session.agencies?.name}
                quoteData={{
                    total_premium: items[0]?.premium_total?.toLocaleString() || '0',
                    currency: items[0]?.currency || 'MXN',
                    coverages: items[0]?.parsed_data?.data?.coverage_highlights?.map((h: string) => ({ name: h, limit: 'Incluido' })) || []
                }}
            />

            <main className="max-w-7xl mx-auto px-4 py-12 -mt-20 relative z-20">
                {/* Comparison Grid (Only if multiple options) */}
                {items.length > 1 && (
                    <div className="mb-20">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Compara tus Opciones</h2>
                            <p className="text-slate-500">Hemos seleccionado {items.length} alternativas que se ajustan a tus necesidades.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {items.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    className={`relative bg-white rounded-[40px] p-8 shadow-xl border-2 transition-all hover:translate-y-[-8px] ${idx === 0 ? "border-emerald-500 shadow-emerald-600/10" : "border-transparent"}`}
                                >
                                    {idx === 0 && (
                                        <div className="absolute top-0 right-8 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30">
                                            Mejor Valor
                                        </div>
                                    )}

                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-2xl font-black text-slate-900">{item.insurer_name}</h3>
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                                                <ShieldCheck className="w-6 h-6 text-slate-400" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inversión Total</p>
                                            <div className="flex items-end gap-2">
                                                <p className="text-4xl font-black text-slate-900">${item.premium_total?.toLocaleString()}</p>
                                                <p className="text-sm font-bold text-slate-400 mb-1">{item.currency}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 py-8 border-y border-slate-100">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500 font-medium flex items-center gap-2">
                                                    <ChevronDown className="w-4 h-4 text-slate-400" /> Deducible
                                                </span>
                                                <span className="text-slate-900 font-black">{item.parsed_data?.data?.deductible || "N/A"}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500 font-medium flex items-center gap-2">
                                                    <ChevronDown className="w-4 h-4 text-slate-400" /> Coaseguro
                                                </span>
                                                <span className="text-slate-900 font-black">{item.parsed_data?.data?.['co-insurance'] || "N/A"}</span>
                                            </div>
                                        </div>

                                        <button className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${idx === 0 ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-slate-900 text-white"}`}>
                                            Seleccionar Opción
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Section with reassurance */}
                <div className="mt-20 p-10 bg-white rounded-[40px] border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
                    <div className="flex gap-4">
                        <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
                            <Info className="w-7 h-7 text-indigo-600" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-lg font-bold text-slate-900 underline decoration-indigo-200 decoration-4 underline-offset-4">¿Deseas formalizar tu protección?</h4>
                            <p className="text-slate-500 max-w-md">Nuestro equipo está listo para ayudarte a emitir tu póliza en minutos. Sin papeleo excesivo.</p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                            <Download className="w-5 h-5" /> Descargar PDF
                        </button>
                        <button className="flex-1 md:flex-none px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20">
                            Hablar con un Experto <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}

