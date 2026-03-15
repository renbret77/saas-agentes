
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Image as ImageIcon, Sparkles, Download, RefreshCw, Smartphone, Layout, Palette, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"

const FLYER_TEMPLATES = [
    { 
        id: 'modern', 
        name: 'Modern Protection', 
        colors: 'from-slate-900 to-indigo-900', 
        tagline: 'Seguridad de Grado Militar para tu Familia',
        accent: 'bg-indigo-500' 
    },
    { 
        id: 'minimal', 
        name: 'Clean Shield', 
        colors: 'from-white to-slate-50', 
        tagline: 'Protección Transparente. Sin Letras Chiquitas.',
        accent: 'bg-rose-500' 
    },
    { 
        id: 'gold', 
        name: 'Executive Wealth', 
        colors: 'from-amber-900 to-slate-950', 
        tagline: 'Blindaje Patrimonial para Empresarios',
        accent: 'bg-amber-400' 
    }
]

export default function AIPremiumFlyer() {
    const [selectedTemplate, setSelectedTemplate] = useState(FLYER_TEMPLATES[0])
    const [isGenerating, setIsGenerating] = useState(false)
    const [customCopy, setCustomCopy] = useState("Protegemos lo que más amas con tecnología de vanguardia.")

    const generateNewCopy = async () => {
        setIsGenerating(true)
        // Aquí iría la llamada a OpenAI
        setTimeout(() => {
            const copies = [
                "Tu tranquilidad no tiene precio, pero sí tiene un plan inteligente.",
                "Menos papeleo, más protección. Bienvenido al futuro de los seguros.",
                "La IA que cuida tu patrimonio 24/7. Descubre la experiencia RB."
            ]
            setCustomCopy(copies[Math.floor(Math.random() * copies.length)])
            setIsGenerating(false)
        }, 1500)
    }

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden group">
            <div className="p-8 bg-indigo-600 text-white flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                    <Layout className="w-20 h-20" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">AI Flyer Generator</h3>
                            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Marketing Visual Instantáneo</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Editor */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estilo Visual</h4>
                        <div className="grid grid-cols-3 gap-3">
                            {FLYER_TEMPLATES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTemplate(t)}
                                    className={cn(
                                        "p-3 rounded-2xl border transition-all text-center space-y-2",
                                        selectedTemplate.id === t.id 
                                            ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                                            : "bg-slate-50 border-slate-100 hover:border-slate-200"
                                    )}
                                >
                                    <div className={cn("h-8 rounded-lg bg-gradient-to-br", t.colors)} />
                                    <p className="text-[8px] font-black uppercase tracking-tighter truncate">{t.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenido Persuasivo</h4>
                            <button 
                                onClick={generateNewCopy}
                                className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:text-indigo-800"
                            >
                                <RefreshCw className={cn("w-3 h-3", isGenerating && "animate-spin")} /> Re-generar Copy
                            </button>
                        </div>
                        <textarea 
                            value={customCopy}
                            onChange={(e) => setCustomCopy(e.target.value)}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                        />
                    </div>

                    <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" /> Exportar Flyer Pro
                    </button>
                </div>

                {/* Preview */}
                <div className="relative">
                    <div className="sticky top-0 bg-slate-100 rounded-[2rem] p-8 flex items-center justify-center min-h-[500px] border border-slate-200">
                        {/* The Actual Flyer Mockup */}
                        <motion.div 
                            key={selectedTemplate.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={cn(
                                "w-full aspect-[4/5] rounded-3xl shadow-2xl relative overflow-hidden flex flex-col p-8 text-center",
                                "bg-gradient-to-br", selectedTemplate.colors,
                                selectedTemplate.id === 'minimal' ? "text-slate-900" : "text-white"
                            )}
                        >
                            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-xl border-4 border-white/20", selectedTemplate.accent)}>
                                    <Shield className="w-10 h-10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">RB Proyectos Presenta</h5>
                                    <h2 className="text-3xl font-black leading-tight uppercase tracking-tighter">
                                        {selectedTemplate.tagline}
                                    </h2>
                                </div>
                                <p className="text-sm font-medium opacity-80 leading-relaxed px-4">
                                    {customCopy}
                                </p>
                            </div>

                            <div className="pt-8 mt-8 border-t border-white/10 flex items-center justify-between">
                                <div className="text-left">
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Broker Master</p>
                                    <p className="text-xs font-bold uppercase tracking-tighter">Rene Breton</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                        <Smartphone className="w-4 h-4 opacity-60" />
                                    </div>
                                    <span className="text-[10px] font-black">CAPATAZ IA</span>
                                </div>
                            </div>

                            {/* Decorative element */}
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Shield({ className }: { className?: string }) {
    return (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    )
}
