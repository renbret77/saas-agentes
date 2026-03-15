"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Sparkles, Send, User, Shield, HelpCircle, Brain, Target, ArrowRight, CheckCircle2, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    id: string;
    role: 'ai' | 'user';
    content: string;
    type?: 'qualification' | 'pain_point' | 'info';
}

export function AIProspectIntake() {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'ai', content: "¡Hola! Soy Capataz AI. Estoy aquí para entender mejor tus necesidades de protección y asegurarnos de darte el mejor servicio. ¿Cómo te llamas?" }
    ])
    const [input, setInput] = useState("")
    const [step, setStep] = useState(0)
    const [isTyping, setIsTyping] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const [prospectData, setProspectData] = useState({
        name: "",
        need: "",
        pain: "",
        urgency: "",
        qualification: ""
    })

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isTyping])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setIsTyping(true)

        // Simulación de interacción IA con lógica de calificación
        setTimeout(() => {
            let aiResponse = ""
            let nextStep = step + 1

            if (step === 0) {
                setProspectData(prev => ({ ...prev, name: input }))
                aiResponse = `Un gusto, ${input}. 🤝 ¿Qué tipo de protección estás buscando hoy? (Autos, Gastos Médicos, Vida, Empresa...)`
            } else if (step === 1) {
                setProspectData(prev => ({ ...prev, need: input }))
                aiResponse = `Entiendo. Y dime, ¿qué es lo que más te preocupa actualmente sobre este tema? (Ej: el costo, no saber si te cubrirán, trámites lentos...)`
            } else if (step === 2) {
                setProspectData(prev => ({ ...prev, pain: input }))
                aiResponse = `Te escucho fuerte y claro. La mayoría de nuestros clientes sienten lo mismo. 🛡️ ¿Qué tan pronto te gustaría tener esto resuelto?`
            } else if (step === 3) {
                setProspectData(prev => ({ ...prev, urgency: input }))
                aiResponse = `¡Perfecto! He analizado tu perfil y he detectado que necesitas un "Blindaje Patrimonial Nivel Pro". He agendado una prioridad ALTA para tu caso. Un asesor humano te contactará en breve con una propuesta diseñada específicamente para tus dolores.`
                setProspectData(prev => ({ ...prev, qualification: "High Priority" }))
            } else {
                aiResponse = "¡Gracias por confiar en RB Proyectos! Estamos procesando tu solicitud con tecnología de punta."
            }

            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: aiResponse }])
            setStep(nextStep)
            setIsTyping(false)
        }, 1500)
    }

    return (
        <div className="flex flex-col h-[600px] w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden relative group">
            {/* Header Pro */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Brain className="w-20 h-20 text-white" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/50 relative">
                        <Sparkles className="w-6 h-6 text-white" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black tracking-tight uppercase tracking-widest">Capataz Intake AI</h4>
                        <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Atención Tecnológica 24/7</p>
                    </div>
                </div>
                <div className="text-right relative z-10">
                    <p className="text-[9px] font-black text-slate-500 uppercase">Status</p>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Online</p>
                </div>
            </div>

            {/* Chat Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={cn(
                                "flex w-full",
                                msg.role === 'ai' ? "justify-start" : "justify-end"
                            )}
                        >
                            <div className={cn(
                                "max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm transition-all",
                                msg.role === 'ai' 
                                    ? "bg-white text-slate-700 border border-slate-100 rounded-tl-md" 
                                    : "bg-indigo-600 text-white shadow-xl shadow-indigo-100 rounded-tr-md"
                            )}>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="bg-white p-4 rounded-3xl border border-slate-100 flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-100">
                <div className="relative flex items-center gap-3">
                    <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Escribe aquí..."
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all placeholder:text-slate-300"
                    />
                    <button 
                        onClick={handleSend}
                        className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 grayscale opacity-20">
                    <Shield className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em]">AI Secure Process</span>
                </div>
            </div>

            {/* Qualification Badge - Fixed at bottom when complete */}
            {step >= 4 && (
                <motion.div 
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="absolute bottom-24 left-6 right-6 p-4 bg-emerald-500 text-white rounded-2xl shadow-2xl flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5" />
                        <div>
                            <p className="text-[10px] font-black uppercase">Prospecto Calificado</p>
                            <p className="text-xs font-bold">{prospectData.qualification}</p>
                        </div>
                    </div>
                    <Zap className="w-5 h-5 animate-pulse" />
                </motion.div>
            )}
        </div>
    )
}
