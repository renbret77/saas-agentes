"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, Megaphone, PenTool, RefreshCw, MessageSquare, Target, Zap, Share2, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AIWriterWidget() {
  const [prompt, setPrompt] = useState("")
  const [copy, setCopy] = useState("No vendemos seguros, blindamos el esfuerzo de toda tu vida. Con RB Proyectos, tu tranquilidad tiene tecnología de punta.")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateCopy = () => {
    setLoading(true)
    setTimeout(() => {
      setCopy("¿Sabías que el 80% de las familias mexicanas no tienen un blindaje patrimonial real? RB Proyectos utiliza IA para detectar tus riesgos antes de que se conviertan en pesos. Protege lo que amas con la tecnología del mañana.")
      setLoading(false)
    }, 1500)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(copy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <h4 className="text-sm font-black text-slate-900 uppercase">AI Copywriter</h4>
        </div>
        <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
            RB-Link v2.1
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <input 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Promo para Vida..."
            className="w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none transition-all"
          />
          <button 
            onClick={generateCopy}
            disabled={loading}
            className="absolute right-3 top-3 w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-indigo-600 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>

        <div className="relative">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Target className="w-3 h-3 text-indigo-400" /> Speech de Alto Impacto:
          </p>
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] italic text-xs text-slate-600 leading-relaxed shadow-inner min-h-[100px] flex items-center">
            {loading ? "IA Generando narrativa de poder..." : copy}
          </div>
          <button 
            onClick={handleCopy}
            className="absolute bottom-4 right-4 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm group"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />}
          </button>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-100 flex items-center justify-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Publicar en Ads
          </button>
          <button className="p-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all shadow-sm">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
            <Share2 className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

