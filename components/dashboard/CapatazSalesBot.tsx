"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Sparkles, Send, User, Shield, HelpCircle, Brain, Target, ArrowRight, CheckCircle2, Zap, AlertTriangle, Fingerprint, Activity, BarChart3, Scan } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    id: string;
    role: 'ai' | 'user';
    content: string;
    type?: 'qualification' | 'pain_point' | 'info';
}

export function CapatazSalesBot() {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'ai', content: "SISTEMA INICIALIZADO. Soy Capataz Alpha-1. Analizaré tu perfil para diseñar la protección perfecta. ¿Cuál es tu nombre?" }
    ])
    const [input, setInput] = useState("")
    const [step, setStep] = useState(0)
    const [isTyping, setIsTyping] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // AI "Brain" State - What the AI is "thinking"
    const [brainState, setBrainState] = useState({
        score: 0,
        detectedPains: [] as string[],
        urgency: "Calculando...",
        strategy: "Capturando Data Inicial",
        isAnalyzing: false
    })

    const [prospectData, setProspectData] = useState({
        name: "",
        need: "",
        pain: "",
        urgency: "",
        qualification: "",
        phone: ""
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

        // Matrix "Analyzing" effect
        setBrainState(prev => ({ ...prev, isAnalyzing: true }))

        setTimeout(() => {
            let aiResponse = ""
            let nextStep = step + 1
            let newScore = brainState.score
            let newPains = [...brainState.detectedPains]
            let newStrategy = brainState.strategy
            let newUrgency = brainState.urgency

            if (step === 0) {
                setProspectData(prev => ({ ...prev, name: input }))
                aiResponse = `Acceso concedido, ${input}. 🦾 Identidad verificada. ¿Qué activo o valor deseas blindar hoy? (Familia, Empresa, Salud, Patrimonio...)`
                newScore = 15
                newStrategy = "Mapeo de activos"
            } else if (step === 1) {
                setProspectData(prev => ({ ...prev, need: input }))
                aiResponse = `Entendido. Escaneando riesgos para ${input}... 🔍 Describe tu mayor temor: ¿qué pasaría si hoy perdieras el control sobre esto?`
                newScore = 35
                newStrategy = "Detección de Dolores (Pain Points)"
            } else if (step === 2) {
                setProspectData(prev => ({ ...prev, pain: input }))
                newPains.push(input.length > 20 ? input.substring(0, 20) + "..." : input)
                aiResponse = `Dolor detectado: "${input}". 🛡️ Analizando impacto financiero... Mi red neuronal sugiere acción inmediata. ¿Cuándo necesitas dormir tranquilo sabiendo que esto está resuelto?`
                newScore = 65
                newUrgency = "ALTA"
                newStrategy = "Cierre de Urgencia"
            } else if (step === 3) {
                setProspectData(prev => ({ ...prev, urgency: input }))
                aiResponse = `ANÁLISIS COMPLETADO. ⚡ Tienes una probabilidad de éxito del 92%. He inyectado tu caso en el carril "RB ELITE". Un agente táctico te contactará con el antídoto exacto para tu preocupación.`
                newScore = 92
                newUrgency = "CRÍTICA"
                newStrategy = "Fase de Cierre (Transferencia Humana)"
                setProspectData(prev => ({ ...prev, qualification: "High Yield Prospect" }))
            } else {
                aiResponse = "El sistema está optimizando tu plan. Mantente en línea."
            }

            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: aiResponse }])
            setBrainState({
                score: newScore,
                detectedPains: newPains,
                urgency: newUrgency,
                strategy: newStrategy,
                isAnalyzing: false
            })
            setStep(nextStep)
            setIsTyping(false)

            // Si el proceso terminó, guardamos en el CRM
            if (nextStep >= 4) {
                saveToCRM(newScore, newPains, newUrgency);
            }
        }, 2000)
    }

    const saveToCRM = async (score: number, pains: string[], urgency: string) => {
        setIsSaving(true)
        try {
            await fetch('/api/prospects/save-lead', {
                method: 'POST',
                body: JSON.stringify({
                    name: prospectData.name,
                    need: prospectData.need,
                    pain: pains.join(", "),
                    urgency: urgency,
                    qualification: "High Yield (IA Qualified)",
                    phone: "55-" + Math.floor(Math.random() * 10000000) // Simulación de captura o generatividad
                })
            })
        } catch (e) {
            console.error("Error saving to CRM", e)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col lg:flex-row h-[700px] w-full max-w-5xl bg-slate-950 rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border border-slate-800 overflow-hidden relative">
            
            {/* Sidebar: AI Brain Intelligence */}
            <div className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 p-8 flex flex-col gap-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
                
                <div className="space-y-1">
                    <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Scan className="w-3 h-3" /> Real-time Intel
                    </h5>
                    <h4 className="text-xl font-black text-white tracking-tighter">Capataz <span className="text-indigo-500">Brain</span></h4>
                </div>

                {/* Score Meter */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversion Score</p>
                        <p className="text-2xl font-black text-indigo-400">{brainState.score}%</p>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${brainState.score}%` }}
                            className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="p-5 bg-slate-800/50 rounded-2xl border border-white/5 space-y-2 group hover:bg-slate-800 transition-all">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Target className="w-4 h-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Estrategia</p>
                        </div>
                        <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors uppercase">{brainState.strategy}</p>
                    </div>

                    <div className="p-5 bg-slate-800/50 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Activity className="w-4 h-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Urgencia</p>
                        </div>
                        <p className={cn(
                            "text-xs font-black uppercase",
                            brainState.urgency === "Calculando..." ? "text-slate-500" : "text-emerald-400"
                        )}>{brainState.urgency}</p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Dolores Detectados</p>
                        <div className="flex flex-wrap gap-2">
                            {brainState.detectedPains.length === 0 ? (
                                <p className="text-[10px] font-medium text-slate-600 italic px-1">Escaneando...</p>
                            ) : (
                                brainState.detectedPains.map((pain, i) => (
                                    <motion.span 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        key={i} 
                                        className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-tighter"
                                    >
                                        {pain}
                                    </motion.span>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {brainState.isAnalyzing && (
                    <div className="mt-auto flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl animate-pulse">
                        <Brain className="w-5 h-5 text-indigo-400" />
                        <p className="text-[10px] font-black text-indigo-300 uppercase italic tracking-widest">Pensamiento IA Activo...</p>
                    </div>
                )}
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {/* Header Chat */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-100 relative">
                            <Fingerprint className="w-7 h-7 text-white" />
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-900 tracking-tighter uppercase">Capataz <span className="text-indigo-600">Alpha-1</span></h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Shield className="w-3 h-3" /> Secure Cyber-Broker 24/7
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-2 h-2 bg-slate-100 rounded-full" />
                            ))}
                        </div>
                        <p className="text-[9px] font-black text-rose-500 uppercase mt-2">Encriptado de Grado Militar</p>
                    </div>
                </div>

                {/* Chat Body */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-slate-50/30">
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={cn(
                                    "flex w-full",
                                    msg.role === 'ai' ? "justify-start" : "justify-end"
                                )}
                            >
                                <div className={cn(
                                    "max-w-[75%] p-6 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm relative",
                                    msg.role === 'ai' 
                                        ? "bg-white text-slate-800 border border-slate-100 rounded-tl-sm shadow-[0_10px_20px_-10px_rgba(0,0,0,0.05)]" 
                                        : "bg-indigo-600 text-white shadow-xl shadow-indigo-100/50 rounded-tr-sm"
                                )}>
                                    {msg.content}
                                    {msg.role === 'ai' && (
                                        <div className="absolute -left-12 bottom-0 w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Sparkles className="w-4 h-4 text-indigo-400" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        {isTyping && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="flex justify-start"
                            >
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex gap-1.5 items-center">
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="p-8 bg-white border-t border-slate-100 relative">
                    <div className="relative flex items-center gap-4">
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Introduce tu respuesta táctica..."
                            className="flex-1 bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all placeholder:text-slate-300 shadow-inner"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={isTyping}
                            className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </div>
                    <p className="mt-4 text-[9px] text-center text-slate-400 font-bold uppercase tracking-[0.2em] opacity-40">
                        IA procesando mediante red neuronal dedicada "RB-CORELINK v2"
                    </p>
                </div>
            </div>

            {/* Floating Qualification Result */}
            <AnimatePresence>
                {step >= 4 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="absolute bottom-10 left-10 right-10 lg:left-auto lg:right-10 lg:w-96 p-8 bg-emerald-600 text-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(16,185,129,0.4)] z-50 flex items-center gap-6 border-4 border-white/20 backdrop-blur-xl"
                    >
                        <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center border border-white/30 shrink-0">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.1em] opacity-80">Score de Calificación</p>
                            <h4 className="text-2xl font-black tracking-tighter leading-tight uppercase">Propensión Crítica</h4>
                            <p className="text-xs font-bold text-emerald-100 italic">
                                {isSaving ? "Sincronizando con CRM Pro..." : "Lead inyectado en el CRM Exitosamente"}
                            </p>
                        </div>
                        <Zap className="w-8 h-8 text-amber-300 fill-amber-300 absolute -top-4 -right-4 animate-bounce" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
export default CapatazSalesBot;
