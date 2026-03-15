"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Video, Play, Link, Save, Plus, X, Globe, MessageSquare, Quote, Target, Star } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface QuoteSession {
    id: string
    project_title: string
    public_share_id: string
    video_url?: string
    created_at: string
}

export default function VideoProposalManager() {
    const [sessions, setSessions] = useState<QuoteSession[]>([])
    const [loading, setLoading] = useState(true)
    const [editingSession, setEditingSession] = useState<QuoteSession | null>(null)
    const [videoUrl, setVideoUrl] = useState("")

    useEffect(() => {
        fetchSessions()
    }, [])

    const fetchSessions = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('quote_sessions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        if (!error && data) {
            setSessions(data)
        }
        setLoading(false)
    }

    const handleSaveVideo = async () => {
        if (!editingSession) return

        const { error } = await supabase
            .from('quote_sessions')
            .update({ video_url: videoUrl })
            .eq('id', editingSession.id)

        if (!error) {
            setSessions(sessions.map(s => s.id === editingSession.id ? { ...s, video_url: videoUrl } : s))
            setEditingSession(null)
            setVideoUrl("")
        }
    }

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[500px]">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Video className="w-5 h-5 text-indigo-600" />
                        Video-Cotizaciones
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sube el nivel de tus presentaciones</p>
                </div>
                <div className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">V-Prop Beta</div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                            <Video className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">No hay cotizaciones recientes para video.</p>
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div key={session.id} className="group p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-white transition-all shadow-sm hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{session.project_title}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold">{new Date(session.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {session.video_url ? (
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                            <Play className="w-4 h-4 fill-emerald-600/20" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                                            <X className="w-4 h-4" />
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => { setEditingSession(session); setVideoUrl(session.video_url || "") }}
                                        className="p-2 hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mt-4 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">
                                    <Globe className="w-3.5 h-3.5" /> Ver Propuesta
                                </button>
                                <button className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline">
                                    <MessageSquare className="w-3.5 h-3.5" /> Enviar WhatsApp
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {editingSession && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm p-6 flex flex-col justify-end"
                    >
                        <motion.div 
                            initial={{ y: 50 }}
                            animate={{ y: 0 }}
                            className="bg-white rounded-3xl shadow-2xl p-8 space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-black text-slate-900">Configurar Video de Presentación</h4>
                                <button onClick={() => setEditingSession(null)} className="p-2 hover:bg-slate-100 rounded-full">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pega el enlace de video (YouTube, Loom, HeyGen, etc.)</p>
                                <div className="relative">
                                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="https://loom.com/share/..."
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 space-y-4 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Target className="w-4 h-4 text-indigo-600" />
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Guion de Venta Sugerido</span>
                                </div>
                                <Quote className="w-6 h-6 text-indigo-200 mx-auto" />
                                <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
                                    "Hola [Nombre], como emprendedor sé que tu negocio es tu vida. No permitas que un imprevisto detenga tu crecimiento. En este video te explico cómo este blindaje de RB Proyectos te da la paz mental para seguir creando..."
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="px-2 py-0.5 bg-white text-[8px] font-black text-slate-400 rounded-md border border-slate-200">ARQUETIPO: EMPRENDEDOR</span>
                                </div>
                            </div>

                            <button 
                                onClick={handleSaveVideo}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <Save className="w-5 h-5" /> Vincular Video
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
