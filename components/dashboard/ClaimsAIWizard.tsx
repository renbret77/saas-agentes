"use client"

import { useState } from "react"
import { Sparkles, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface ClaimsAIWizardProps {
    onAnalysisComplete: (data: any) => void;
    claimType?: string;
}

export function ClaimsAIWizard({ onAnalysisComplete, claimType }: ClaimsAIWizardProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsAnalyzing(true)
        setError(null)
        setResult(null)

        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("claimType", claimType || "General")

            const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession()

            const response = await fetch("/api/claims/analyze", {
                method: "POST",
                body: formData,
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`
                }
            })

            if (!response.ok) throw new Error("Error en el análisis IA")

            const data = await response.json()
            setResult(data)
            onAnalysisComplete(data)
        } catch (err: any) {
            console.error("AI Error:", err)
            setError(err.message || "No se pudo procesar el documento")
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-rose-600 p-2 rounded-lg">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Capataz AI</p>
                        <p className="text-sm font-black text-slate-900">Asistente de Llenado</p>
                    </div>
                </div>
                {isAnalyzing && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-rose-600 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Analizando...
                    </div>
                )}
            </div>

            <div className="relative">
                <label className={cn(
                    "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all gap-2",
                    isAnalyzing ? "bg-slate-100 border-slate-300 opacity-50 pointer-events-none" : "bg-white border-rose-200 hover:border-rose-400 hover:bg-rose-50/30"
                )}>
                    <FileText className="w-8 h-8 text-rose-500" />
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-slate-900">Cargar Documento Base</p>
                        <p className="text-[9px] text-slate-400 font-medium">Sube el informe o factura para pre-llenar</p>
                    </div>
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                </label>
            </div>

            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2"
                    >
                        <div className="flex items-center gap-2 text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" />
                            <p className="text-[10px] font-black uppercase">¡Análisis Exitoso!</p>
                        </div>
                        <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                            {result.brief_summary || "Datos extraídos correctamente."}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            {result.diagnosis && (
                                <div className="p-2 bg-white/50 rounded-lg">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Diagnóstico</p>
                                    <p className="text-[10px] font-bold text-slate-700 truncate">{result.diagnosis}</p>
                                </div>
                            )}
                            {result.total_amount > 0 && (
                                <div className="p-2 bg-white/50 rounded-lg">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Importe</p>
                                    <p className="text-[10px] font-bold text-slate-700">${result.total_amount.toLocaleString()}</p>
                                </div>
                            ) || result.folio && (
                                <div className="p-2 bg-white/50 rounded-lg">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Folio</p>
                                    <p className="text-[10px] font-bold text-slate-700 truncate">{result.folio}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700"
                    >
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-[10px] font-bold uppercase">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
