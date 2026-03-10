"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    CreditCard, Zap, ShieldCheck, CheckCircle2, Crown,
    Bot, Star, Sparkles, AlertCircle, ArrowRight
} from "lucide-react"
import { supabase } from "@/lib/supabase"
// Assuming we'll create a checkout action later
// import { createCheckoutSession } from "./actions"

export default function BillingPage() {
    const [loading, setLoading] = useState(true)
    const [agencyStatus, setAgencyStatus] = useState({
        license: 'free',
        credits: 0,
        addons: [] as string[]
    })

    // Switch between Monthly / Yearly pricing
    const [isYearly, setIsYearly] = useState(false)

    useEffect(() => {
        const fetchStatus = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Get the user's agency ID
            const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', session.user.id).single()
            if (!profile?.agency_id) return setLoading(false)

            // Get Agency Details
            const { data: agency } = await supabase.from('agencies').select('license_type').eq('id', profile.agency_id).single()

            // Note: credits and addons fetching will go here once the tables have mock data

            setAgencyStatus({
                license: agency?.license_type || 'free',
                credits: 10, // Mock for now
                addons: []
            })
            setLoading(false)
        }
        fetchStatus()
    }, [])

    const handleCheckout = async (priceId: string, type: 'subscription' | 'credits' | 'addon') => {
        alert("Integración con Stripe en progreso. PriceID: " + priceId)
        // const res = await createCheckoutSession(priceId, type)
        // if (res.url) window.location.href = res.url
    }

    if (loading) {
        return <div className="p-10 text-center text-slate-500 animate-pulse">Cargando tu plan actual...</div>
    }

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
                    <CreditCard className="w-8 h-8 text-indigo-600" /> Mi Suscripción
                </h1>
                <p className="text-slate-500 mt-2 text-lg">Administra tus licencias, créditos de IA y métodos de pago.</p>
            </div>

            {/* Current Plan Mini-Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Plan Actual</p>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${agencyStatus.license === 'free' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            {agencyStatus.license === 'free' ? <ShieldCheck className="w-6 h-6" /> : <Crown className="w-6 h-6" />}
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 capitalize tracking-tight">
                            Licencia {agencyStatus.license}
                        </h2>
                    </div>
                </div>

                <div className="bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Créditos de IA</p>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            {agencyStatus.credits} Disponibles
                        </h2>
                    </div>
                </div>

                <button className="bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors rounded-3xl p-6 shadow-xl flex items-center justify-between text-left group">
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Método de Pago
                        </p>
                        <h2 className="text-xl font-bold text-white mt-1">Visa terminada en ****</h2>
                    </div>
                    <ArrowRight className="text-slate-500 group-hover:text-white transition-colors" />
                </button>
            </div>

            {/* MAIN PRICING */}
            <div className="pt-8">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Expande tu Billetera 🚀</h3>
                        <p className="text-slate-500">Sin plazos forzosos. Cancela cuando quieras.</p>
                    </div>

                    {/* Billing Toggle */}
                    <div className="bg-slate-200/50 p-1.5 rounded-2xl flex items-center border border-slate-200">
                        <button
                            onClick={() => setIsYearly(false)}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${!isYearly ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${isYearly ? 'bg-slate-900 shadow-md text-white' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Anual <span className={`${isYearly ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'} text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest`}>-20%</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* PRO TIER */}
                    <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 shadow-xl relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                            <Crown className="w-64 h-64 -rotate-12 -mr-10 -mt-20" />
                        </div>
                        <div className="relative z-10 flex-1">
                            <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-700 font-black text-sm uppercase tracking-widest rounded-full border border-indigo-100 mb-6">
                                Licencia PRO
                            </div>
                            <h4 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">
                                ${isYearly ? '304' : '380'} <span className="text-lg text-slate-400 font-medium tracking-normal">MXN/mes</span>
                            </h4>
                            <p className="text-slate-500 font-medium mb-8">El estándar indispensable para Agentes que quieren crecer su cartera sin topar.</p>

                            <ul className="space-y-4 mb-10">
                                <li className="flex items-start gap-3 text-slate-700 font-medium">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> <span className="pt-0.5">Clientes y Pólizas <strong>Ilimitadas</strong>.</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-700 font-medium">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> <span className="pt-0.5">Hasta 10 asistentes (Sub-cuentas) conectables.</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-700 font-medium">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> <span className="pt-0.5">Desbloqueo de <strong>Reportes de IA y Venta Cruzada</strong>.</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-700 font-medium whitespace-nowrap">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> <span className="pt-0.5">Sin límites de dispositivos físicos.</span>
                                </li>
                            </ul>
                        </div>
                        <button
                            onClick={() => handleCheckout('price_pro_id', 'subscription')}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 ${agencyStatus.license === 'pro' ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25'}`}
                        >
                            {agencyStatus.license === 'pro' ? 'Plan Actual' : 'Hacer Upgrade a PRO'}
                        </button>
                    </div>

                    {/* ADD-ONS SECTION */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
                                <Bot className="w-48 h-48 rotate-12 -mr-10 -mt-10 text-emerald-400" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-emerald-400 mb-6">
                                    <Zap className="w-5 h-5" />
                                    <span className="font-bold text-sm tracking-widest uppercase">Módulos Extra (Add-ons)</span>
                                </div>
                                <h4 className="text-3xl font-black text-white tracking-tight mb-2">Automatización Total 🤖</h4>
                                <p className="text-slate-400 font-medium mb-8 leading-relaxed">Potencia tu licencia base agregando los módulos que tu negocio realmente necesita. Cobraremos el extra a tu mensualidad.</p>

                                {/* Module 1 */}
                                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between mb-4 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                                            <MessageSquare className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h5 className="text-white font-bold">Bot "Capataz" en WhatsApp</h5>
                                            <p className="text-sm text-emerald-400 font-bold">+$150 MXN/mes</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleCheckout('price_addon_bot', 'addon')} className="px-4 py-2 bg-white text-slate-900 font-bold rounded-lg text-sm hover:scale-105 transition-transform active:scale-95">
                                        Activar
                                    </button>
                                </div>

                                {/* Module 2 */}
                                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h5 className="text-white font-bold">Paquete 50 Créditos IA</h5>
                                            <p className="text-sm text-amber-400 font-bold">Pago Único $199 MXN</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleCheckout('price_credits_50', 'credits')} className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black rounded-lg text-sm hover:scale-105 shadow-lg shadow-amber-500/20 transition-all active:scale-95">
                                        Comprar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning Note */}
            <div className="mt-12 p-6 bg-slate-100 rounded-2xl border border-slate-200 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Los pagos son procesados de forma ultra segura a través de la infraestructura bancaria internacional de Stripe. La plataforma no almacena números de tarjeta. Todas las facturas son deducibles al 100%. Las compras de Paquetes de Créditos son pago único y no caducan.
                </p>
            </div>

        </div>
    )
}
