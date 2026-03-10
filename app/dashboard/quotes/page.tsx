"use client"

import { useState, useEffect } from "react"
import {
    Plus,
    Search,
    FileText,
    Send,
    MoreHorizontal,
    ExternalLink,
    Trash2,
    CheckCircle2,
    Clock,
    AlertCircle,
    Copy,
    Share2,
    Sparkles,
    Upload,
    Loader2
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface QuoteOption {
    company: string
    price: string
    coverage_summary: string
    is_recommended: boolean
}

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newQuote, setNewQuote] = useState({
        client_name: "",
        client_email: "",
        branch: "Autos",
        options: [{ company: "", price: "", coverage_summary: "", is_recommended: false }] as QuoteOption[]
    })
    const [generatingAI, setGeneratingAI] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
        fetchQuotes()
    }, [])

    const fetchQuotes = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('quotes')
            .select('*')
            .order('created_at', { ascending: false })
        if (data) setQuotes(data)
        setLoading(false)
    }

    const handleCreateQuote = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('quotes')
            .insert([{
                ...newQuote,
                agent_id: user.id,
                status: 'pendiente'
            }] as any)
            .select()

        if (error) {
            console.error("Error creating quote:", error)
            return
        }

        // --- CRM SYNC START ---
        // Automatically create a card in the pipeline (Etapa: Cotizando)
        const quoteId = (data as any)[0].id
        await supabase
            .from('pipeline_cards')
            .insert([{
                agent_id: user.id,
                title: `Cotización: ${newQuote.client_name}`,
                client_name: newQuote.client_name,
                branch: newQuote.branch,
                stage: 'quoting',
                value: newQuote.options[0]?.price || "0",
                quote_id: quoteId
            }] as any)
        // --- CRM SYNC END ---

        setIsCreateModalOpen(false)
        fetchQuotes()
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const res = await fetch("/api/quotes/parse", {
                method: "POST",
                body: formData
            })
            const data = await res.json()

            if (data.error) throw new Error(data.error)

            setNewQuote({
                client_name: data.client_name || "",
                client_email: "",
                branch: data.branch || "GMM",
                options: data.options.map((opt: any) => ({
                    company: opt.company,
                    price: opt.price,
                    coverage_summary: opt.coverage_summary,
                    is_recommended: false,
                    main_hospitals: opt.main_hospitals // Added for GMM
                })),
                ai_summary: data.ai_analysis
            } as any)
        } catch (error) {
            console.error("Error analyzing quote:", error)
            alert("Error al analizar la cotización. Intenta manualmente.")
        } finally {
            setIsUploading(false)
        }
    }

    const generateAISummary = async () => {
        setGeneratingAI(true)
        // Simulated AI delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        const summary = `Basado en las opciones para ${newQuote.client_name}, la opción de ${newQuote.options[0].company} ofrece el mejor balance entre costo y protección legal, ideal para el perfil de riesgo solicitado.`
        setNewQuote({ ...newQuote, ai_summary: summary } as any)
        setGeneratingAI(false)
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <FileText className="w-8 h-8 text-indigo-600" /> Cotizaciones Inteligentes
                    </h1>
                    <p className="text-slate-500 mt-1">Genera propuestas profesionales que venden solas.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-200"
                >
                    <Plus className="w-5 h-5" /> Nueva Cotización
                </button>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="h-40 flex items-center justify-center bg-white rounded-3xl border border-slate-100 italic text-slate-400">
                        Cargando cotizaciones...
                    </div>
                ) : quotes.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 text-slate-400 text-center p-8">
                        <FileText className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium text-slate-600 mb-1">No hay cotizaciones aún</p>
                        <p className="text-sm max-w-[250px]">Crea tu primera cotización inteligente para impresionar a tus clientes.</p>
                    </div>
                ) : (
                    quotes.map((quote) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={quote.id}
                            className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-xl transition-all group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                        {quote.client_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{quote.client_name}</h3>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                            <span className="flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                                                {quote.branch}
                                            </span>
                                            <span>{new Date(quote.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Copiar Link">
                                        <Copy className="w-5 h-5" />
                                    </button>
                                    <button className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Enviar por WhatsApp">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                    <div className="h-8 w-px bg-slate-100 mx-2" />
                                    <a
                                        href={`/quote/${quote.id}`}
                                        target="_blank"
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-bold text-sm"
                                    >
                                        Ver Propuesta <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setIsCreateModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">Nueva Cotización</h2>
                                        <p className="text-slate-500">Crea una propuesta profesional con IA.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>

                                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                                    {/* Upload Zone */}
                                    <div className="p-6 border-2 border-dashed border-indigo-100 bg-indigo-50/30 rounded-[2rem] text-center space-y-3 group hover:border-indigo-300 transition-all cursor-pointer relative overflow-hidden">
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                                            {isUploading ? <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" /> : <Upload className="w-6 h-6 text-indigo-600" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{isUploading ? "Analizando Cotización..." : "Sube el PDF de la aseguradora"}</p>
                                            <p className="text-xs text-slate-500">La IA leerá los datos y llenará todo por ti.</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre del Cliente</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                                placeholder="Ej: René Breton"
                                                value={newQuote.client_name}
                                                onChange={(e) => setNewQuote({ ...newQuote, client_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Ramo</label>
                                            <select
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium appearance-none"
                                                value={newQuote.branch}
                                                onChange={(e) => setNewQuote({ ...newQuote, branch: e.target.value })}
                                            >
                                                <option>Autos</option>
                                                <option>GMM</option>
                                                <option>Vida</option>
                                                <option>Hogar</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Options Container */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Opciones de Aseguradora</label>
                                            <button
                                                onClick={() => setNewQuote({
                                                    ...newQuote,
                                                    options: [...newQuote.options, { company: "", price: "", coverage_summary: "", is_recommended: false }]
                                                })}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                                            >
                                                + Añadir Aseguradora
                                            </button>
                                        </div>

                                        {newQuote.options.map((option, idx) => (
                                            <div key={idx} className="p-4 bg-slate-50 rounded-2xl space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        type="text"
                                                        className="px-4 py-2 bg-white border-none rounded-xl outline-none text-sm font-medium"
                                                        placeholder="Aseguradora"
                                                        value={option.company}
                                                        onChange={(e) => {
                                                            const opts = [...newQuote.options]
                                                            opts[idx].company = e.target.value
                                                            setNewQuote({ ...newQuote, options: opts })
                                                        }}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="px-4 py-2 bg-white border-none rounded-xl outline-none text-sm font-medium"
                                                        placeholder="Precio (Anual)"
                                                        value={option.price}
                                                        onChange={(e) => {
                                                            const opts = [...newQuote.options]
                                                            opts[idx].price = e.target.value
                                                            setNewQuote({ ...newQuote, options: opts })
                                                        }}
                                                    />
                                                </div>
                                                <textarea
                                                    className="w-full px-4 py-2 bg-white border-none rounded-xl outline-none text-sm font-medium resize-none h-16"
                                                    placeholder="Resumen de coberturas clave..."
                                                    value={option.coverage_summary}
                                                    onChange={(e) => {
                                                        const opts = [...newQuote.options]
                                                        opts[idx].coverage_summary = e.target.value
                                                        setNewQuote({ ...newQuote, options: opts })
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* AI Summary Section */}
                                    <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl text-white space-y-4 shadow-xl shadow-indigo-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 animate-pulse" />
                                                <span className="font-bold">Análisis Inteligente (AI)</span>
                                            </div>
                                            <button
                                                onClick={generateAISummary}
                                                disabled={generatingAI || !newQuote.client_name}
                                                className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                                            >
                                                {generatingAI ? "Pensando..." : "Generar Resumen"}
                                            </button>
                                        </div>
                                        {(newQuote as any).ai_summary ? (
                                            <p className="text-sm text-indigo-50 italic leading-relaxed">
                                                "{(newQuote as any).ai_summary}"
                                            </p>
                                        ) : (
                                            <p className="text-sm text-indigo-100/60 italic">
                                                Usa la IA para redactar por qué estas opciones son las mejores para tu cliente.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all font-bold"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreateQuote}
                                        className="flex-[2] px-6 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100"
                                    >
                                        Crear y Compartir Link
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
