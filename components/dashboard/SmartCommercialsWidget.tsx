"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Sparkles, Video, Download, RefreshCw, Layers, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const TEMPLATES = [
  { id: 'recruit', name: 'Reclutamiento Pro', icon: '👤', description: 'Atrae nuevos agentes con el poder de la IA.' },
  { id: 'auto', name: 'Seguros de Auto', icon: '🚗', description: 'Rapidez y confianza en cada km.' },
  { id: 'gmm', name: 'Gastos Médicos', icon: '🏥', description: 'Blindaje familiar de nivel superior.' },
  { id: 'tech', name: 'Capataz Tech', icon: '🤖', description: 'Demo de la app para ganar autoridad.' },
  { id: 'efficiency', name: 'Asesor 24/7', icon: '⚡', description: 'Destaca tu servicio automatizado.' },
]

export default function SmartCommercialsWidget() {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0])
  const [generating, setGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [script, setScript] = useState<string | null>(null)

  const handleGenerate = async () => {
    setGenerating(true)
    setVideoUrl(null)
    
    // Simular llamada a la API
    try {
      const res = await fetch('/api/marketing/generate-video', {
        method: 'POST',
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          agentName: "Rene Breton",
          scriptType: "premium"
        })
      })
      const data = await res.json()
      
      if (data.success) {
        setScript(data.script)
        // Simular tiempo de renderizado de HeyGen después de tener el guion
        setTimeout(() => {
          setVideoUrl(data.videoUrl)
          setGenerating(false)
        }, 3000)
      } else {
        throw new Error(data.error)
      }
    } catch (e) {
      console.error(e)
      setGenerating(false)
    }
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden group relative">
      {/* Premium Header */}
      <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
          <Video className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-900/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight uppercase">Smart Commercials</h3>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">IA Generativa (HeyGen + ElevenLabs)</p>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Template Selector */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Elige tu Plantilla Maestras</h4>
            <div className="px-2 py-0.5 bg-rose-50 text-[9px] font-black text-rose-600 rounded-full border border-rose-100 uppercase">5 Disponibles</div>
          </div>
          
          <div className="space-y-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={cn(
                  "w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 group/btn",
                  selectedTemplate.id === t.id 
                    ? "bg-slate-900 border-slate-900 shadow-xl shadow-slate-200" 
                    : "bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-white"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner",
                  selectedTemplate.id === t.id ? "bg-slate-800" : "bg-white"
                )}>
                  {t.icon}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-xs font-black uppercase tracking-tight",
                    selectedTemplate.id === t.id ? "text-white" : "text-slate-900"
                  )}>{t.name}</p>
                  <p className={cn(
                    "text-[10px] font-medium leading-tight mt-0.5",
                    selectedTemplate.id === t.id ? "text-slate-400" : "text-slate-500"
                  )}>{t.description}</p>
                </div>
                {selectedTemplate.id === t.id && (
                  <CheckCircle2 className="w-4 h-4 text-rose-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Area */}
        <div className="relative aspect-[9/16] lg:aspect-auto h-full min-h-[400px] bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center p-8 text-center group/preview">
          <AnimatePresence mode="wait">
            {!generating && !videoUrl && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg group-hover/preview:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-rose-500 fill-rose-500 ml-1" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase">Vista Previa</p>
                  <p className="text-[10px] text-slate-400 font-medium px-8 mt-1 italic">La IA generará un video cinemático con tu marca y un speech psicológico de cierre.</p>
                </div>
                <button 
                  onClick={handleGenerate}
                  className="px-8 py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
                >
                  Generar Comercial IA
                </button>
              </motion.div>
            )}

            {generating && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="space-y-6"
              >
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-rose-600 animate-spin mx-auto" />
                  <Sparkles className="absolute top-0 right-1/4 w-4 h-4 text-amber-400 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-900 uppercase animate-pulse">Renderizando con HeyGen...</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sincronizando Voz ElevenLabs Premium</p>
                </div>
                {/* Progress bar simulation */}
                <div className="w-48 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: '100%' }} 
                    transition={{ duration: 3 }}
                    className="h-full bg-rose-600"
                  />
                </div>
              </motion.div>
            )}

            {videoUrl && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex flex-col gap-4"
              >
                <div className="flex-1 relative bg-slate-900 rounded-[2rem] flex items-center justify-center group/video overflow-hidden">
                  <video 
                    src={videoUrl} 
                    className="w-full h-full object-cover opacity-40" 
                    autoPlay 
                    loop 
                    muted 
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/40">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4" />
                    <p className="text-xl font-black text-white uppercase tracking-tighter">Video Renderizado</p>
                    <p className="text-[10px] text-emerald-100 font-bold uppercase mt-2">Listo para descargar y publicar</p>
                  </div>
                  
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">HeyGen Core Output</p>
                      <p className="text-xs font-bold text-white uppercase">{selectedTemplate.name}</p>
                    </div>
                    <button className="p-3 bg-white text-slate-900 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-xl">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {script && (
                  <div className="p-4 bg-white border border-slate-100 rounded-2xl text-left">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Sparkles className="w-3 h-3 text-amber-500" /> Guion Generado
                    </h5>
                    <p className="text-[10px] font-medium text-slate-600 italic leading-relaxed line-clamp-3">
                        "{script}"
                    </p>
                  </div>
                )}

                <button 
                  onClick={() => { setVideoUrl(null); setScript(null); }}
                  className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-all z-20"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Security/Trust Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-6">
        <div className="flex items-center gap-1.5 grayscale opacity-30">
          <Layers className="w-3 h-3 text-slate-900" />
          <span className="text-[8px] font-black uppercase tracking-widest">Branded Content</span>
        </div>
        <div className="flex items-center gap-1.5 grayscale opacity-30">
          <AlertCircle className="w-3 h-3 text-slate-900" />
          <span className="text-[8px] font-black uppercase tracking-widest">Copyright Protected</span>
        </div>
      </div>
    </div>
  )
}
