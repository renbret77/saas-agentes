"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
    Users, 
    Plus, 
    Search, 
    Filter, 
    MoreHorizontal,
    MessageSquare,
    DollarSign,
    Calendar,
    ArrowRight,
    Loader2,
    Sparkles
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { getCRMSettings, saveCRMSettings, CRMStage } from "@/lib/crm-settings"
import { CapatazSalesBot } from "@/components/dashboard/CapatazSalesBot"

type StageID = 'lead' | 'contacted' | 'quoting' | 'closing' | 'won' | 'lost'

interface Prospect {
    id: string
    name: string
    line_of_business: string
    projected_value: number
    stage: StageID
    phone: string
    last_contact?: string
}

const DEFAULT_STAGES: CRMStage[] = [
    { id: 'lead', label: 'Candidatos', color: 'bg-slate-100', order: 0 },
    { id: 'contacted', label: 'Contactados', color: 'bg-blue-50', order: 1 },
    { id: 'quoting', label: 'Cotizando', color: 'bg-indigo-50', order: 2 },
    { id: 'closing', label: 'Cierre', color: 'bg-amber-50', order: 3 },
    { id: 'won', label: 'Ganados', color: 'bg-emerald-50', order: 4 }
]

export default function ProspectsPage() {
    const [prospects, setProspects] = useState<Prospect[]>([])
    const [loading, setLoading] = useState(true)
    const [stages, setStages] = useState<CRMStage[]>(DEFAULT_STAGES)
    const [showStageSettings, setShowStageSettings] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const init = async () => {
            setLoading(true)
            const settings = await getCRMSettings()
            if (settings && settings.stages) {
                setStages(settings.stages)
            }
            await fetchProspects()
            setLoading(false)
        }
        init()
    }, [])

    const fetchProspects = async () => {
        try {
            const { data, error } = await supabase
                .from('prospects')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.error("Error fetching prospects:", error)
                // Fallback to mock for UI dev if table missing
                return
            }
            
            if (data) setProspects(data as Prospect[])
        } catch (error) {
            console.error('Fetch error:', error)
        }
    }

    const moveProspect = (id: string, newStage: StageID) => {
        setProspects(prev => prev.map(p => p.id === id ? { ...p, stage: newStage } : p))
    }

    const updateStageName = (id: string, newName: string) => {
        setStages(prev => prev.map(s => s.id === id ? { ...s, label: newName } : s))
    }

    const handleSaveSettings = async () => {
        setIsSaving(true)
        try {
            await saveCRMSettings(stages)
            setShowStageSettings(false)
        } catch (err) {
            alert("Error al guardar configuraciones")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        CRM de Prospectos
                    </h1>
                    <p className="text-slate-500 mt-1">Gestiona tu tubería de ventas y no pierdas ni un cierre.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowStageSettings(true)}
                        className="px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
                    >
                        Configurar Etapas ⚙️
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar prospecto..." 
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm">
                        <Plus className="w-4 h-4" /> Nuevo Prospecto
                    </button>
                </div>
            </div>

            {/* Main Content: Kanban + AI Intake */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Kanban Board */}
                <div className="xl:col-span-3 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {stages.map((stage) => (
                        <div key={stage.id} className="flex-shrink-0 w-80">
                            <div className={`p-4 rounded-t-2xl border-x border-t border-slate-200 ${stage.color} flex items-center justify-between`}>
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${
                                        stage.id === 'won' ? 'bg-emerald-500' : 
                                        stage.id === 'closing' ? 'bg-amber-500' :
                                        stage.id === 'quoting' ? 'bg-indigo-500' :
                                        'bg-slate-400'
                                    }`} />
                                    {stage.label}
                                </h3>
                                <span className="text-[10px] font-bold bg-white/50 px-2 py-0.5 rounded-full text-slate-600">
                                    {prospects.filter(p => p.stage === stage.id).length}
                                </span>
                            </div>
                            
                            <div className="bg-slate-50/50 border-x border-b border-slate-200 rounded-b-2xl p-3 min-h-[600px] space-y-3">
                                {prospects.filter(p => p.stage === stage.id).map((prospect) => (
                                    <motion.div
                                        key={prospect.id}
                                        layoutId={prospect.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="p-1 px-2 bg-slate-100 text-[9px] font-black text-slate-500 rounded uppercase">
                                                {prospect.line_of_business}
                                            </div>
                                            <button className="text-slate-300 hover:text-slate-600">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                        
                                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase text-xs">
                                            {prospect.name}
                                        </h4>
                                        
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-emerald-600 font-black text-xs">
                                                <DollarSign className="w-3 h-3" />
                                                {prospect.projected_value.toLocaleString()}
                                            </div>
                                            <div className="flex -space-x-1">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">
                                                    JD
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-[10px] font-bold">WhatsApp</span>
                                            </div>
                                            <button 
                                                onClick={() => moveProspect(prospect.id, 'won')}
                                                className="p-1.5 hover:bg-slate-50 rounded-lg group-hover:text-amber-500 transition-colors"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}

                                {prospects.filter(p => p.stage === stage.id).length === 0 && (
                                    <div className="py-20 text-center">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sin Prospectos</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* AI Intake Panel */}
                <div className="space-y-6">
                    <div className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-100 flex items-center justify-between group cursor-pointer hover:bg-indigo-700 transition-all overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Sparkles className="w-16 h-16 text-white" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-lg font-black text-white tracking-tight uppercase tracking-tighter">Live Intake IA</h3>
                            <p className="text-[10px] font-bold text-indigo-100/70">Atención 24/7 activada</p>
                        </div>
                    </div>
                    <CapatazSalesBot />
                </div>
            </div>

            {/* v36: Modal de Configuración de Etapas */}
            <AnimatePresence>
                {showStageSettings && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Personalización del Pipeline</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Adapta las etapas a tu proceso de venta</p>
                                </div>
                                <button onClick={() => setShowStageSettings(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                                    <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    {stages.map((s, idx) => (
                                        <div key={s.id} className="flex items-center gap-4 group">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <input 
                                                    type="text" 
                                                    value={s.label}
                                                    onChange={(e) => updateStageName(s.id, e.target.value)}
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase"
                                                />
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-4 border-white shadow-sm ${s.color.replace('bg-', 'bg-')}`} />
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex justify-end">
                                    <button 
                                        disabled={isSaving}
                                        onClick={handleSaveSettings}
                                        className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        {isSaving ? "Guardando..." : "Guardar Cambios"}
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
