"use client"

import { motion } from "framer-motion"
import { 
    ChevronRight, 
    Download, 
    Sparkles, 
    Shield, 
    Zap, 
    Target,
    Layout,
    ArrowRight,
    Search,
    UserPlus,
    Bot,
    MousePointer2,
    Lock,
    MessageCircle,
    BellRing,
    Calendar,
    Briefcase,
    Star,
    Heart
} from "lucide-react"

export default function MarketingShowcase() {
    return (
        <div className="min-h-screen bg-slate-950 text-white pb-32">
            {/* Header: Emotional Hook */}
            <div className="relative pt-24 pb-20 px-6 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.2)_0%,transparent_70%)] pointer-events-none" />
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-indigo-400">
                            ✨ Estrategia: Enamorar al Agente 🇲🇽
                        </span>
                        <h1 className="text-6xl md:text-9xl font-black mb-8 leading-[0.85] tracking-tighter">
                            Tu Agencia, <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400 italic">Sin Esfuerzo.</span>
                        </h1>
                        <p className="text-xl md:text-3xl text-slate-400 font-light max-w-4xl mx-auto leading-relaxed">
                            Diseño persuasivo y herramientas que devuelven la pasión por el negocio. <br/>
                            <span className="text-white font-bold opacity-100 italic">"Cierra ventas mientras recuperas tu vida."</span>
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Feature 1: La Magia Real (Real Screenshot) */}
            <div className="max-w-7xl mx-auto px-6 mt-32">
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-40"
                >
                    <div>
                        <span className="text-emerald-400 text-xs font-black uppercase tracking-[0.5em] mb-6 block">CAPTURA INTELIGENTE</span>
                        <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">La IA que <span className="text-emerald-400 italic">piensa por ti.</span></h2>
                        <p className="text-slate-400 text-xl mb-10 font-medium leading-relaxed">
                            Muestra cómo nuestro sistema lee pólizas automáticamente en segundos. 100% en español, cero errores, total libertad operativa.
                        </p>
                        <div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                            <Star className="text-emerald-400 w-6 h-6 fill-current" />
                            <p className="font-bold text-emerald-100 tracking-tight">Factor WOW: Cero manualidad garantizada.</p>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full"></div>
                        <img 
                            src="https://krqsquqqeztvoecymnbv.supabase.co/storage/v1/object/public/system_assets/media__1773271842567.png" 
                            className="relative z-10 w-full rounded-[3rem] shadow-2xl border border-white/10 hover:scale-105 transition-transform duration-700" 
                            alt="Mockup Portal" 
                        />
                    </div>
                </motion.div>
            </div>

            {/* Feature 2: Asistente Personal (Spanish Bot) */}
            <div className="max-w-7xl mx-auto px-6">
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-40 lg:flex-row-reverse"
                >
                    <div className="lg:order-2">
                        <span className="text-indigo-400 text-xs font-black uppercase tracking-[0.5em] mb-6 block">SERVICIO 24/7 SIN ESFUERZO</span>
                        <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">Paz mental <br/> <span className="text-indigo-400 italic">para tus clientes.</span></h2>
                        <p className="text-slate-400 text-xl mb-10 font-medium leading-relaxed">
                            Un bot que guía en siniestros y entrega documentos al instante. Tus clientes sentirán que siempre estás ahí, sin que tengas que atender una sola llamada.
                        </p>
                        <div className="flex items-center gap-4 p-5 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                            <Heart className="text-indigo-400 w-6 h-6 fill-current" />
                            <p className="font-bold text-indigo-100 tracking-tight">Fidelización: Clientes que aman tu servicio.</p>
                        </div>
                    </div>
                    <div className="relative lg:order-1">
                        <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full"></div>
                        <img 
                            src="https://krqsquqqeztvoecymnbv.supabase.co/storage/v1/object/public/system_assets/chat_bot_guia_siniestros_es_premium_1773297741143.png" 
                            className="relative z-10 w-full rounded-[4rem] shadow-2xl border border-white/10 hover:scale-105 transition-transform duration-700" 
                            alt="Spanish Bot" 
                        />
                    </div>
                </motion.div>
            </div>

            {/* Notification Showcase: CSS Based (No English) */}
            <div className="max-w-7xl mx-auto px-6 mt-24 py-32 bg-white/5 rounded-[4rem] border border-white/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-[120px]"></div>
                <div className="text-center mb-20 relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black mb-6">Omnicanalidad Real</h2>
                    <p className="text-slate-500 font-medium italic">WhatsApp, Telegram y Email. Siempre presente, con personalidad.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative z-10 text-center">
                    <div className="p-8 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10">
                        <MessageCircle className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
                        <h4 className="text-xl font-black mb-4 uppercase tracking-tighter">WhatsApp Brandeado</h4>
                        <p className="text-slate-400 text-sm">Notificaciones que conectan con emojis y calidez.</p>
                    </div>
                    <div className="p-8 rounded-[3rem] bg-blue-500/5 border border-blue-500/10 scale-110 shadow-2xl">
                        <BellRing className="w-12 h-12 text-blue-400 mx-auto mb-6" />
                        <h4 className="text-xl font-black mb-4 uppercase tracking-tighter">Telegram Automático</h4>
                        <p className="text-slate-400 text-sm">Tu canal de comunicación siempre actualizado.</p>
                    </div>
                    <div className="p-8 rounded-[3rem] bg-indigo-500/5 border border-indigo-500/10">
                        <Calendar className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
                        <h4 className="text-xl font-black mb-4 uppercase tracking-tighter">Email Corporativo</h4>
                        <p className="text-slate-400 text-sm">Formatos premium para renovaciones y cobranza.</p>
                    </div>
                </div>
            </div>

            {/* Footer / CTA */}
            <div className="max-w-7xl mx-auto px-6 mt-40 text-center">
                <h2 className="text-5xl md:text-[9rem] font-black mb-12 italic tracking-tighter leading-none">AMAS TU NEGOCIO. <br/> <span className="text-indigo-400">DOMINA TU TIEMPO.</span></h2>
                <div className="flex flex-col md:flex-row gap-8 justify-center mt-16 mt-20">
                    <button className="px-20 py-8 bg-white text-black rounded-[3rem] font-black text-2xl hover:scale-105 transition-transform shadow-2xl shadow-white/10 uppercase tracking-tighter">¡LO QUIERO YA! 🚀</button>
                    <button className="px-12 py-8 glass rounded-[3rem] font-black text-xl hover:bg-white/10 transition-all italic underline decoration-white/20">VER DEMO AGENTE</button>
                </div>
            </div>
        </div>
    )
}
