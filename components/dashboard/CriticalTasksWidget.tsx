"use client"

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    AlertTriangle,
    Clock,
    MessageSquare,
    RefreshCw,
    ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCollectionMessage, getRenewalMessage, generateWhatsAppLink } from '@/lib/whatsapp-templates'

interface CriticalTask {
    id: string
    type: 'payment' | 'renewal'
    title: string
    subtitle: string
    amount?: number
    dueDate: string
    clientName: string
    phone: string
    policyData: any // Context for the message
}

export default function CriticalTasksWidget() {
    const [tasks, setTasks] = useState<CriticalTask[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCriticalTasks()
    }, [])

    const fetchCriticalTasks = async () => {
        try {
            setLoading(true)

            // 1. Fetch Overdue Installments
            const { data: installments, error: instError } = await supabase
                .from('policy_installments')
                .select(`
                    id, 
                    total_amount, 
                    due_date, 
                    installment_number, 
                    policies (
                        policy_number,
                        branch_id,
                        insurer_id,
                        payment_method,
                        clients (first_name, last_name, phone)
                    )
                `)
                .eq('status', 'Pendiente')
                .lte('due_date', new Date().toISOString().split('T')[0])
                .order('due_date', { ascending: true })
                .limit(5)

            // 2. Fetch Upcoming Renewals (< 15 days)
            const fifteenDaysFromNow = new Date()
            fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15)

            const { data: policies, error: polError } = await supabase
                .from('policies')
                .select(`
                    id,
                    policy_number,
                    end_date,
                    branch_id,
                    insurer_id,
                    premium_total,
                    clients (first_name, last_name, phone)
                `)
                .neq('status', 'Cancelada')
                .lte('end_date', fifteenDaysFromNow.toISOString().split('T')[0])
                .gte('end_date', new Date().toISOString().split('T')[0])
                .order('end_date', { ascending: true })
                .limit(5)

            const combinedTasks: CriticalTask[] = []

            if (installments) {
                installments.forEach((inst: any) => {
                    const policy = inst.policies
                    const client = policy?.clients
                    if (!client) return

                    combinedTasks.push({
                        id: inst.id,
                        type: 'payment',
                        title: `Pago Vencido: ${policy.policy_number}`,
                        subtitle: `${client.first_name} ${client.last_name}`,
                        amount: inst.total_amount,
                        dueDate: inst.due_date,
                        clientName: `${client.first_name} ${client.last_name}`,
                        phone: client.phone || '',
                        policyData: { ...policy, ...inst }
                    })
                })
            }

            if (policies) {
                policies.forEach((pol: any) => {
                    const client = pol.clients
                    if (!client) return

                    combinedTasks.push({
                        id: pol.id,
                        type: 'renewal',
                        title: `Renovación: ${pol.policy_number}`,
                        subtitle: `${client.first_name} ${client.last_name}`,
                        amount: pol.premium_total,
                        dueDate: pol.end_date,
                        clientName: `${client.first_name} ${client.last_name}`,
                        phone: client.phone || '',
                        policyData: pol
                    })
                })
            }

            setTasks(combinedTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()))
        } catch (err) {
            console.error('Error fetching critical tasks:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSendWhatsApp = (task: CriticalTask) => {
        let message = ''
        if (task.type === 'payment') {
            const d = task.policyData
            const today = new Date()
            const dueDate = new Date(task.dueDate)
            const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            message = getCollectionMessage(
                task.clientName,
                d.branch_id || 'Seguros',
                d.insurer_id || 'Aseguradora',
                d.policy_number,
                task.amount || 0,
                d.payment_method || 'Contado',
                diffDays,
                new Date().toISOString(), // Simulating start
                task.dueDate,
                '',
                '',
                d.installment_number
            )
        } else {
            const d = task.policyData
            message = getRenewalMessage(
                task.clientName,
                d.branch_id || 'Seguros',
                d.insurer_id || 'Aseguradora',
                d.policy_number,
                task.dueDate,
                task.amount
            )
        }

        const link = generateWhatsAppLink(task.phone, message)
        window.open(link, '_blank')
    }

    return (
        <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Tareas Críticas</h3>
                        <p className="text-sm text-slate-400">Acciones que requieren tu atención inmediata</p>
                    </div>
                </div>
                {!loading && (
                    <button
                        onClick={fetchCriticalTasks}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                    >
                        <RefreshCw className="w-5 h-5 text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                        <p className="text-slate-500 text-sm">Escaneando vencimientos...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ChevronRight className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="text-white font-medium">¡Todo en orden!</p>
                        <p className="text-slate-400 text-sm">No hay cobranza ni renovaciones pendientes hoy.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence>
                            {tasks.map((task, idx) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group relative flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-3 rounded-xl ${task.type === 'payment' ? 'bg-rose-500/20' : 'bg-blue-500/20'}`}>
                                            {task.type === 'payment' ? (
                                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                                            ) : (
                                                <Clock className="w-5 h-5 text-blue-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                                                {task.title}
                                            </h4>
                                            <p className="text-xs text-slate-400">
                                                {task.subtitle} • <span className="text-amber-500/80 font-medium">Vence: {task.dueDate}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {task.amount && (
                                            <div className="hidden sm:block text-right mr-4">
                                                <p className="text-sm font-bold text-white">${task.amount.toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total</p>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleSendWhatsApp(task)}
                                            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            <span className="hidden lg:inline">Avisar</span>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Footer / Stats */}
            {!loading && tasks.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-xs text-slate-500 italic">
                        * Sugerencia: Envía los recordatorios antes de las 11:00 AM para mayor efectividad.
                    </p>
                    <span className="px-2 py-1 bg-white/5 text-[10px] font-bold text-slate-400 rounded-md">
                        {tasks.length} CRÍTICOS
                    </span>
                </div>
            )}
        </div>
    )
}
