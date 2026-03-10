"use client"

import { useEffect, useState } from "react"
import {
    Plus,
    MoreHorizontal,
    Phone,
    Mail,
    User,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    XCircle,
    Clock,
    MessageSquare,
    TrendingUp,
    Search
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

const STAGES = [
    { id: 'lead', label: 'Prospectos', color: 'bg-blue-500', icon: User },
    { id: 'contacted', label: 'Contactados', color: 'bg-amber-500', icon: MessageSquare },
    { id: 'quoting', label: 'Cotizando', color: 'bg-indigo-500', icon: Clock },
    { id: 'won', label: 'Ganados', color: 'bg-emerald-500', icon: CheckCircle2 },
    { id: 'lost', label: 'Perdidos', color: 'bg-slate-400', icon: XCircle },
]

export default function PipelinePage() {
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('updated_at', { ascending: false })

            if (error) throw error
            setClients(data || [])
        } catch (error) {
            console.error('Error loading pipeline:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (clientId: string, newStatus: string) => {
        try {
            const { error } = await (supabase.from('clients') as any)
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', clientId)

            if (error) throw error

            // Actualización optimista local
            setClients(prev => prev.map(c =>
                c.id === clientId ? { ...c, status: newStatus } : c
            ))
        } catch (error) {
            alert("Error al actualizar estado")
        }
    }

    const filteredClients = clients.filter(c =>
        (c.first_name + " " + c.last_name).toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-indigo-600" /> Pipeline de Ventas
                    </h1>
                    <p className="text-slate-500 mt-1">Arrastra tus prospectos hacia el éxito.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar prospecto..."
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto pb-6">
                <div className="flex gap-6 h-full min-w-[1200px]">
                    {STAGES.map((stage) => {
                        const stageClients = filteredClients.filter(c => c.status === stage.id || (stage.id === 'lead' && !c.status))

                        return (
                            <div key={stage.id} className="flex-1 flex flex-col min-w-[280px]">
                                {/* Stage Header */}
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${stage.color} text-white`}>
                                            <stage.icon className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-bold text-slate-700 text-sm italic">{stage.label}</h3>
                                        <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                            {stageClients.length}
                                        </span>
                                    </div>
                                    <button className="text-slate-400 hover:text-slate-600">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Column Body */}
                                <div className="flex-1 bg-slate-50/50 rounded-3xl p-3 space-y-3 border border-dashed border-slate-200">
                                    <AnimatePresence mode="popLayout">
                                        {stageClients.map((client) => (
                                            <motion.div
                                                layout
                                                key={client.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-default group"
                                            >
                                                <div className="space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="font-black text-slate-900 text-sm leading-tight group-hover:text-indigo-600 transition-colors">
                                                                {client.first_name} {client.last_name}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {client.id.slice(0, 8)}</p>
                                                        </div>
                                                        <Link href={`/dashboard/clients/${client.id}`} className="text-slate-300 hover:text-indigo-500">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Link>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        {client.phone && (
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                                                                <Phone className="w-3 h-3 text-emerald-500" />
                                                                {client.phone}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="h-px bg-slate-50"></div>

                                                    <div className="flex items-center justify-between gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            disabled={stage.id === STAGES[0].id}
                                                            onClick={() => {
                                                                const prevIdx = STAGES.findIndex(s => s.id === stage.id) - 1
                                                                updateStatus(client.id, STAGES[prevIdx].id)
                                                            }}
                                                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 disabled:opacity-0"
                                                        >
                                                            <ChevronLeft className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            disabled={stage.id === STAGES[STAGES.length - 1].id}
                                                            onClick={() => {
                                                                const nextIdx = STAGES.findIndex(s => s.id === stage.id) + 1
                                                                updateStatus(client.id, STAGES[nextIdx].id)
                                                            }}
                                                            className="p-1.5 hover:bg-slate-100 rounded-lg text-indigo-500 flex items-center gap-1 text-[10px] font-bold disabled:opacity-0"
                                                        >
                                                            Siguiente <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {stageClients.length === 0 && !loading && (
                                        <div className="py-10 text-center space-y-2">
                                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                                                <TrendingUp className="w-5 h-5 text-slate-300" />
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vacío</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
