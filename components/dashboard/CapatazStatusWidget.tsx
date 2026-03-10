"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Signal, Zap, RefreshCw, Smartphone, ShieldCheck, MoreHorizontal, Link2 } from "lucide-react"
import { motion } from "framer-motion"
import CapatazPairingModal from "./CapatazPairingModal"

export default function CapatazStatusWidget() {
    const [status, setStatus] = useState<'online' | 'pairing' | 'offline'>('offline')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [stats, setStats] = useState({
        scanned: 0,
        summarized: 0,
        actions: 0
    })

    const instanceName = "RB-Agente-Default"

    const checkStatus = async () => {
        try {
            const res = await fetch(`/api/capataz/instance?instanceName=${instanceName}`)
            const data = await res.json()
            if (data.instance?.state === 'open') {
                setStatus('online')
            } else {
                setStatus('offline')
            }
        } catch (e) {
            setStatus('offline')
        }
    }

    useEffect(() => {
        checkStatus()
        const interval = setInterval(checkStatus, 30000)
        return () => clearInterval(interval)
    }, [])

    return (
        <>
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl border border-slate-800 relative overflow-hidden group">
                {/* Background Decorative Element */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>

                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                                <Zap className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-tight text-slate-100">Capataz Hub</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-500'}`}></div>
                                    <span className={`text-[10px] uppercase font-black tracking-widest ${status === 'online' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {status === 'online' ? 'Instance Active' : 'Disconnected'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <MoreHorizontal className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Main Action Area */}
                    <div className="flex-1 space-y-6">
                        {status === 'online' ? (
                            <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-700">
                                        <Smartphone className="w-4 h-4 text-slate-300" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-300">WhatsApp vinculado</span>
                                </div>
                                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Activo</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full flex items-center justify-center gap-3 p-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl border border-emerald-500/30 transition-all shadow-lg shadow-emerald-950/40 group/btn"
                            >
                                <Link2 className="w-5 h-5 text-white group-hover:rotate-45 transition-transform" />
                                <span className="text-sm font-bold text-white">Vincular WhatsApp</span>
                            </button>
                        )}

                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 bg-slate-800/20 rounded-xl border border-slate-700/30 text-center">
                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Auditado</p>
                                <p className="text-xl font-black text-slate-100">{stats.scanned}</p>
                            </div>
                            <div className="p-3 bg-slate-800/20 rounded-xl border border-slate-700/30 text-center">
                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Snaps</p>
                                <p className="text-xl font-black text-slate-100">{stats.summarized}</p>
                            </div>
                            <div className="p-3 bg-slate-800/20 rounded-xl border border-slate-700/30 text-center">
                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Tareas</p>
                                <p className="text-xl font-black text-slate-100">{stats.actions}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between gap-4">
                        <button
                            onClick={checkStatus}
                            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2 group"
                        >
                            <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                            Refrescar
                        </button>
                        <button className="px-4 py-2.5 bg-slate-800/40 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2">
                            <Signal className="w-3.5 h-3.5" />
                            Status
                        </button>
                    </div>
                </div>
            </div>

            <CapatazPairingModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    checkStatus()
                }}
                instanceName={instanceName}
            />
        </>
    )
}
