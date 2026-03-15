"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Car, 
    ShieldCheck, 
    Zap, 
    CheckCircle2, 
    ArrowRight, 
    Star, 
    ShieldAlert, 
    Clock, 
    Building2,
    Check,
    ChevronDown,
    MapPin,
    AlertTriangle,
    Plus,
    X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Coverage {
    id: string
    name: string
    description: string
    price: number
    selected: boolean
    isExtra: boolean
}

import { QuoteEngine } from "@/lib/quote-engine"

export default function InteractiveQuotePage() {
    const quoteData = QuoteEngine.getMockQuote()
    const [totalPremium, setTotalPremium] = useState(0)
    const [timeLeft, setTimeLeft] = useState(7200) // 2 horas de urgencia
    const [coverages, setCoverages] = useState<Coverage[]>(
        QuoteEngine.getFullQuoteCoverages().map(c => ({
            id: c.id,
            name: c.name,
            description: c.standard ? 'Cobertura Básica Incluida' : 'Mejora tu protección',
            price: c.premium,
            selected: c.standard,
            isExtra: !c.standard
        }))
    )

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => prev > 0 ? prev - 1 : 0)
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    useEffect(() => {
        const activeCoverages = coverages
            .filter(c => c.selected)
            .map(c => ({ id: c.id, premium: c.price }))

        const invoice = QuoteEngine.calculateFullInvoice(
            activeCoverages,
            quoteData.discount,
            'contado'
        )
        
        setTotalPremium(Math.round(invoice.total))
    }, [coverages, quoteData.discount])

    const toggleCoverage = (id: string) => {
        setCoverages(curr => curr.map(c => 
            c.id === id ? { ...c, selected: !c.selected } : c
        ))
    }

    const basePremium = coverages
        .filter(c => !c.isExtra)
        .reduce((sum, c) => sum + c.price, 0)

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 pb-20">
            {/* URGENCY BANNER */}
            <div className="bg-rose-600 text-white py-2 px-6 text-center overflow-hidden relative border-b border-rose-500">
                <motion.div 
                    animate={{ x: [0, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em]"
                >
                    <Zap className="w-3 h-3 fill-current animate-pulse" />
                    ¡OFERTA EXCLUSIVA! EL DESCUENTO DEL {quoteData.discount}% VENCE EN: {formatTime(timeLeft)}
                </motion.div>
            </div>

            {/* Premium Header */}
            <div className="bg-slate-950 text-white py-16 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[120px] -ml-64 -mb-64" />
                
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-12 relative z-10">
                    <div className="space-y-6 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-md">
                                ESTATUS ELITE QUALITAS
                            </div>
                            <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-md flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3" /> AGENTE CERTIFICADO RENE BRETON
                            </div>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] uppercase italic">
                            PROTECCIÓN <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-indigo-500">
                                SIN LÍMITES
                            </span>
                        </h1>
                        
                        <div className="space-y-2">
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">Preparado especialmente para:</p>
                            <h2 className="text-3xl font-black text-white">{quoteData.vehicleName}</h2>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
                                <Car className="w-6 h-6 text-indigo-400" />
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Modelo</p>
                                    <p className="text-sm font-black text-white">{quoteData.modelYear}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-emerald-500/10 p-4 rounded-3xl border border-emerald-500/20 backdrop-blur-md">
                                <Star className="w-6 h-6 text-emerald-400" />
                                <div>
                                    <p className="text-[9px] font-black text-emerald-400/50 uppercase tracking-widest">Garantía</p>
                                    <p className="text-sm font-black text-emerald-400">VALOR CONVENIDO</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 p-10 rounded-[4rem] shadow-2xl relative z-10 border-t-white/30"
                        >
                            <p className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.4em] mb-4 text-center">Inversión Final Hoy</p>
                            <div className="flex items-start justify-center">
                                <span className="text-2xl font-black text-white/50 mt-2">$</span>
                                <motion.span 
                                    className="text-7xl md:text-8xl font-black tracking-tighter text-white"
                                >
                                    {totalPremium.toLocaleString()}
                                </motion.span>
                            </div>
                            <div className="mt-6 space-y-3">
                                <div className="flex items-center justify-center gap-2 px-6 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                                    <Check className="w-4 h-4" /> AHORRA ${(totalPremium * (quoteData.discount/100)).toLocaleString()} SOLO HOY
                                </div>
                                <p className="text-[10px] text-center text-slate-400 font-medium">Incluye Gastos de Expedición e IVA (16%)</p>
                            </div>
                        </motion.div>
                        {/* Shadow decoration */}
                        <div className="absolute inset-x-8 -bottom-8 h-8 bg-indigo-600/40 blur-2xl rounded-full" />
                    </div>
                </div>
            </div>

            {/* Comparison Bar & Financial Gap Alert */}
            <div className="max-w-6xl mx-auto -mt-16 px-6 relative z-20 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-white p-8 rounded-[3rem] shadow-2xl border-l-[12px] border-l-indigo-600 border border-slate-100 flex items-center justify-between group transition-all"
                    >
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tu Patrimonio Protegido</p>
                            <h4 className="text-3xl font-black text-indigo-950">${quoteData.valorConvenido.toLocaleString()}</h4>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-black rounded-full uppercase">100% GARANTIZADO</span>
                                <span className="text-[10px] text-slate-400 font-bold italic">Valor Convenido</span>
                            </div>
                        </div>
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center shadow-inner">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                    </motion.div>

                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex items-center justify-between group opacity-80"
                    >
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Riesgo de Mercado</p>
                            <h4 className="text-3xl font-black text-slate-400">${quoteData.valorComercial.toLocaleString()}</h4>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[9px] font-black rounded-full uppercase">DEPRA CIACIÓN MENSUAL</span>
                                <span className="text-[10px] text-slate-400 font-bold italic">Libro Azul</span>
                            </div>
                        </div>
                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10" />
                        </div>
                    </motion.div>
                </div>

                {/* CRITICAL GAP BARS */}
                <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                        <Building2 className="w-64 h-64 text-slate-900" />
                    </div>
                    
                    <div className="relative z-10 space-y-10">
                        <div className="flex flex-col md:flex-row items-center gap-10 justify-between">
                            <div className="space-y-3 text-center md:text-left">
                                <h3 className="text-3xl font-black tracking-tight uppercase leading-none">
                                    ¿Cuánto dinero <br /> <span className="text-rose-600">perderías</span> con otros?
                                </h3>
                                <p className="text-slate-500 font-medium max-w-md">
                                    En caso de pérdida total, la competencia te pagará menos cada mes. Con Rene Breton, tu valor está congelado y garantizado.
                                </p>
                            </div>
                            <div className="bg-rose-600 text-white px-10 py-6 rounded-[2.5rem] shadow-2xl shadow-rose-900/20 text-center relative overflow-hidden group">
                                <motion.div 
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="relative z-10"
                                >
                                    <p className="text-[10px] font-black text-rose-200 uppercase tracking-[0.3em] mb-1">Pérdida Directa Potencial</p>
                                    <p className="text-4xl font-black tracking-tighter">${(quoteData.valorConvenido - quoteData.valorComercial).toLocaleString()}</p>
                                </motion.div>
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                            </div>
                        </div>

                        <div className="space-y-12">
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg">
                                            <Check className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-widest text-indigo-700">Qualitas (Valor Convenido)</span>
                                    </div>
                                    <span className="text-sm font-black text-indigo-900">RECUPERAS EL 100%</span>
                                </div>
                                <div className="h-4 w-full bg-slate-100 rounded-full p-1 border border-slate-200">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-indigo-600 rounded-full shadow-lg shadow-indigo-200"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-200 text-slate-500 rounded-lg flex items-center justify-center">
                                            <X className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-widest text-slate-400">Competencia (Valor Comercial)</span>
                                    </div>
                                    <span className="text-sm font-black text-rose-500">
                                        PIERDES EL {Math.round((1 - (quoteData.valorComercial / quoteData.valorConvenido)) * 100)}%
                                    </span>
                                </div>
                                <div className="h-4 w-full bg-slate-100 rounded-full p-1 border border-slate-200">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(quoteData.valorComercial / quoteData.valorConvenido) * 100}%` }}
                                        transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                                        className="h-full bg-slate-300 rounded-full relative"
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-300 rounded-full" />
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MARKET BATTLEGROUND */}
                <div className="space-y-8">
                    <div className="text-center space-y-2">
                        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.5em]">Comparativa en Tiempo Real</h3>
                        <p className="text-3xl font-black uppercase tracking-tight">Otras Ofertas vs. Descuento Elite</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {QuoteEngine.getComparisonData().map((other, idx) => (
                            <motion.div 
                                key={idx}
                                whileHover={{ scale: 1.02 }}
                                className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl flex flex-col relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 px-4 py-1.5 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-2xl">
                                    -{other.discount}% HOY
                                </div>
                                
                                <h4 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-50 pb-4">{other.name}</h4>
                                
                                <div className="space-y-1 mb-8">
                                    <p className="text-[10px] font-black text-slate-400 line-through tracking-widest">${other.normal.toLocaleString()}</p>
                                    <p className="text-4xl font-black tracking-tighter text-slate-700">${other.total.toLocaleString()}</p>
                                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mt-2 italic">Valor {other.value}</p>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Soporte Técnico Incluido:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {other.standardCoverages.map(cov => (
                                            <span key={cov} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[8px] font-black text-slate-500 uppercase">
                                                {cov}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-auto px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl text-[9px] font-black uppercase text-center border border-slate-100">
                                    PROTECCIÓN ESTÁNDAR
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="bg-indigo-900 text-white p-6 rounded-3xl flex items-center justify-between gap-6 border-4 border-indigo-700">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                <Zap className="w-6 h-6 text-indigo-400" />
                            </div>
                            <p className="text-sm font-bold">
                                <span className="text-indigo-300 uppercase text-[10px] block font-black mb-1">Diferencia de Agente</span>
                                Rene Breton aplica el **Descuento Máximo del {quoteData.discount}%** directamente para tu beneficio.
                            </p>
                        </div>
                        <div className="hidden md:block text-right">
                            <p className="text-[10px] font-black uppercase opacity-50 mb-1">Status Oferta</p>
                            <p className="text-xs font-black uppercase tracking-widest animate-pulse text-emerald-400">✓ ACTIVA Y DISPONIBLE</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* PERSUASIVE MARKETING SECTIONS */}
            <div className="max-w-6xl mx-auto mt-32 px-6 space-y-32">
                {/* REPARACION EN AGENCIA */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        className="space-y-8"
                    >
                        <div className="w-16 h-16 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                            <Star className="w-8 h-8 fill-current" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none uppercase italic">
                            ¿AMAS TU AUTO? <br />
                            <span className="text-indigo-600">REPARACIÓN ELITE</span>
                        </h2>
                        <p className="text-slate-500 text-lg font-medium leading-relaxed">
                            Si tu vehículo es premium o simplemente quieres que luzca como nuevo siempre, la <span className="text-slate-900 font-bold">Reparación en Agencia</span> es obligatoria. No arriesgues piezas originales por ahorros mínimos.
                        </p>
                        <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Inversión Individual</p>
                                <p className="text-2xl font-black text-indigo-600">+$1,746.24</p>
                            </div>
                            <button 
                                onClick={() => toggleCoverage('agencia')}
                                className={cn(
                                    "px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                                    coverages.find(c => c.id === 'agencia')?.selected 
                                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                                        : "bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50"
                                )}
                            >
                                {coverages.find(c => c.id === 'agencia')?.selected ? 'QUITAR DE MI PAQUETE' : 'AGREGAR AHORA'}
                            </button>
                        </div>
                    </motion.div>
                    <div className="aspect-[4/5] bg-slate-900 rounded-[4rem] relative overflow-hidden group">
                        <img 
                            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
                            alt="Luxury Car Detail" 
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                        <div className="absolute bottom-12 left-12 right-12 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">Estándar Quálitas</p>
                            <h3 className="text-2xl font-black italic">Solo refacciones nuevas y originales garantizadas por planta.</h3>
                        </div>
                    </div>
                </div>

                {/* ROBO PARCIAL */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="order-2 lg:order-1 aspect-[4/5] bg-slate-900 rounded-[4rem] relative overflow-hidden group">
                        <img 
                            src="https://images.unsplash.com/photo-1562141989-c52496bcd5b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
                            alt="Car Theft Prevention" 
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                        <div className="absolute bottom-12 left-12 right-12 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-400 mb-2">Prevención de Riesgos</p>
                            <h3 className="text-2xl font-black italic">Rines, espejos, computadora... Nada se queda sin protección.</h3>
                        </div>
                    </div>
                    <motion.div 
                        initial={{ x: 20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        className="space-y-8 order-1 lg:order-2"
                    >
                        <div className="w-16 h-16 bg-rose-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-600/30">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none uppercase italic">
                            ¿MIEDO A LOS <br />
                            <span className="text-rose-600">CRISTALAZOS?</span>
                        </h2>
                        <p className="text-slate-500 text-lg font-medium leading-relaxed">
                            No dejes que un robo de autopartes arruine tu día. Con la cobertura de <span className="text-slate-900 font-bold">Robo Parcial</span>, tus accesorios están asegurados. Sal tranquilo sabiendo que Rene Breton te respalda.
                        </p>
                        <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Inversión Individual</p>
                                <p className="text-2xl font-black text-rose-600">+$2,530.19</p>
                            </div>
                            <button 
                                onClick={() => toggleCoverage('rob_p')}
                                className={cn(
                                    "px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                                    coverages.find(c => c.id === 'rob_p')?.selected 
                                        ? "bg-rose-600 text-white shadow-xl shadow-rose-200"
                                        : "bg-white text-rose-600 border border-rose-200 hover:bg-rose-50"
                                )}
                            >
                                {coverages.find(c => c.id === 'rob_p')?.selected ? 'QUITAR DE MI PAQUETE' : 'AGREGAR AHORA'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* AI Sales Video Section */}
            <div className="max-w-6xl mx-auto mt-40 px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center bg-slate-900 p-12 lg:p-20 rounded-[4rem] text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-32 -mt-32" />
                    <div className="space-y-8 relative z-10">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-600/20 rounded-full border border-indigo-500/30">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Mensaje de tu Agente</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase leading-none italic">
                            ¿Por qué Quálitas <br /> es tu <span className="text-indigo-400">mejor aliada</span>?
                        </h2>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                            Rene Breton te explica en este breve video los beneficios exclusivos del sistema de Valor Convenido y cómo garantizamos que recuperes el valor total de tu inversión pase lo que pase.
                        </p>
                        <ul className="space-y-5">
                            {['Pago garantizado sin depreciación', 'Reparación en Agencia certificada', 'Asistencia Vial Élite 24/7'].map((item, i) => (
                                <li key={i} className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-100">
                                    <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-emerald-400">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div> 
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="aspect-video bg-slate-800 rounded-[3rem] shadow-2xl relative group overflow-hidden border-8 border-white/5 relative z-10">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-24 h-24 bg-white text-slate-950 rounded-full flex items-center justify-center shadow-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all border-[10px] border-white/20"
                            >
                                <Zap className="w-10 h-10 fill-current" />
                            </motion.button>
                        </div>
                        <div className="absolute bottom-0 left-0 p-10">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Video de Marketing 2026</p>
                            <h4 className="text-white font-black uppercase italic tracking-tight text-xl">Estrategia de Valor RB Proyectos</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONFIGURADOR TITAN */}
            <div className="max-w-6xl mx-auto mt-40 px-6 grid grid-cols-1 lg:grid-cols-3 gap-16">
                <div className="lg:col-span-2 space-y-12">
                    <section id="configurador">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-4xl font-black uppercase tracking-tight italic">
                                CONFIGURADOR <span className="text-indigo-600">TITÁN</span>
                            </h3>
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Cotejando Con</span>
                                <span className="text-xs font-black text-slate-900">REGLAS DE CÁLCULO 2026</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {coverages.map((c) => (
                                <button 
                                    key={c.id}
                                    onClick={() => c.isExtra && toggleCoverage(c.id)}
                                    className={cn(
                                        "p-8 rounded-[2.5rem] border-2 transition-all text-left relative overflow-hidden group min-h-[160px] flex flex-col",
                                        c.selected 
                                            ? "bg-white border-indigo-600 shadow-2xl shadow-indigo-100" 
                                            : "bg-white border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-300",
                                        !c.isExtra && "cursor-default"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-black text-sm uppercase tracking-tight leading-none max-w-[70%]">{c.name}</h4>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                            c.selected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-200 text-transparent"
                                        )}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                    </div>
                                    
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-6">{c.description}</p>
                                    
                                    {c.isExtra && (
                                        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inversión</span>
                                            <span className="font-black text-indigo-600 text-lg">+${c.price.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {!c.isExtra && (
                                        <div className="mt-auto px-4 py-2 bg-slate-50 rounded-xl text-[8px] font-black text-slate-400 uppercase tracking-widest text-center border border-slate-100">
                                            COBERTURA BASE INCLUIDA
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="bg-gradient-to-br from-indigo-700 to-indigo-900 p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden text-center lg:text-left">
                        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                                </pattern>
                                <rect width="100" height="100" fill="url(#grid)" />
                            </svg>
                        </div>
                        <h3 className="text-3xl font-black mb-6 uppercase italic">Estrategia de Valor Quálitas</h3>
                        <p className="text-indigo-100 text-lg leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0 font-medium">
                            Hemos configurado Quálitas con **Valor Convenido Máximo**. Esto significa que en caso de pérdida total, recibirás el pago del valor acordado hoy, sin importar la depreciación del mercado durante el año.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                            <button className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] bg-white text-indigo-950 px-10 py-5 rounded-2xl hover:bg-slate-50 transition-all shadow-xl">
                                VER DETALLE TÉCNICO <ArrowRight className="w-4 h-4" />
                            </button>
                            <button className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] bg-indigo-500 text-white px-10 py-5 rounded-2xl hover:bg-indigo-400 transition-all border border-indigo-400/30 backdrop-blur-md">
                                DESCARGAR COTIZACIÓN <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl shadow-indigo-900/10 sticky top-12 overflow-hidden">
                        <div className="absolute top-0 right-0 px-8 py-3 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-3xl">
                            ORDEN ELITE #2026-RB
                        </div>
                        
                        <div className="flex items-center gap-4 mb-10 pb-8 border-b border-slate-50 pt-4">
                            <div className="w-14 h-14 bg-slate-950 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
                                <Building2 className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black uppercase tracking-tight text-slate-800 italic">Quálitas Elite</h4>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> AGENTE RENE BRETON
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-10">
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>Configuración Actual</span>
                                <span>Costo</span>
                            </div>
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                        <span className="text-xs font-bold text-slate-700">Paquete Base (Descuento {quoteData.discount}%)</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900">INCLUIDO</span>
                                </div>
                                {coverages.filter(c => c.selected && c.isExtra).map(c => (
                                    <div key={c.id} className="flex justify-between items-center group animate-in slide-in-from-right-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                                            <span className="text-xs font-medium text-slate-600">{c.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-indigo-600">+${c.price.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-8 mt-4 border-t-2 border-dashed border-slate-100">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Inversión Anual Total</span>
                                    <span className="text-sm font-black text-indigo-600 italic">IVA INCLUIDO</span>
                                </div>
                                <div className="flex items-start text-indigo-950">
                                    <span className="text-2xl font-black mt-1">$</span>
                                    <span className="text-6xl font-black tracking-tighter leading-none">{totalPremium.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <button className="group w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-emerald-900/30 hover:bg-emerald-500 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-95">
                            ACEPTAR Y EMITIR <Check className="w-5 h-5 group-hover:scale-125 transition-transform" />
                        </button>
                        
                        <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                    EMISIÓN INMEDIATA 24/7 SIN SALIR DE CASA
                                </p>
                            </div>
                            <p className="text-[9px] text-center text-slate-400 font-medium italic">
                                Al confirmar, Rene Breton recibirá tu solicitud para emitir la póliza vía WhatsApp de inmediato.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Powered by Branding */}
            <footer className="mt-40 py-20 px-6 bg-slate-950 text-white text-center border-t border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-600/5 blur-[100px] -mb-48" />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="flex items-center gap-4 opacity-40 hover:opacity-100 transition-all duration-700 cursor-default grayscale hover:grayscale-0">
                        <Building2 className="w-8 h-8" />
                        <span className="text-xl font-black uppercase tracking-[0.5em] italic">RB PROYECTOS</span>
                    </div>
                    <div className="h-px w-24 bg-white/10 my-8" />
                    <p className="text-[11px] text-slate-500 font-black tracking-[0.4em] uppercase">
                        PLATAFORMA POWERED BY <span className="text-indigo-500">RB ELITE ENGINE v3.0</span>
                    </p>
                    <p className="text-[10px] text-slate-700 mt-6 font-bold uppercase tracking-widest">
                        © 2026 TODOS LOS DERECHOS RESERVADOS. PROTECCIÓN DE DATOS NIVEL BANCARIO.
                    </p>
                </div>
            </footer>
        </div>
    )
}
