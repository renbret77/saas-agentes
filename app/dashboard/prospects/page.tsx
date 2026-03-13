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
    ArrowRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Stage = 'lead' | 'contacted' | 'quoting' | 'closing' | 'won' | 'lost'

interface Prospect {
    id: string
    name: string
    line_of_business: string
    projected_value: number
    stage: Stage
    phone: string
    last_contact?: string
}

const STAGES: { id: Stage, label: string, color: string }[] = [
    { id: 'lead', label: 'Candidatos', color: 'bg-slate-100' },
    { id: 'contacted', label: 'Contactados', color: 'bg-blue-50' },
    { id: 'quoting', label: 'Cotizando', color: 'bg-indigo-50' },
    { id: 'closing', label: 'Cierre', color: 'bg-amber-50' },
    { id: 'won', label: 'Ganados', color: 'bg-emerald-50' }
]

export default function ProspectsPage() {
    const [prospects, setProspects] = useState<Prospect[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProspects()
    }, [])

    const fetchProspects = async () => {
        setLoading(true)
        // In a real scenario, we'd fetch from 'prospects' table
        // Mocking for now to show the UI
        const mockProspects: Prospect[] = [
            { id: '1', name: 'Juan Pérez', line_of_business: 'Autos Flotilla', projected_value: 12500, stage: 'lead', phone: '5512345678' },
            { id: '2', name: 'Empresa Logística SA', line_of_business: 'Gastos Médicos', projected_value: 45000, stage: 'quoting', phone: '5587654321' },
            { id: '3', name: 'María García', line_of_business: 'Vida', projected_value: 8000, stage: 'contacted', phone: '5599887766' },
            { id: '4', name: 'Roberto Sánchez', line_of_business: 'Hogar', projected_value: 3500, stage: 'closing', phone: '5544332211' }
        ]
        setProspects(mockProspects)
        setLoading(false)
    }

    const moveProspect = (id: string, newStage: Stage) => {
        setProspects(prev => prev.map(p => p.id === id ? { ...p, stage: newStage } : p))
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

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {STAGES.map((stage) => (
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
        </div>
    )
}
