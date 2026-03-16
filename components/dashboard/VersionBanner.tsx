"use client"

import { Clock, Zap } from "lucide-react"

export function VersionBanner() {
    const releaseDate = "15 Mar 2026 - 07:15 PM"
    const version = "v3.1.0-OMNI-ELITE"

    return (
        <div className="bg-rose-600 text-white px-4 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] shadow-lg relative overflow-hidden">
            {/* Animated Glow Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
            
            <div className="flex items-center gap-4 relative z-10">
                <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 fill-white animate-pulse" />
                    <span>Último Despliegue</span>
                </div>
                <div className="h-3 w-px bg-white/20" />
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span className="text-rose-100">{releaseDate}</span>
                </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
                <div className="px-2 py-0.5 bg-black/20 rounded-md border border-white/10">
                    SISTEMA OPERATIVO • {version}
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-rose-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    MÁQUINA DE DINERO ACTIVA
                </div>
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    )
}
