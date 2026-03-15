"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Square, Loader2, Play, CheckCircle2, XCircle, Sparkles, Send } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function VoiceCommandInterface() {
    const [isRecording, setIsRecording] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [transcript, setTranscript] = useState<string | null>(null)
    const [result, setResult] = useState<any>(null)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/ogg; codecs=opus' })
                setAudioBlob(blob)
                processAudio(blob)
            }

            mediaRecorder.start()
            setIsRecording(true)
            setTranscript(null)
            setResult(null)
        } catch (err) {
            console.error("Error accessing microphone:", err)
            alert("No se pudo acceder al micrófono.")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const processAudio = async (blob: Blob) => {
        setIsProcessing(true)
        try {
            const formData = new FormData()
            formData.append('file', blob, 'voice.ogg')

            const res = await fetch('/api/ai/process-voice', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            if (data.success) {
                setTranscript(data.text)
                setResult(data.analysis)
                // Aquí podríamos disparar una notificación de éxito o actualizar la UI global
            } else {
                setResult({ error: data.error })
            }
        } catch (err) {
            console.error("Error processing voice:", err)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="fixed bottom-24 right-8 z-[60] flex flex-col items-end gap-4">
            <AnimatePresence>
                {(transcript || isRecording || isProcessing) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200 shadow-2xl w-72 mb-2"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Capataz Voice Hub</span>
                            </div>

                            {!transcript && !isRecording && !isProcessing && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Prueba diciendo:</p>
                                    <div className="space-y-2">
                                        {[
                                            "Agendar cita con Juan mañana a las 5",
                                            "Añadir nota: El cliente prefiere seguros GMM",
                                            "Ver oportunidades de venta de Vida",
                                            "Buscar póliza de Seguros Atlas"
                                        ].map((cmd, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => {
                                                    stopRecording();
                                                    // Simular comando de texto para demo
                                                    setTranscript(cmd);
                                                    processAudio(new Blob([], { type: 'audio/ogg' })); // Mock blob for demo
                                                }}
                                                className="w-full p-2.5 bg-slate-50 hover:bg-indigo-50 text-[10px] text-left text-slate-500 hover:text-indigo-600 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all font-medium"
                                            >
                                                "{cmd}"
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isRecording && (
                                <div className="flex flex-col items-center gap-3 py-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-rose-400 rounded-full animate-ping opacity-20"></div>
                                        <div className="relative bg-rose-500 p-4 rounded-full text-white">
                                            <Mic className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-rose-600 animate-pulse">Grabando instrucción...</p>
                                </div>
                            )}

                            {isProcessing && (
                                <div className="flex flex-col items-center gap-3 py-4">
                                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                    <p className="text-xs font-bold text-slate-500">Procesando audio...</p>
                                </div>
                            )}

                            {transcript && (
                                <div className="space-y-3">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 italic text-xs text-slate-600">
                                        "{transcript}"
                                    </div>
                                    {result && result.intent && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            <div>
                                                <p className="text-[8px] font-bold text-emerald-600 uppercase">Intención Detectada</p>
                                                <p className="text-[10px] font-black text-emerald-900 capitalize">{result.intent}: {result.summary}</p>
                                            </div>
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => { setTranscript(null); setResult(null); }}
                                        className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                    "h-16 w-16 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90 relative group overflow-hidden",
                    isRecording 
                    ? "bg-rose-500 text-white animate-pulse" 
                    : "bg-slate-900 text-white hover:bg-slate-800"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-7 h-7" />}
                
                {!isRecording && !transcript && (
                    <div className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 text-[8px] flex items-center justify-center font-bold">IA</span>
                    </div>
                )}
            </button>
        </div>
    )
}
