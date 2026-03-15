"use client"

import { useEffect, useState } from "react"
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Download,
    Calendar,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Briefcase,
    FileText,
    MessageCircle,
    Building2,
    MoreHorizontal,
    X,
    Plus,
    CalendarDays,
    Share2,
    Mail,
    Send
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import GlobalAnalytics from "@/components/dashboard/GlobalAnalytics"

export default function ReportsPage() {
    const [filters, setFilters] = useState<{
        branch: string,
        client_ids: string[],
        startDate: string,
        endDate: string
    }>({
        branch: "all",
        client_ids: [],
        startDate: "",
        endDate: ""
    })
    const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false)
    const [clientSearch, setClientSearch] = useState("")

    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalPremium: 0,
        conversionRate: 0
    })
    const [clients, setClients] = useState<any[]>([])
    const [insurerData, setInsurerData] = useState<any[]>([])

    useEffect(() => {
        fetchClients()
    }, [])

    useEffect(() => {
        fetchReports()
    }, [filters])

    const fetchClients = async () => {
        const { data: clientsData } = await supabase.from('clients').select('id, first_name, last_name')
        if (clientsData) setClients(clientsData)
    }

    const fetchReports = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('policies')
                .select(`
                    id,
                    premium_total,
                    created_at,
                    branch,
                    client_id,
                    insurers(name)
                `)

            if (filters.branch !== 'all') {
                query = query.eq('branch', filters.branch)
            }

            if (filters.client_ids.length > 0) {
                query = query.in('client_id', filters.client_ids)
            }

            if (filters.startDate) {
                query = query.gte('created_at', filters.startDate)
            }
            if (filters.endDate) {
                query = query.lte('created_at', filters.endDate)
            }

            const { data: policies } = await query

            if (policies) {
                const pols = policies as any[]
                const total = pols.reduce((acc, p) => acc + (p.premium_total || 0), 0)
                setStats(prev => ({ ...prev, totalPremium: total }))

                // Agrupar por aseguradora
                const grouped: any = {}
                pols.forEach(p => {
                    const name = p.insurers?.name || 'Desconocida'
                    grouped[name] = (grouped[name] || 0) + (p.premium_total || 0)
                })
                setInsurerData(Object.entries(grouped).map(([name, value]) => ({ name, value })))
            }
        } catch (error) {
            console.error("Error fetching reports:", error)
        }
    }

    const shareReport = (type: 'whatsapp' | 'email' | 'telegram') => {
        const selectedCount = filters.client_ids.length
        let clientLabel = 'Cliente'

        if (selectedCount === 1) {
            const c = clients.find(c => c.id === filters.client_ids[0])
            clientLabel = c ? `${c.first_name} ${c.last_name}` : 'Cliente'
        } else if (selectedCount > 1) {
            clientLabel = `${selectedCount} Clientes`
        }

        const message = encodeURIComponent(`Hola ${clientLabel}! 👋 Te comparto el resumen de tu producción y estado de cuenta actual en Seguros RB. Puedes consultarlo aquí: [Link Temporal]`)

        if (type === 'whatsapp') {
            window.open(`https://wa.me/?text=${message}`, '_blank')
        } else if (type === 'email') {
            window.open(`mailto:?subject=Resumen de Seguros RB&body=${message}`, '_blank')
        } else if (type === 'telegram') {
            window.open(`https://t.me/share/url?url=[Link Temporal]&text=${message}`, '_blank')
        }
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-indigo-600" /> Centro de Reportes
                    </h1>
                    <p className="text-slate-500 mt-1">Analítica avanzada de tu cartera y producción.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl bg-white">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            className="text-xs font-bold text-slate-600 outline-none bg-transparent"
                            value={filters.branch}
                            onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                        >
                            <option value="all">Todos los Ramos</option>
                            <option value="Autos">Autos</option>
                            <option value="GMM">G. Médicos</option>
                            <option value="Vida">Vida</option>
                            <option value="Hogar">Hogar</option>
                        </select>
                    </div>
                    {/* Multi-Select Clients */}
                    <div className="relative">
                        <button
                            onClick={() => setIsClientSelectorOpen(!isClientSelectorOpen)}
                            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all min-w-[150px]"
                        >
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-600 truncate">
                                {filters.client_ids.length === 0 ? "Todos los Clientes" :
                                    filters.client_ids.length === 1 ? clients.find(c => c.id === filters.client_ids[0])?.first_name :
                                        `${filters.client_ids.length} Seleccionados`}
                            </span>
                            <Plus className="w-3 h-3 text-slate-400 ml-auto" />
                        </button>

                        <AnimatePresence>
                            {isClientSelectorOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsClientSelectorOpen(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 p-4 max-h-[300px] overflow-y-auto"
                                    >
                                        <div className="relative mb-3">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar cliente..."
                                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border-none rounded-lg text-[10px] outline-none"
                                                value={clientSearch}
                                                onChange={(e) => setClientSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => setFilters({ ...filters, client_ids: [] })}
                                                className={cn(
                                                    "w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors",
                                                    filters.client_ids.length === 0 ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"
                                                )}
                                            >
                                                Todos los Clientes
                                            </button>
                                            {clients.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(clientSearch.toLowerCase())).map(c => {
                                                const isSelected = filters.client_ids.includes(c.id)
                                                return (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => {
                                                            const newIds = isSelected
                                                                ? filters.client_ids.filter(id => id !== c.id)
                                                                : [...filters.client_ids, c.id]
                                                            setFilters({ ...filters, client_ids: newIds })
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-between",
                                                            isSelected ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <span>{c.first_name} {c.last_name}</span>
                                                        {isSelected && <X className="w-3 h-3" />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Date Range Filters */}
                    <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-xl bg-white">
                        <CalendarDays className="w-4 h-4 text-slate-400" />
                        <div className="flex items-center gap-1">
                            <input
                                type="date"
                                className="text-[10px] font-bold text-slate-600 bg-transparent outline-none"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            />
                            <span className="text-slate-300">/</span>
                            <input
                                type="date"
                                className="text-[10px] font-bold text-slate-600 bg-transparent outline-none"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="relative group">
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-xs shadow-lg shadow-indigo-100"
                        >
                            <Share2 className="w-4 h-4" /> Enviar Reporte
                        </button>
                        {/* One-Click Sharing Menu */}
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 space-y-1">
                            <button
                                onClick={() => shareReport('whatsapp')}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-colors text-[10px] font-black uppercase"
                            >
                                <MessageCircle className="w-4 h-4 text-emerald-500" /> WhatsApp
                            </button>
                            <button
                                onClick={() => shareReport('email')}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors text-[10px] font-black uppercase"
                            >
                                <Mail className="w-4 h-4 text-blue-500" /> Email
                            </button>
                            <button
                                onClick={() => shareReport('telegram')}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-sky-50 text-sky-600 rounded-xl transition-colors text-[10px] font-black uppercase"
                            >
                                <Send className="w-4 h-4 text-sky-500" /> Telegram
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => alert("Generando Estado de Cuenta en PDF...")}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs"
                    >
                        <FileText className="w-4 h-4" /> PDF
                    </button>
                </div>
            </div>

            {/* Global Funnel Flow NEW */}
            <GlobalAnalytics />

            {/* Quick KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Primas Totales"
                    value={`$${stats.totalPremium.toLocaleString()}`}
                    change="+12.5%"
                    isUp={true}
                    icon={TrendingUp}
                    color="indigo"
                />
                <KPICard
                    title="Conversión"
                    value={`${stats.conversionRate}%`}
                    change="+2.4%"
                    isUp={true}
                    icon={PieChart}
                    color="emerald"
                />
                <KPICard
                    title="Renovaciones Pendientes"
                    value="14"
                    change="-5"
                    isUp={true}
                    icon={Calendar}
                    color="amber"
                />
                <KPICard
                    title="Siniestros Activos"
                    value="8"
                    change="+2"
                    isUp={false}
                    icon={Building2}
                    color="rose"
                />
            </div>

            {/* Main Charts Placeholder Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 shadow-xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Producción por Mes</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Histórico 2026</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global</span>
                        </div>
                    </div>
                    {/* Visual Bar Chart Placeholder using CSS */}
                    <div className="h-64 flex items-end justify-between gap-4 px-4 border-b border-slate-100 pb-2">
                        {[40, 60, 45, 90, 75, 55, 100, 85].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ delay: i * 0.1, duration: 1 }}
                                className="w-full bg-gradient-to-t from-indigo-600 to-blue-400 rounded-t-xl group relative"
                            >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    ${(h * 1500).toLocaleString()}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span><span>Jul</span><span>Ago</span>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[40px] shadow-2xl p-8 hover:scale-[1.02] transition-transform duration-500">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-8">Ramos Ganadores</h3>
                    <div className="space-y-6">
                        <BranchProgress label="Autos" percent={65} color="bg-indigo-500" />
                        <BranchProgress label="G. Médicos" percent={20} color="bg-emerald-500" />
                        <BranchProgress label="Vida" percent={10} color="bg-amber-500" />
                        <BranchProgress label="Hogar" percent={5} color="bg-rose-500" />
                    </div>
                    <div className="mt-12 p-6 bg-slate-800/100 border border-slate-700/50 rounded-3xl backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Insight de IA</p>
                        </div>
                        <p className="text-xs text-white leading-relaxed">
                            Vemos un incremento del **15% en Ramos de Daños**. Te recomendamos lanzar una campaña de venta cruzada en **Vida** para consolidar el trimestre.
                        </p>
                    </div>
                </div>
            </div>

            {/* Production por Aseguradora Table */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Producción por Aseguradora</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Filtrar..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Compañía</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Primas Emitidas</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pólizas</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {insurerData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-10 text-center text-slate-400 italic">No hay datos por aseguradora.</td>
                                </tr>
                            ) : (
                                insurerData.map((d, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5 border-l-4 border-transparent group-hover:border-indigo-500">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-400 text-xs">
                                                    {d.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-slate-900">{d.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 font-mono font-bold text-slate-600">${d.value.toLocaleString()}</td>
                                        <td className="px-8 py-5 text-slate-600">--</td>
                                        <td className="px-8 py-5">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                                                Al Corriente
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function KPICard({ title, value, change, isUp, icon: Icon, color }: any) {
    const colors: any = {
        indigo: "bg-indigo-100 text-indigo-600 shadow-indigo-100",
        emerald: "bg-emerald-100 text-emerald-600 shadow-emerald-100",
        amber: "bg-amber-100 text-amber-600 shadow-amber-100",
        rose: "bg-rose-100 text-rose-600 shadow-rose-100"
    }
    return (
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300 shadow-lg", colors[color])}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className={cn("flex items-center gap-1 text-[10px] font-black uppercase tracking-widest", isUp ? "text-emerald-500" : "text-rose-500")}>
                    {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {change}
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
        </div>
    )
}

function BranchProgress({ label, percent, color }: any) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{label}</span>
                <span className="text-xs font-black text-white">{percent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={cn("h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]", color)}
                />
            </div>
        </div>
    )
}
