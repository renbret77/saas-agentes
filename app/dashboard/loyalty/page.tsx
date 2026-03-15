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
    const [referralLeads, setReferralLeads] = useState<any[]>([])
    const [churnRisks, setChurnRisks] = useState<any[]>([])
    const [referralsStats, setReferralsStats] = useState({ total: 0, pending: 0 })

    useEffect(() => {
        fetchLoyaltyData()
    }, [])

    const fetchLoyaltyData = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Clientes con cumpleaños este mes
            const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
            const { data: bdays } = await supabase
                .from('clients')
                .select('*')
                .ilike('birth_date', `%-${month}-%`)
                .limit(5)

            if (bdays) setBirthdays(bdays)

            // 2. Clientes con Riesgo de Churn (Simulado mediante last_contacted_at > 90 días)
            // En producción esto usaría la vista view_churn_analysis si existiera
            const { data: risky } = await supabase
                .from('clients')
                .select('*')
                .or('last_contacted_at.lt.' + new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() + ',last_contacted_at.is.null')
                .limit(5)

            if (risky) setChurnRisks(risky)

            // 3. Referidos Recientes
            const { data: refs } = await supabase
                .from('client_referrals')
                .select('*, referrer:clients(first_name, last_name)')
                .eq('agent_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            if (refs) {
                setReferralLeads(refs)
                setReferralsStats({
                    total: refs.length,
                    pending: refs.filter(r => r.status === 'lead').length
                })
            }

        } catch (error) {
            console.error("Error loading loyalty data:", error)
        } finally {
            setLoading(false)
        }
    }

    const sendGreeting = async (client: any, type: 'birthday' | 'checkup' | 'referral' | 'reward') => {
        let text = ""
        
        if (type === 'reward') {
            const couponCode = `RB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            text = encodeURIComponent(`¡Felicidades ${client.first_name}! 🎁 Como agradecimiento por tu lealtad con RB Proyectos, te hemos generado un cupón de beneficio exclusivo: *${couponCode}*. ¡Gracias por confiar en nosotros!`)
            
            // Registrar en DB (Opcional, simulado para UI)
            await supabase.from('loyalty_rewards').insert([{
                client_id: client.id,
                code: couponCode,
                reward_type: 'coupon',
                description: 'Cupón de Lealtad'
            }])
        } else if (type === 'referral_request') {
            text = encodeURIComponent(`¡Hola ${client.first_name}! 👋 Espero que estés muy bien. Quería agradecerte por tu confianza en RB Proyectos. 🎁 ¿Habrá alguien a quien creas que pueda ayudar con sus seguros? Me encantaría que me recomendaras. ¡Gracias!`)
        } else {
            const messages = {
                birthday: `¡Hola ${client.first_name}! 🎂 De parte de RB Proyectos, te deseamos un muy feliz cumpleaños. Que pases un día increíble.`,
                checkup: `Hola ${client.first_name}, ¿cómo va todo? 👋 Paso a saludarte y recordarte que estoy aquí para cualquier duda con tus seguros.`,
                referral: `Hola ${client.first_name}. 👋 Si estás contento con mi servicio, ¿me podrías recomendar con alguien? ¡Te lo agradecería mucho!`
            }
            text = encodeURIComponent(messages[type as keyof typeof messages] || messages.checkup)
        }
        
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
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => sendGreeting(c, 'reward')}
                                                className="p-3 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                                title="Recompensar con Cupón"
                                            >
                                                <Zap className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => sendGreeting(c, 'birthday')}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                                            >
                                                <MessageCircle className="w-4 h-4" /> Felicitar
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Predictive Churn Widget NEW */}
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/30 to-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                                    <TrendingUp className="w-6 h-6 transform rotate-180" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Riesgo de Deserción (AI)</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Clientes con baja interacción</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-2">
                            {churnRisks.length === 0 ? (
                                <div className="py-10 text-center text-slate-400 italic">No hay clientes en riesgo detectados.</div>
                            ) : (
                                churnRisks.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors rounded-[32px]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center relative">
                                                <Users className="w-6 h-6" />
                                                <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{c.first_name} {c.last_name}</p>
                                                <p className="text-xs text-rose-500 font-bold uppercase">ALTO RIESGO • {c.last_contacted_at ? 'Inactivo desde ' + new Date(c.last_contacted_at).toLocaleDateString() : 'Sin contacto previo'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => sendGreeting(c, 'checkup')}
                                                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-100"
                                            >
                                                <Zap className="w-4 h-4" /> Rescatar
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
                            <h3 className="text-2xl font-black tracking-tight leading-none mb-2">Referidos<br />Reales</h3>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed">
                                Has recibido **{referralsStats.total} referidos** totales, con **{referralsStats.pending} pendientes** de contacto.
                            </p>

                            <div className="mt-8 space-y-4">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                                    <span>Tasa de Conversión</span>
                                    <span className="text-white">{(referralsStats.total > 0 ? (referralsStats.total - referralsStats.pending) / referralsStats.total * 100 : 0).toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: `${referralsStats.total > 0 ? (referralsStats.total - referralsStats.pending) / referralsStats.total * 100 : 0}%` }} 
                                        className="h-full bg-emerald-500" 
                                    />
                                </div>
                            </div>

                            <div className="mt-8 space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                                {referralLeads.map((ref, i) => (
                                    <div key={i} className="p-3 bg-slate-800/50 rounded-xl border border-white/5 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-white">{ref.referred_name}</p>
                                            <p className="text-[8px] text-slate-500 italic">Por: {ref.referrer?.first_name}</p>
                                        </div>
                                        <span className={cn(
                                            "text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase",
                                            ref.status === 'lead' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                                        )}>
                                            {ref.status}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-6 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 hover:text-white transition-all flex items-center justify-center gap-2">
                                <Zap className="w-4 h-4" /> Solicitar a Clientes VIP
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
