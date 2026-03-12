"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { CalendarWidget } from "@/components/dashboard/calendar-widget"
import { 
    Calendar as CalendarIcon, 
    Filter, 
    Download, 
    RefreshCw, 
    ChevronLeft, 
    ChevronRight,
    Search
} from "lucide-react"

export default function AgendaPage() {
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [viewDate, setViewDate] = useState(new Date())

    useEffect(() => {
        fetchAgendaData()
    }, [])

    const fetchAgendaData = async () => {
        setLoading(true)
        try {
            // Fetch Policies for renewals
            const { data: policies } = await supabase
                .from('policies')
                .select(`
                    id,
                    policy_number,
                    end_date,
                    clients ( first_name, last_name ),
                    insurers ( name )
                `)

            // Fetch Installments for payments
            const { data: installments } = await supabase
                .from('policy_installments')
                .select(`
                    id,
                    due_date,
                    total_amount,
                    status,
                    policies (
                        policy_number,
                        clients ( first_name, last_name )
                    )
                `)

            const formattedEvents: any[] = []

            // Add renewals
            policies?.forEach(p => {
                if (p.end_date) {
                    formattedEvents.push({
                        id: `renewal-${p.id}`,
                        title: `Renovación: ${p.clients?.first_name} ${p.clients?.last_name}`,
                        date: p.end_date,
                        type: 'renewal',
                        description: `Póliza ${p.policy_number} - ${p.insurers?.name}`,
                        color: 'rose'
                    })
                }
            })

            // Add payments
            installments?.forEach(i => {
                if (i.due_date) {
                    formattedEvents.push({
                        id: `payment-${i.id}`,
                        title: `Pago: ${i.policies?.clients?.first_name} ${i.policies?.clients?.last_name}`,
                        date: i.due_date,
                        type: 'payment',
                        description: `Monto: $${i.total_amount} - Póliza ${i.policies?.policy_number}`,
                        color: i.status === 'paid' ? 'emerald' : 'amber',
                        status: i.status
                    })
                }
            })

            setEvents(formattedEvents)
        } catch (error) {
            console.error("Error fetching agenda:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        Centro de Mando: Agenda
                    </h1>
                    <p className="text-slate-500 mt-1">Gestiona renovaciones, pagos y tareas pendientes.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={fetchAgendaData}
                        className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all border border-slate-200">
                        <Download className="w-4 h-4" />
                        Sincronizar
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all shadow-sm">
                        + Nueva Tarea
                    </button>
                </div>
            </div>

            {/* Calendar Widget */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[700px]">
                <CalendarWidget events={events} onRefresh={fetchAgendaData} />
            </div>
        </div>
    )
}
