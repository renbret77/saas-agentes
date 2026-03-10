"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
    ShieldCheck,
    Check,
    MessageCircle,
    FileText,
    Shield,
    Clock,
    User,
    Sparkles,
    Star,
    MapPin,
    Activity,
    Hospital
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function PublicQuotePage() {
    const params = useParams()
    const id = params?.id as string
    const [quote, setQuote] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) fetchQuote()
    }, [id])

    const fetchQuote = async () => {
        const { data } = await supabase
            .from('quotes')
            .select('*')
            .eq('id', id)
            .single()

        if (data) setQuote(data)
        setLoading(false)
    }

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">Cargando tu propuesta personalizada...</p>
            </div>
        </div>
    )

    if (!quote) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-[2rem] p-8 text-center shadow-xl">
                <Shield className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-slate-900 mb-2">Propuesta No Encontrada</h1>
                <p className="text-slate-500 mb-6">El enlace puede haber expirado o ser incorrecto. Contacta a tu agente de seguros.</p>
                <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">Contactar Soporte</button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header / Brand */}
            <div className="bg-white border-b border-slate-100">
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
                        <ShieldCheck className="h-7 w-7" />
                        <span>Seguros RB</span>
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Propuesta #{(quote.id as string).substring(0, 8)}
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 pt-12">
                {/* Hero Section */}
                <div className={cn(
                    "rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl mb-10 transition-colors duration-500",
                    quote.branch === "Empresarial"
                        ? "bg-gradient-to-br from-[#0f172a] to-[#1e293b] shadow-slate-200"
                        : "bg-gradient-to-br from-indigo-900 to-slate-900 shadow-indigo-200"
                )}>
                    <div className="relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-indigo-200 mb-6"
                        >
                            <Sparkles className="w-4 h-4" /> ESTUDIO PERSONALIZADO DE SEGURO
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-bold leading-tight mb-4"
                        >
                            Propuesta de {quote.branch} <br />
                            para <span className="text-indigo-400">{quote.client_name}</span>
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-6 text-indigo-100/60 text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Válida por 15 días
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Protección Garantizada
                            </div>
                        </motion.div>
                    </div>

                    {/* Decorative Elements */}
                    <div className={cn(
                        "absolute top-0 right-0 w-64 h-64 blur-[100px] -mr-32 -mt-32 rounded-full",
                        quote.branch === "Empresarial" ? "bg-slate-500/10" : "bg-indigo-500/20"
                    )} />
                    <div className={cn(
                        "absolute bottom-0 left-0 w-48 h-48 blur-[80px] -ml-24 -mb-24 rounded-full",
                        quote.branch === "Empresarial" ? "bg-slate-400/5" : "bg-blue-500/10"
                    )} />
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-8">
                        {/* AI Summary Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className={cn(
                                "p-8 rounded-[2rem] relative border transition-colors",
                                quote.branch === "Empresarial"
                                    ? "bg-slate-100 border-slate-200 text-slate-900"
                                    : "bg-indigo-50 border-indigo-100 text-indigo-900"
                            )}
                        >
                            <Star className={cn(
                                "absolute top-4 right-4 w-6 h-6 opacity-20 fill-current",
                                quote.branch === "Empresarial" ? "text-slate-400" : "text-indigo-300"
                            )} />
                            <h2 className={cn(
                                "text-lg font-bold mb-3 flex items-center gap-2",
                                quote.branch === "Empresarial" ? "text-slate-800" : "text-indigo-900"
                            )}>
                                <Sparkles className="w-5 h-5" /> {quote.branch === "Empresarial" ? "Evaluación de Riesgos AI" : "Análisis del Especialista"}
                            </h2>
                            <p className="leading-relaxed italic opacity-80">
                                "{quote.ai_summary || "Hemos analizado las mejores opciones del mercado para garantizar tu tranquilidad y la de tu familia."}"
                            </p>
                        </motion.div>

                        {/* Options Comparison */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-900 px-2 uppercase tracking-wider text-sm flex items-center gap-3">
                                <div className="h-4 w-1 bg-indigo-600 rounded-full" /> Comparativa de Opciones
                            </h2>
                            <div className="grid gap-4">
                                {quote.options.map((opt: any, idx: number) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + (idx * 0.1) }}
                                        key={idx}
                                        className={cn(
                                            "bg-white p-6 rounded-3xl border transition-all hover:shadow-lg",
                                            opt.is_recommended ? "border-indigo-600 ring-4 ring-indigo-50" : "border-slate-100"
                                        )}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="space-y-1">
                                                {opt.is_recommended && (
                                                    <span className="text-[10px] font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-tighter mb-2 inline-block">
                                                        Recomendada
                                                    </span>
                                                )}
                                                <h3 className="text-xl font-bold text-slate-900">{opt.company}</h3>
                                                <p className="text-sm text-slate-500 max-w-sm">{opt.coverage_summary}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-slate-400 block uppercase mb-1">Inversión Anual</span>
                                                <span className="text-2xl font-black text-slate-900">{opt.price}</span>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex flex-wrap gap-4">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <Check className="w-4 h-4 text-emerald-500" /> Cobertura Amplia
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <Check className="w-4 h-4 text-emerald-500" /> Pago a MSI
                                                </div>
                                                {quote.branch === "GMM" && (
                                                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-500">
                                                        <Hospital className="w-4 h-4" /> Nivel Hospitalario Top
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                className={cn(
                                                    "px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
                                                    opt.is_recommended
                                                        ? (quote.branch === "Empresarial" ? "bg-slate-900 text-white hover:bg-black" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100")
                                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                )}
                                                onClick={() => {
                                                    const msg = encodeURIComponent(`Hola Rene! 👋 Me interesa la opción de ${opt.company} por ${opt.price} pesos para mi seguro de ${quote.branch}. ¿Me podrías ayudar con la emisión?`)
                                                    window.open(`https://wa.me/5211234567890?text=${msg}`, '_blank')
                                                }}
                                            >
                                                Elegir esta Opción
                                            </button>
                                        </div>

                                        {/* Hospital Enrichment Section */}
                                        {opt.main_hospitals && opt.main_hospitals.length > 0 && (
                                            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <MapPin className="w-3 h-3" /> Hospitales Destacados en tu zona ({quote.location || 'Monterrey'})
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {opt.main_hospitals.map((h: string, i: number) => (
                                                        <span key={i} className="px-3 py-1 bg-white border border-slate-100 text-slate-600 text-[10px] font-medium rounded-lg shadow-sm">
                                                            {h}
                                                        </span>
                                                    ))}
                                                    <span className="px-3 py-1 text-slate-400 text-[10px] font-medium italic">...y más de 200 en red.</span>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Agent Info */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 sticky top-12 shadow-sm">
                            <div className="text-center mb-6">
                                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-indigo-500 to-blue-500 mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-indigo-100 overflow-hidden">
                                    RB
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Rene Breton</h3>
                                <p className="text-sm font-medium text-indigo-600 mt-1 uppercase tracking-widest text-[10px]">Agente Certificado</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-bold text-slate-900 mb-0.5">Cédula Profesional</p>
                                        <p className="text-slate-500">B-A123-456</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => window.open('https://wa.me/5211234567890', '_blank')}
                                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                                >
                                    <MessageCircle className="w-5 h-5" /> Resolver Dudas
                                </button>
                                <p className="text-[10px] text-center text-slate-400 leading-relaxed px-4">
                                    Al contratar conmigo recibes asesoría personalizada sin costo extra y apoyo total en caso de siniestro.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
