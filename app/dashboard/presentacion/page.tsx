"use client"

import { motion } from "framer-motion"
import { 
    Zap, Shield, Users, Bot, 
    BarChart3, Globe, Smartphone, 
    CheckCircle2, ArrowRight, Star,
    TrendingUp, Clock, Sparkles, MessageSquare, Target
} from "lucide-react"
import Link from "next/link"

const FLYERS = [
    {
        id: "money_machine",
        title: "Vende Más con lo que YA TIENES",
        subtitle: "La Cartera es una Mina de Oro",
        icon: TrendingUp,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
        bullet_points: [
            "Cross-Selling con IA detecta huecos de protección al instante.",
            "Argumentos psicológicos (Papá, Empresario) que cierran solos.",
            "Mapa de Blindaje que crea urgencia visual en el cliente."
        ],
        cta: "Activa tu Máquina de Dinero"
    },
    {
        id: "time_freedom",
        title: "Recupera 10 Horas a la Semana",
        subtitle: "Deja de ser un Capturador de Datos",
        icon: Clock,
        color: "text-indigo-500",
        bg: "bg-indigo-50",
        bullet_points: [
            "Capataz Sync RPA: La info de portales se carga sola.",
            "Bot Pro: Cobranza automática que trabaja mientras duermes.",
            "Reportes Ejecutivos en 1 clic (Lo que te tomaba horas)."
        ],
        cta: "Empieza a Vivir Mejor"
    },
    {
        id: "elite_presence",
        title: "Destaca vs Otros Asesores",
        subtitle: "Presentaciones Premium de Nivel CEO",
        icon: Target,
        color: "text-rose-500",
        bg: "bg-rose-50",
        bullet_points: [
            "Cotizaciones interactivas con Video Engagement (V-Prop).",
            "Branding profesional 'Powered by RB Proyectos'.",
            "Atención 24/7 vía WhatsApp Bot con tu propia marca."
        ],
        cta: "Sube de Nivel Hoy"
    }
]

export default function BenefitsPortal() {
    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Super Hero Header */}
            <section className="relative pt-24 pb-20 overflow-hidden bg-slate-900 text-white rounded-b-[80px]">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-250 -mt-250" />
                <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-black mb-8 uppercase tracking-[0.2em]"
                    >
                        <Sparkles className="w-4 h-4" /> ¡Bolas Don Cuco! El Futuro Llegó
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
                    >
                        El Sistema que <br />
                        <span className="text-emerald-400">Trabaja Mejor que Tú</span>
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl text-slate-400 max-w-2xl mx-auto font-medium mb-12"
                    >
                        Eres Promotor y quieres que tus agentes vendan más. Aquí tienes la herramienta que los convertirá en máquinas de producción imparables.
                    </motion.p>
                </div>
            </section>

            {/* Flyer Matrix */}
            <section className="py-20 -mt-10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {FLYERS.map((flyer, idx) => (
                            <motion.div
                                key={flyer.id}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="group bg-white p-10 rounded-[50px] border-2 border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:border-emerald-500/30 transition-all hover:shadow-2xl relative overflow-hidden"
                            >
                                <div className={`w-20 h-20 ${flyer.bg} ${flyer.color} rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform shadow-inner`}>
                                    <flyer.icon className="w-10 h-10" />
                                </div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-900 leading-tight mb-2">{flyer.title}</h3>
                                        <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">{flyer.subtitle}</p>
                                    </div>

                                    <div className="space-y-4 pt-6 border-t border-slate-50">
                                        {flyer.bullet_points.map((point, pIdx) => (
                                            <div key={pIdx} className="flex items-start gap-3">
                                                <div className="mt-1.5 w-1.5 h-1.5 bg-slate-900 rounded-full shrink-0" />
                                                <p className="text-sm font-medium text-slate-600 leading-relaxed">{point}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <button className="w-full py-4 mt-8 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                                        {flyer.cta} <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Abstract Design Element */}
                                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-slate-50 rounded-full -z-10 group-hover:scale-150 transition-transform" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* The Capataz Power Section */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="bg-indigo-900 rounded-[60px] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -mr-48 -mt-48" />
                        
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-8">
                                <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/10 rounded-full text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                                    <MessageSquare className="w-3 h-3" /> El Asistente Inteligente
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black leading-tight">Capataz No Descansa, Tú Sí.</h2>
                                <p className="text-lg text-indigo-100 font-medium opacity-80">
                                    Desde contestar dudas de clientes por WhatsApp hasta avisarte qué póliza se vence mañana. Capataz es el socio que siempre habías querido.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        "Transcripción de audio a tareas reales.",
                                        "Detección proactiva de siniestros.",
                                        "Carga de recibos en segundos."
                                    ].map((li, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <span className="font-bold text-sm">{li}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="relative">
                                <div className="aspect-square bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 flex items-center justify-center shadow-inner">
                                    <Bot className="w-40 h-40 text-indigo-300 opacity-20 animate-pulse" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-24 h-24 bg-indigo-500/30 rounded-full blur-2xl animate-ping" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final Call to Action */}
            <section className="py-24 text-center">
                <div className="max-w-2xl mx-auto px-4 space-y-8">
                    <h2 className="text-4xl font-black text-slate-900">¿Listo para transformar tu Promotoría?</h2>
                    <p className="text-slate-500 font-medium">
                        Dales a tus agentes las herramientas que usan los <strong>Top Producers</strong> del mercado. Empieza hoy mismo.
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <Link href="/dashboard" className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-xl active:scale-95">
                            Probar mi Oficina Digital
                        </Link>
                        <button className="w-full md:w-auto px-12 py-5 bg-white text-slate-900 border-2 border-slate-100 font-black rounded-2xl hover:bg-slate-50 transition-all active:scale-95">
                            Manual de Beneficios (PDF)
                        </button>
                    </div>
                </div>
            </section>
        </div>
    )
}
