"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Mic2, 
    Volume2, 
    Play, 
    Square, 
    Sparkles, 
    TrendingUp, 
    Calendar, 
    AlertCircle,
    ChevronRight,
    Headphones
} from "lucide-react"
import { AIExecutiveBriefing, ExecutiveSummary } from "@/lib/ai/briefing"
import { supabase } from "@/lib/supabase"

export default function AIBriefingWidget() {
    const [summary, setSummary] = useState<ExecutiveSummary | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [loading, setLoading] = useState(true)
    const [script, setScript] = useState("")

    useEffect(() => {
        loadBriefing()
    }, [])

    const loadBriefing = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const data = await AIExecutiveBriefing.getSummary(user.id)
        if (data) {
            setSummary(data)
            setScript(AIExecutiveBriefing.generateScript(data, user.user_metadata?.first_name || "Agente"))
        }
        setLoading(false)
    }

    const handlePlay = () => {
        if (!window.speechSynthesis) return
        
        if (isPlaying) {
            window.speechSynthesis.cancel()
            setIsPlaying(false)
            return
        }

        const utterance = new SpeechSynthesisUtterance(script)
        utterance.lang = 'es-MX'
        utterance.rate = 1.0
        utterance.pitch = 1.1

        utterance.onend = () => setIsPlaying(false)
        
        window.speechSynthesis.speak(utterance)
        setIsPlaying(true)
    }

    if (loading) return (
        <div className="h-[280px] bg-slate-50 animate-pulse rounded-[3rem] border border-slate-100" />
    )

    return (
        <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden group border border-white/5 shadow-2xl shadow-slate-950/50">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-indigo-500/20 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[60px] -ml-24 -mb-24 group-hover:bg-emerald-500/10 transition-all duration-700" />

            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400">
                            <Sparkles className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight">Executive Briefing</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Co-Pilot Autónomo V1.0</p>
                        </div>
                    </div>
                    <button 
                        onClick={handlePlay}
                        className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl",
                            isPlaying ? "bg-rose-500 shadow-rose-900/40" : "bg-white text-slate-900 shadow-indigo-900/40 hover:bg-indigo-400 hover:text-white"
                        )}
                    >
                        {isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                    </button>
                </div>

                {/* Metrics Summary Rows */}
                <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Cobranza Hoy</span>
                        </div>
                        <span className="text-lg font-black text-emerald-400">${Number(summary?.expectedToday).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Alertas Vencidas</span>
                        </div>
                        <span className="text-lg font-black text-rose-400">{summary?.overdueInstallmentsCount}</span>
                    </div>
                </div>

                <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-3">
                    <Headphones className="w-5 h-5 text-indigo-400" />
                    <p className="text-[11px] font-medium text-indigo-100 leading-relaxed italic">
                        "{script.substring(0, 80)}..."
                    </p>
                </div>

                <button className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2">
                    VER REPORTE COMPLETO <ChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}
