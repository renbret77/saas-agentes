"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
    Activity, 
    ArrowRight, 
    Target, 
    Zap, 
    TrendingUp, 
    Users,
    ChevronDown,
    Filter
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface StageCount {
    stage: string
    count: number
    color: string
}

export default function GlobalAnalytics() {
    const [stages, setStages] = useState<StageCount[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPipelineFlow()
    }, [])

    const fetchPipelineFlow = async () => {
        const { data, error } = await supabase
            .from('crm_pipeline')
            .select('stage')
        
        if (data) {
            const counts: Record<string, number> = {}
            data.forEach(item => {
                counts[item.stage] = (counts[item.stage] || 0) + 1
            })

            const stageOrder = ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won']
            const stageColors = {
                'New': 'bg-blue-400',
                'Contacted': 'bg-indigo-400',
                'Quoted': 'bg-violet-400',
                'Negotiation': 'bg-fuchsia-400',
                'Won': 'bg-emerald-400'
            }

            const formatted = stageOrder.map(s => ({
                stage: s,
                count: counts[s] || 0,
                color: stageColors[s as keyof typeof stageColors] || 'bg-slate-400'
            }))

            setStages(formatted)
        }
        setLoading(false)
    }

    const maxCount = Math.max(...stages.map(s => s.count), 1)

    return (
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-slate-200">
                        <Activity className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Global Funnel Flow</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Análisis de Conversión OMNI</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all">
                        <Filter className="w-5 h-5" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                        Este Trimestre <ChevronDown className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="relative pt-10 pb-20">
                <div className="flex items-end justify-between gap-4">
                    {stages.map((s, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-6 relative">
                            {/* Connector Line */}
                            {i < stages.length - 1 && (
                                <div className="absolute top-1/2 left-[calc(50%+2rem)] right-[calc(-50%+2rem)] h-[2px] bg-slate-50 z-0">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                                        className="h-full bg-slate-200"
                                    />
                                </div>
                            )}

                            {/* Node */}
                            <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="relative z-10 flex flex-col items-center"
                            >
                                <div className={`w-16 h-16 ${s.color} rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white`}>
                                    <span className="text-sm font-black">{s.count}</span>
                                </div>
                                
                                {/* Label */}
                                <div className="absolute -bottom-12 w-32 text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.stage}</p>
                                    <p className="text-[11px] font-black text-slate-900">{((s.count / (stages[0].count || 1)) * 100).toFixed(0)}% Conv.</p>
                                </div>
                            </motion.div>

                            {/* Column Visualizer */}
                            <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: (s.count / maxCount) * 150 }}
                                className={`w-full max-w-[40px] ${s.color} opacity-10 rounded-t-2xl mt-4`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                <div className="p-6 bg-emerald-50 rounded-3xl space-y-2">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Tasa de Cierre Global</p>
                    <p className="text-3xl font-black text-emerald-900">
                        {stages.length > 0 ? ((stages.find(s => s.stage === 'Won')?.count || 0) / (stages[0].count || 1) * 100).toFixed(1) : 0}%
                    </p>
                </div>
                <div className="p-6 bg-blue-50 rounded-3xl space-y-2">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Leads en Pipeline</p>
                    <p className="text-3xl font-black text-blue-900">
                        {stages.reduce((acc, s) => acc + s.count, 0)}
                    </p>
                </div>
                <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue Proyectado (Trim)</p>
                    <p className="text-3xl font-black text-white">$420k</p>
                </div>
            </div>
        </div>
    )
}
