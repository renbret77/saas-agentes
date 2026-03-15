"use client"

import { motion } from "framer-motion"
import { Sparkles, Megaphone, Target, TrendingUp, BarChart3, Video, MessageSquare } from "lucide-react"
import SmartCommercialsWidget from "@/components/dashboard/SmartCommercialsWidget"
import AIWriterWidget from "@/components/dashboard/AIWriterWidget"
import AdsAnalyticsDashboard from "@/components/dashboard/AdsAnalyticsDashboard"
import MarketingROICalculator from "@/components/dashboard/MarketingROICalculator"
import AIPremiumFlyer from "@/components/dashboard/AIPremiumFlyer"
import { RefreshCw } from "lucide-react"

export default function MarketingDashboardPage() {
  return (
    <div className="space-y-10 pb-20">
      {/* Header Elite */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
          <Megaphone className="w-24 h-24 text-slate-900" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Consola de Marketing Pro</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Inteligencia de Atracción & Cierre</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Meta Pixel: Activo</span>
          </div>
          <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">
            Configurar Ads
          </button>
        </div>
      </div>

      {/* Main Grid: Smart Commercials + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: Smart Commercials (2/3 width on XL) */}
        <div className="xl:col-span-2">
          <SmartCommercialsWidget />
        </div>

        {/* Right: Marketing Tips & AI Copy */}
        <div className="space-y-6">
          <AIWriterWidget />

          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute -bottom-4 -right-4 p-8 opacity-10 group-hover:scale-125 transition-transform">
              <TrendingUp className="w-20 h-20 text-white" />
            </div>
            <div className="relative z-10 space-y-4">
              <h4 className="text-sm font-black text-white uppercase tracking-tight">Estatus de Campaña</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <span className="text-slate-400">Presupuesto Mes</span>
                  <span className="text-white">$3,500 / $5,000</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-[70%]" />
                </div>
              </div>
              <p className="text-[9px] text-slate-400 font-medium">Vas al 70% de tu inversión mensual. El CPL ha bajado un 5% esta semana.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width: Ads Analytics */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-4">
          <div className="w-2 h-2 bg-indigo-500 rounded-full" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Análisis Profundo de Rendimiento</h3>
        </div>
        <AdsAnalyticsDashboard />
      </div>

      {/* Visual Marketing: Flyers IA */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-4">
          <div className="w-2 h-2 bg-rose-500 rounded-full" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Flyers Premium Instantáneos</h3>
        </div>
        <AIPremiumFlyer />
      </div>

      {/* ROI Calculator Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-4">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Planificación Financiera de Ads</h3>
        </div>
        <MarketingROICalculator />
      </div>
    </div>
  )
}

