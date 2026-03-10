"use client"

import { useEffect, useState } from "react"
import {
    CreditCard,
    Calendar,
    MessageSquare,
    Search,
    Filter,
    AlertCircle,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    Users,
    Mail,
    Send,
    Zap,
    Coins,
    Sparkles
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ReferralCard } from "@/components/dashboard/ReferralCard"

export default function BillingPage() {
    const [installments, setInstallments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filter, setFilter] = useState<'all' | 'overdue' | 'upcoming'>('all')

    useEffect(() => {
        fetchBilling()
    }, [])

    const fetchBilling = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('billing_overview' as any)
                .select('*')
                .order('due_date', { ascending: true })

            if (error) throw error
            setInstallments(data || [])
        } catch (error) {
            console.error('Error loading billing:', error)
        } finally {
            setLoading(false)
        }
    }

    const sendReminder = (item: any) => {
        const message = `Hola ${item.client_name}, te saludamos de Seguros RB. Te recordamos que tienes un recibo pendiente de tu póliza ${item.policy_number} (${item.insurer_name}) con vencimiento el ${new Date(item.due_date).toLocaleDateString()}. Monto: $${item.amount.toLocaleString()}. Quedamos a tus órdenes.`
        const url = `https://wa.me/${item.client_phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    }

    const filtered = installments.filter(item => {
        const matchesSearch = item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.policy_number.toLowerCase().includes(searchTerm.toLowerCase())

        const isOverdue = new Date(item.due_date) < new Date()

        if (filter === 'overdue') return matchesSearch && isOverdue
        if (filter === 'upcoming') return matchesSearch && !isOverdue
        return matchesSearch
    })

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-emerald-600" /> Control de Cobranza
                    </h1>
                    <p className="text-slate-500 mt-1">Gestiona los recibos pendientes y asegura tus comisiones.</p>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vencidos</p>
                            <p className="text-2xl font-black text-slate-900">
                                {installments.filter(i => new Date(i.due_date) < new Date()).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pendiente Total</p>
                            <p className="text-2xl font-black text-slate-900">
                                ${installments.reduce((acc, i) => acc + i.amount, 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Próximos 30 días</p>
                            <p className="text-2xl font-black text-slate-900">
                                {installments.filter(i => {
                                    const d = new Date(i.due_date)
                                    const now = new Date()
                                    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
                                    return d >= now && d <= thirtyDays
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Credits Shop */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl mb-10">
                {/* ... existing shop content ... */}
            </div>

            {/* Referral Banner */}
            <ReferralCard />

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o póliza..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", filter === 'all' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('overdue')}
                        className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", filter === 'overdue' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                        Vencidos
                    </button>
                    <button
                        onClick={() => setFilter('upcoming')}
                        className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", filter === 'upcoming' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                        Próximos
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente / Póliza</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recibo</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimiento</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-6 py-6 h-20 bg-slate-50/50"></td>
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium italic">
                                    No se encontraron recibos pendientes.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((item) => {
                                const isOverdue = new Date(item.due_date) < new Date()
                                return (
                                    <tr key={item.installment_id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{item.client_name}</span>
                                                <span className="text-xs text-slate-400 font-mono uppercase">{item.policy_number} • {item.insurer_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                                                {item.installment_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className={cn("w-4 h-4", isOverdue ? "text-rose-500" : "text-emerald-500")} />
                                                <span className={cn("text-sm font-bold", isOverdue ? "text-rose-600" : "text-slate-700")}>
                                                    {new Date(item.due_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-black text-slate-900">
                                            ${item.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => sendReminder(item)}
                                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all active:scale-95"
                                                    title="WhatsApp"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all active:scale-95"
                                                    title="Email"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-100 transition-all active:scale-95"
                                                    title="Telegram"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
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
