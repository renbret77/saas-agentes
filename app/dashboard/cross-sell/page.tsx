"use client"

import { useEffect, useState } from "react"
import {
    TrendingUp,
    Target,
    Users,
    ArrowRight,
    Shield,
    Zap,
    Sparkles,
    Search,
    ChevronRight,
    MessageSquare,
    CheckCircle2,
    XCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import Link from "next/link"

const INSURANCE_TYPES = [
    { id: 'autos', label: 'Autos', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'gm', label: 'Gastos Médicos', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'vida', label: 'Vida', icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'hogar', label: 'Hogar', icon: Shield, color: 'text-amber-500', bg: 'bg-amber-50' }
]

export default function CrossSellPage() {
    const [opportunities, setOpportunities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchOpportunities()
    }, [])

    const fetchOpportunities = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('client_insurance_gaps' as any)
                .select('*')
                .order('last_name', { ascending: true })

            if (error) throw error
            setOpportunities(data || [])
        } catch (error) {
            console.error('Error loading cross-sell:', error)
        } finally {
            setLoading(false)
        }
    }

    const filtered = opportunities.filter(o =>
        (o.first_name + " " + o.last_name).toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Target className="w-8 h-8 text-indigo-600" /> Análisis de Venta Cruzada
                    </h1>
                    <p className="text-slate-500 mt-1">Identifica brechas en la protección de tus clientes y aumenta tu cartera.</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {INSURANCE_TYPES.map((type) => {
                    const count = opportunities.filter(o => !o[`has_${type.id}`]).length
                    return (
                        <div key={type.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={cn("p-2 rounded-xl", type.bg, type.color)}>
                                    <type.icon className="w-4 h-4" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type.label}</p>
                            </div>
                            <div className="flex items-end justify-between">
                                <p className="text-2xl font-black text-slate-900">{count}</p>
                                <p className="text-[10px] text-rose-500 font-bold">SIN PROTECCIÓN</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Content Control */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar clientes con oportunidades..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[30%]">Cliente</th>
                            {INSURANCE_TYPES.map(t => (
                                <th key={t.id} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.label}</th>
                            ))}
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Potencial</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            Array(8).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={6} className="h-16 bg-slate-50/50 px-6"></td>
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-20 text-center text-slate-400 italic">No hay datos de oportunidades disponibles.</td>
                            </tr>
                        ) : (
                            filtered.map((client) => {
                                const opportunitiesCount = INSURANCE_TYPES.filter(t => !client[`has_${t.id}`]).length
                                return (
                                    <tr key={client.client_id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{client.first_name} {client.last_name}</span>
                                                <span className="text-[10px] text-slate-400 font-mono italic">#{client.client_id.slice(0, 8)}</span>
                                            </div>
                                        </td>
                                        {INSURANCE_TYPES.map(t => {
                                            const hasIt = client[`has_${t.id}`]
                                            return (
                                                <td key={t.id} className="px-6 py-4 text-center">
                                                    <div className="flex justify-center">
                                                        {hasIt ? (
                                                            <div className="p-1 bg-emerald-100 text-emerald-600 rounded-lg">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </div>
                                                        ) : (
                                                            <div className="p-1 bg-rose-50 text-rose-300 rounded-lg group-hover:text-rose-400 transition-colors">
                                                                <XCircle className="w-4 h-4 opacity-50" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            )
                                        })}
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/dashboard?client_id=${client.client_id}`}
                                                className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    opportunitiesCount >= 3 ? "bg-amber-100 text-amber-700 shadow-sm" : "bg-slate-100 text-slate-400"
                                                )}
                                            >
                                                {opportunitiesCount} Gaps <Sparkles className="w-3 h-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
