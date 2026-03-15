"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
    Zap, Bot, Mic, Shield, 
    HardDrive, Users, Check,
    Sparkles, ArrowRight, Star,
    Layers, CreditCard, AlertCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

const MODULES = [
    {
        id: "bot_pro",
        title: "Bot Pro (Auto-Pilot)",
        description: "Cobranza y recordatorios automáticos 24/7 sin intervención humana.",
        price: 200,
        period: "mes",
        icon: Bot,
        color: "text-amber-500",
        bg: "bg-amber-50",
        features: ["WhatsApp 24/7", "Detección de periodo de gracia", "Confirmación de pago automática"]
    },
    {
        id: "sync_portales",
        title: "Capataz Sync RPA",
        description: "Sincronización automática de datos desde los portales de aseguradoras.",
        price: 150,
        period: "mes/aseg",
        icon: Zap,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
        features: ["Elimina carga manual", "Evita errores de dedo", "Actualización diaria"]
    },
    {
        id: "voice_ai",
        title: "Capataz Voice AI",
        description: "Dicta tareas y notas de voz para que la IA registre todo por ti.",
        price: 100,
        period: "mes",
        icon: Mic,
        color: "text-indigo-500",
        bg: "bg-indigo-50",
        features: ["Transcripción inteligente", "Creación de tareas por voz", "Búsqueda de clientes"]
    }
]

const GROWTH_PACKS = [
    { id: "plus_policies", title: "+500 Pólizas", price: 100, icon: Shield },
    { id: "plus_clients", title: "+300 Clientes", price: 100, icon: Users },
    { id: "plus_cloud", title: "+5 GB Cloud", price: 50, icon: HardDrive },
]

export default function MarketplacePage() {
    const [selected, setSelected] = useState<string | null>(null)
    const [loading, setLoading] = useState<string | null>(null)
    const [activeAddons, setActiveAddons] = useState<string[]>([])
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        fetchActiveAddons()
    }, [])

    const fetchActiveAddons = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data: profile } = await supabase.from('profiles').select('agency_id').single()
        if (profile?.agency_id) {
            const { data } = await supabase
                .from('agency_addons')
                .select('addon_type')
                .eq('agency_id', profile.agency_id)
                .eq('status', 'active')
            
            if (data) setActiveAddons(data.map(a => a.addon_type))
        }
    }

    const handleActivate = async (addonType: string) => {
        if (activeAddons.includes(addonType)) return
// ...
        try {
            setLoading(addonType)
            setMessage(null)
            
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error("No session found")

            const res = await fetch('/api/marketplace/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ addon_type: addonType })
            })

            const data = await res.json()
            if (data.success) {
                setMessage({ type: 'success', text: data.message })
                // Refresh addons or local state if needed
            } else {
                throw new Error(data.error)
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-12">
            {/* Notifications */}
            {message && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`fixed top-8 right-8 z-[100] p-4 rounded-2xl shadow-xl border flex items-center gap-3 ${
                        message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
                        {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <p className="font-bold text-sm">{message.text}</p>
                    <button onClick={() => setMessage(null)} className="ml-4 opacity-50 hover:opacity-100 uppercase text-[10px] font-black tracking-widest">Cerrar</button>
                </motion.div>
            )}
            {/* Hero */}
            <div className="relative p-12 bg-indigo-900 rounded-[50px] overflow-hidden shadow-2xl shadow-indigo-200">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/30 rounded-full text-indigo-100 text-[10px] font-black uppercase tracking-widest border border-white/10">
                            <Sparkles className="w-3 h-3" /> Marketplace Pro
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                            Añade <span className="text-emerald-400 font-black">Superpoderes</span> <br /> a tu Oficina Digital
                        </h1>
                        <p className="text-indigo-100 text-lg font-medium opacity-80">
                            Activa módulos de Inteligencia Artificial y crece tus límites según tus necesidades. Sin contratos forzosos.
                        </p>
                    </div>
                    <div className="hidden lg:block">
                        <div className="p-8 bg-white/10 backdrop-blur-xl rounded-[40px] border border-white/10 shadow-inner">
                            <Layers className="w-20 h-20 text-indigo-200 opacity-50" />
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Modules */}
            <div>
                <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <Bot className="w-5 h-5 text-indigo-600" />
                    </div>
                    Módulos "A-la-Carta"
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {MODULES.map((module) => (
                        <motion.div
                            key={module.id}
                            whileHover={{ y: -5 }}
                            className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-all relative group"
                        >
                            <div className={`w-14 h-14 ${module.bg} ${module.color} rounded-2xl flex items-center justify-center mb-6`}>
                                <module.icon className="w-7 h-7" />
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-slate-900">{module.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed min-h-[4rem]">
                                    {module.description}
                                </p>
                                
                                <div className="space-y-2 py-4 border-y border-slate-100">
                                    {module.features.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            <Check className="w-3 h-3 text-emerald-500" /> {f}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-end justify-between pt-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inversión Mensual</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-slate-900">${module.price}</span>
                                            <span className="text-xs font-bold text-slate-400">/{module.period}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleActivate(module.id)}
                                        disabled={loading === module.id || activeAddons.includes(module.id)}
                                        className={`p-4 rounded-2xl transition-all shadow-lg ${
                                            activeAddons.includes(module.id) 
                                            ? 'bg-emerald-500 text-white cursor-default' 
                                            : 'bg-indigo-600 text-white hover:scale-110 shadow-indigo-100 disabled:opacity-50 disabled:scale-100'
                                        }`}
                                    >
                                        {loading === module.id ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : activeAddons.includes(module.id) ? (
                                            <Check className="w-5 h-5" />
                                        ) : (
                                            <ArrowRight className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Growth Packs */}
            <div className="bg-slate-50 p-12 rounded-[50px] border border-slate-200">
                <div className="text-center mb-12 space-y-2">
                    <h2 className="text-3xl font-black text-slate-900">Módulos de Crecimiento</h2>
                    <p className="text-slate-500 font-medium italic">"Si tú creces, nosotros crecemos"</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {GROWTH_PACKS.map((pack) => (
                        <button 
                            key={pack.id}
                            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <pack.icon className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-slate-900">{pack.title}</p>
                                    <p className="text-xs font-bold text-indigo-500">${pack.price} MXN / mes</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-colors">
                                <Check className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer / FAQ */}
            <div className="p-8 bg-indigo-50 rounded-3xl border border-indigo-100 flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-bold text-indigo-600 shadow-sm">
                        !
                    </div>
                    <div>
                        <p className="font-bold text-indigo-900">¿Tienes dudas sobre los créditos?</p>
                        <p className="text-xs text-indigo-700 font-medium">Todos los módulos incluyen soporte técnico prioritario 24/7 de Capataz.</p>
                    </div>
                </div>
                <button className="px-6 py-3 bg-white text-indigo-900 font-bold rounded-xl shadow-sm border border-indigo-100 hover:bg-slate-50 transition-colors flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Gestionar Pagos
                </button>
            </div>
        </div>
    )
}
