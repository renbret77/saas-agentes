"use client"

import { motion, AnimatePresence } from "framer-motion"
import { 
    Car, 
    ArrowUpRight, 
    Sparkles, 
    Zap,
    ExternalLink,
    Send,
    Loader2,
    Shield,
    BarChart3,
    CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function SuperQuotePreview() {
    const [phone, setPhone] = useState("")
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    
    // RPA Simulation State
    const [rpaStatus, setRpaStatus] = useState<null | 'idle' | 'running' | 'completed'>(null)
    const [rpaStep, setRpaStep] = useState(0)
    const [quoteData, setQuoteData] = useState<any>(null)

    const steps = [
        "Iniciando Motor Stealth...",
        "Bypass de Seguridad Quálitas...",
        "Extrayendo Valor Comercial...",
        "Extrayendo Valor Convenido...",
        "Generando Comparativo IA..."
    ]

    const startRPASimulation = () => {
        setRpaStatus('running')
        setRpaStep(0)
    }

    useEffect(() => {
        if (rpaStatus === 'running' && rpaStep < steps.length) {
            const timer = setTimeout(() => {
                setRpaStep(prev => prev + 1)
            }, 1500)
            return () => clearTimeout(timer)
        } else if (rpaStep === steps.length) {
            setRpaStatus('completed')
            setQuoteData({
                comercial: 12450.50,
                convenido: 14200.00,
                ahorro_potencial: 1749.50
            })
        }
    }, [rpaStatus, rpaStep])

    const sendProposal = async () => {
        if (!phone) {
            alert("Por favor ingresa un número de teléfono.")
            return
        }

        setSending(true)
        try {
            const response = await fetch("/api/whatsapp/send-proposal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phoneNumber: phone,
                    clientName: "Rene Breton",
                    vehicleName: "BMW X5 2024",
                    proposalUrl: `${window.location.origin}/quote/presentation/auto-demo`,
                    type: "auto"
                })
            })

            const data = await response.json()
            if (data.success) {
                setSent(true)
                setPhone("")
                setTimeout(() => setSent(false), 3000)
            } else {
                alert(`Error: ${data.error}`)
            }
        } catch (error) {
            console.error(error)
            alert("Ocurrió un error al enviar la propuesta.")
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[3rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-indigo-900/40">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[60px] -mr-24 -mt-24 group-hover:bg-white/20 transition-all duration-700" />
            
            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
                            <Car className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight">Super Cotizador</h3>
                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">RPA Auto Elite v3.0</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[9px] font-black border border-white/10">
                        <Shield className="w-3 h-3 text-emerald-400" /> STEALTH MODE
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {!rpaStatus || rpaStatus === 'idle' ? (
                        <motion.div 
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <p className="text-sm font-medium text-indigo-100 leading-relaxed italic">
                                "Obtén precios de Quálitas en tiempo real comparando Comercial vs Convenido con nuestro motor Stealth."
                            </p>
                            <button 
                                onClick={startRPASimulation}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                            >
                                <Zap className="w-4 h-4" /> INICIAR COTIZACIÓN RPA
                            </button>
                        </motion.div>
                    ) : rpaStatus === 'running' ? (
                        <motion.div 
                            key="running"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Procesando RPA Engine</span>
                                <span className="text-[10px] font-black text-emerald-400">{Math.round((rpaStep / steps.length) * 100)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-emerald-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(rpaStep / steps.length) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs font-bold text-center animate-pulse">{steps[rpaStep] || "Finalizando..."}</p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="completed"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/5 rounded-2xl p-6 border border-emerald-500/30 space-y-4"
                        >
                            <div className="flex items-center justify-between text-emerald-400 mb-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Resultado Exitoso</span>
                                </div>
                                <button onClick={() => setRpaStatus(null)} className="text-[8px] font-black border border-white/20 px-2 py-1 rounded-md hover:bg-white/10">NUEVA</button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                    <p className="text-[8px] font-black text-indigo-300 uppercase mb-1">Comercial</p>
                                    <p className="text-sm font-black">${quoteData?.comercial.toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                    <p className="text-[8px] font-black text-emerald-400 uppercase mb-1">Convenido ✨</p>
                                    <p className="text-sm font-black">${quoteData?.convenido.toLocaleString()}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-4 border-t border-white/10 pt-6">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Envío de Propuesta v3.0</p>
                    <div className="relative group/input">
                        <input 
                            type="text" 
                            placeholder="WhatsApp del Cliente" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-xs font-bold placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                        <button 
                            onClick={sendProposal}
                            disabled={sending || sent}
                            className={`absolute right-2 top-2 p-2 rounded-xl transition-all ${sent ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-900 hover:bg-emerald-500 hover:text-white'}`}
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : (sent ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />)}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Link 
                        href="/quote/presentation/auto-demo" 
                        target="_blank"
                        className="bg-white/10 p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-white/20 transition-all group/info"
                    >
                        <ExternalLink className="w-4 h-4 text-indigo-300 group-hover/info:scale-110 transition-transform" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Ver Landing</span>
                    </Link>
                    <div className="bg-indigo-500/20 p-4 rounded-2xl border border-indigo-500/30 flex flex-col items-center justify-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-300" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-indigo-300 text-center">Analytics Hub</span>
                    </div>
                </div>
            </div>

            <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap className="w-48 h-48" />
            </div>
        </div>
    )
}
