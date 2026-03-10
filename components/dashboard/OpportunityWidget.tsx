"use client"

import { useState, useEffect } from "react"
import { Sparkles, ArrowRight, Zap, Mail, MessageSquare, Send, X, Loader2, CreditCard, ChevronRight, CheckCircle2, Bot, User, Calendar, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"

interface Opportunity {
    client_id: string
    client_name: string
    gap_life: boolean
    gap_health: boolean
    gap_home: boolean
    gap_auto: boolean
}

export default function OpportunityWidget() {
    const [opps, setOpps] = useState<Opportunity[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOpp, setSelectedOpp] = useState<{ opp: Opportunity, type: string } | null>(null)
    const [generating, setGenerating] = useState(false)
    const [campaign, setCampaign] = useState<{ asunto: string, email: string, whatsapp: string } | null>(null)
    const [credits, setCredits] = useState<number | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Cargar oportunidades desde la vista SQL
            const { data, error } = await supabase
                .from('v_cross_sell_opportunities')
                .select('*')
                .or('gap_life.eq.true,gap_health.eq.true,gap_home.eq.true,gap_auto.eq.true')
                .limit(5)

            if (data) setOpps(data)

            // Cargar créditos
            const { data: creditData } = await supabase
                .from('user_credits')
                .select('balance')
                .single() as { data: { balance: number } | null }

            if (creditData) setCredits(creditData.balance)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const [briefing, setBriefing] = useState({
        tone: 'Profesional',
        promo: '',
        focus: 'Seguridad familiar'
    })

    const generateCampaign = async (opp: Opportunity, type: string) => {
        setGenerating(true)
        setCampaign(null)
        try {
            const res = await fetch('/api/ai/generate-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: opp.client_id,
                    client_name: opp.client_name,
                    target_insurance: type,
                    ...briefing
                })
            })
            const data = await res.json()
            if (res.ok) {
                setCampaign(data)
                if (credits !== null) setCredits(credits - 1)

                // Actualizar ESTADO en el CRM automáticamente a 'quoting'
                await (supabase.from('clients') as any)
                    .update({ status: 'quoting', updated_at: new Date().toISOString() })
                    .eq('id', opp.client_id)
            } else {
                alert(data.error || "Error al generar campaña")
            }
        } catch (err) {
            alert("Error de conexión con la IA")
        } finally {
            setGenerating(false)
        }
    }

    if (loading) return null
    if (opps.length === 0) return null

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Inteligencia de Ventas
                </h3>
                {credits !== null && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                        <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
                        <span className="text-[10px] font-bold text-amber-700">{credits} CRÉDITOS</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
                {opps.map((opp, idx) => {
                    const gaps = [
                        { label: 'Vida', active: opp.gap_life },
                        { label: 'GMM', active: opp.gap_health },
                        { label: 'Hogar', active: opp.gap_home },
                        { label: 'Auto', active: opp.gap_auto }
                    ].filter(g => g.active)

                    return (
                        <motion.div
                            key={opp.client_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400">Oportunidad para:</p>
                                    <p className="text-sm font-black text-slate-900">{opp.client_name}</p>
                                </div>
                                <div className="flex gap-1">
                                    {gaps.slice(0, 2).map(gap => (
                                        <button
                                            key={gap.label}
                                            onClick={() => setSelectedOpp({ opp, type: gap.label })}
                                            className="px-2 py-1 bg-indigo-50 text-[10px] font-bold text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
                                        >
                                            + {gap.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Modal de Copiloto IA */}
            <AnimatePresence>
                {selectedOpp && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden shadow-indigo-500/10"
                        >
                            <div className="p-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Copiloto de Marketing</h4>
                                        <p className="text-xs text-white/70">Venta de seguro de {selectedOpp.type} para {selectedOpp.opp.client_name}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedOpp(null); setCampaign(null); }} className="hover:rotate-90 transition-transform">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                {!campaign && !generating && (
                                    <div className="space-y-8 py-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Tono */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Tono de Voz</label>
                                                <select
                                                    value={briefing.tone}
                                                    onChange={(e) => setBriefing({ ...briefing, tone: e.target.value })}
                                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                                >
                                                    <option>Profesional</option>
                                                    <option>Amigable y Cercano</option>
                                                    <option>Urgente (Vencimiento)</option>
                                                    <option>Educativo</option>
                                                </select>
                                            </div>

                                            {/* Enfoque */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Enfoque de Venta</label>
                                                <select
                                                    value={briefing.focus}
                                                    onChange={(e) => setBriefing({ ...briefing, focus: e.target.value })}
                                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                                >
                                                    <option>Seguridad familiar</option>
                                                    <option>Ahorro y Economía</option>
                                                    <option>Prevención de Desastres</option>
                                                    <option>Cuidado de la Salud</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Promo */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Promoción o Gancho (Opcional)</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: '10% de descuento este mes' o 'Meses sin intereses'"
                                                value={briefing.promo}
                                                onChange={(e) => setBriefing({ ...briefing, promo: e.target.value })}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                            />
                                        </div>

                                        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                                                <span className="text-xs font-bold text-slate-400">Costo: 1 Crédito</span>
                                            </div>
                                            <button
                                                onClick={() => generateCampaign(selectedOpp.opp, selectedOpp.type)}
                                                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                Generar Magia IA <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {generating && (
                                    <div className="text-center py-20 flex flex-col items-center gap-4">
                                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                                        <div className="space-y-1">
                                            <p className="font-bold text-indigo-900">Redactando propuesta mágica...</p>
                                            <p className="text-xs text-slate-400">Afinando el tono persuasivo de Gemini Flash</p>
                                        </div>
                                    </div>
                                )}

                                {campaign && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                                <Mail className="w-4 h-4" />
                                                <span className="text-xs font-black uppercase tracking-widest">E-mail Personalizado</span>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                                <p className="text-sm font-bold text-slate-900">Asunto: {campaign.asunto}</p>
                                                <div className="h-px bg-slate-200"></div>
                                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{campaign.email}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-emerald-600 mb-2">
                                                <MessageCircle className="w-4 h-4" />
                                                <span className="text-xs font-black uppercase tracking-widest">Whats-App Directo</span>
                                            </div>
                                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                                <p className="text-xs text-emerald-900 leading-relaxed italic">"{campaign.whatsapp}"</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
                                                Enviar WhatsApp <ChevronRight className="w-5 h-5" />
                                            </button>
                                            <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2">
                                                Copiar Texto
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
