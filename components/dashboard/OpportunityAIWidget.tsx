"use client"

import { useState, useEffect } from "react"
import { Sparkles, ArrowRight, Zap, MessageSquare, Send, X, Loader2, ChevronRight, CheckCircle2, TrendingUp, Star, Video, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { analyzePortfolioCrossSell, generateCrossSellPitch, generateStructuredPresentation, SalesOpportunity, PresentationData, ClientArchetype } from "@/lib/cross-sell-engine"
import { cn } from "@/lib/utils"

export default function OpportunityAIWidget() {
    const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOpp, setSelectedOpp] = useState<SalesOpportunity | null>(null)
    const [presentation, setPresentation] = useState<PresentationData | null>(null)
    const [pitch, setPitch] = useState("") 
    const [selectedArchetype, setSelectedArchetype] = useState<ClientArchetype>("generic")

    useEffect(() => {
        const load = async () => {
            const opps = await analyzePortfolioCrossSell()
            setOpportunities(opps.slice(0, 5)) // Top 5
            setLoading(false)
        }
        load()
    }, [])

    const handleSelectOpp = (opp: SalesOpportunity) => {
        setSelectedOpp(opp)
        setSelectedArchetype("generic")
        const struct = generateStructuredPresentation(opp.client_name.split(' ')[0], opp.missing_line, 'generic')
        setPresentation(struct)
        setPitch(struct.intro)
    }

    const sendWhatsApp = () => {
        if (!presentation) return
        
        const fullMessage = `*Propuesta de Protección: ${selectedOpp?.missing_line}* 🛡️\n\n` +
            `${presentation.intro}\n\n` +
            `*¿Por qué elegir RB Proyectos?*\n` +
            presentation.value_prop.map(v => `• ${v}`).join('\n') + `\n\n` +
            `*Ejemplo de Presentación Premium:* \n${presentation.example_link}\n\n` +
            `*${presentation.cta}*\n` +
            presentation.data_reqs.map(r => `✅ ${r}`).join('\n') + `\n\n` +
            `_Generado por la IA de Capataz 🤖_`;

        const url = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`
        window.open(url, '_blank')
        setSelectedOpp(null)
    }

    if (loading) return (
        <div className="bg-white/80 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Analizando Cartera con IA...</p>
        </div>
    )

    if (opportunities.length === 0) return null

    return (
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            {/* Mesh background effect */}
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp className="w-24 h-24 text-amber-600" />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Cross-Sell Pro
                        <Sparkles className="w-4 h-4 text-amber-500" />
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Inteligencia de Crecimiento</p>
                </div>
                <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-amber-600 fill-amber-600" />
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                {opportunities.map((opp, idx) => (
                    <motion.div
                        key={`${opp.client_id}-${opp.missing_line}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 bg-slate-50 hover:bg-white rounded-2xl border border-transparent hover:border-slate-100 hover:shadow-lg transition-all cursor-pointer flex items-center justify-between group/item"
                        onClick={() => handleSelectOpp(opp)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                                opp.missing_line === 'Autos' ? "bg-blue-100" :
                                opp.missing_line === 'GMM' ? "bg-rose-100" :
                                opp.missing_line === 'Vida' ? "bg-emerald-100" : "bg-amber-100"
                            )}>
                                {opp.missing_line === 'Autos' ? "🚗" :
                                 opp.missing_line === 'Gastos Médicos Mayores' ? "🏥" :
                                 opp.missing_line === 'Vida' ? "🛡️" : "🏠"}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{opp.missing_line}</p>
                                <p className="text-sm font-bold text-slate-900">{opp.client_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                                opp.priority === 'high' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                opp.priority === 'medium' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                "bg-slate-100 text-slate-600 border-slate-200"
                            )}>
                                {opp.priority}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover/item:translate-x-1 transition-transform" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal de Propuesta */}
            <AnimatePresence>
                {selectedOpp && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 bg-amber-50 flex justify-between items-center border-b border-amber-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900">Venta Cruzada IA</h4>
                                        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Oferta sugerida</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedOpp(null)} className="p-2 hover:bg-white rounded-full transition-colors">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estrategia de Crecimiento</p>
                                        <div className="px-3 py-1 bg-amber-100/50 rounded-full text-[9px] font-black text-amber-700 border border-amber-200 uppercase tracking-widest">IA de Persuasión</div>
                                    </div>

                                    {/* Archetype Selector */}
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'parent', label: 'Papá/Mamá', icon: '👨‍👩‍👧' },
                                            { id: 'entrepreneur', label: 'Emprendedor', icon: '🚀' },
                                            { id: 'ceo', label: 'Empresario', icon: '💼' },
                                            { id: 'professional', label: 'Profesionista', icon: '🎓' },
                                            { id: 'generic', label: 'General', icon: '✨' }
                                        ].map(arch => (
                                            <button
                                                key={arch.id}
                                                onClick={() => {
                                                    setSelectedArchetype(arch.id as ClientArchetype)
                                                    const struct = generateStructuredPresentation(selectedOpp.client_name.split(' ')[0], selectedOpp.missing_line, arch.id as any)
                                                    setPresentation(struct)
                                                    setPitch(struct.intro)
                                                }}
                                                className={cn(
                                                    "px-3 py-1.5 border rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5",
                                                    selectedArchetype === arch.id 
                                                        ? "bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-200" 
                                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600"
                                                )}
                                            >
                                                <span>{arch.icon}</span> {arch.label}
                                            </button>
                                        ))}
                                    </div>

                                    {presentation && (
                                        <div className="space-y-6">
                                            <div className="p-6 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                                    <Sparkles className="w-16 h-16 text-white" />
                                                </div>
                                                <p className="text-lg font-medium text-slate-300 leading-relaxed relative z-10 italic">
                                                    "{presentation.intro}"
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Valor Agregado RB</h5>
                                                {presentation.value_prop.map((v, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-2xl">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                        <p className="text-[11px] font-medium text-slate-600">{v}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                                                        <Video className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Presentación Premium</p>
                                                        <p className="text-[9px] text-indigo-400 font-bold truncate max-w-[150px]">{presentation.example_link}</p>
                                                    </div>
                                                </div>
                                                <button className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-[9px] font-black border border-indigo-200 shadow-sm hover:bg-indigo-50 transition-colors">
                                                    VER DEMO
                                                </button>
                                            </div>

                                            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] space-y-3">
                                                <p className="text-[11px] font-black text-emerald-800">{presentation.cta}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {presentation.data_reqs.map((r, i) => (
                                                        <span key={i} className="px-3 py-1 bg-white border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-600 shadow-sm">
                                                            + {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Por qué este cliente?</h5>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                        {selectedOpp.reason}
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-2 pb-8">
                                    <button 
                                        onClick={sendWhatsApp}
                                        className="flex-1 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
                                    >
                                        <MessageSquare className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" /> 
                                        Enviar por WhatsApp
                                    </button>
                                </div>
                                <div className="flex items-center justify-center gap-2 grayscale opacity-30">
                                    <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-[6px] font-black text-white">RB</div>
                                    <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Powered by RB Proyectos</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
