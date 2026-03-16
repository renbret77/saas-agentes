"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Upload, FileText, Sparkles, X,
    ArrowRight, Loader2, ShieldCheck,
    AlertCircle, CheckCircle2, Zap,
    ExternalLink, RefreshCw, Layers,
    MousePointer2, Clock, Trophy,
    User, Car, Heart, Home, Briefcase, Globe
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

const CATEGORIES = [
    { id: 'auto', label: 'Autos / Camiones', icon: <Car className="w-6 h-6" />, color: 'bg-blue-500' },
    { id: 'gastos_medicos', label: 'Gastos Médicos', icon: <Heart className="w-6 h-6" />, color: 'bg-rose-500' },
    { id: 'segupyme', label: 'Hogar / Negocio', icon: <Home className="w-6 h-6" />, color: 'bg-amber-500' },
    { id: 'retiro', label: 'Vida / Retiro', icon: <User className="w-6 h-6" />, color: 'bg-emerald-500' },
    { id: 'mercancias', label: 'Carga / Logística', icon: <Briefcase className="w-6 h-6" />, color: 'bg-indigo-500' },
    { id: 'viajero', label: 'Viajero / Global', icon: <Globe className="w-6 h-6" />, color: 'bg-teal-500' },
]

export default function QuotesPage() {
    const [step, setStep] = useState<'selection' | 'uploading' | 'success'>('selection')
    const [clientName, setClientName] = useState("")
    const [category, setCategory] = useState("auto")
    const [files, setFiles] = useState<File[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [results, setResults] = useState<any[]>([])
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [publicShareId, setPublicShareId] = useState<string | null>(null)
    const [creditBalance, setCreditBalance] = useState<number | null>(null)
    const [progress, setProgress] = useState(0)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        fetchCredits()
    }, [])

    const fetchCredits = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                if (user.email === 'admin@admin.com') {
                    setCreditBalance(1000)
                    return
                }
                const { data }: any = await (supabase.from('user_credits') as any).select('balance').eq('user_id', user.id).single()
                setCreditBalance(data?.balance ?? 0)
            }
        } catch (e) {
            console.error("Error fetching credits:", e)
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
        setIsProcessing(true)
        setProgress(0)
        setErrorMessage(null)
        
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 98) return 98
                return prev + (prev < 50 ? 5 : 1)
            })
        }, 400)

        try {
            const { data: { session: authSession } } = await supabase.auth.getSession()
            const formData = new FormData()
            files.forEach(file => formData.append("files", file))
            formData.append("clientName", clientName)
            formData.append("category", category)

            const response = await fetch("/api/quotes/parse", {
                method: "POST",
                headers: { 'Authorization': `Bearer ${authSession?.access_token}` },
                body: formData
            })
            
            clearInterval(interval)
            setProgress(100)

            const data = await response.json()
            if (data.success) {
                setResults(data.results)
                setSessionId(data.sessionId)
                const { data: sess } = await (supabase.from('quote_sessions') as any).select('public_share_id').eq('id', data.sessionId).single()
                if (sess) setPublicShareId(sess.public_share_id)
                setStep('success')
            } else {
                setErrorMessage(data.error || "Falla en el motor de IA.")
            }
        } catch (error: any) {
            clearInterval(interval)
            setErrorMessage("Error de conexión.")
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden pb-24 selection:bg-emerald-200">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-[800px] pointer-events-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-300/20 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-indigo-200/20 blur-[120px] rounded-full" />
            </div>

            <main className="max-w-6xl mx-auto px-6 pt-12 relative z-10">
                
                <AnimatePresence mode="wait">
                    {step === 'selection' ? (
                        <motion.div
                            key="selection"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="max-w-4xl mx-auto space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md border border-white rounded-full shadow-sm">
                                    <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Configuración de Cotización</span>
                                </div>
                                <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
                                    ¿Para quién es esta <span className="text-emerald-600">Magia?</span>
                                </h1>
                                <p className="text-lg text-slate-500 font-medium italic">Personaliza la experiencia antes de que la IA Omni Elite tome el control.</p>
                            </div>

                            <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-slate-100 space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre del Prospecto / Cliente</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                            <User className="w-6 h-6 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                        </div>
                                        <input 
                                            type="text"
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                            placeholder="Ej. Juan Pérez García"
                                            className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-200"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Selecciona la Línea de Negocio</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {CATEGORIES.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setCategory(cat.id)}
                                                className={cn(
                                                    "p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 text-sm font-black text-center relative overflow-hidden group/cat",
                                                    category === cat.id 
                                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-500/10"
                                                        : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200 hover:bg-white"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                                    category === cat.id ? "bg-emerald-500 text-white shadow-xl rotate-6" : "bg-white text-slate-300 group-hover/cat:scale-110"
                                                )}>
                                                    {cat.icon}
                                                </div>
                                                <span className="leading-tight uppercase tracking-tight">{cat.label}</span>
                                                {category === cat.id && (
                                                    <motion.div layoutId="activeCat" className="absolute top-4 right-4 text-emerald-500">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </motion.div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep('uploading')}
                                    className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black tracking-[0.2em] uppercase text-xs flex items-center justify-center gap-4 hover:bg-slate-800 transition-all active:scale-[0.98] shadow-2xl shadow-slate-900/20 group"
                                >
                                    Siguiente Paso <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform text-emerald-400" />
                                </button>
                            </div>
                        </motion.div>
                    ) : step === 'uploading' ? (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-12"
                        >
                            v3.1.0 [OMNI ELITE] | SYNC OK | 19:15
                            {/* MINI HEADER */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="space-y-4">
                                    <button 
                                        onClick={() => setStep('selection')}
                                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 hover:text-emerald-500 transition-colors"
                                    >
                                        ← Regresar a Personalización
                                    </button>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-center shadow-sm">
                                            {CATEGORIES.find(c => c.id === category)?.icon}
                                        </div>
                                        <div>
                                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none italic">
                                                {clientName ? `Para: ${clientName}` : 'Comparativa IA'}
                                            </h1>
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                                                Línea: {CATEGORIES.find(c => c.id === category)?.label}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Motor OMNI 3.1 Activo</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                <div className="lg:col-span-7 space-y-8">
                                    <div className="bg-white/40 backdrop-blur-xl border-2 border-dashed border-slate-100 rounded-[4rem] p-16 relative overflow-hidden group hover:border-emerald-300 transition-all">
                                        <input
                                            type="file" multiple accept=".pdf"
                                            onChange={onFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            disabled={isProcessing}
                                        />
                                        <div className="text-center space-y-6">
                                            <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                                <Upload className="w-10 h-10 text-emerald-600" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">Sube tus archivos Omni Elite</h3>
                                                <p className="text-slate-500 font-medium">Arrastra las cotizaciones en PDF aquí.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {files.map((file, idx) => (
                                        <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm group hover:border-emerald-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-50">
                                                    <FileText className="w-6 h-6 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 truncate max-w-[200px]">{file.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">PDF Document • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button onClick={() => removeFile(idx)} className="p-3 hover:bg-rose-50 text-slate-200 hover:text-rose-500 rounded-[1.5rem] transition-all">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="lg:col-span-5">
                                    <div className="bg-slate-900 rounded-[3.5rem] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.3)] space-y-12 border border-slate-800 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                            <Trophy className="w-48 h-48 text-white fill-white" />
                                        </div>

                                        <div className="space-y-2 relative z-10">
                                            <h4 className="text-emerald-400 font-black uppercase tracking-widest text-[10px]">Omni Elite Intelligence</h4>
                                            <h3 className="text-white text-3xl font-black italic tracking-tighter leading-none">Motor de Cierre</h3>
                                        </div>

                                        <div className="space-y-8 relative z-10">
                                            <div className="flex items-center justify-between text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
                                                <span>Prospecto</span>
                                                <span className="text-white truncate max-w-[150px]">{clientName || '---'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
                                                <span>Documentos</span>
                                                <span className="text-white">{files.length}</span>
                                            </div>
                                            <div className="h-px bg-slate-800" />
                                            
                                            {isProcessing ? (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">Analizando Quirúrgicamente...</span>
                                                        <span className="text-3xl font-black text-white">{Math.round(progress)}%</span>
                                                    </div>
                                                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress}%` }}
                                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-slate-500 text-xs italic leading-relaxed text-center">
                                                    La IA procesará cada PDF buscando las mejores coberturas para {clientName || 'tu cliente'}. Generará una comparativa única e irreversiblemente profesional.
                                                </p>
                                            )}
                                        </div>

                                        {errorMessage && (
                                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
                                                <AlertCircle className="w-5 h-5 text-rose-500" />
                                                <p className="text-[10px] text-rose-300 font-bold italic">{errorMessage}</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={startQuoting}
                                            disabled={files.length === 0 || isProcessing}
                                            className={cn(
                                                "w-full py-6 rounded-3xl font-black flex items-center justify-center gap-4 transition-all tracking-[0.3em] uppercase text-[10px] relative z-20",
                                                files.length === 0 || isProcessing
                                                    ? "bg-slate-800 text-slate-600 grayscale"
                                                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl shadow-emerald-600/20 active:scale-95 group/btn"
                                            )}
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>Ejecutar Comparativa <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-12"
                        >
                            <div className="bg-white border border-slate-100 rounded-[4rem] p-16 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none rotate-12">
                                    <Sparkles className="w-64 h-64 text-slate-900" />
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 relative z-10">
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest rounded-full">
                                            <Trophy className="w-4 h-4" /> Inteligencia Omni Elite Aplicada
                                        </div>
                                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none italic">Análisis Final Omni Elite</h2>
                                        <p className="text-xl text-slate-500 font-medium">Comparativa generada para <span className="text-slate-900 font-black underline decoration-emerald-500 decoration-8 underline-offset-4">{clientName || 'tu prospecto'}</span>.</p>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {publicShareId && (
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => {
                                                        const url = `${window.location.origin}/cotizacion/${publicShareId}`
                                                        navigator.clipboard.writeText(url)
                                                        alert("¡Link de Cierre Omni Elite Copiado! 🚀🚀")
                                                    }}
                                                    className="px-12 py-6 bg-slate-100 text-slate-900 border border-slate-200 font-black rounded-3xl hover:bg-white transition-all text-[10px] tracking-[0.3em] uppercase flex items-center gap-4 shadow-sm group/share"
                                                >
                                                    <ExternalLink className="w-6 h-6 text-slate-400 group-hover/share:rotate-12 transition-transform" /> 
                                                    Copiar Link de Cierre
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const url = `${window.location.origin}/cotizacion/${publicShareId}`
                                                        window.open(url, '_blank')
                                                    }}
                                                    className="px-12 py-6 bg-slate-900 text-white font-black rounded-3xl hover:bg-slate-800 transition-all text-[10px] tracking-[0.3em] uppercase flex items-center gap-4 shadow-2xl shadow-slate-900/40 group/view"
                                                >
                                                    <MousePointer2 className="w-6 h-6 text-emerald-400 group-hover/view:scale-110 transition-transform" /> 
                                                    Ver Landing Page
                                                </button>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => { setStep('selection'); setFiles([]); setResults([]); setPublicShareId(null); setClientName(""); }}
                                            className="p-6 bg-white border border-slate-100 text-slate-300 rounded-[2.5rem] hover:text-slate-900 hover:rotate-180 transition-all duration-700 shadow-sm"
                                        >
                                            <RefreshCw className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {results.map((res, i) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-white border border-slate-100 rounded-[4rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all group"
                                    >
                                        <div className="p-10 space-y-10">
                                            <div className="flex items-center justify-between">
                                                <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-200 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-inner">
                                                    <Layers className="w-10 h-10" />
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Aseguradora</p>
                                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic leading-none">{res.insurer_name || res.insurer}</h3>
                                                </div>
                                            </div>

                                            <div className="p-8 bg-slate-900 rounded-[3rem] text-center border border-slate-800 shadow-inner group-hover:-translate-y-2 transition-transform duration-500 space-y-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-2">Inversión Omni Elite</p>
                                                    <div className="flex items-baseline justify-center gap-2">
                                                        <p className="text-4xl font-black text-white tracking-tighter transition-colors">
                                                            ${res.premium_total?.toLocaleString()}
                                                        </p>
                                                        <span className="text-xs font-black text-emerald-500 italic uppercase">{res.currency || 'MXN'}</span>
                                                    </div>
                                                </div>
                                                        <p className="text-[10px] text-slate-400 leading-relaxed italic font-medium">
                                                            "{res.omni_analysis}"
                                                        </p>
                                            </div>

                                            <div className="space-y-4 px-4 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Deducible Daños</span>
                                                    <span className="text-xs font-black text-slate-900">{res.deductible_dmg || 'Ver PDF'}</span>
                                                </div>
                                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Deducible Robo</span>
                                                    <span className="text-xs font-black text-slate-900">{res.deductible_theft || 'Ver PDF'}</span>
                                                </div>
                                                
                                                {/* All Coverages */}
                                                {res.coverages?.map((cov: any, idx: number) => (
                                                    <div key={idx} className="flex items-start justify-between py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black text-slate-700 uppercase leading-none">{cov.name}</p>
                                                            {cov.deductible && <p className="text-[9px] text-emerald-600 font-bold italic">Ded: {cov.deductible}</p>}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-500 text-right">{cov.limit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <footer className="mt-40 py-20 bg-slate-900 relative z-10 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute -top-24 -left-24 w-96 h-96 border-[40px] border-white rounded-full" />
                    <div className="absolute top-1/2 right-0 w-64 h-64 border-[30px] border-white rotate-45" />
                </div>
                
                <div className="max-w-4xl mx-auto px-6 text-center space-y-12 relative z-10">
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[2.5rem] bg-white text-slate-900 flex items-center justify-center text-xl font-black shadow-[0_0_50px_rgba(255,255,255,0.2)] rotate-6">RB</div>
                            <div className="text-left font-black tracking-tighter leading-none italic">
                                <p className="text-emerald-400 text-[10px] uppercase tracking-[0.5em] mb-2 font-black">Powered by</p>
                                <p className="text-4xl text-white">RB PROYECTOS <span className="text-slate-500 font-medium not-italic ml-2">| IA OMNI ELITE</span></p>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.8em] mt-4">Sincronización Total • Inteligencia Omni Elite • Liderazgo Tecnológico</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
