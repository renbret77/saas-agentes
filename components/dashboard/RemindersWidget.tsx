"use client"

import { useState, useEffect } from "react"
import { Bell, BellRing, Calendar, CheckCircle2, ChevronRight, Loader2, Send, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export default function RemindersWidget() {
    const [pendingReminders, setPendingReminders] = useState<{ payments: number, renewals: number }>({ payments: 0, renewals: 0 })
    const [loading, setLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [status, setStatus] = useState<string | null>(null)

    useEffect(() => {
        fetchPendingCounts()
    }, [])

    const fetchPendingCounts = async () => {
        try {
            setLoading(true)
            const threeDaysFromNow = new Date()
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
            
            const thirtyDaysFromNow = new Date()
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

            const today = new Date().toISOString().split('T')[0]

            // Count pending payments
            const { count: paymentsCount } = await supabase
                .from('policy_installments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Pending')
                .gte('due_date', today)
                .lte('due_date', threeDaysFromNow.toISOString().split('T')[0])

            // Count pending renewals
            const { count: renewalsCount } = await supabase
                .from('policies')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Vigente')
                .gte('end_date', today)
                .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0])

            setPendingReminders({
                payments: paymentsCount || 0,
                renewals: renewalsCount || 0
            })
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSendReminders = async () => {
        if (isProcessing) return
        try {
            setIsProcessing(true)
            setStatus("Buscando recordatorios...")
            
            const { data: { user } } = await supabase.auth.getUser()
            const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user?.id).single()
            
            if (!profile?.agency_id) throw new Error("Agency not found")

            setStatus("Enviando vía WhatsApp...")
            const res = await fetch('/api/reminders/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agencyId: profile.agency_id })
            })

            const data = await res.json()
            if (data.success) {
                setStatus(`¡Éxito! Enviados: ${data.results.payments_sent + data.results.renewals_sent}`)
                setTimeout(() => setStatus(null), 5000)
                fetchPendingCounts()
            } else {
                throw new Error(data.error)
            }
        } catch (error: any) {
            console.error(error)
            setStatus("Error: " + error.message)
            setTimeout(() => setStatus(null), 5000)
        } finally {
            setIsProcessing(false)
        }
    }

    const total = pendingReminders.payments + pendingReminders.renewals

    return (
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <BellRing className="w-24 h-24 text-indigo-600" />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Recordatorios IA
                        {total > 0 && (
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                        )}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Automatización Proactiva</p>
                </div>
                <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-indigo-600" />
                </div>
            </div>

            <div className="space-y-6 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pagos (3d)</p>
                        <p className="text-2xl font-black text-slate-900">{loading ? "..." : pendingReminders.payments}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Renov. (30d)</p>
                        <p className="text-2xl font-black text-slate-900">{loading ? "..." : pendingReminders.renewals}</p>
                    </div>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                            <Send className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-700">Procesar WhatsApp</p>
                            <p className="text-[10px] text-slate-500">Envío masivo con IA</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSendReminders}
                        disabled={isProcessing || total === 0}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                            isProcessing || total === 0
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                        )}
                    >
                        {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <>Disparar <ChevronRight className="w-3 h-3" /></>
                        )}
                    </button>
                </div>

                <AnimatePresence>
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-center"
                        >
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50 py-1 rounded-lg">
                                {status}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="text-[10px] text-slate-400 text-center italic">
                    * Los recordatorios se envían usando las plantillas Premium configuradas.
                </p>
            </div>
        </div>
    )
}
