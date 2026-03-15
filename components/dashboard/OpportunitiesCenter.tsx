"use client"

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Gift, 
    Snowflake, 
    TrendingUp, 
    Sparkles, 
    ChevronRight,
    MessageSquare,
    Clock,
    ShieldAlert,
    CheckCircle2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateWhatsAppLink } from '@/lib/whatsapp-templates'

interface Opportunity {
    id: string
    type: 'birthday' | 'cold_quote' | 'low_protection' | 'ai_sug'
    title: string
    subtitle: string
    client_name: string
    phone?: string
    priority: 'high' | 'medium' | 'low'
    data?: any
}

export default function OpportunitiesCenter() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOpportunities()
    }, [])

    const fetchOpportunities = async () => {
        try {
            setLoading(true)
            const today = new Date()
            const nextWeek = new Date()
            nextWeek.setDate(today.getDate() + 7)

            const opps: Opportunity[] = []

            // 1. Fetch Birthdays (Next 7 days)
            const { data: bdayClients } = await supabase
                .from('clients')
                .select('id, first_name, last_name, phone, birth_date')
                .not('birth_date', 'is', null)

            if (bdayClients) {
                const currentMonth = today.getMonth() + 1
                const currentDay = today.getDate()
                
                bdayClients.forEach(client => {
                    const bday = new Date(client.birth_date)
                    const bMonth = bday.getMonth() + 1
                    const bDay = bday.getDate()
                    
                    // Check if birthday is coming up (simplified for demo logic)
                    if (bMonth === currentMonth && bDay >= currentDay && bDay <= (currentDay + 7)) {
                        opps.push({
                            id: `bday-${client.id}`,
                            type: 'birthday',
                            title: 'Cumpleaños Próximo',
                            subtitle: `Felicita a ${client.first_name} y envíale un regalo o descuento.`,
                            client_name: `${client.first_name} ${client.last_name}`,
                            phone: client.phone,
                            priority: 'high'
                        })
                    }
                })
            }

            // 2. Cold Quotes (> 3 days without response)
            const threeDaysAgo = new Date()
            threeDaysAgo.setDate(today.getDate() - 3)

            const { data: coldQuotes } = await supabase
                .from('quote_sessions')
                .select('id, project_title, client_name_temp, updated_at, clients(first_name, last_name, phone)')
                .eq('is_active', true)
                .lt('updated_at', threeDaysAgo.toISOString())

            if (coldQuotes) {
                coldQuotes.forEach((q: any) => {
                    const client = q.clients
                    opps.push({
                        id: `cold-${q.id}`,
                        type: 'cold_quote',
                        title: 'Cotización en Espera',
                        subtitle: `No hay respuesta en 3+ días para "${q.project_title}".`,
                        client_name: client ? `${client.first_name} ${client.last_name}` : (q.client_name_temp || 'Prospecto'),
                        phone: client?.phone,
                        priority: 'medium',
                        data: q
                    })
                })
            }

            // 3. Low Protection (Clients with only 1 active policy)
            const { data: clientsWithPolicies } = await supabase
                .from('clients')
                .select('id, first_name, last_name, phone, policies(count)')
                .eq('policies.status', 'Vigente')

            if (clientsWithPolicies) {
                clientsWithPolicies.forEach((c: any) => {
                    if (c.policies && c.policies.length === 1) {
                        opps.push({
                            id: `low-${c.id}`,
                            type: 'low_protection',
                            title: 'Baja Protección',
                            subtitle: `Solo tiene 1 póliza activa. Potencial de Cross-Sell detectado.`,
                            client_name: `${c.first_name} ${c.last_name}`,
                            phone: c.phone,
                            priority: 'medium'
                        })
                    }
                })
            }

            setOpportunities(opps.sort((a, b) => {
                const score = { high: 3, medium: 2, low: 1 };
                return score[b.priority] - score[a.priority];
            }))

        } catch (error) {
            console.error('Error fetching opportunities:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = (opp: Opportunity) => {
        let msg = ""
        if (opp.type === 'birthday') {
            msg = `¡Hola ${opp.client_name}! 🎂 De parte de RB Proyectos, te deseamos un muy feliz cumpleaños. Queremos celebrarlo contigo con una atención especial en tu próxima renovación.`
        } else if (opp.type === 'cold_quote') {
            msg = `Hola ${opp.client_name}, ¿qué tal? Pasaba a saludarte y ver si tuviste oportunidad de revisar la propuesta de "${opp.data?.project_title}" que te enviamos. Quedo a tus órdenes para cualquier duda.`
        } else if (opp.type === 'low_protection') {
            msg = `Hola ${opp.client_name}, revisando tu blindaje patrimonial noté que tenemos algunas áreas descubiertas que podrían ser un riesgo. ¿Te gustaría agendar una breve llamada de 5 min para revisarlo?`
        }

        if (opp.phone) {
            window.open(generateWhatsAppLink(opp.phone, msg), '_blank')
        } else {
            alert("No hay teléfono registrado para este cliente.")
        }
    }

    return (
        <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-2xl">
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Centro de Oportunidades</h3>
                        <p className="text-sm font-medium text-slate-500">Acciones que te ayudan a ganar más dinero</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black border border-amber-100 animate-pulse">
                    MÁQUINA DE DINERO 🦾
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-slate-50 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : opportunities.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Sin oportunidades detectadas hoy</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence>
                            {opportunities.map((opp, idx) => (
                                <motion.div
                                    key={opp.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group relative flex items-center justify-between p-5 bg-slate-50/50 hover:bg-white border border-slate-100 rounded-[2rem] transition-all hover:shadow-xl"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-2xl ${
                                            opp.type === 'birthday' ? 'bg-rose-50 text-rose-500' :
                                            opp.type === 'cold_quote' ? 'bg-blue-50 text-blue-500' :
                                            'bg-indigo-50 text-indigo-500'
                                        }`}>
                                            {opp.type === 'birthday' && <Gift className="w-6 h-6" />}
                                            {opp.type === 'cold_quote' && <Snowflake className="w-6 h-6" />}
                                            {opp.type === 'low_protection' && <ShieldAlert className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{opp.title}</h4>
                                                {opp.priority === 'high' && (
                                                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-slate-400 group-hover:text-slate-600 mb-1">{opp.client_name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium italic">{opp.subtitle}</p>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleAction(opp)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-emerald-600 transition-all active:scale-95 shadow-lg uppercase"
                                    >
                                        <MessageSquare className="w-3 h-3" /> Ejecutar
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Inteligencia Predictiva Activa
                </p>
                <div className="text-[10px] font-black text-slate-400">
                    {opportunities.length} OPORTUNIDADES
                </div>
            </div>
        </div>
    )
}
