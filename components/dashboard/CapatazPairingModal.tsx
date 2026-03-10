"use client"

import { useState, useEffect } from "react"
import { QrCode, X, Loader2, CheckCircle2, AlertCircle, Smartphone, ShieldCheck, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface CapatazPairingModalProps {
    isOpen: boolean;
    onClose: () => void;
    instanceName?: string;
}

export default function CapatazPairingModal({ isOpen, onClose, instanceName = "RB-Agente-Default" }: CapatazPairingModalProps) {
    const [step, setStep] = useState<'intro' | 'loading' | 'qr' | 'success' | 'error'>('intro')
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const startPairing = async () => {
        setStep('loading')
        try {
            // 1. Create or Get Instance
            const createRes = await fetch('/api/capataz/instance', {
                method: 'POST',
                body: JSON.stringify({ action: 'create', instanceName })
            })

            // 2. Fetch QR
            const connectRes = await fetch('/api/capataz/instance', {
                method: 'POST',
                body: JSON.stringify({ action: 'connect', instanceName })
            })
            const connectData = await connectRes.json()

            if (connectData.base64) {
                setQrCode(connectData.base64)
                setStep('qr')
                startPolling()
            } else {
                throw new Error("No se pudo generar el código QR")
            }
        } catch (err: any) {
            setError(err.message)
            setStep('error')
        }
    }

    const startPolling = () => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/capataz/instance?instanceName=${instanceName}`)
                const data = await res.json()
                if (data.instance?.state === 'open') {
                    setStep('success')
                    clearInterval(interval)
                }
            } catch (e) {
                console.error("Polling error", e)
            }
        }, 5000)

        return () => clearInterval(interval)
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
                >
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors z-20">
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-8 pt-12">
                        {step === 'intro' && (
                            <div className="text-center space-y-6">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20">
                                    <Zap className="w-10 h-10 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">Activar Capataz</h2>
                                    <p className="text-slate-400 text-sm mt-2 px-4">Vincula tu WhatsApp para que Capataz pueda responder audios, resumir PDFs y gestionar tu agenda automáticamente.</p>
                                </div>
                                <div className="space-y-3 pt-4">
                                    {[
                                        { icon: Smartphone, text: "Control total desde tu WhatsApp" },
                                        { icon: ShieldCheck, text: "Encriptación de grado bancario" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-2xl border border-slate-800 text-left">
                                            <item.icon className="w-4 h-4 text-emerald-400" />
                                            <span className="text-xs font-medium text-slate-300">{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={startPairing}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-950/50"
                                >
                                    ¡Vincular mi WhatsApp!
                                </button>
                            </div>
                        )}

                        {step === 'loading' && (
                            <div className="text-center py-12 space-y-4">
                                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
                                <p className="text-slate-400 font-medium">Preparando tu instancia privada...</p>
                            </div>
                        )}

                        {step === 'qr' && (
                            <div className="text-center space-y-6">
                                <h2 className="text-xl font-bold text-white uppercase tracking-widest text-[10px]">Escanea este código</h2>
                                <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl">
                                    {qrCode && <img src={qrCode} alt="WhatsApp QR" className="w-64 h-64" />}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-slate-400 text-xs">Abre WhatsApp en tu teléfono {`>`} Ajustes {`>`} Dispositivos vinculados.</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-3 h-3 text-emerald-500 animate-spin" />
                                        <span className="text-[10px] font-black uppercase text-emerald-500 tracking-tighter">Esperando conexión...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="text-center space-y-6 py-8">
                                <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto" />
                                <div>
                                    <h2 className="text-2xl font-black text-white">¡Capataz está vivo!</h2>
                                    <p className="text-slate-400 text-sm mt-2">Tu WhatsApp se ha vinculado correctamente. Ya puedes empezar a mandarle órdenes por nota de voz.</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all"
                                >
                                    Entendido, ¡vamos!
                                </button>
                            </div>
                        )}

                        {step === 'error' && (
                            <div className="text-center space-y-6 py-8">
                                <AlertCircle className="w-20 h-20 text-rose-500 mx-auto" />
                                <div>
                                    <h2 className="text-2xl font-black text-white">Ups, algo falló</h2>
                                    <p className="text-slate-400 text-sm mt-2">{error || "Hubo un error al intentar crear tu instancia."}</p>
                                </div>
                                <button
                                    onClick={() => setStep('intro')}
                                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all"
                                >
                                    Reintentar
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
