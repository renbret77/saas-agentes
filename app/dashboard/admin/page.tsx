"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Terminal,
    Database,
    Activity,
    Play,
    ShieldCheck,
    AlertCircle,
    Search,
    RefreshCw,
    Cpu
} from "lucide-react"

export default function AdminPage() {
    const [isExecuting, setIsExecuting] = useState(false)
    const [migrations, setMigrations] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMigrations()
    }, [])

    const fetchMigrations = async () => {
        try {
            const res = await fetch('/api/admin/migrations')
            const data = await res.json()
            if (data.migrations) setMigrations(data.migrations)
        } catch (error) {
            console.error("Error fetching migrations:", error)
        } finally {
            setLoading(false)
        }
    }

    const adminSections = [
        {
            title: "Operaciones de Base de Datos",
            icon: Database,
            description: "Ejecución de migraciones y limpieza de datos",
            actions: loading
                ? [{ name: "Cargando migraciones...", lastRun: "-", status: "idle" }]
                : migrations.slice(-3).reverse().map(m => ({
                    name: m.replace('.sql', '').replace(/_/g, ' '),
                    lastRun: "Pendiente",
                    status: "idle"
                }))
        },
        {
            title: "Inteligencia de Bots",
            icon: Cpu,
            description: "Monitoreo y control de bots autónomos",
            actions: [
                { name: "Capataz Status", lastRun: "Hace 5 min", status: "active" },
                { name: "Resetear Memoria AI", lastRun: "Hace 1 día", status: "ok" },
                { name: "Configurar Horarios", lastRun: "05/03/2026", status: "ok" },
            ]
        }
    ]

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Terminal className="text-emerald-500" /> Centro de Comando Cloud
                    </h1>
                    <p className="text-slate-500 mt-2">Gestión administrativa y operativa de la plataforma.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Ver Logs
                    </button>
                    <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Sincronizar Todo
                    </button>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <p className="font-bold text-amber-900">Modo Administrador Activo</p>
                    <p className="text-sm text-amber-700">Las acciones realizadas aquí afectan directamente a la base de datos de producción en Supabase.</p>
                </div>
            </div>

            {/* Command Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {adminSections.map((section, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                            <div className="flex items-center gap-3 mb-1">
                                <section.icon className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-bold text-slate-900">{section.title}</h3>
                            </div>
                            <p className="text-sm text-slate-500">{section.description}</p>
                        </div>

                        <div className="p-6 space-y-4 flex-1">
                            {section.actions.map((action, aIdx) => (
                                <div key={aIdx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-emerald-200 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800">{action.name}</span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Última ejecución: {action.lastRun}</span>
                                    </div>
                                    <button className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-500 transition-all shadow-sm">
                                        <Play className="w-4 h-4 fill-current" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* DB Health Summary */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                            <ShieldCheck className="w-6 h-6" /> Infraestructura Saludable
                        </div>
                        <h2 className="text-4xl font-black">Tu negocio corre sobre rieles.</h2>
                        <p className="text-slate-400 max-w-lg">Supabase PostgreSQL reporta 99.9% de disponibilidad. Los backups diarios están activos y verificados.</p>
                        <div className="flex items-center gap-6 pt-2">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-1">Status</p>
                                <p className="font-bold text-emerald-400">100% ONLINE</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-1">Latencia</p>
                                <p className="font-bold">42ms</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative isolate">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full -z-10 animate-pulse" />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="bg-slate-800/40 p-8 rounded-full border border-slate-700/50 backdrop-blur-3xl"
                        >
                            <Database className="w-24 h-24 text-emerald-500 opacity-80" />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}
