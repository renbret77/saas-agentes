"use client"

import { motion } from "framer-motion"
import { TrendingUp, Users, Clock, Zap, DollarSign, ArrowUpRight, BarChart3, PieChart, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

export function AdvancedKPIDashboard() {
    const metrics = [
        { label: "Horas de Trabajo Ahorradas", value: "1,240h", change: "+15%", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-50" },
        { label: "Tasa de Cross-Sell IA", value: "24.5%", change: "+8.2%", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
        { label: "Crecimiento de Red", value: "12 Agentes", change: "+2", icon: Users, color: "text-indigo-500", bg: "bg-indigo-50" },
        { label: "ROI Estimado (SaaS)", value: "3.2x", change: "Mensual", icon: DollarSign, color: "text-blue-500", bg: "bg-blue-50" },
    ]

    return (
        <div className="space-y-10">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {metrics.map((m, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-lg transition-all"
                    >
                        <div className={cn("inline-flex p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform", m.bg, m.color)}>
                            <m.icon className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{m.label}</p>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-black text-slate-900 leading-none">{m.value}</p>
                            <span className="text-[10px] font-black text-emerald-500 uppercase">{m.change}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Performance Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visual Bar Chart (Mockup with CSS) */}
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Crecimiento Trimestral
                            </h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Nuevos Agentes vs Bajas</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                                <span className="text-[9px] font-bold text-slate-500 uppercase">Altas</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-slate-200 rounded-full" />
                                <span className="text-[9px] font-bold text-slate-500 uppercase">Bajas</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-48 flex items-end justify-between gap-4 px-2">
                        {[40, 65, 45, 90, 55, 75, 85].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col gap-1.5 group">
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className="w-full bg-slate-50 rounded-t-xl group-hover:bg-indigo-100 transition-all border border-slate-100 relative"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 group-hover:h-full group-hover:opacity-10 transition-all opacity-20" />
                                </motion.div>
                                <p className="text-[8px] font-black text-slate-300 text-center uppercase">Sem {i+1}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Efficiency Ring (Mockup with CSS) */}
                <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
                    
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-1">
                            <h4 className="text-xl font-black tracking-tight flex items-center gap-2 uppercase tracking-tighter">
                                <PieChart className="w-5 h-5 text-indigo-400" />
                                Salud del Negocio
                            </h4>
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Distribución de Ingresos (SaaS)</p>
                        </div>

                        <div className="flex items-center gap-10">
                            {/* Circle Chart Mockup */}
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                                    <motion.circle 
                                        cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" 
                                        strokeDasharray="364.4"
                                        initial={{ strokeDashoffset: 364.4 }}
                                        animate={{ strokeDashoffset: 100 }}
                                        transition={{ duration: 1.5 }}
                                        className="text-indigo-500" 
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-2xl font-black text-white">72%</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Suscripciones Elite</p>
                                    </div>
                                    <p className="text-sm font-black">$45,200 <span className="text-xs font-medium opacity-40">/ mes</span></p>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 bg-slate-700 rounded-full" />
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Paquetes de Créditos</p>
                                    </div>
                                    <p className="text-sm font-black">$12,400 <span className="text-xs font-medium opacity-40">/ mes</span></p>
                                </div>
                            </div>
                        </div>

                        <button className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all active:scale-95">
                            Ver Reporte Detallado
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Insight Feed */}
            <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-[2.5rem] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Activity className="w-6 h-6 text-indigo-600 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Monitor en Tiempo Real</p>
                        <p className="text-xs font-bold text-slate-700">La red de agentes ha procesado <span className="text-indigo-600 font-extrabold">2,415 solicitudes IA</span> hoy. <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] rounded-md ml-2">+4.2% vs ayer</span></p>
                    </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-indigo-300" />
            </div>
        </div>
    )
}
