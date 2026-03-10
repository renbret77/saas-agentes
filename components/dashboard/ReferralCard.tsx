"use client"

import { useState, useEffect } from "react"
import { Gift, Copy, Check, Users, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"

export function ReferralCard() {
    const [referralCode, setReferralCode] = useState("")
    const [copied, setCopied] = useState(false)
    const [stats, setStats] = useState({ count: 0, creditsEarned: 0 })

    useEffect(() => {
        fetchReferralData()
    }, [])

    const fetchReferralData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('agent_settings')
            .select('referral_code, referral_count')
            .eq('user_id', user.id)
            .single()

        if (data) {
            setReferralCode((data as any).referral_code)
            setStats({
                count: (data as any).referral_count || 0,
                creditsEarned: ((data as any).referral_count || 0) * 50
            })
        }
    }

    const copyToClipboard = () => {
        const url = `${window.location.origin}/register?ref=${referralCode}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-100 mb-10">
            <div className="relative z-10">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <Gift className="w-3 h-3" /> Programa de Referidos
                        </div>
                        <h2 className="text-3xl font-black leading-tight">Recomienda y Gana <br /> <span className="text-emerald-200">50 Créditos Gratis</span></h2>
                        <p className="text-emerald-50/80 text-sm max-w-sm">
                            Comparte tu enlace único con otros agentes. Cuando se registren, tú ganas 50 créditos y ellos reciben 20 de bienvenida. ¡Todos ganan!
                        </p>
                    </div>

                    <div className="w-full md:w-auto space-y-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl space-y-4">
                            <div className="flex items-center justify-between gap-8">
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Colegas Invitados</p>
                                    <p className="text-2xl font-black">{stats.count}</p>
                                </div>
                                <div className="h-10 w-px bg-white/10" />
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Premios Ganados</p>
                                    <p className="text-2xl font-black text-amber-400">{stats.creditsEarned} <span className="text-xs">Créditos</span></p>
                                </div>
                            </div>

                            <div className="bg-emerald-900/20 rounded-2xl p-3 border border-emerald-400/10">
                                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                    <Sparkles className="w-3 h-3" /> Bono de Lealtad Mensual
                                </p>
                                <p className="text-sm font-medium">
                                    Recibirás <span className="text-amber-400 font-black">{stats.count * 10} créditos</span> extra cada mes mientras tus colegas sigan activos.
                                </p>
                            </div>

                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-emerald-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                <button
                                    onClick={copyToClipboard}
                                    className="relative w-full bg-white text-emerald-900 py-4 px-6 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-5 h-5 text-emerald-600" /> ¡Enlace Copiado!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-5 h-5" /> Copiar Enlace de Invitado
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-400/20 blur-[60px] rounded-full" />
        </div>
    )
}
