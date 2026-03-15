import { useState } from "react"
import { ClipboardCheck, AlertCircle, FileWarning, CheckCircle2, Loader2, Sparkles, FileText, Download, User, Calendar, MapPin, Activity, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { analyzeClaimGap, ClaimAnalysisResult } from "@/lib/claims-processor"
import { cn } from "@/lib/utils"

interface ClaimGapAnalysisProps {
    claim: any;
    onUpdate?: () => void;
}

export function ClaimGapAnalysis({ claim, onUpdate }: ClaimGapAnalysisProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysis, setAnalysis] = useState<any>(null)
    const [isFormModalOpen, setIsFormModalOpen] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

    const runFullAnalysis = async () => {
        setIsAnalyzing(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            const result = analyzeClaimGap(claim.claim_type, claim.checklist || [])
            setAnalysis(result)
        } catch (err) {
            console.error(err)
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm">
            <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-rose-500 p-3 rounded-2xl shadow-lg shadow-rose-500/20">
                        <ClipboardCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-300 mb-1">Diagnóstico Administrativo</p>
                        <h3 className="text-xl font-black">Salud del Expediente</h3>
                    </div>
                </div>
                <button 
                    onClick={runFullAnalysis}
                    disabled={isAnalyzing}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/10"
                >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isAnalyzing ? 'Analizando...' : 'Analizar Faltantes'}
                </button>
            </div>

            <div className="p-8 space-y-8">
                <AnimatePresence mode="wait">
                    {!analysis && !isAnalyzing ? (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="text-center py-12 space-y-4"
                        >
                            <FileWarning className="w-16 h-16 text-slate-200 mx-auto" />
                            <p className="text-sm font-medium text-slate-400 italic">Pulsa en "Analizar" para detectar posibles rechazos de la aseguradora.</p>
                        </motion.div>
                    ) : isAnalyzing ? (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-rose-500"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 2 }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-20 bg-slate-50 rounded-3xl animate-pulse" />
                                <div className="h-20 bg-slate-50 rounded-3xl animate-pulse" />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            {/* Score & Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={cn(
                                    "p-6 rounded-[32px] border-2",
                                    analysis.status === 'healthy' ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100 text-amber-900"
                                )}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={cn("p-2 rounded-xl", analysis.status === 'healthy' ? "bg-emerald-500" : "bg-amber-500")}>
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Viabilidad de Pago</p>
                                    </div>
                                    <p className="text-4xl font-black">{analysis.score}%</p>
                                    <p className="text-[10px] font-bold mt-2 opacity-60 uppercase">Probabilidad de éxito estimada por IA</p>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Acciones Sugeridas</p>
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => {
                                                setSelectedTemplate("Aviso de Accidente o Enfermedad")
                                                setIsFormModalOpen(true)
                                            }}
                                            className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                                        >
                                            <FileText className="w-4 h-4" /> Pre-llenar Formato Aviso
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setSelectedTemplate("Solicitud de Programación de Cirugía")
                                                setIsFormModalOpen(true)
                                            }}
                                            className="w-full py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                                        >
                                            <Activity className="w-4 h-4" /> Programación Médica
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Missing Documents List */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Alertas de Expediente ({analysis.missing.length})
                                </h4>
                                <div className="space-y-2">
                                    {analysis.missing.map((item: string, i: number) => (
                                        <div key={i} className="p-4 bg-white border border-rose-100 rounded-2xl flex items-center gap-4 group hover:bg-rose-50 transition-all">
                                            <div className="w-2 h-2 bg-rose-500 rounded-full" />
                                            <p className="text-sm font-bold text-slate-700">{item}</p>
                                        </div>
                                    ))}
                                    {analysis.missing.length === 0 && (
                                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-sm font-bold">
                                            ¡Expediente completo y verificado por IA!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Smart Form Pre-fill Modal */}
            <AnimatePresence>
                {isFormModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFormModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-rose-600 p-2 rounded-xl">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">{selectedTemplate}</h3>
                                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Capataz Auto-Fill v1.0</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsFormModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="p-10 overflow-y-auto space-y-10 custom-scrollbar">
                                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3 text-amber-700">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p className="text-xs font-bold leading-relaxed">
                                        La IA ha pre-llenado estos campos usando el expediente actual. <span className="underline italic">Los campos en rojo requieren tu atención manual.</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {/* Section 1: Datos Personales */}
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <User className="w-4 h-4" /> 01. Información del Asegurado
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Nombre Completo</label>
                                                <input readOnly value={`${claim.client?.first_name} ${claim.client?.last_name}`} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Póliza / Certificado</label>
                                                <input readOnly value={claim.policy?.policy_number} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Datos Médicos */}
                                    <div className="space-y-6 text-rose-900">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> 02. Detalles de la Reclamación
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Diagnóstico Analizado</label>
                                                <input readOnly value={claim.description?.match(/\[DIA: (.*)\]/)?.[1] || "No detectado en informe"} className={cn("w-full px-4 py-3 rounded-xl text-sm font-bold", !claim.description?.includes("[DIA:") ? "bg-rose-50 border-2 border-rose-200 text-rose-700" : "bg-slate-50 border border-slate-200 text-slate-700")} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Fecha Primer Síntoma</label>
                                                <input type="date" className="w-full px-4 py-3 bg-rose-50 border-2 border-rose-200 rounded-xl text-sm font-bold text-rose-700 focus:ring-2 focus:ring-rose-500 outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 rounded-[32px] border border-dashed border-slate-200 text-center space-y-4">
                                    <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="text-xs text-slate-500 font-medium italic">Sección de Hospitalización y Gastos Otros Analizada... (Pendiente firmas)</p>
                                </div>
                            </div>

                            <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-between">
                                <p className="text-[10px] font-bold text-slate-400 italic">Listo para imprimir o firmar digitalmente.</p>
                                <div className="flex gap-4">
                                    <button onClick={() => setIsFormModalOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
                                    <button className="px-8 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-2">
                                        <Download className="w-4 h-4" /> Descargar PDF Pre-llenado
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
