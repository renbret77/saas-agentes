"use client"

import { useState, useEffect } from "react"
import { 
    Globe, 
    Plus, 
    Trash2, 
    Zap, 
    Shield, 
    ChevronRight, 
    History,
    CheckCircle2,
    XCircle,
    Copy,
    ExternalLink
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { WebhookService, WebhookEvent } from "@/lib/webhooks"
import { motion, AnimatePresence } from "framer-motion"

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [newWebhook, setNewWebhook] = useState({
        url: "",
        event_type: "client.created" as WebhookEvent
    })

    useEffect(() => {
        fetchWebhooks()
    }, [])

    const fetchWebhooks = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        try {
            const data = await WebhookService.getWebhooks(user.id)
            setWebhooks(data || [])
        } catch (error) {
            console.error("Error fetching webhooks:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('outgoing_webhooks')
            .insert({
                agent_id: user.id,
                url: newWebhook.url,
                event_type: newWebhook.event_type
            })

        if (!error) {
            setIsAdding(false)
            setNewWebhook({ url: "", event_type: "client.created" })
            fetchWebhooks()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar este webhook?")) return
        const { error } = await supabase
            .from('outgoing_webhooks')
            .delete()
            .eq('id', id)
        
        if (!error) fetchWebhooks()
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Globe className="w-8 h-8 text-indigo-600" /> Webhooks Pro
                    </h1>
                    <p className="text-slate-500 mt-1">Conecta tu portal con miles de apps externas de forma nativa.</p>
                </div>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Nuevo Webhook
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List Column */}
                <div className="lg:col-span-2 space-y-6">
                    {loading ? (
                        <div className="h-64 bg-slate-50 animate-pulse rounded-[3rem]" />
                    ) : webhooks.length === 0 ? (
                        <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm border-dashed">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Zap className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase">Sin conexiones activas</h3>
                            <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto italic">Configura un webhook para enviar datos a Zapier, Make o tu propio servidor.</p>
                        </div>
                    ) : (
                        webhooks.map((wh) => (
                            <div key={wh.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6 relative group overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                            {wh.event_type}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <History className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                {wh.last_triggered_at ? 'Último disparo: ' + new Date(wh.last_triggered_at).toLocaleDateString() : 'Sin actividad'}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(wh.id)}
                                        className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endpoint URL</label>
                                        <a href={wh.url} target="_blank" className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                            PROBAR <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-mono text-slate-600 break-all select-all">
                                        {wh.url}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Secret Key:</span>
                                        <code className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100">
                                            {wh.secret_key.substring(0, 8)}****
                                        </code>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Docs Column */}
                <div className="space-y-8">
                    <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center">
                                <Zap className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-tight font-black">Guía Rápida</h4>
                        </div>
                        <div className="space-y-6">
                            <Step num="1" text="Crea un 'Webhook' en Zapier o Make." />
                            <Step num="2" text="Pega la URL aquí y elige el evento disparador." />
                            <Step num="3" text="Recibe los datos en tiempo real y automatiza." />
                        </div>
                    </div>

                    <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[3rem] space-y-4">
                        <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Evento: client.created</h4>
                        <p className="text-xs text-indigo-600 leading-relaxed italic">
                            "Se dispara automáticamente cada vez que registras un nuevo cliente manual o vía importación masiva."
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal de Nuevo Webhook */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/40">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md bg-white rounded-[3.5rem] p-10 shadow-[0_32px_80px_rgb(0,0,0,0.3)] border border-slate-100"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-slate-900 uppercase">Configurar Conexión</h3>
                                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-50 rounded-full">
                                    <XCircle className="w-6 h-6 text-slate-300" />
                                </button>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL de Destino</label>
                                    <input 
                                        type="url"
                                        placeholder="https://hooks.zapier.com/..."
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={newWebhook.url}
                                        onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evento Disparador</label>
                                    <select 
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={newWebhook.event_type}
                                        onChange={(e) => setNewWebhook({...newWebhook, event_type: e.target.value as WebhookEvent})}
                                    >
                                        <option value="client.created">Nuevo Cliente (client.created)</option>
                                        <option value="policy.renewed">Póliza Renovada (policy.renewed)</option>
                                        <option value="payment.overdue">Pago Vencido (payment.overdue)</option>
                                        <option value="lead.converted">Venta Cerrada (lead.converted)</option>
                                    </select>
                                </div>

                                <button 
                                    onClick={handleAdd}
                                    className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                                >
                                    ACTIVAR CONEXIÓN <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

function Step({ num, text }: any) {
    return (
        <div className="flex gap-4">
            <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black border border-white/20">
                {num}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
        </div>
    )
}
