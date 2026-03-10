"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Zap, ShieldCheck, ChevronDown, Sparkles } from "lucide-react"
import { useState } from "react"
import { INSURANCE_TEMPLATES } from "@/lib/insurance-templates"

interface QuotePresentationProps {
    type: string
    quoteData: any
    agencyName?: string
}

export default function QuotePresentation({ type, quoteData, agencyName = "Tu Agente de Seguros" }: QuotePresentationProps) {
    const template = (INSURANCE_TEMPLATES as any)[type] || INSURANCE_TEMPLATES.auto
    const [openFaq, setOpenFaq] = useState<number | null>(null)

    // Select a random variety if available, otherwise use default hero
    const [heroImage] = useState(() => {
        if (template.varieties && template.varieties.length > 0) {
            return template.varieties[Math.floor(Math.random() * template.varieties.length)]
        }
        return template.hero
    })

    return (
        <div className="min-h-screen bg-white">
            {/* HERO SECTION */}
            <header className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <img
                    src={heroImage}
                    alt={template.title}
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30" />

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1.5 bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-widest rounded-full border border-emerald-500/30 mb-6 backdrop-blur-md"
                    >
                        Propuesta Personalizada por {agencyName}
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6"
                    >
                        {template.title}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl md:text-2xl text-slate-200 font-medium"
                    >
                        {template.subtitle}
                    </motion.p>
                </div>
            </header>

            {/* STORY / PERSUASIVE SECTION */}
            {template.story && (
                <section className="py-24 px-6 bg-slate-50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                            {/* Problem */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="relative"
                            >
                                <div className="text-slate-300 text-6xl font-black absolute -top-10 -left-4 select-none opacity-20">01</div>
                                <h4 className="text-indigo-600 font-bold uppercase tracking-widest text-xs mb-4">El Problema</h4>
                                <p className="text-slate-900 font-bold text-lg leading-relaxed">{template.story.problem}</p>
                            </motion.div>

                            {/* Agitate */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="relative"
                            >
                                <div className="text-slate-300 text-6xl font-black absolute -top-10 -left-4 select-none opacity-20">02</div>
                                <h4 className="text-rose-500 font-bold uppercase tracking-widest text-xs mb-4">El Riesgo</h4>
                                <p className="text-slate-600 font-medium text-lg leading-relaxed">{template.story.agitate}</p>
                            </motion.div>

                            {/* Solution */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="relative p-6 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200"
                            >
                                <div className="text-white text-6xl font-black absolute -top-10 -left-4 select-none opacity-10">03</div>
                                <h4 className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-4">La Solución</h4>
                                <p className="text-white font-bold text-lg leading-relaxed">{template.story.solution}</p>
                            </motion.div>
                        </div>
                    </div>
                </section>
            )}

            {/* BENEFITS SECTION */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">¿Por qué protegerte con nosotros?</h2>
                    <p className="text-slate-500 mt-2">{template.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {template.benefits.map((benefit: any, idx: number) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -5 }}
                            className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
                        >
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{benefit.title}</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">{benefit.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* QUOTE REVEAL SECTION */}
            <section className="bg-slate-900 py-24 px-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-24 opacity-[0.05] pointer-events-none">
                    <Sparkles className="w-64 h-64 text-white" />
                </div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                            <div>
                                <h3 className="text-white text-3xl font-black tracking-tight mb-2">Resumen de tu Cotización</h3>
                                <p className="text-slate-400 font-medium italic">Elegido por IA como la mejor protección para tu perfil</p>
                            </div>
                            <div className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Prima Total</p>
                                <p className="text-3xl font-black text-emerald-400">${quoteData.total_premium} <span className="text-sm">{quoteData.currency || 'MXN'}</span></p>
                            </div>
                        </div>

                        {/* Specific Coverages Table */}
                        <div className="space-y-4">
                            {quoteData.coverages?.map((cov: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl group hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        <span className="text-white font-bold">{cov.name}</span>
                                    </div>
                                    <span className="text-slate-400 font-medium">{cov.limit || 'Amparado'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section className="py-24 px-6 max-w-3xl mx-auto">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight text-center mb-12">Preguntas Frecuentes</h3>
                <div className="space-y-4">
                    {template.faq.map((item: any, idx: number) => (
                        <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                            <button
                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                className="w-full p-6 text-left flex items-center justify-between font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                            >
                                {item.q}
                                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                            </button>
                            {openFaq === idx && (
                                <div className="p-6 bg-slate-50 text-slate-500 font-medium border-t border-slate-100 animate-in slide-in-from-top-2">
                                    {item.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>


            {/* TRUST FOOTER */}
            <footer className="py-12 bg-slate-50 border-t border-slate-100 text-center px-6">
                <div className="max-w-4xl mx-auto">
                    <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">Esta cotización tiene una vigencia de 15 días naturales. Sujeto a cambios según las condiciones de la aseguradora.</p>
                    <div className="mt-8 flex items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">RB</div>
                        <span className="text-sm font-bold text-slate-900">Powered by Portal SaaS Vuelo a la Hilacha</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}
