"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, X, Target, Heart, TrendingUp, ShieldAlert, Zap, Lock, CreditCard } from "lucide-react"
import Link from "next/link"

const FEATURE_INFO: Record<string, { title: string, desc: string, icon: any, color: string, videoUrl: string }> = {
    "/dashboard/cross-sell": {
        title: "Venta Cruzada con IA",
        desc: "Nuestra IA analiza automáticamente tu cartera y te dice exactamente a quién llamarle para venderle un seguro complementario (Ej. Vida a quien ya tiene Gastos Médicos).",
        icon: Target,
        color: "text-rose-500",
        videoUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" // Placeholder
    },
    "/dashboard/loyalty": {
        title: "Fidelización Autónoma",
        desc: "Envía tarjetas de cumpleaños, aniversarios de póliza y recordatorios de pago por WhatsApp de forma 100% automática. Tus clientes te amarán sin que muevas un dedo.",
        icon: Heart,
        color: "text-amber-500",
        videoUrl: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80" // Placeholder
    },
    "/dashboard/reports": {
        title: "Reportes Inteligentes",
        desc: "Gráficas predictivas, comisiones proyectadas y análisis de embudo. Toma decisiones de negocio sabiendo exactamente dónde está tu dinero.",
        icon: TrendingUp,
        color: "text-emerald-500",
        videoUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80" // Placeholder
    },
    "/dashboard/claims": {
        title: "Gestor Rápido de Siniestros",
        desc: "Lleva un control exacto (Bitácora) de cada paso en un siniestro. Mantén a tu cliente informado por WhatsApp mientras hablas con los ajustadores de la aseguradora.",
        icon: ShieldAlert,
        color: "text-amber-500",
        videoUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80" // Placeholder
    },
    "/dashboard/quotes": {
        title: "Cotizador Múltiple con IA",
        desc: "¿Manejas varias aseguradoras? Sube tus PDF's y nuestra IA extraerá las primas y coberturas para crear una presentación comparativa hermosa, persuasiva y profesional. Ahorra horas de captura y cierra más ventas diciendo 'Wow'.",
        icon: Sparkles,
        color: "text-indigo-500",
        videoUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80" // Placeholder
    }
}

interface UpsellModalProps {
    isOpen: boolean
    onClose: () => void
    featureRoute: string
}

export function UpsellModal({ isOpen, onClose, featureRoute }: UpsellModalProps) {
    if (!isOpen) return null

    // Fallback if route is strange
    const feature = FEATURE_INFO[featureRoute] || {
        title: "Herramienta Premium",
        desc: "Esta es una herramienta exclusiva para Agentes y Promotorías que quieren llevar su producción al siguiente nivel acelerando sus procesos con IA.",
        icon: Sparkles,
        color: "text-indigo-500",
        videoUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
    }

    const Icon = feature.icon

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            >
                <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
                >
                    {/* Botón Cerrar Flotante */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-50 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white md:text-slate-400 md:bg-slate-100 md:hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Izquierda: Gráfico / Imágen / Venta Visual */}
                    <div className="md:w-5/12 relative min-h-[250px] md:min-h-full bg-slate-900 overflow-hidden group">
                        <img
                            src={feature.videoUrl}
                            alt={feature.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                        <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                            <div className={`p-3 bg-white/10 backdrop-blur-md w-fit rounded-2xl mb-4 text-white border border-white/20 shadow-xl`}>
                                <Icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight mb-2 leading-none">{feature.title}</h3>
                            <p className="text-slate-300 text-sm opacity-90 leading-relaxed font-medium">Lleva tu cartera al siguiente nivel con automatizaciones y reportes que facturan solos.</p>
                        </div>
                    </div>

                    {/* Derecha: Texto de Venta y Call to Actions */}
                    <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-slate-50 relative overflow-hidden">

                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                            <Lock className="w-48 h-48 -rotate-12" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black tracking-widest uppercase rounded-full border border-amber-200">
                                        FUNCIÓN EXCLUSIVA
                                    </span>
                                </div>
                                <h4 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">Desbloquea el poder total de tu plataforma.</h4>
                            </div>

                            <p className="text-slate-600 font-medium leading-relaxed">
                                {feature.desc}
                            </p>

                            <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm shadow-indigo-100/50">
                                <h5 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-500" /> Beneficios de la Licencia PRO
                                </h5>
                                <ul className="space-y-3 text-sm text-slate-600 mt-4">
                                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-emerald-500 shrink-0" /> Acceso a herramientas de Inteligencia Artificial.</li>
                                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-emerald-500 shrink-0" /> Asistentes de oficina ilimitados conectables.</li>
                                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-emerald-500 shrink-0" /> WhatsApp bot automatizado (Capataz) habilitado.</li>
                                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-rose-500 shrink-0" /><span className="text-rose-600 font-bold leading-tight">Sin límites forzosos ("Hard limits") de 20 clientes o pólizas.</span></li>
                                </ul>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Link
                                    href="/dashboard/billing"
                                    onClick={onClose}
                                    className="flex-1 flex justify-center items-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                                >
                                    <CreditCard className="w-5 h-5" /> Convertirse en PRO
                                </Link>
                                <button className="flex-1 flex justify-center items-center gap-2 py-4 bg-white hover:bg-slate-50 text-indigo-700 font-bold rounded-xl border-2 border-indigo-100 hover:border-indigo-200 transition-all active:scale-95">
                                    <Zap className="w-5 h-5 text-indigo-500" /> Probar con 1 Crédito
                                </button>
                            </div>
                        </div>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
