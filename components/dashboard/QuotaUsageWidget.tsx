"use client"

import { useState, useEffect } from "react"
import { checkQuota, QuotaStatus } from "@/lib/quotas"
import { supabase } from "@/lib/supabase"
import { Shield, Users, FileText, ArrowUpRight, Lock } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export default function QuotaUsageWidget() {
    const [clientsQuota, setClientsQuota] = useState<QuotaStatus | null>(null)
    const [policiesQuota, setPoliciesQuota] = useState<QuotaStatus | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadQuotas = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const [c, p] = await Promise.all([
                checkQuota(user.id, 'max_clients'),
                checkQuota(user.id, 'max_policies')
            ])

            setClientsQuota(c)
            setPoliciesQuota(p)
            setLoading(false)
        }
        loadQuotas()
    }, [])

    if (loading) return (
        <div className="h-40 bg-white/50 animate-pulse rounded-[2rem] border border-slate-100" />
    )

    const QuotaItem = ({ quota, icon: Icon, label, color }: { quota: QuotaStatus | null, icon: any, label: string, color: string }) => {
        if (!quota) return null
        const percentage = Math.min((quota.current / quota.limit) * 100, 100)
        const isCritical = percentage > 85

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                            <p className="text-sm font-bold text-slate-900">{quota.current} <span className="text-slate-400 font-medium">/ {quota.limit}</span></p>
                        </div>
                    </div>
                    {isCritical && (
                        <div className="px-2 py-0.5 bg-rose-50 border border-rose-100 rounded-full flex items-center gap-1">
                            <Lock className="w-3 h-3 text-rose-500" />
                            <span className="text-[8px] font-black text-rose-600 uppercase">Límite Próximo</span>
                        </div>
                    )}
                </div>
                
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                            "h-full rounded-full",
                            isCritical ? "bg-rose-500" : "bg-emerald-500"
                        )}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Mi Plan
                        <Shield className="w-4 h-4 text-emerald-500" />
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Estatus de Capacidad</p>
                </div>
                <button className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors flex items-center gap-1 group/btn">
                    Upgrade <ArrowUpRight className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </button>
            </div>

            <div className="space-y-8">
                <QuotaItem 
                    quota={clientsQuota} 
                    icon={Users} 
                    label="Clientes en Cartera" 
                    color="bg-blue-50 text-blue-600"
                />
                <QuotaItem 
                    quota={policiesQuota} 
                    icon={FileText} 
                    label="Pólizas Activas" 
                    color="bg-purple-50 text-purple-600"
                />
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50">
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Usa los módulos de crecimiento para expandir tus límites y desbloquear nuevas herramientas de IA.
                </p>
            </div>
        </div>
    )
}
