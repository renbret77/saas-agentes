"use client"

import { useEffect, useState } from "react"
import { ShieldAlert, Clock, ChevronRight, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { motion } from "framer-motion"

export default function ClaimsTrackingWidget() {
    const [recentClaims, setRecentClaims] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRecentClaims = async () => {
            try {
                const { data, error } = await supabase
                    .from('claims')
                    .select(`
                        id,
                        status,
                        report_date,
                        description,
                        claim_type,
                        clients (first_name, last_name)
                    `)
                    .neq('status', 'Cerrado')
                    .order('report_date', { ascending: false })
                    .limit(3)

                if (error) throw error
                setRecentClaims(data || [])
            } catch (err) {
                console.error('Error fetching recent claims:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchRecentClaims()
    }, [])

    return (
        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                    <h3 className="font-bold text-slate-900">Seguimiento de Siniestros</h3>
                </div>
                <Link href="/dashboard/claims" className="text-[10px] font-black uppercase text-rose-600 hover:underline">
                    Ver Todos
                </Link>
            </div>

            <div className="flex-1 p-6 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                        <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                        <p className="text-xs text-slate-400 font-medium italic">Consultando bitácora...</p>
                    </div>
                ) : recentClaims.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">No hay siniestros activos</p>
                    </div>
                ) : (
                    recentClaims.map((claim, idx) => (
                        <motion.div
                            key={claim.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-rose-50/30 rounded-2xl border border-slate-100 group transition-all"
                        >
                            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-rose-500">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-slate-900 truncate">
                                        {claim.clients?.first_name} {claim.clients?.last_name}
                                    </p>
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                        {claim.status}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                    {claim.claim_type} • {claim.description || 'Sin descripción'}
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 transition-colors" />
                        </motion.div>
                    ))
                )}
            </div>

            <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                <Link
                    href="/dashboard/claims"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:border-rose-300 hover:text-rose-600 transition-all shadow-sm"
                >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Reportar Incidente
                </Link>
            </div>
        </div>
    )
}
