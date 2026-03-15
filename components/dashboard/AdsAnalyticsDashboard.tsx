"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Users, Target, MousePointer2, DollarSign, ArrowUpRight, BarChart3, PieChart, Activity, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const METRICS = [
  { label: 'Gasto Total', value: '$4,250', change: '+12%', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { label: 'Leads (Prospectos)', value: '48', change: '+8%', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { label: 'CPL (Costo/Lead)', value: '$88.50', change: '-5%', icon: Target, color: 'text-rose-500', bg: 'bg-rose-50' },
  { label: 'CTR (Click-Through)', value: '2.4%', change: '+0.8%', icon: MousePointer2, color: 'text-amber-500', bg: 'bg-amber-50' },
]

export function AdsAnalyticsDashboard() {
  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {METRICS.map((m, idx) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", m.bg)}>
                <m.icon className={cn("w-6 h-6", m.color)} />
              </div>
              <div className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1",
                m.change.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {m.change}
                <ArrowUpRight className={cn("w-3 h-3", !m.change.startsWith('+') && "rotate-90")} />
              </div>
            </div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</h4>
            <p className="text-2xl font-black text-slate-900 mt-1">{m.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Analytics View */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Conversion Chart (Simulation) */}
        <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Rendimiento de Campaña</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conversiones vs Inversión (Últimos 30 días)</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                <span className="text-[10px] font-bold text-slate-600 uppercase">Leads</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="w-2 h-2 bg-rose-500 rounded-full" />
                <span className="text-[10px] font-bold text-slate-600 uppercase">Gasto</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full flex items-end justify-between gap-2 px-4">
            {/* Visual simulation of a bar chart */}
            {[40, 70, 45, 90, 65, 80, 55, 95, 75, 40, 60, 85].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                <div className="w-full relative flex flex-col items-center justify-end h-full">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.05, duration: 1 }}
                    className="w-full max-w-[12px] bg-indigo-100 rounded-t-full group-hover/bar:bg-indigo-500 transition-colors"
                  />
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${h * 0.6}%` }}
                    transition={{ delay: i * 0.05 + 0.2, duration: 1 }}
                    className="w-full max-w-[12px] bg-rose-100 rounded-t-full absolute bottom-0 group-hover/bar:bg-rose-500 transition-colors opacity-60"
                  />
                </div>
                <span className="text-[8px] font-black text-slate-300">S{i+1}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ROI Estimado</span>
                <span className="text-sm font-black text-emerald-600">1.8x</span>
              </div>
              <div className="h-8 w-px bg-slate-100" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estatus de Pixel</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Activo
                </span>
              </div>
            </div>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-slate-200">
              Ver Reporte Full
            </button>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6">
          {/* Channel breakdown */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Canales de Origen</h4>
            <div className="space-y-4">
              {[
                { name: 'Facebook Ads', val: 65, color: 'bg-indigo-500' },
                { name: 'Google Search', val: 25, color: 'bg-rose-500' },
                { name: 'Directo/Referido', val: 10, color: 'bg-amber-500' }
              ].map(c => (
                <div key={c.name} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                    <span className="text-slate-600">{c.name}</span>
                    <span className="text-slate-900">{c.val}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${c.val}%` }}
                      className={cn("h-full", c.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-xl shadow-indigo-100 relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-16 h-16 text-white" />
            </div>
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">IA Suggestion</span>
              </div>
              <p className="text-xs font-medium text-indigo-50 leading-relaxed">
                "Hemos detectado que el comercial de **Gastos Médicos** tiene un CTR 15% mayor. Recomendamos subir el presupuesto diario $200 MXN."
              </p>
              <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[9px] font-black text-white uppercase tracking-widest transition-all">
                Aplicar Optimización
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default AdsAnalyticsDashboard;
