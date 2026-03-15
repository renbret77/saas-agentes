
"use client"

import { motion } from "framer-motion"
import { TrendingUp, Users, Target, DollarSign, Megaphone, ArrowUpRight, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function PromotoriaMarketingStats() {
    const networkStats = [
        { label: "Leads Totales (Red)", value: "1,248", change: "+14%", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "CPL Promedio", value: "$82.50", change: "-5.2%", icon: Target, color: "text-rose-600", bg: "bg-rose-50" },
        { label: "ROI Global Est.", value: "340%", change: "+22%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Venta Atribuida IA", value: "$4.2M", change: "+18%", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
    ]

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                        Marketing de Red <span className="text-indigo-600">Real-Time</span>
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Consolidado de Inversión y Resultados</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 uppercase">Sincronizado</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {networkStats.map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-50 transition-all"
                    >
                        <div className={cn("absolute top-0 right-0 p-5 opacity-5 group-hover:scale-110 transition-transform", stat.color)}>
                            <stat.icon className="w-12 h-12" />
                        </div>
                        
                        <div className="space-y-2 relative z-10">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                            <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</h4>
                            <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase", 
                                stat.change.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            )}>
                                {stat.change.startsWith('+') ? <ArrowUpRight className="w-2.5 h-2.5" /> : <BarChart3 className="w-2.5 h-2.5 rotate-180" />}
                                {stat.change}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-slate-900 p-8 rounded-[3.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all" />
                
                <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
                    <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-950 shrink-0 group-hover:scale-105 transition-transform">
                        <Megaphone className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1 space-y-2 text-center lg:text-left">
                        <h4 className="text-lg font-black text-white uppercase tracking-tighter">Acción Sugerida de Red</h4>
                        <p className="text-sm font-medium text-slate-400 leading-relaxed italic">
                            IA detectó una ventana de oportunidad en <span className="text-indigo-400 font-bold underline">Anuncios de Vida</span>. El CPL promedio bajó de $120 a $75 en los últimos 3 días. Recomendamos inyectar créditos a los 5 agentes con mayor tasa de cierre para maximizar el ROI grupal.
                        </p>
                    </div>
                    <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-400 hover:text-white transition-all active:scale-95 whitespace-nowrap">
                        Ejecutar Inyección IA
                    </button>
                </div>
            </div>
        </div>
    )
}
