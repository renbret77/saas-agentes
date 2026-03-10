"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Upload, FileText, Sparkles, X,
    ArrowRight, Loader2, ShieldCheck,
    AlertCircle, CheckCircle2, Zap,
    ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

export default function QuotesPage() {
    const [files, setFiles] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'uploading' | 'parsing' | 'success' | 'error'>('idle')
    const [results, setResults] = useState<any[]>([])
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [publicShareId, setPublicShareId] = useState<string | null>(null)
    const [creditBalance, setCreditBalance] = useState<number | null>(null)

    useEffect(() => {
        fetchCredits()
    }, [])

    const fetchCredits = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data }: any = await (supabase.from('user_credits') as any).select('balance').eq('user_id', user.id).single()
            if (data) setCreditBalance(data.balance)
        }
    }

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            setFiles(prev => [...prev, ...newFiles])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const startQuoting = async () => {
        if (files.length === 0) return
        setIsUploading(true)
        setStatus('uploading')

        try {
            const formData = new FormData()
            files.forEach(file => formData.append("files", file))

            const response = await fetch("/api/quotes/parse", {
                method: "POST",
                body: formData
            })

            const data = await response.json()
            if (data.success) {
                setResults(data.results)
                setSessionId(data.sessionId)

                // Fetch the public_share_id from the session created
                const { data: sess } = await (supabase
                    .from('quote_sessions') as any)
                    .select('public_share_id')
                    .eq('id', data.sessionId)
                    .single()

                if (sess) setPublicShareId(sess.public_share_id)
                setStatus('success')
            } else {
                setStatus('error')
            }
        } catch (error) {
            console.error(error)
            setStatus('error')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 pt-4 px-4 md:px-0">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-emerald-500 font-bold tracking-widest uppercase text-[10px]">
                        <div className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                        Fase 3: Cotizador IA Live
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        Cotizador Múltiple
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl">
                        Sube PDFs de diferentes aseguradoras y nuestra IA generará una comparativa unificada al instante.
                    </p>
                </div>

                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-600">Zero Data Retention Active</span>
                </div>
            </div>

            {status === 'success' ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-2xl font-bold text-slate-900">Resultados de la Comparativa</h2>
                        <div className="flex items-center gap-3">
                            {publicShareId && (
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/cotizacion/${publicShareId}`
                                        navigator.clipboard.writeText(url)
                                        alert("¡Enlace copiado al portapapeles! 🚀")
                                    }}
                                    className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all text-sm flex items-center gap-2 shadow-lg shadow-slate-900/10"
                                >
                                    <ExternalLink className="w-4 h-4 text-emerald-400" /> Copiar Link para Cliente
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setFiles([])
                                    setResults([])
                                    setStatus('idle')
                                    setPublicShareId(null)
                                }}
                                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm"
                            >
                                + Nueva Cotización
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map((res, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aseguradora</p>
                                        <h3 className="text-xl font-black text-slate-900">{res.insurer}</h3>
                                    </div>
                                    <div className="p-3 bg-white rounded-2xl border border-slate-100">
                                        <Sparkles className="w-5 h-5 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prima Total</p>
                                            <p className="text-3xl font-black text-emerald-600">${res.premium_total?.toLocaleString()}</p>
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 mb-1">{res.currency}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                                            <span className="text-slate-500 font-medium">Deducible</span>
                                            <span className="text-slate-900 font-bold">{res.data?.deductible || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                                            <span className="text-slate-500 font-medium">Coaseguro</span>
                                            <span className="text-slate-900 font-bold">{res.data?.['co-insurance'] || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Coberturas Destacadas</p>
                                        <div className="flex flex-wrap gap-2">
                                            {res.data?.coverage_highlights?.map((tag: string, j: number) => (
                                                <span key={j} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        <div
                            className={cn(
                                "relative group border-2 border-dashed rounded-3xl p-12 transition-all duration-300 flex flex-col items-center justify-center text-center",
                                files.length > 0 ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50"
                            )}
                        >
                            <input
                                type="file"
                                multiple
                                accept=".pdf"
                                onChange={onFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={isUploading}
                            />

                            <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Upload className="w-10 h-10 text-emerald-600" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-2">Arrastra tus PDFs aquí</h3>
                            <p className="text-slate-500 max-w-sm">
                                Puedes subir archivos de GNP, AXA, Mapfre, Qualitas, etc. Soporta hasta 10 archivos simultáneos.
                            </p>
                        </div>

                        {/* File List */}
                        <AnimatePresence>
                            {files.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Archivos Seleccionados ({files.length})</h4>
                                        <button
                                            onClick={() => setFiles([])}
                                            className="text-xs font-bold text-rose-500 hover:text-rose-600"
                                        >
                                            Limpiar Todo
                                        </button>
                                    </div>
                                    {files.map((file, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                                                    <FileText className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 truncate max-w-[200px] md:max-w-md">{file.name}</p>
                                                    <p className="text-[10px] font-medium text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFile(idx)}
                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Processing Panel */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl shadow-slate-900/20 border border-slate-800">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                                Resumen de Acción
                            </h3>

                            <div className="space-y-6 mb-8">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Archivos a Procesar</span>
                                    <span className="font-bold">{files.length} PDFs</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Balance Actual</span>
                                    <span className={cn("font-bold", (creditBalance || 0) > 0 ? "text-emerald-400" : "text-rose-400")}>
                                        {creditBalance !== null ? `${creditBalance} Créditos` : "Cargando..."}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Costo Estimado</span>
                                    <span className="font-bold text-amber-400">1 Crédito AI</span>
                                </div>
                                <div className="h-px bg-slate-800 w-full" />

                                {/* Status Stepper */}
                                <div className="space-y-4">
                                    {[
                                        { key: 'uploading', label: 'Subiendo a la Nube Segura', status: (status as any) === 'uploading' ? 'active' : (status as any) !== 'idle' ? 'done' : 'waiting' },
                                        { key: 'parsing', label: 'IA Analizando Coberturas', status: (status as any) === 'parsing' ? 'active' : ((status as any) === 'success' || (status as any) === 'error') ? 'done' : 'waiting' },
                                        { key: 'success', label: 'Generando Comparativa Visual', status: (status as any) === 'success' ? 'done' : 'waiting' }
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                                step.status === 'active' ? "bg-amber-400 text-slate-900" :
                                                    step.status === 'done' ? "bg-emerald-500 text-white" :
                                                        "bg-slate-800 text-slate-500"
                                            )}>
                                                {step.status === 'done' ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                                            </div>
                                            <span className={cn(
                                                "text-xs font-medium",
                                                step.status === 'active' ? "text-white" :
                                                    step.status === 'done' ? "text-emerald-400" :
                                                        "text-slate-500"
                                            )}>{step.label}</span>
                                            {step.status === 'active' && <Loader2 className="w-3 h-3 animate-spin text-amber-400 ml-auto" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={startQuoting}
                                disabled={files.length === 0 || isUploading}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                                    files.length === 0 || isUploading
                                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
                                )}
                            >
                                {status === 'idle' ? (
                                    <>
                                        Comenzar Cotización
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                ) : (
                                    <>
                                        Procesando con IA...
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex gap-4">
                            <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-amber-800 mb-1">Nota sobre Créditos</p>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    Se descontará 1 crédito de tu balance al generar la comparativa final. El análisis de PDFs es gratuito.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
