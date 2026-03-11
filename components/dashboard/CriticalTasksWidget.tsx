"use client"

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    AlertTriangle,
    Clock,
    MessageSquare,
    RefreshCw,
    ChevronRight,
    Mail,
    Send,
    BadgeCheck
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
    email: string
    clientId: string
    policyId: string
    installmentId?: string
    policyData: any
    lastNotified?: {
        channel: string
        at: string
    }
}

export default function CriticalTasksWidget() {
    const [selectedTask, setSelectedTask] = useState<CriticalTask | null>(null)
    const [previewMessage, setPreviewMessage] = useState('')

    useEffect(() => {
        fetchCriticalTasks()
    }, [])

    // ... (keep fetchCriticalTasks, logNotification, getMessage as they are but I'll need to wrap them and use preview)

    const handleOpenPreview = (task: CriticalTask) => {
        const message = getMessage(task)
        setPreviewMessage(message)
        setSelectedTask(task)
    }

    const handleConfirmSend = (channel: 'whatsapp' | 'email' | 'telegram') => {
        if (!selectedTask) return

        if (channel === 'whatsapp') {
            const link = generateWhatsAppLink(selectedTask.phone, previewMessage)
            window.open(link, '_blank')
        } else if (channel === 'email') {
            const subject = selectedTask.type === 'payment' ? 'Recordatorio de Pago' : 'Aviso de Renovación'
            const mailto = `mailto:${selectedTask.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(previewMessage)}`
            window.location.href = mailto
        } else if (channel === 'telegram') {
            const link = `https://t.me/share/url?url=${encodeURIComponent('RB Proyectos')}&text=${encodeURIComponent(previewMessage)}`
            window.open(link, '_blank')
        }

        logNotification(selectedTask, channel)
        setSelectedTask(null)
    }

    return (
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-md border border-slate-100 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-amber-100 rounded-2xl">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Tareas Críticas</h3>
                        <p className="text-sm font-medium text-slate-500">Acciones que requieren tu atención inmediata</p>
                    </div>
                </div>
                {!loading && (
                    <button
                        onClick={fetchCriticalTasks}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
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
                        <p className="text-slate-500 text-sm font-medium">Escaneando vencimientos...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                            <ChevronRight className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="text-slate-900 font-bold">¡Todo en orden!</p>
                        <p className="text-slate-500 text-sm">No hay cobranza ni renovaciones pendientes hoy.</p>
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
                                    className="group relative flex items-center justify-between p-5 bg-slate-50/50 hover:bg-white border border-slate-100 rounded-[2rem] transition-all hover:shadow-xl hover:shadow-slate-200/50"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-4 rounded-2xl ${task.type === 'payment' ? 'bg-rose-100' : 'bg-blue-100'}`}>
                                            {task.type === 'payment' ? (
                                                <AlertTriangle className="w-5 h-5 text-rose-600" />
                                            ) : (
                                                <Clock className="w-5 h-5 text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                                                {task.title}
                                            </h4>
                                            <p className="text-sm font-medium text-slate-500">
                                                {task.subtitle} • <span className="text-amber-600 font-bold whitespace-nowrap">Vence: {task.dueDate}</span>
                                            </p>
                                            {task.lastNotified && (
                                                <p className="text-[10px] text-emerald-600 font-black uppercase mt-1.5 flex items-center gap-1">
                                                    <BadgeCheck className="w-3 h-3" /> Avisado por {task.lastNotified.channel} ({new Date(task.lastNotified.at).toLocaleDateString()})
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {typeof task.amount === 'number' && (
                                            <div className="hidden md:block text-right mr-4">
                                                <p className="text-lg font-black text-slate-900">${task.amount.toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Importe</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleOpenPreview(task)}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                        >
                                            <Send className="w-3.5 h-3.5" /> Gestionar
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Preview & Edit Modal */}
            <AnimatePresence>
                {selectedTask && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTask(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
                        >
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Vista Previa del Mensaje</h3>
                                        <p className="text-sm font-medium text-slate-500">Revisa y edita antes de enviar</p>
                                    </div>
                                </div>

                                <textarea
                                    value={previewMessage}
                                    onChange={(e) => setPreviewMessage(e.target.value)}
                                    className="w-full h-64 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                />

                                <div className="grid grid-cols-3 gap-3 mt-8">
                                    <button
                                        onClick={() => handleConfirmSend('whatsapp')}
                                        className="flex flex-col items-center gap-2 p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 transition-all active:scale-95"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase">WhatsApp</span>
                                    </button>
                                    <button
                                        onClick={() => handleConfirmSend('email')}
                                        className="flex flex-col items-center gap-2 p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all active:scale-95"
                                    >
                                        <Mail className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase">Email</span>
                                    </button>
                                    <button
                                        onClick={() => handleConfirmSend('telegram')}
                                        className="flex flex-col items-center gap-2 p-4 bg-sky-500 text-white rounded-2xl hover:bg-sky-400 transition-all active:scale-95"
                                    >
                                        <Send className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase">Telegram</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Footer / Stats */}
            {!loading && tasks.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-400 italic">
                        * Sugerencia: Envía los recordatorios antes de las 11:00 AM para mayor efectividad.
                    </p>
                    <span className="px-3 py-1 bg-rose-50 text-[10px] font-black text-rose-600 rounded-full border border-rose-100">
                        {tasks.length} CRÍTICOS
                    </span>
                </div>
            )}
        </div>
    )
}
