"use client"

import { useEffect, useState } from "react"
import {
    Heart,
    Cake,
    Calendar,
    MessageCircle,
    Send,
    Mail,
    TrendingUp,
    Users,
    Star,
    Zap,
    History,
    ChevronRight,
    Smartphone
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function LoyaltyPage() {
    const [loading, setLoading] = useState(true)
    const [birthdays, setBirthdays] = useState<any[]>([])
    const [dormantClients, setDormantClients] = useState<any[]>([])
    const [referrals, setReferrals] = useState({ total: 12, pending: 3 })

    useEffect(() => {
        fetchLoyaltyData()
    }, [])

    const fetchLoyaltyData = async () => {
        setLoading(true)
        try {
            // 1. Clientes con cumpleaños este mes
            const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
            const { data: bdays } = await supabase
                .from('clients')
                .select('*')
                .ilike('birth_date', `%-${month}-%`)
                .limit(5)

            if (bdays) setBirthdays(bdays)

            // 2. Clientes "Inactivos" (Dormant) - Simulamos con last_contacted_at nulo o viejo
            const { data: idle } = await supabase
                .from('clients')
                .select('*')
                .is('last_contacted_at', null)
                .limit(5)

            if (idle) setDormantClients(idle)

        } catch (error) {
            console.error("Error loading loyalty data:", error)
        } finally {
            setLoading(false)
        }
    }

    const sendGreeting = (client: any, type: 'birthday' | 'checkup' | 'referral') => {
        const messages = {
            birthday: `¡Hola ${client.first_name}! 🎂 De parte de Seguros RB, te deseamos un muy feliz cumpleaños. Que pases un día increíble.`,
            checkup: `Hola ${client.first_name}, ¿cómo va todo? 👋 Paso a saludarte y recordarte que estoy aquí para cualquier duda con tus seguros.`,
            referral: `Hola ${client.first_name}. 👋 Si estás contento con mi servicio, ¿me podrías recomendar con alguien? ¡Te lo agradecería mucho!`
        }
        const text = encodeURIComponent(messages[type])
        window.open(`https://wa.me/${client.phone?.replace(/\D/g, '')}?text=${text}`, '_blank')
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <Heart className="w-8 h-8 text-rose-500" /> Fidelización Elite
                </h1>
                <p className="text-slate-500 mt-1">Mantén tu marca presente y convierte clientes en promotores.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lat Column: Birthday & Dormant */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Birthdays Widget */}
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/30 to-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                                    <Cake className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Cumpleaños del Mes</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Sorprende a tus clientes</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-2">
                            {birthdays.length === 0 ? (
                                <div className="py-10 text-center text-slate-400 italic">No hay cumpleaños próximos.</div>
                            ) : (
                                birthdays.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors rounded-[32px]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400">
                                                {c.first_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{c.first_name} {c.last_name}</p>
                                                <p className="text-xs text-rose-500 font-bold uppercase tracking-widest">{c.birth_date}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => sendGreeting(c, 'birthday')}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                                        >
                                            <MessageCircle className="w-4 h-4" /> Felicitar
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Re-engagement Widget */}
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/30 to-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                                    <History className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Re-activación de Clientes</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Más de 90 días sin contacto</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-2">
                            {dormantClients.length === 0 ? (
                                <div className="py-10 text-center text-slate-400 italic">Todos tus clientes están al día.</div>
                            ) : (
                                dormantClients.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors rounded-[32px]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{c.first_name} {c.last_name}</p>
                                                <p className="text-xs text-slate-400 font-bold uppercase">Último contacto: N/A</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => sendGreeting(c, 'checkup')}
                                                className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                            >
                                                <MessageCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => sendGreeting(c, 'referral')}
                                                className="p-3 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                            >
                                                <Star className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Referral Marketing */}
                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="px-3 py-1 bg-emerald-500 rounded-full text-[8px] font-black uppercase tracking-widest">Activo</div>
                                <Star className="w-4 h-4 text-amber-400" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight leading-none mb-2">Referidos<br />Premiados</h3>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed">
                                Tu campaña actual ha generado **{referrals.total} leads** este mes.
                            </p>

                            <div className="mt-8 space-y-4">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                                    <span>Meta Mensual</span>
                                    <span className="text-white">75%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} className="h-full bg-emerald-500" />
                                </div>
                            </div>

                            <button className="w-full mt-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-600" /> Lanzar Campaña
                            </button>
                        </div>
                        <div className="absolute -bottom-10 -right-10 opacity-5">
                            <Heart className="w-64 h-64 text-white" />
                        </div>
                    </div>

                    <div className="p-8 bg-indigo-600 rounded-[40px] text-white shadow-xl shadow-indigo-100">
                        <h4 className="font-black uppercase tracking-tighter text-lg leading-tight mb-4">Consejo de Fidelización</h4>
                        <p className="text-sm font-medium text-indigo-100 leading-relaxed italic">
                            "Un cliente feliz es tu mejor vendedor. Pídeles un referido justo después de resolverles un siniestro exitosamente."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
