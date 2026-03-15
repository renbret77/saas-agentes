"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, UserPlus, TrendingUp, Calendar, ArrowUpRight, Shield, Zap, Search, Filter, MoreVertical, Briefcase, Star, MessageSquare, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { AssignCreditsModal } from "@/components/dashboard/AssignCreditsModal"

import { AdvancedKPIDashboard } from "@/components/dashboard/AdvancedKPIDashboard"
import PromotoriaMarketingStats from "@/components/dashboard/PromotoriaMarketingStats"
import FinancialDashboard from "@/components/dashboard/FinancialDashboard"

export default function EnterpriseDashboard() {
    const router = useRouter()
    const [agents, setAgents] = useState<any[]>([])
    const [selectedAgent, setSelectedAgent] = useState<any>(null)
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalAgents: 0,
        activeSeats: 0,
        totalPremiums: 0,
        pendingRenewals: 0
    })

    useEffect(() => {
        const fetchEnterpriseData = async () => {
            setLoading(true)
            try {
                // 1. Fetch Agents (Profiles with linked agencies)
                const { data: profiles, error } = await supabase
                    .from('profiles')
                    .select(`
                        id,
                        first_name,
                        last_name,
                        email,
                        agencies (
                            name,
                            max_clients,
                            max_policies
                        ),
                        agent_settings (
                             ai_credits_total,
                             ai_credits_used
                        )
                    `)
                
                if (error) throw error

                setAgents(profiles || [])
                setStats({
                    totalAgents: profiles?.length || 0,
                    activeSeats: profiles?.length || 0,
                    totalPremiums: 1245000, 
                    pendingRenewals: 42
                })

            } catch (err) {
                console.error("Error fetching enterprise data:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchEnterpriseData()
    }, [])

    return (
        <div className="relative min-h-screen space-y-8 pb-32">
            {/* Mesh Gradient Background (Enterprise Theme: Indigo/Purple) */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[5%] -left-[5%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[10%] -right-[5%] w-[35%] h-[45%] bg-purple-500/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Enterprise Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-200">Consola Enterprise</span>
                        <span className="text-slate-400 text-[10px] font-medium underline decoration-slate-200 underline-offset-4">Control de Promotoría v1.0</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight tracking-tighter">Capataz <span className="text-indigo-600">Commander</span></h1>
                    <p className="text-slate-500 font-medium max-w-2xl">
                        Visión 360° de tu fuerza de ventas. Gestiona agentes, monitorea el crecimiento y escala tu negocio <span className="text-indigo-600 font-bold italic">sin límites</span>.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 h-10">
                        <UserPlus className="w-4 h-4" /> Invitar Agente
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95 h-10">
                        <Briefcase className="w-4 h-4" /> Facturación
                    </button>
                </div>
            </div>

            {/* Enterprise Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Agentes Totales", value: stats.totalAgents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Asientos Activos", value: stats.activeSeats, icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Prima Emitida (Red)", value: `$${(stats.totalPremiums / 1000000).toFixed(1)}M`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Renovaciones Pend.", value: stats.pendingRenewals, icon: Calendar, color: "text-rose-600", bg: "bg-rose-50" },
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group"
                    >
                        <div className={cn("absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform", stat.color)}>
                            <stat.icon className="w-10 h-10" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tight">{loading ? "..." : stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Main Table Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Fuerza de Ventas
                            <Zap className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Monitoreo de Salud de Cartera y Performance</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Buscar agente o sucursal..." 
                                className="pl-11 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none w-full md:w-64 transition-all"
                            />
                        </div>
                        <button className="p-3 border border-slate-100 rounded-2xl hover:bg-slate-50 text-slate-500 transition-colors">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Agente</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Plan Corporativo</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Uso de Cartera</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Crecimiento</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right px-4">Consola</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="py-8 px-4"><div className="h-12 bg-slate-50 rounded-2xl" /></td>
                                    </tr>
                                ))
                            ) : agents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="max-w-xs mx-auto space-y-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-900 italic">No hay agentes en esta promotoría aún.</p>
                                            <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Invita a tu primer agente</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                agents.map((agent, i) => (
                                    <tr key={agent.id} className="group hover:bg-indigo-50/30 transition-all cursor-pointer">
                                        <td className="py-6 px-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                                                    {agent.first_name?.[0]}{agent.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 leading-tight">{agent.first_name} {agent.last_name}</p>
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">{agent.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 text-center">
                                            <span className="px-3 py-1 bg-white border border-slate-100 text-slate-600 text-[10px] font-black rounded-xl uppercase shadow-sm">
                                                {agent.agencies?.[0]?.name || 'Standard Agent'}
                                            </span>
                                        </td>
                                        <td className="py-6 text-center">
                                            <div className="max-w-[120px] mx-auto">
                                                <p className="text-[11px] font-black text-slate-900 mb-1.5">
                                                    {(agent.agent_settings?.[0]?.ai_credits_total || 10) - (agent.agent_settings?.[0]?.ai_credits_used || 0)} 
                                                    <span className="text-slate-400 font-medium"> / {agent.agent_settings?.[0]?.ai_credits_total || 10}</span>
                                                </p>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${((agent.agent_settings?.[0]?.ai_credits_total || 10) - (agent.agent_settings?.[0]?.ai_credits_used || 0)) / (agent.agent_settings?.[0]?.ai_credits_total || 10) * 100}%` }}
                                                        className="h-full bg-indigo-500 rounded-full" 
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl">
                                                <TrendingUp className="w-3.5 h-3.5" />
                                                <p className="text-[11px] font-black uppercase">+12.4%</p>
                                            </div>
                                        </td>
                                        <td className="py-6 text-right px-4">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedAgent(agent)
                                                        setIsAssignModalOpen(true)
                                                    }}
                                                    className="w-9 h-9 flex items-center justify-center bg-white rounded-xl border border-slate-100 shadow-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                                                >
                                                    <Zap className="w-4 h-4" />
                                                </button>
                                                <button className="w-9 h-9 flex items-center justify-center bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100 text-white hover:bg-slate-900 transition-all">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Mostrando {agents.length} Agentes Activos</p>
                    <div className="flex items-center gap-2 font-black text-[11px] text-slate-400">
                        <span className="text-indigo-600">1</span>
                        <span className="hover:text-slate-900 cursor-pointer transition-colors px-2">2</span>
                        <span className="hover:text-slate-900 cursor-pointer transition-colors px-2">3</span>
                    </div>
                </div>
            </div>

            {/* Credit Assignment Modal */}
            <AssignCreditsModal 
                agent={selectedAgent}
                isOpen={isAssignModalOpen}
                onClose={() => {
                    setIsAssignModalOpen(false)
                    setSelectedAgent(null)
                }}
                onSuccess={() => {
                    router.refresh()
                }}
            />

            {/* Financial Intelligence Hub (Liquidador) */}
            <FinancialDashboard />

            {/* Global Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="bg-slate-900 p-10 rounded-[3.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap className="w-32 h-32 text-white" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-950 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight leading-none uppercase tracking-tighter">Network Intelligence</h3>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2">Detección de Oportunidades en Red</p>
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-400 leading-relaxed max-w-md italic">
                            IA detectó un <span className="text-indigo-300 font-extrabold underline decoration-indigo-400 underline-offset-4">incremento del 18%</span> en el ticket promedio global tras habilitar el motor de Cotizaciones Mamalonas en tu red. 
                        </p>
                        <div className="pt-6 grid grid-cols-2 gap-8 border-t border-white/5">
                            <div>
                                <p className="text-3xl font-black text-white">85.2%</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Nivel de Adopción</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-indigo-400">+$420k</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Margen Extra (IA)</p>
                            </div>
                        </div>
                        <button className="mt-8 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-black transition-all border border-white/10 hover:border-white/20 active:scale-95">
                            CONFIGURAR REGLAS GRUPALES
                        </button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 gap-8">
                    <div className="bg-white border border-slate-100 p-8 rounded-[3.5rem] shadow-sm flex flex-col justify-between group hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer">
                        <div className="flex items-start justify-between">
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black">
                                    <Star className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">VIP Growth Pack</h3>
                                    <p className="text-xs font-bold text-slate-400 leading-relaxed mt-1">
                                        Desbloquea 10 asientos Elite adicionales para tus mejores agentes con un 15% de descuento corporativo.
                                    </p>
                                </div>
                            </div>
                            <ArrowUpRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                        </div>
                        <div className="mt-8 flex items-center gap-3">
                            <div className="flex -space-x-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-xl border-4 border-white bg-slate-200 shadow-sm" />
                                ))}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3 Agentes Elegibles para el Plan Elite</p>
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-8 rounded-[3.5rem] shadow-2xl shadow-indigo-100 flex items-center justify-between group cursor-pointer hover:bg-indigo-700 transition-all">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform">
                                <Briefcase className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-tighter">Business Dashboard</h3>
                                <p className="text-xs font-bold text-indigo-100/70">Métricas avanzadas de facturación y ROI.</p>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white transition-all group-hover:bg-white group-hover:text-indigo-600">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
