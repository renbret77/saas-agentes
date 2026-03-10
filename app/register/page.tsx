"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ShieldCheck, Mail, Lock, Building2, Bot, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { registerFreeAgency } from "./actions"

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ type: "", text: "" })

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage({ type: "", text: "" })

        const formData = new FormData(e.currentTarget)
        const res = await registerFreeAgency(formData)

        if (res?.error) {
            setMessage({ type: "error", text: res.error })
            setIsLoading(false)
        } else {
            setMessage({ type: "success", text: "¡Cuenta creada exitosamente! Redirigiendo al login..." })
            setTimeout(() => {
                router.push("/login")
            }, 2000)
        }
    }

    return (
        <div className="min-h-screen w-full flex bg-slate-50 items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
                {/* Left Side - Info */}
                <div className="md:w-5/12 bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-emerald-400 mb-8">
                            <ShieldCheck className="h-8 w-8" />
                            <span className="text-xl font-bold tracking-tight text-white">Seguros RB</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Acelera tus ventas gratis.</h2>
                        <ul className="space-y-4 text-slate-300">
                            <li className="flex items-center gap-3"><Bot className="text-emerald-400 w-5 h-5" /> Inteligencia Artificial Integrada</li>
                            <li className="flex items-center gap-3"><Bot className="text-emerald-400 w-5 h-5" /> Gestión de Clientes y Pólizas</li>
                            <li className="flex items-center gap-3"><Bot className="text-emerald-400 w-5 h-5" /> Hasta 20 clientes sin costo</li>
                        </ul>
                    </div>

                    <div className="relative z-10 mt-12 bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                        <p className="text-sm">"Desde que uso la plataforma, ahorro 10 horas a la semana automatizando mis renovaciones."</p>
                        <p className="font-bold text-emerald-400 mt-2 text-sm">- Agente Top de GNP</p>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="md:w-7/12 p-8 md:p-12 bg-white">
                    <div className="max-w-md mx-auto">
                        <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Crear tu Agencia Free</h3>
                        <p className="text-slate-500 mb-8">No se requiere tarjeta de crédito para iniciar.</p>

                        {message.text && (
                            <div className={`p-4 mb-6 rounded-xl text-sm font-bold flex items-center gap-2 ${message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-5">
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Nombre de tu Promotoría / Despacho</label>
                                <div className="relative mt-1">
                                    <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                    <input name="agency_name" type="text" required className="block w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium" placeholder="Seguros Martínez" />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700">Correo Electrónico Administrador</label>
                                <div className="relative mt-1">
                                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                    <input name="admin_email" type="email" required className="block w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium" placeholder="director@empresa.com" />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700">Contraseña Administrador</label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                    <input name="admin_password" type="password" required minLength={6} className="block w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium" placeholder="••••••••" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Comenzar Gratis <ArrowRight className="ml-2 h-5 w-5" /></>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <span className="text-slate-500 text-sm">¿Ya tienes una cuenta? </span>
                            <Link href="/login" className="text-indigo-600 font-bold hover:underline text-sm">Inicia Sesión aquí</Link>
                        </div>
                    </div>
                </div>

            </motion.div>
        </div>
    )
}
