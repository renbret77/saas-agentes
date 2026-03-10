"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ArrowRight, X, CheckCircle2, Zap, ShieldCheck } from "lucide-react"
import { supabase } from "@/lib/supabase"

const steps = [
    {
        title: "¡Bienvenido a la Era de la IA!",
        description: "Tu operación acaba de volverse 10x más fácil. Hemos preparado este portal para que seas el agente más productivo del mercado.",
        icon: Sparkles,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10"
    },
    {
        title: "Cotizador Múltiple IA",
        description: "Olvídate de transcribir PDFs. Arrastra las cotizaciones de GNP, AXA o Qualitas y nuestra IA extraerá todo automáticamente por ti.",
        icon: Zap,
        color: "text-amber-400",
        bg: "bg-amber-400/10"
    },
    {
        title: "Seguridad de Nivel Bancario",
        description: "Tus datos y los de tus clientes están protegidos con aislamiento criptográfico. Nadie más puede ver tus pólizas.",
        icon: ShieldCheck,
        color: "text-blue-400",
        bg: "bg-blue-400/10"
    },
    {
        title: "Todo Listo",
        description: "Comienza registrando a tu primer cliente o subiendo una póliza masiva desde el menú de SICAS. ¡Mucho éxito!",
        icon: CheckCircle2,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
    }
]

export function OnboardingTour() {
    const [isOpen, setIsOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        checkOnboarding()
    }, [])

    const checkOnboarding = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('profiles')
            .select('has_seen_onboarding')
            .eq('id', user.id)
            .single()

        if (profile && !(profile as any).has_seen_onboarding) {
            setIsOpen(true)
        }
    }

    const nextStep = async () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            completeOnboarding()
        }
    }

    const completeOnboarding = async () => {
        setIsOpen(false)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await (supabase
                .from('profiles') as any)
                .update({ has_seen_onboarding: true })
                .eq('id', user.id)
        }
    }

    if (!isOpen) return null

    const step = steps[currentStep]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
                {/* Decorative background flash */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${step.bg} rounded-full -mr-16 -mt-16 blur-3xl`} />

                <button
                    onClick={completeOnboarding}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className={`p-4 rounded-2xl ${step.bg} mb-6`}>
                        <step.icon className={`w-12 h-12 ${step.color}`} />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">
                        {step.title}
                    </h2>

                    <p className="text-slate-400 text-lg leading-relaxed mb-8">
                        {step.description}
                    </p>

                    <div className="flex items-center gap-2 mb-8">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? "w-8 bg-emerald-500" : "w-1.5 bg-slate-700"
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={nextStep}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-600/20"
                    >
                        {currentStep === steps.length - 1 ? "¡Empezar ahora!" : "Siguiente"}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
